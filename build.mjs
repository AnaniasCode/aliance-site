// Gera a pasta dist/ com uma página HTML por endereço (cada uma com título,
// descrição e imagem próprias para a prévia de links no WhatsApp/Google).
// Uso: node build.mjs   (a Netlify/Vercel rodam isso sozinhas a cada mudança)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");

// Endereço público do site, para as imagens de prévia. A Netlify e a Vercel
// informam isso sozinhas; se usar domínio próprio, pode escrever aqui.
const SITE_URL = (process.env.SITE_URL || process.env.URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "")).replace(/\/$/, "");

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "catalog.js"), "utf8"), ctx);
const { modelos } = ctx.window.ALIANCE;

// Dados para as funções do servidor (pagamento): preços, frete e cupons do catalog.js
{
  const A = ctx.window.ALIANCE;
  const dados = {
    modelos: A.modelos.map((m) => ({ code: m.code, name: m.name, precoNum: m.precoNum, tamanhos: [...m.tamanhos] })),
    FRETE: A.FRETE, CUPONS: A.CUPONS, WHATSAPP_PEDIDOS: A.WHATSAPP_PEDIDOS,
  };
  const out = path.join(ROOT, "netlify", "lib", "dados.mjs");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, "// Gerado pelo build.mjs a partir de catalog.js — não edite à mão.\n" +
    Object.entries(dados).map(([k, v]) => `export const ${k} = ${JSON.stringify(v, null, 2)};`).join("\n") + "\n");
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const abs = (u) => (SITE_URL ? SITE_URL + u : u);

const pages = [
  { url: "/", title: "ALIANCE® — Camisetas autorais em tiragem limitada",
    desc: "Conheça a Aliance: camisetas autorais, tiragens limitadas e acabamento de ateliê.",
    ogTitle: "ALIANCE® — More than clothes, a lifestyle", ogDesc: "Camisetas autorais em tiragens limitadas, com acabamento de ateliê.",
    img: "/assets/hero_1.jpg" },
  { url: "/colecoes", title: "Coleções — ALIANCE®", desc: "As coleções da Aliance: Coastal Club, Autorais e Society.",
    ogDesc: "Cada coleção nasce de um lugar e de uma ideia. Conheça cada universo da Aliance.", img: "/assets/hero_2.jpg" },
  { url: "/produtos", title: "Produtos — ALIANCE®", desc: "Todas as camisetas Aliance: 100% algodão, com preço, tamanhos e tabela de medidas.",
    ogDesc: "O acervo completo da Aliance em detalhe.", img: "/assets/hero_3.jpg" },
  { url: "/sobre", title: "Sobre a Marca — ALIANCE®", desc: "A história da Aliance: uma visão, uma união e uma nova história em camisetas autorais.",
    ogDesc: "Autoral, limitada e feita no Brasil.", img: "/assets/hero_4.jpg" },
  { url: "/contato", title: "Contato — ALIANCE®", desc: "Ajuda e reclamações sobre a Aliance: entre em contato pelo e-mail lojaaliancebrl@gmail.com.",
    ogDesc: "Ajuda e reclamações pelo e-mail de atendimento da Aliance.", img: "/assets/hero_1.jpg" },
  { url: "/favoritos", title: "Favoritos — ALIANCE®", desc: "Suas peças favoritas da Aliance.", noindex: true, img: "/assets/hero_1.jpg" },
  { url: "/finalizar", title: "Finalizar pedido — ALIANCE®", desc: "Entrega e pagamento do seu pedido Aliance.", noindex: true, img: "/assets/hero_1.jpg" },
  { url: "/pedido-enviado", title: "Pedido enviado — ALIANCE®", desc: "Seu pedido Aliance.", noindex: true, img: "/assets/hero_1.jpg" },
  { url: "/pagamento-retorno", title: "Pagamento — ALIANCE®", desc: "Retorno do pagamento do seu pedido Aliance.", noindex: true, img: "/assets/hero_1.jpg" },
  { url: "/sacola", title: "Sacola — ALIANCE®", desc: "Suas peças escolhidas, cupom de desconto e frete.", noindex: true, img: "/assets/hero_1.jpg" },
  ...modelos.map((m) => ({ url: `/produtos/${m.slug}`, title: `${m.name} — ALIANCE®`, desc: m.descricao, type: "product", img: m.img })),
];

const template = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const meta = (p) => [
  `<title>${esc(p.title)}</title>`,
  `<meta name="description" content="${esc(p.desc)}" />`,
  `<meta property="og:title" content="${esc(p.ogTitle || p.title)}" />`,
  `<meta property="og:description" content="${esc(p.ogDesc || p.desc)}" />`,
  `<meta property="og:type" content="${p.type || "website"}" />`,
  `<meta property="og:image" content="${esc(abs(p.img))}" />`,
  SITE_URL ? `<meta property="og:url" content="${esc(SITE_URL + p.url)}" />` : "",
  `<meta name="twitter:card" content="summary_large_image" />`,
  p.noindex ? `<meta name="robots" content="noindex" />` : "",
].filter(Boolean).map((l) => "  " + l).join("\n");
const render = (p) => template.replace(/  <!--META-->[\s\S]*?<!--\/META-->/, meta(p));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of ["styles.css", "catalog.js", "app.js", "robots.txt", "favicon.ico", "favicon.svg", "site.webmanifest"]) {
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
for (const p of pages) {
  const dir = path.join(OUT, p.url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), render(p));
}
fs.writeFileSync(path.join(OUT, "404.html"), render({ url: "/404", title: "Página não encontrada — ALIANCE®", desc: "Esta página não existe.", noindex: true, img: "/assets/hero_1.jpg" }));
console.log(`OK: ${pages.length} páginas em dist/ ${SITE_URL ? "(" + SITE_URL + ")" : "(sem SITE_URL: imagens de prévia com caminho relativo)"}`);
