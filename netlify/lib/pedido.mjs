// Cálculo do pedido no servidor. Usa os dados de catalog.js (gerados em dados.mjs pelo
// build.mjs), então preço, frete e cupom não podem ser alterados pelo navegador.
import { modelos, FRETE, CUPONS } from "./dados.mjs";

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
export function calcularPedido(itens, codigoCupom) {
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
  let desconto = 0, frete = FRETE;
  if (cupom?.tipo === "percentual") desconto = r2(subtotal * cupom.valor / 100);
  else if (cupom?.tipo === "valor") desconto = Math.min(subtotal, cupom.valor);
  else if (cupom?.tipo === "frete") frete = 0;
  const total = r2(subtotal - desconto + frete);
  return { linhas, subtotal, desconto, frete, total, cupom: cupom ? cupom.codigo.toUpperCase() : "" };
}

export function novoId() {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).replace(/-/g, "").slice(2);
  return `AL${d}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
