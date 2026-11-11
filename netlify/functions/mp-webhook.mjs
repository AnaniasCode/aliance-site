// POST /api/mp-webhook — o Mercado Pago avisa aqui quando um pagamento muda de status.
// Por segurança, o aviso não é confiado: o pagamento é consultado direto no Mercado Pago
// com a chave da loja. Pagamentos aprovados (ou estornados/cancelados) são registrados no
// formulário "pagamento" da Netlify, que manda o e-mail para a loja.
import { brl } from "../lib/pedido.mjs";

export const config = { path: "/api/mp-webhook" };

const MP = "https://api.mercadopago.com";
const env = (k) => (globalThis.Netlify?.env?.get(k) ?? process.env[k]) || "";

export const STATUS = {
  approved: "PAGO", pending: "Aguardando pagamento", in_process: "Em análise", rejected: "Recusado",
  cancelled: "Cancelado", refunded: "Estornado", charged_back: "Contestado (chargeback)",
};
const AVISAR = new Set(["approved", "refunded", "cancelled", "charged_back"]);
const FORMA = { bank_transfer: "Pix", credit_card: "Cartão de crédito", debit_card: "Cartão de débito", account_money: "Saldo Mercado Pago", prepaid_card: "Cartão pré-pago", ticket: "Boleto" };

export function camposDoPagamento(p) {
  const md = p.metadata || {};
  const parcelas = p.payment_type_id === "credit_card" && p.installments > 1 ? ` em ${p.installments}x` : "";
  return {
    "form-name": "pagamento",
    pedido: p.external_reference || md.pedido || "",
    status: STATUS[p.status] || p.status,
    valor: brl(Number(p.transaction_amount || 0)),
    forma: (FORMA[p.payment_type_id] || p.payment_type_id || "") + parcelas,
    id_pagamento: String(p.id),
    nome: md.nome || "", telefone: md.telefone || "", endereco: md.endereco || "",
    itens: md.itens || "", cupom: md.cupom || "", frete: md.frete || "", total: md.total || "",
    novidades: md.novidades || "",
  };
}

export default async (req) => {
  const token = env("MP_ACCESS_TOKEN");
  if (!token) return new Response("pagamento online desligado");
  const url = new URL(req.url);
  let body = {};
  try { body = await req.json(); } catch {}
  const tipo = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
  const id = body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
  if (tipo !== "payment" || !id || !/^\d+$/.test(String(id))) return new Response("ignorado");

  const r = await fetch(`${MP}/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    console.error("Não consegui consultar o pagamento", id, r.status);
    return new Response("erro ao consultar", { status: 500 }); // o Mercado Pago tenta de novo
  }
  const p = await r.json();
  console.log(`Pagamento ${p.id} do pedido ${p.external_reference}: ${p.status}`);
  if (!AVISAR.has(p.status)) return new Response("ok");

  const campos = camposDoPagamento(p);
  const f = await fetch(`${url.origin}/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos).toString(),
  });
  if (!f.ok) console.error("Falha ao registrar no formulário da Netlify:", f.status);
  return new Response("ok");
};
