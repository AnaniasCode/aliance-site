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
o pedido abre pronto no WhatsApp da loja e uma cópia é salva na Netlify (Forms, formulário "pedido").

Em `catalog.js`:
- `WHATSAPP_PEDIDOS`: número que recebe os pedidos (55 + DDD + número).
- `FRETE`: valor fixo do frete por pedido.
- `CUPONS`: lista de cupons (modelo explicado no próprio arquivo). Tipos: `percentual`,
  `valor` ou `frete` (frete grátis), com mínimo, validade e ativo/pausado.

## Pagamento online (Mercado Pago — Checkout Pro)
Liga sozinho quando a variável `MP_ACCESS_TOKEN` existe na Netlify
(Site configuration → Environment variables). Sem ela, o site continua com o pedido pelo WhatsApp.
- Chave de teste (`TEST-...`): abre o ambiente de teste do Mercado Pago, sem cobrança real.
  Se a chave de teste não começar com `TEST-`, crie também `MP_MODO` = `teste`.
- `netlify/functions/pagamento.mjs`: recalcula preço, cupom e frete no servidor e cria o pagamento.
- `netlify/functions/mp-webhook.mjs`: recebe o aviso do Mercado Pago, confere o pagamento direto
  com o Mercado Pago e registra os pagos no formulário "pagamento" da Netlify (e-mail para a loja).
- `netlify/lib/dados.mjs` é gerado pelo `build.mjs` a partir de `catalog.js` (não editar).
- Retorno do cliente: `/pagamento-retorno` (aprovado, aguardando ou não concluído).

## Publicar (Netlify ou Vercel)
Ligue o repositório do GitHub na Netlify ou na Vercel. As configurações já estão em
`netlify.toml` e `vercel.json`: a cada mudança salva no GitHub, o site é gerado
(`node build.mjs` cria a pasta `dist/`) e entra no ar sozinho.

## Ver no próprio computador
```bash
node build.mjs
```
```bash
python3 -m http.server 8000 -d dist
```
Depois abra http://localhost:8000. Abrir o `index.html` com dois cliques não funciona mais,
porque os endereços agora são normais (`/produtos/monte-carlo`, sem `#`).
