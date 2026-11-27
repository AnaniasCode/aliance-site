/**
 * ALIANCE® — Estoque do site ligado ao Google Sheets  (versão 2: tabela por cor × tamanho)
 * --------------------------------------------------------------------------------------
 * Cole este código em: Planilha → Extensões → Apps Script (apague o que estiver lá).
 * Primeira vez: Implantar → Nova implantação → Tipo "App da Web"
 *               Executar como: "Eu"   |   Quem pode acessar: "Qualquer pessoa"
 * Atualizando:  Implantar → Gerenciar implantações → lápis → Versão: "Nova versão" → Implantar
 *               (assim a URL continua a mesma).
 *
 * Aba de estoque (a primeira aba, gid 0) — uma linha por cor, uma coluna por tamanho:
 *
 *     COR     | P | M | G | GG | TOTAL
 *     BRANCA  | 2 | 2 | 5 | 1  | (fórmula)
 *     PRETA   | 0 | 3 | 0 | 0  | (fórmula)
 *     TOTAL   | (fórmulas)
 *
 *   - A linha do cabeçalho é a que tem "COR" na coluna A (pode haver títulos acima).
 *   - Os números são a quantidade DISPONÍVEL para venda. Para repor, é só mudar o número.
 *   - A coluna TOTAL e a linha TOTAL são ignoradas pelo script (podem ter fórmulas).
 *   - Para criar uma cor ou tamanho novo, acrescente a linha/coluna antes do TOTAL.
 *
 * O que faz:
 *  - GET  → informa ao site quantas camisas há por cor e tamanho.
 *  - POST → quando um cliente finaliza um pedido no site, diminui as quantidades e registra
 *           cada peça na aba "Pedidos do site" com SITUAÇÃO = EM NEGOCIAÇÃO.
 *           Se faltar alguma peça, nada é alterado e o site avisa o cliente.
 *  - Na aba "Pedidos do site", ao mudar a SITUAÇÃO para CANCELADO, a peça volta sozinha
 *    para o estoque (e a situação vira "CANCELADO — devolvido ao estoque").
 */

const GID_ESTOQUE = 0;                  // aba do estoque (gid=0 no endereço da planilha)
const ABA_PEDIDOS = 'Pedidos do site';  // criada automaticamente se não existir
const CAB_PEDIDOS = ['DATA', 'PEDIDO', 'CLIENTE', 'TELEFONE', 'PEÇA', 'COR', 'TAMANHO', 'QUANT.', 'SITUAÇÃO'];
const SIT_NOVO = 'EM NEGOCIAÇÃO';
const SIT_DEVOLVIDO = 'CANCELADO — devolvido ao estoque';
const MAX_PECAS_POR_PEDIDO = 20;

function norm_(v) {
  return String(v == null ? '' : v).trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function abaEstoque_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().find((s) => s.getSheetId() === GID_ESTOQUE) || ss.getSheets()[0];
}

// Lê a tabela cor × tamanho. Retorna { cols: {P: índice}, linhas: {BRANCA: índice}, estoque }
function lerGrade_(aba) {
  const vals = aba.getDataRange().getValues();
  const h = vals.findIndex((r) => norm_(r[0]) === 'COR');
  if (h < 0) throw new Error('Não achei a linha de cabeçalho com "COR" na coluna A da aba de estoque.');
  const cols = {};
  vals[h].forEach((v, c) => { const t = norm_(v); if (c > 0 && t && t !== 'TOTAL') cols[t] = c; });
  const linhas = {}, estoque = {};
  for (let r = h + 1; r < vals.length; r++) {
    const cor = norm_(vals[r][0]);
    if (!cor || cor === 'TOTAL') break;
    linhas[cor] = r;
    estoque[cor] = {};
    Object.keys(cols).forEach((t) => { estoque[cor][t] = Math.max(0, parseInt(vals[r][cols[t]], 10) || 0); });
  }
  return { cols, linhas, estoque };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  try {
    return json_({ ok: true, estoque: lerGrade_(abaEstoque_()).estoque, atualizado: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, erro: String(err.message || err) });
  }
}

function abaPedidos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = ss.getSheetByName(ABA_PEDIDOS);
  if (!log) {
    log = ss.insertSheet(ABA_PEDIDOS);
    log.appendRow(CAB_PEDIDOS);
    log.setFrozenRows(1);
  }
  return log;
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
  if (!pedido || !nome || !itens.length || totalPecas < 1 || totalPecas > MAX_PECAS_POR_PEDIDO ||
      itens.some((i) => !((parseInt(i.qtd, 10) || 0) > 0))) {
    return json_({ ok: false, erro: 'Pedido inválido.' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, erro: 'Estoque ocupado, tente de novo.' });
  try {
    const aba = abaEstoque_();
    const g = lerGrade_(aba);

    // 1) confere se tem tudo (soma itens da mesma cor/tamanho)
    const pedidoPor = {};
    itens.forEach((i) => {
      const k = norm_(i.cor) + '|' + norm_(i.tamanho);
      pedidoPor[k] = (pedidoPor[k] || 0) + (parseInt(i.qtd, 10) || 0);
    });
    const disp = (cor, tam) => ((g.estoque[cor] || {})[tam] || 0);
    const faltando = Object.keys(pedidoPor)
      .filter((k) => { const [cor, tam] = k.split('|'); return disp(cor, tam) < pedidoPor[k]; })
      .map((k) => { const [cor, tam] = k.split('|'); return { cor, tamanho: tam, disponivel: disp(cor, tam) }; });
    if (faltando.length) return json_({ ok: false, erro: 'Sem estoque suficiente.', faltando, estoque: g.estoque });

    // 2) registra em "Pedidos do site" e diminui as quantidades
    const agora = new Date();
    const registros = itens.map((i) => [agora, pedido, nome, telefone, String(i.peca || '').slice(0, 80),
      norm_(i.cor), norm_(i.tamanho), parseInt(i.qtd, 10), SIT_NOVO]);
    const log = abaPedidos_();
    log.getRange(log.getLastRow() + 1, 1, registros.length, registros[0].length).setValues(registros);
    Object.keys(pedidoPor).forEach((k) => {
      const [cor, tam] = k.split('|');
      aba.getRange(g.linhas[cor] + 1, g.cols[tam] + 1).setValue(disp(cor, tam) - pedidoPor[k]);
    });

    return json_({ ok: true, estoque: lerGrade_(aba).estoque });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Gatilho simples: roda sozinho quando alguém edita a planilha à mão.
 * Na aba "Pedidos do site", SITUAÇÃO = CANCELADO devolve a peça ao estoque.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== ABA_PEDIDOS) return;
  const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(norm_);
  const cSit = cab.indexOf('SITUACAO'), cCor = cab.indexOf('COR'), cTam = cab.indexOf('TAMANHO'), cQtd = cab.indexOf('QUANT.');
  if (cSit < 0 || cCor < 0 || cTam < 0 || cQtd < 0) return;
  const c0 = e.range.getColumn(), c1 = c0 + e.range.getNumColumns() - 1;
  if (cSit + 1 < c0 || cSit + 1 > c1) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    const aba = abaEstoque_();
    const g = lerGrade_(aba);
    for (let r = e.range.getRow(); r < e.range.getRow() + e.range.getNumRows(); r++) {
      if (r < 2) continue;
      const linha = sh.getRange(r, 1, 1, cab.length).getValues()[0];
      if (norm_(linha[cSit]) !== 'CANCELADO') continue;
      const cor = norm_(linha[cCor]), tam = norm_(linha[cTam]), qtd = parseInt(linha[cQtd], 10) || 0;
      if (!(cor in g.linhas) || !(tam in g.cols) || qtd < 1) {
        sh.getRange(r, cSit + 1).setNote('Não devolvi ao estoque: cor/tamanho não encontrados na aba de estoque.');
        continue;
      }
      g.estoque[cor][tam] += qtd;
      aba.getRange(g.linhas[cor] + 1, g.cols[tam] + 1).setValue(g.estoque[cor][tam]);
      sh.getRange(r, cSit + 1).setValue(SIT_DEVOLVIDO);
    }
  } finally {
    lock.releaseLock();
  }
}
