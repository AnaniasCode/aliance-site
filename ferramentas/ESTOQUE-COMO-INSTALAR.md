# Estoque ligado à planilha — como instalar

O site lê o estoque da planilha e, a cada pedido, apaga da planilha as camisas lisas usadas
(copiando-as antes para a aba **"Pedidos do site"**). Tudo é feito por um script do Google
que fica dentro da própria planilha. Gratuito, e não gasta créditos da Netlify.

## Formato da planilha (versão 2)
Primeira aba (gid 0), uma linha por cor e uma coluna por tamanho, com a quantidade
**disponível para venda**:

| COR | P | M | G | GG | TOTAL |
|---|---|---|---|---|---|
| BRANCA | 2 | 2 | 5 | 1 | =SOMA |
| PRETA | 0 | 3 | 0 | 0 | =SOMA |
| TOTAL | =SOMA | … | | | |

- O cabeçalho é a linha com **COR** na coluna A (pode ter títulos acima).
- Coluna TOTAL e linha TOTAL são ignoradas pelo script (podem ter fórmulas).
- Repor estoque: é só mudar o número. Cor/tamanho novo: acrescente linha/coluna antes do TOTAL.
- Camisas **pretas** do site usam a linha **PRETA**; as demais usam **BRANCA**.

## Regras
- Pedido feito no site → diminui a quantidade da cor/tamanho e registra cada peça na aba
  **"Pedidos do site"** com SITUAÇÃO = **EM NEGOCIAÇÃO**.
- Na aba "Pedidos do site", mude a SITUAÇÃO para **VENDIDA** quando fechar a venda, ou para
  **CANCELADO** se não fechar: a peça **volta sozinha** ao estoque e a situação vira
  "CANCELADO — devolvido ao estoque".
- Se faltar peça na hora de finalizar, nada é alterado e o cliente é avisado.
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
