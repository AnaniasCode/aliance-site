# ALIANCE® — site

Site da Aliance em HTML, CSS e JavaScript puros, sem Lovable e sem dependências.

## Onde editar
- `catalog.js`: produtos, preços, descrições, tamanhos, WhatsApp dos donos, e-mail e slides da página inicial.
- `styles.css`: cores e fontes (no topo, em `:root`).
- `app.js`: as páginas (Início, Coleções, Produtos, Peça, Sacola, Sobre e Contato).
- `build.mjs`: título, descrição e imagem de prévia (WhatsApp e Google) de cada página.
- `assets/produtos/`: fotos das peças (3 por peça: costas, frente e conjunto). Para trocar uma foto, substitua o arquivo mantendo o nome.

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
