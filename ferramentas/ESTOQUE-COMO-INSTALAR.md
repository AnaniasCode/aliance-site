# Estoque ligado à planilha — como instalar

O site lê o estoque da planilha e, a cada pedido, apaga da planilha as camisas lisas usadas
(copiando-as antes para a aba **"Pedidos do site"**). Tudo é feito por um script do Google
que fica dentro da própria planilha. Gratuito, e não gasta créditos da Netlify.

## Regras
- Conta como estoque só a linha com **DISPONIBILIDADE = DISPONÍVEL** (VENDIDA, PRODUÇÃO e
  EM NEGOCIAÇÃO não contam).
- Cor da camisa lisa de cada peça: camisas **pretas** usam as linhas **PRETA**; as demais usam
  **OFF-WHITE** (coluna COR). O estoque de "PRETA M" vale para todas as estampas pretas.
- Pedido feito no site → as linhas DISPONÍVEIS da cor/tamanho são **apagadas** e copiadas para
  "Pedidos do site" (situação EM NEGOCIAÇÃO). Se a venda não fechar, copie a linha de volta para
  o estoque com DISPONÍVEL.
- Se faltar peça na hora de finalizar, nada é apagado e o cliente é avisado.
- Se a planilha estiver fora do ar, o pedido segue pelo WhatsApp com o aviso
  "⚠️ Estoque NÃO foi baixado automaticamente".

## Instalar (uma vez)
1. Abra a planilha → **Extensões → Apps Script**.
2. Apague o código que aparecer e cole todo o conteúdo de `estoque-apps-script.gs`. Salve.
3. **Implantar → Nova implantação** → engrenagem → **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. **Implantar** → autorize com a conta Google dona da planilha (o Google avisa que o app
   "não foi verificado": clique em **Avançado → Acessar**; é o seu próprio script).
5. Copie a **URL do App da Web** (termina em `/exec`) e coloque em `ESTOQUE_URL` no `catalog.js`.

Depois de instalado, a planilha **não precisa** ficar compartilhada por link: o script mostra ao
site só as quantidades (sem custos ou valores).

## Ao mudar o script
Implantar → **Gerenciar implantações** → editar (lápis) → Versão: **Nova versão** → Implantar.
Assim a URL continua a mesma.
