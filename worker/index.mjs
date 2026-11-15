// Servidor do site no Cloudflare (Worker). Responde só os endereços /api/*;
// todo o resto (páginas, fotos, etc.) vem direto da pasta dist/.
//
//   GET  /api/pagamento → { ativo, teste }  (o site usa para saber se o pagamento online está ligado)
//   POST /api/pagamento → cria o pagamento no Mercado Pago (Checkout Pro) e devolve o link
//   GET  /api/pedidos   → lista os pagamentos do Mercado Pago com os dados de entrega
//                         (só para os donos: exige a senha PAINEL_SENHA no cabeçalho x-senha)
//
// Segredos (Cloudflare → Workers → aliance-site → Settings → Variables and Secrets):
//   MP_ACCESS_TOKEN  Access Token de produção do Mercado Pago da loja
//   PAINEL_SENHA     senha da página /pedidos
import { calcularPedido, novoId, brl } from "./pedido.mjs";

const MP = "https://api.mercadopago.com";
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// Forma escolhida no site → tipos de pagamento ESCONDIDOS no Mercado Pago
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

const fone = (t) => (t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`);

export function montarPreferencia({ id, calc, cli, pagamento, origin }) {
  const [primeiro, ...resto] = cli.nome.split(/\s+/);
  const itensTxt = calc.linhas.map((l) => `${l.qty}x ${l.name} (${l.code}) Tam. ${l.size}`).join("; ");
  const endereco = `${cli.rua}, ${cli.numero}${cli.complemento ? " — " + cli.complemento : ""} | ${cli.bairro} — ${cli.cidade}/${cli.uf} | CEP ${cli.cep.slice(0, 5)}-${cli.cep.slice(5)}`;
  const retorno = `${origin}/pagamento-retorno`;
  return {
    items: [{ id, title: `Pedido ${id} — ALIANCE`, description: itensTxt.slice(0, 250), quantity: 1, unit_price: calc.total, currency_id: "BRL", category_id: "fashion" }],
    payer: {
      name: primeiro, surname: resto.join(" "),
      phone: { area_code: cli.telefone.slice(0, 2), number: cli.telefone.slice(2) },
      address: { zip_code: cli.cep, street_name: cli.rua, street_number: cli.numero },
    },
    external_reference: id,
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    auto_return: "approved",
    statement_descriptor: "ALIANCE",
    payment_methods: { excluded_payment_types: EXCLUIR[pagamento].map((t) => ({ id: t })), installments: 12 },
    metadata: {
      pedido: id, nome: cli.nome, telefone: fone(cli.telefone), endereco, itens: itensTxt,
      cupom: calc.cupom, subtotal: brl(calc.subtotal), desconto: brl(calc.desconto), frete: brl(calc.frete),
      total: brl(calc.total), forma_escolhida: pagamento, novidades: cli.novidades ? "Sim" : "Não",
    },
  };
}

// A chave é de conta de teste do Mercado Pago? (só para mostrar o aviso "modo de teste")
let _contaTeste = null;
async function contaDeTeste(token) {
  if (_contaTeste !== null) return _contaTeste;
  try {
    const r = await fetch(`${MP}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    _contaTeste = Array.isArray(u.tags) && u.tags.includes("test_user");
    return _contaTeste;
  } catch { return false; }
}

async function criarPagamento(req, env) {
  const token = env.MP_ACCESS_TOKEN || "";
  if (!token) return json({ erro: "Pagamento online desligado." }, 503);
  let body;
  try { body = await req.json(); } catch { return json({ erro: "Pedido inválido." }, 400); }
  const { cli, erro } = validarCliente(body.cliente);
  if (erro) return json({ erro }, 400);
  if (!EXCLUIR[body.pagamento]) return json({ erro: "Forma de pagamento inválida." }, 400);
  let calc;
  try { calc = calcularPedido(body.itens, body.cupom); } catch (e) { return json({ erro: e.message }, 400); }
  const id = novoId();
  const pref = montarPreferencia({ id, calc, cli, pagamento: body.pagamento, origin: new URL(req.url).origin });
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
  return json({ id, url: j.init_point, total: calc.total, subtotal: calc.subtotal, desconto: calc.desconto, frete: calc.frete, cupom: calc.cupom });
}

export const STATUS = {
  approved: "Pago", pending: "Aguardando pagamento", in_process: "Em análise", authorized: "Autorizado",
  rejected: "Recusado", cancelled: "Cancelado", refunded: "Estornado", charged_back: "Contestado",
};
const FORMA = { bank_transfer: "Pix", credit_card: "Cartão de crédito", debit_card: "Cartão de débito", account_money: "Saldo Mercado Pago", prepaid_card: "Cartão pré-pago", ticket: "Boleto" };

export function resumoPagamento(p) {
  const md = p.metadata || {};
  const parc = p.payment_type_id === "credit_card" && p.installments > 1 ? ` em ${p.installments}x` : "";
  return {
    id: String(p.id), data: p.date_created, situacao: STATUS[p.status] || p.status, status: p.status,
    pedido: p.external_reference || md.pedido || "", valor: brl(Number(p.transaction_amount || 0)),
    forma: (FORMA[p.payment_type_id] || p.payment_type_id || "") + parc,
    nome: md.nome || [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" "),
    telefone: md.telefone || "", endereco: md.endereco || "", itens: md.itens || p.description || "",
    cupom: md.cupom || "", frete: md.frete || "", novidades: md.novidades || "",
  };
}

function senhaCerta(dada, certa) {
  if (!certa || typeof dada !== "string" || dada.length !== certa.length) return false;
  let d = 0;
  for (let i = 0; i < certa.length; i++) d |= dada.charCodeAt(i) ^ certa.charCodeAt(i);
  return d === 0;
}

async function listarPedidos(req, env) {
  if (!env.PAINEL_SENHA) return json({ erro: "Página de pedidos desligada (falta a senha PAINEL_SENHA)." }, 503);
  if (!senhaCerta(req.headers.get("x-senha"), env.PAINEL_SENHA)) return json({ erro: "Senha incorreta." }, 401);
  if (!env.MP_ACCESS_TOKEN) return json({ erro: "Pagamento online desligado." }, 503);
  const r = await fetch(`${MP}/v1/payments/search?sort=date_created&criteria=desc&limit=100&range=date_created&begin_date=NOW-90DAYS&end_date=NOW`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) { console.error("Busca de pagamentos falhou:", r.status); return json({ erro: "Não foi possível consultar o Mercado Pago." }, 502); }
  const j = await r.json();
  return json({ pedidos: (j.results || []).map(resumoPagamento) });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/pagamento") {
      if (req.method === "GET") {
        const token = env.MP_ACCESS_TOKEN || "";
        return json({ ativo: !!token, teste: token ? await contaDeTeste(token) : false });
      }
      if (req.method === "POST") return criarPagamento(req, env);
      return json({ erro: "Método não permitido." }, 405);
    }
    if (url.pathname === "/api/pedidos" && req.method === "GET") return listarPedidos(req, env);
    if (url.pathname.startsWith("/api/")) return json({ erro: "Não encontrado." }, 404);
    return env.ASSETS.fetch(req);
  },
};
