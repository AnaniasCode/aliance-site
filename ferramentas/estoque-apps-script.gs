/**
 * ALIANCE® — Estoque do site ligado ao Google Sheets
 * --------------------------------------------------
 * Cole este código em: Planilha → Extensões → Apps Script (apague o que estiver lá).
 * Depois: Implantar → Nova implantação → Tipo "App da Web"
 *         Executar como: "Eu"   |   Quem pode acessar: "Qualquer pessoa"
 * Copie a URL do App da Web e coloque em ESTOQUE_URL no catalog.js do site.
 *
 * O que faz:
 *  - GET  → informa ao site quantas camisas DISPONÍVEIS existem por cor e tamanho
 *           (só as quantidades; custos e valores da planilha não saem daqui).
 *  - POST → quando um cliente finaliza um pedido no site, apaga da aba de estoque as
 *           linhas DISPONÍVEIS da cor/tamanho pedidos e copia cada linha apagada para a
 *           aba "Pedidos do site" (com número do pedido e cliente), para conferência.
 *           Se faltar alguma peça, nada é apagado e o site avisa o cliente.
 *
 * Aba de estoque (a primeira aba, gid 0), a partir da linha 2:
 *   A: COR | B: TAMANHO | C: QUANT. | D: VALOR - CUSTO | E: VALOR | F: DISPONIBILIDADE
 */

const GID_ESTOQUE = 0;                 // aba do estoque (gid=0 no endereço da planilha)
const ABA_PEDIDOS = 'Pedidos do site'; // criada automaticamente
const STATUS_DISPONIVEL = 'DISPONIVEL';
const MAX_PECAS_POR_PEDIDO = 20;

function norm_(v) {
  return String(v == null ? '' : v).trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function abaEstoque_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().find((s) => s.getSheetId() === GID_ESTOQUE) || ss.getSheets()[0];
}

function lerLinhas_(aba) {
  const n = aba.getLastRow();
  if (n < 2) return [];
  return aba.getRange(2, 1, n - 1, 6).getValues().map((r, i) => ({
    linha: i + 2, cor: norm_(r[0]), tamanho: norm_(r[1]),
    quant: Math.max(0, parseInt(r[2], 10) || 0), custo: r[3], valor: r[4], status: norm_(r[5]), bruto: r,
  }));
}

function contarDisponivel_(linhas) {
  const est = {};
  linhas.forEach((l) => {
    if (l.status !== STATUS_DISPONIVEL || !l.cor || !l.tamanho) return;
    est[l.cor] = est[l.cor] || {};
    est[l.cor][l.tamanho] = (est[l.cor][l.tamanho] || 0) + l.quant;
  });
  return est;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, estoque: contarDisponivel_(lerLinhas_(abaEstoque_())), atualizado: new Date().toISOString() });
}

/**
 * Corpo (JSON enviado como text/plain pelo site):
 * { pedido, cliente: { nome, telefone }, itens: [{ peca, cor, tamanho, qtd }], total }
 */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, erro: 'Pedido inválido.' }); }
  const itens = Array.isArray(body.itens) ? body.itens : [];
  const pedido = String(body.pedido || '').slice(0, 40);
  const nome = String((body.cliente && body.cliente.nome) || '').slice(0, 80);
  const telefone = String((body.cliente && body.cliente.telefone) || '').slice(0, 30);
  const totalPecas = itens.reduce((a, i) => a + (parseInt(i.qtd, 10) || 0), 0);
  if (!pedido || !nome || !itens.length || totalPecas < 1 || totalPecas > MAX_PECAS_POR_PEDIDO) {
    return json_({ ok: false, erro: 'Pedido inválido.' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, erro: 'Estoque ocupado, tente de novo.' });
  try {
    const aba = abaEstoque_();
    const linhas = lerLinhas_(aba);
    const estoque = contarDisponivel_(linhas);

    // 1) confere se tem tudo (soma itens da mesma cor/tamanho)
    const pedidoPor = {};
    itens.forEach((i) => {
      const k = norm_(i.cor) + '|' + norm_(i.tamanho);
      pedidoPor[k] = (pedidoPor[k] || 0) + (parseInt(i.qtd, 10) || 0);
    });
    const faltando = Object.keys(pedidoPor).filter((k) => {
      const [cor, tam] = k.split('|');
      return ((estoque[cor] || {})[tam] || 0) < pedidoPor[k];
    }).map((k) => { const [cor, tam] = k.split('|'); return { cor, tamanho: tam, disponivel: (estoque[cor] || {})[tam] || 0 }; });
    if (faltando.length) return json_({ ok: false, erro: 'Sem estoque suficiente.', faltando, estoque });

    // 2) escolhe as linhas DISPONÍVEIS a consumir
    const apagar = [], reduzir = [], registros = [];
    const agora = new Date();
    itens.forEach((i) => {
      let falta = parseInt(i.qtd, 10) || 0;
      const cor = norm_(i.cor), tam = norm_(i.tamanho);
      for (const l of linhas) {
        if (!falta) break;
        if (l.status !== STATUS_DISPONIVEL || l.cor !== cor || l.tamanho !== tam || l.quant < 1 || l.usada) continue;
        const usa = Math.min(l.quant, falta);
        if (usa === l.quant) { apagar.push(l.linha); l.usada = true; } else { reduzir.push({ linha: l.linha, nova: l.quant - usa }); l.quant -= usa; }
        falta -= usa;
        registros.push([agora, pedido, nome, telefone, String(i.peca || '').slice(0, 80), l.bruto[0], l.bruto[1], usa, l.custo, l.valor, 'EM NEGOCIAÇÃO']);
      }
    });

    // 3) registra em "Pedidos do site" e depois mexe no estoque
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let log = ss.getSheetByName(ABA_PEDIDOS);
    if (!log) {
      log = ss.insertSheet(ABA_PEDIDOS);
      log.appendRow(['DATA', 'PEDIDO', 'CLIENTE', 'TELEFONE', 'PEÇA', 'COR', 'TAMANHO', 'QUANT.', 'VALOR - CUSTO', 'VALOR', 'SITUAÇÃO']);
      log.setFrozenRows(1);
    }
    log.getRange(log.getLastRow() + 1, 1, registros.length, registros[0].length).setValues(registros);
    reduzir.forEach((r) => aba.getRange(r.linha, 3).setValue(r.nova));
    apagar.sort((a, b) => b - a).forEach((n) => aba.deleteRow(n)); // de baixo para cima

    return json_({ ok: true, estoque: contarDisponivel_(lerLinhas_(aba)) });
  } finally {
    lock.releaseLock();
  }
}
