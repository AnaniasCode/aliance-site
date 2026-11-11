# Ferramentas de fotos

Scripts usados para preparar as fotos das camisas (não vão para o site).

1. `fotos_quadradas.py PASTA_ORIGEM PASTA_SAIDA [AL-001 ...]`
   Transforma fotos em pé (frente e costas) em quadradas, completando as laterais com o
   próprio fundo, e monta a foto "frente e verso". A tabela `MAP` no início do arquivo diz
   qual foto (pela ordem do nome) é a frente e as costas de cada código.
2. `escurecer_fundo.py PASTA_ENTRADA PASTA_SAIDA`
   Deixa o fundo no mesmo cinza neutro das fotos antigas (205), sem mexer na camisa.

Precisa de Python com Pillow, numpy e scipy.
