// GET  /api/pagamento → { ativo, teste }  (o site usa para saber se o pagamento online está ligado)
// POST /api/pagamento → cria o pagamento no Mercado Pago (Checkout Pro) e devolve o link
// A chave fica na variável de ambiente MP_ACCESS_TOKEN da Netlify (nunca no site).
import { calcularPedido, novoId, brl } from "../lib/pedido.mjs";

export const config = { path: "/api/pagamento" };

const MP = "https://api.mercadopago.com";
const env = (k) => (globalThis.Netlify?.env?.get(k) ?? process.env[k]) || "";
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Forma escolhida no site → tipos de pagamento que ficam ESCONDIDOS no Mercado Pago
export const EXCLUIR = {
  "Pix": ["credit_card", "debit_card", "ticket", "prepaid_card"],
  "Cartão de débito": ["credit_card", "bank_transfer", "ticket"],
  "Cartão de crédito": ["debit_card", "bank_transfer", "ticket", "prepaid_card"],
};

const txt = (v, max = 120) => String(v ?? "").trim().slice(0, max);
const digits = (v) => String(v ?? "").replace(/\D/g, "");

export function validarCliente(c = {}) {
  const cli = {
    nome: txt(c.nome, 80), telefone: digits(c.telefone).slice(0, 11), cep: digits(c.cep).slice(0, 8),
    rua: txt(c.rua), numero: txt(c.numero, 20), complemento: txt(c.complemento, 80),
    bairro: txt(c.bairro, 80), cidade: txt(c.cidade, 80), uf: txt(c.uf, 2).toUpperCase(), novidades: !!c.novidades,
  };
  if (cli.nome.split(/\s+/).length < 2) return { erro: "Digite nome e sobrenome." };
  if (cli.telefone.length < 10) return { erro: "Telefone inválido." };
  if (cli.cep.length !== 8) return { erro: "CEP inválido." };
  for (const k of ["rua", "numero", "bairro", "cidade"]) if (!cli[k]) return { erro: "Endereço incompleto." };
  if (!/^[A-Z]{2}$/.test(cli.uf)) return { erro: "Estado inválido." };
  return { cli };
}

export function montarPreferencia({ id, calc, cli, pagamento, origin }) {
  const fone = (t) => (t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`);
  const [primeiro, ...resto] = cli.nome.split(/\s+/);
  const itensTxt = calc.linhas.map((l) => `${l.qty}x ${l.name} (${l.code}) Tam. ${l.size}`).join("; ");
  const endereco = `${cli.rua}, ${cli.numero}${cli.complemento ? " — " + cli.complemento : ""} | ${cli.bairro} — ${cli.cidade}/${cli.uf} | CEP ${cli.cep.slice(0, 5)}-${cli.cep.slice(5)}`;
  const retorno = `${origin}/pagamento-retorno`;
  return {
    items: [{
      id, title: `Pedido ${id} — ALIANCE`, description: itensTxt.slice(0, 250),
      quantity: 1, unit_price: calc.total, currency_id: "BRL", category_id: "fashion",
    }],
    payer: {
      name: primeiro, surname: resto.join(" "),
      phone: { area_code: cli.telefone.slice(0, 2), number: cli.telefone.slice(2) },
      address: { zip_code: cli.cep, street_name: cli.rua, street_number: cli.numero },
    },
    external_reference: id,
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    auto_return: "approved",
    notification_url: `${origin}/api/mp-webhook`,
    statement_descriptor: "ALIANCE",
    payment_methods: { excluded_payment_types: EXCLUIR[pagamento].map((t) => ({ id: t })), installments: 12 },
    metadata: {
      pedido: id, nome: cli.nome, telefone: fone(cli.telefone), endereco, itens: itensTxt,
      cupom: calc.cupom, subtotal: brl(calc.subtotal), desconto: brl(calc.desconto), frete: brl(calc.frete),
      total: brl(calc.total), forma_escolhida: pagamento, novidades: cli.novidades ? "Sim" : "Não",
    },
  };
}

export default async (req, context) => {
  const token = env("MP_ACCESS_TOKEN");
  const teste = token.startsWith("TEST-") || env("MP_MODO") === "teste";
  // contexto/publicação ajudam a conferir a configuração (não expõem a chave)
  if (req.method === "GET") return json({ ativo: !!token, teste, contexto: context?.deploy?.context || "", publicacao: context?.deploy?.id || "" });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);
  if (!token) return json({ erro: "Pagamento online desligado." }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ erro: "Pedido inválido." }, 400); }
  const { cli, erro } = validarCliente(body.cliente);
  if (erro) return json({ erro }, 400);
  if (!EXCLUIR[body.pagamento]) return json({ erro: "Forma de pagamento inválida." }, 400);
  let calc;
  try { calc = calcularPedido(body.itens, body.cupom); } catch (e) { return json({ erro: e.message }, 400); }

  const id = novoId();
  const origin = new URL(req.url).origin;
  const pref = montarPreferencia({ id, calc, cli, pagamento: body.pagamento, origin });
  let res, j;
  try {
    res = await fetch(`${MP}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": id },
      body: JSON.stringify(pref),
    });
    j = await res.json();
  } catch (e) {
    console.error("Mercado Pago indisponível:", e);
    return json({ erro: "Não foi possível falar com o Mercado Pago. Tente de novo em instantes." }, 502);
  }
  if (!res.ok) {
    console.error("Mercado Pago recusou a preferência:", res.status, JSON.stringify(j));
    return json({ erro: "Não foi possível iniciar o pagamento. Tente de novo." }, 502);
  }
  const url = (teste && j.sandbox_init_point) || j.init_point;
  return json({ id, url, total: calc.total, subtotal: calc.subtotal, desconto: calc.desconto, frete: calc.frete, cupom: calc.cupom });
};
