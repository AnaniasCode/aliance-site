# ALIANCE® — site

Site da Aliance em HTML, CSS e JavaScript puros, sem Lovable e sem dependências.

## Onde editar
- `catalog.js`: produtos, preços, descrições, tamanhos, WhatsApp dos donos, e-mail e slides da página inicial.
- `styles.css`: cores e fontes (no topo, em `:root`).
- `app.js`: as páginas (Início, Coleções, Produtos, Peça, Sacola, Sobre e Contato).
- `build.mjs`: título, descrição e imagem de prévia (WhatsApp e Google) de cada página.
- `assets/produtos/`: fotos das peças (3 por peça: costas, frente e conjunto). Para trocar uma foto, substitua o arquivo mantendo o nome.

## Pedidos pelo site
Sacola → `/finalizar` (nome, telefone, endereço com busca de CEP, forma de pagamento) →
o pedido abre pronto no WhatsApp da loja.

Em `catalog.js`:
- `WHATSAPP_PEDIDOS`: número que recebe os pedidos (55 + DDD + número).
- `FRETE`: valor fixo do frete por pedido.
- `FRETE_GRATIS_LOCAL`: frete grátis para São José do Rio Preto (faixa de CEP 15000-000 a 15099-999,
  ou cidade terminando em "Rio Preto" com UF SP). Vale no site e no servidor do pagamento.
- `CUPONS`: lista de cupons (modelo explicado no próprio arquivo). Tipos: `percentual`,
  `valor` ou `frete` (frete grátis), com mínimo, validade e ativo/pausado.

## Estoque (Google Sheets)
`ESTOQUE_URL` em `catalog.js` aponta para o script da planilha (`ferramentas/estoque-apps-script.gs`,
instalação em `ferramentas/ESTOQUE-COMO-INSTALAR.md`). Vazio = estoque desligado.
Tamanho sem estoque fica desativado, cor zerada mostra "Esgotado", a sacola não passa do estoque
e cada pedido apaga da planilha as camisas lisas usadas.

## Pagamento online (Mercado Pago) e página de pedidos
O servidor fica em `worker/` (Cloudflare Worker, só responde `/api/*`).
Liga sozinho quando estes **segredos** existem no Cloudflare
(Workers & Pages → aliance-site → Settings → Variables and Secrets → tipo *Secret*):
- `MP_ACCESS_TOKEN`: Access Token **de produção** do Mercado Pago da loja.
- `PAINEL_SENHA`: senha da página `/pedidos` (lista os pagamentos com dados de entrega).
Sem `MP_ACCESS_TOKEN`, o site segue com o pedido pelo WhatsApp.
Preço, frete e cupom são recalculados no servidor; o Mercado Pago só mostra a forma escolhida
(Pix, débito ou crédito em até 12x). O Mercado Pago avisa os donos por e-mail a cada venda.

## Publicar no Cloudflare (hospedagem atual)
`wrangler.jsonc` diz ao Cloudflare para rodar `node build.mjs` e publicar a pasta `dist/`
(endereço: https://aliance-site.nacional-oficial.workers.dev). Ao ligar um domínio próprio,
troque o `SITE_URL` dentro de `wrangler.jsonc`.

## Ver no próprio computador
```bash
node build.mjs
```
```bash
python3 -m http.server 8000 -d dist
```
Depois abra http://localhost:8000. Abrir o `index.html` com dois cliques não funciona mais,
porque os endereços agora são normais (`/produtos/monte-carlo`, sem `#`).
