// Cálculo do pedido no servidor (Cloudflare Worker). Usa os dados de catalog.js (gerados em
// worker/dados.mjs pelo build.mjs), então preço, frete e cupom não podem ser alterados pelo navegador.
import { modelos, FRETE, CUPONS, PROMOCAO, FRETE_GRATIS_LOCAL } from "./dados.mjs";

// Frete grátis para São José do Rio Preto (mesma regra do catalog.js)
export function freteGratisLocal(end) {
  if (!end || !FRETE_GRATIS_LOCAL) return false;
  const L = FRETE_GRATIS_LOCAL;
  const digitos = String(end.cep || "").replace(/\D/g, "");
  if (digitos.length === 8 && Number(digitos) >= L.cepInicio && Number(digitos) <= L.cepFim) return true;
  const cidade = String(end.cidade || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
  return String(end.uf || "").toUpperCase() === L.uf && cidade.endsWith(L.cidadeTermina);
}

const r2 = (v) => Math.round(v * 100) / 100;
export const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");

function hojeBR() {
  // data de hoje no fuso de Brasília (AAAA-MM-DD)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function checarCupom(codigo, subtotal) {
  if (!codigo) return { ok: true, cupom: null };
  const c = CUPONS.find((x) => x.codigo.toUpperCase() === String(codigo).trim().toUpperCase());
  if (!c || c.ativo === false) return { ok: false, erro: "Cupom inválido." };
  if (c.validoAte && hojeBR() > c.validoAte) return { ok: false, erro: "Este cupom expirou." };
  if (c.minimo && subtotal < c.minimo) return { ok: false, erro: `Este cupom vale para compras a partir de ${brl(c.minimo)} em peças.` };
  return { ok: true, cupom: c };
}

// itens: [{ code, size, qty }]  →  linhas com preço do catálogo + totais
// Desconto da promoção por quantidade (0 se fora das datas)
export function pctPromocao(qtd, agora = Date.now()) {
  if (!PROMOCAO) return 0;
  if (agora < Date.parse(PROMOCAO.inicio) || agora >= Date.parse(PROMOCAO.fim)) return 0;
  let pct = 0;
  for (const f of PROMOCAO.faixas) if (qtd >= f.min) pct = f.pct;
  return pct;
}

export function calcularPedido(itens, codigoCupom, agora = Date.now(), endereco = null) {
  if (!Array.isArray(itens) || !itens.length) throw new Error("Sacola vazia.");
  if (itens.length > 30) throw new Error("Itens demais no pedido.");
  const linhas = itens.map((i) => {
    const m = modelos.find((x) => x.code === i.code);
    if (!m) throw new Error(`Peça ${i.code} não existe.`);
    if (!m.tamanhos.includes(i.size)) throw new Error(`Tamanho ${i.size} indisponível para ${m.name}.`);
    const qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Quantidade inválida.");
    return { code: m.code, name: m.name, size: i.size, qty, unit: m.precoNum, total: r2(m.precoNum * qty) };
  });
  const subtotal = r2(linhas.reduce((a, l) => a + l.total, 0));
  const chk = checarCupom(codigoCupom, subtotal);
  if (!chk.ok) throw new Error(chk.erro);
  const cupom = chk.cupom;
  const local = freteGratisLocal(endereco);
  const freteBase = local ? 0 : FRETE;
  let descCupom = 0, frete = freteBase;
  if (cupom?.tipo === "percentual") descCupom = r2(subtotal * cupom.valor / 100);
  else if (cupom?.tipo === "valor") descCupom = Math.min(subtotal, cupom.valor);
  else if (cupom?.tipo === "frete") frete = 0;
  // Promoção por quantidade: não acumula com cupom, vale o maior desconto
  const qtd = linhas.reduce((a, l) => a + l.qty, 0);
  const pct = pctPromocao(qtd, agora);
  let descPromo = pct ? r2(subtotal * pct / 100) : 0;
  let cupomUsado = cupom;
  if (pct && cupom) {
    const economiaCupom = cupom.tipo === "frete" ? freteBase : descCupom;
    if (descPromo >= economiaCupom) { cupomUsado = null; descCupom = 0; frete = freteBase; }
    else descPromo = 0;
  }
  const desconto = r2(descCupom + descPromo);
  const total = r2(subtotal - desconto + frete);
  const promocao = descPromo ? `${PROMOCAO.nome} (${qtd} un., ${pct}%)` : "";
  return { linhas, subtotal, desconto, frete, total, cupom: cupomUsado ? cupomUsado.codigo.toUpperCase() : "", promocao, freteLocal: local };
}

export function novoId() {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).replace(/-/g, "").slice(2);
  return `AL${d}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
