# Planilha de teste do estoque

Cópia da planilha de estoque usada para testar a ligação do site com o Google Sheets.
O site **não usa** esta planilha (ele usa a planilha oficial). Fica guardada para testes futuros.

- Planilha no Google: "ESTOQUE ALIANCE CÓPIA"
  `https://docs.google.com/spreadsheets/d/10JUTojm58Xwfh7-vd9BPomnPuVUTsZOEPWkadkLXOhU`
  (deixe o compartilhamento como **Restrito**; ela tem os custos reais)
- Script de teste instalado nela (App da Web):
  `https://script.google.com/macros/s/AKfycby4jnvc48W4Pc7ROmtAN7dY0adn-fVWlyAb7GA9K4NlO5RsqNO5YCmoZtVtQJcbkJhQ/exec`

## Arquivos
- `estoque.csv`: aba de estoque (Página1) como estava em 23/11/2026, no mesmo formato
  (títulos nas linhas 1–3, cabeçalho na linha 4). **O custo foi trocado por R$ 0,00**, porque este
  repositório é público.
- `pedidos-do-site.csv`: aba "Pedidos do site" com o pedido de teste feito em 23/11/2026.

## Como testar o estoque com a planilha de teste
1. Em `catalog.js`, troque temporariamente `ESTOQUE_URL` pela URL do script de teste acima
   (num branch separado; **não** publique na `main`).
2. Faça um pedido pelo site: as linhas DISPONÍVEL da cor/tamanho somem da aba de estoque e
   aparecem em "Pedidos do site".
3. Depois, devolva as linhas ao estoque (DISPONÍVEL) para a planilha voltar ao estado inicial.

## Recriar a planilha de teste do zero
1. Crie uma planilha no Google e vá em **Arquivo → Importar → Fazer upload** com `estoque.csv`
   (opção "Substituir a planilha atual").
2. Instale o script `ferramentas/estoque-apps-script.gs` nela (veja `ferramentas/ESTOQUE-COMO-INSTALAR.md`).
