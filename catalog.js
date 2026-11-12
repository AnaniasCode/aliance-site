// Dados da loja: edite aqui produtos, preços, contatos e slides.
window.ALIANCE = (function () {
  const OWNERS = [
    { name: "Heitor", phone: "5517988351459", label: "(17) 98835-1459" },
    { name: "Felipe" }, // sem WhatsApp no site; o nome aparece em "Sobre a Marca"
  ];
  // ---------- Pedidos pelo site ----------
  // WhatsApp que recebe os pedidos (só números, com 55 + DDD).
  // PROVISÓRIO: número do Heitor até a loja informar o número próprio.
  const WHATSAPP_PEDIDOS = "5517988351459";
  const FRETE = 24.90; // valor fixo por pedido

  // ---------- Estoque (Google Sheets) ----------
  // URL do "App da Web" do script em ferramentas/estoque-apps-script.gs.
  // Vazio = estoque desligado (o site não limita nada).
  const ESTOQUE_URL = "";
  // Cor da camisa lisa de cada peça, como está escrita na planilha (coluna COR).
  const corEstoque = (cor) => (/^pret/i.test(cor) ? "PRETA" : "OFF-WHITE");

  // Cupons de desconto. Para criar um, copie o modelo abaixo e ajuste.
  //   codigo:    o que o cliente digita (maiúsculas ou minúsculas tanto faz)
  //   tipo:      "percentual" (ex.: 10 = 10% nas peças), "valor" (ex.: 20 = R$ 20 de desconto)
  //              ou "frete" (frete grátis)
  //   valor:     número do desconto (não usado no tipo "frete")
  //   minimo:    valor mínimo em peças para o cupom valer (0 = sem mínimo)
  //   validoAte: último dia de uso, "AAAA-MM-DD" (ou "" para não expirar)
  //   ativo:     true para valer, false para pausar
  // Exemplo: { codigo: "BEMVINDO10", tipo: "percentual", valor: 10, minimo: 0, validoAte: "2026-12-31", ativo: true },
  const CUPONS = [
  ];

  const INSTAGRAM = "https://www.instagram.com/aliance.brl/";
  const SUPPORT_EMAIL = "lojaaliancebrl@gmail.com";
  const TAMANHOS = ["P", "M", "G", "GG"];
  const TECIDO = "100% algodão";

  // Fotos: coloque os arquivos em assets/produtos/ com estes nomes
  // (os mesmos do projeto original): peca_N_costas_cinza.jpg, peca_N_frente_cinza.jpg, peca_N_conjunto_cinza.jpg
  const fotos = (n) => ({
    costas: `/assets/produtos/peca_${n}_costas_cinza.jpg`,
    frente: `/assets/produtos/peca_${n}_frente_cinza.jpg`,
    conjunto: `/assets/produtos/peca_${n}_conjunto_cinza.jpg`,
  });

  const raw = [
    [2, "AL-001", "aliance-beach", "Aliance Beach", "Coastal Club",
      "Sol, mar e clube costeiro. O verão em forma de peça.",
      "Tipografia marinha nas costas com estrela-do-mar vermelha e o pequeno brasão de raquetes no peito. Um off-white que pede verão.",
      "Off-white", "Costas — ALIANCE Beach Coastal Club com estrela-do-mar", "R$ 109,90"],
    [3, "AL-002", "par-la-mer", "Par la mer", "Coastal Club",
      "A estrela-do-mar em aquarela, sobre preto profundo.",
      "Estrela-do-mar em aquarela laranja e azul nas costas, com lettering à mão. No peito, o brasão de raquetes bordado em dourado.",
      "Preto", "Costas — estrela-do-mar em aquarela com lettering Par la mer", "R$ 109,90"],
    [4, "AL-003", "the-future-is-yours", "The Future Is Yours", "Autorais",
      "Um manifesto em traço de nanquim e azul.",
      "Lettering gestual entrelaçado em manchas de azul nas costas, com estrelas e o brasão de raquetes no peito. O futuro é seu.",
      "Off-white", "Costas — lettering The future is yours em azul e preto", "R$ 109,90"],
    [5, "AL-004", "do-what-you-love", "Do What You Love", "Autorais",
      "Um cavalo-marinho em aquarela, feito para o horizonte.",
      "Cavalo-marinho em aquarela rosa e coral abraçado pelo lettering. A peça mais expressiva do acervo, sobre preto profundo.",
      "Preto", "Costas — cavalo-marinho em aquarela com lettering Do what you love", "R$ 109,90"],
    [6, "AL-005", "onca-pintada", "Aliance Onça Pintada", "Autorais",
      "Força e elegância em movimento.",
      "A onça pintada em salto, desenhada em traço fino com a assinatura Aliance em vermelho. Discreta na frente, marcante nas costas.",
      "Off-white", "Costas — onça pintada em traço fino com assinatura vermelha", "R$ 109,90"],
    [7, "AL-006", "monte-carlo", "Monte Carlo", "Autorais",
      "A Riviera em traço de nanquim, vestida com calma.",
      "O Cassino de Monte Carlo ilustrado em azul cobalto sobre malha clara, com o lettering Côte d'Azur. Elegância à beira-mar.",
      "Off-white", "Costas — ilustração do Cassino de Monte Carlo em azul cobalto", "R$ 109,90"],
    [8, "AL-007", "obsessed", "Obsessed", "Autorais",
      "Atitude em preto e vermelho.",
      "Silhueta em pinceladas pretas com o lettering Obsessed em vermelho nas costas. Na frente, apenas o brasão de raquetes.",
      "Off-white", "Costas — silhueta em pinceladas com lettering Obsessed", "R$ 109,90"],
    [9, "AL-008", "every-summer-has-a-story", "Every Summer Has a Story", "Coastal Club",
      "Todo verão tem uma história. Vista a sua.",
      "Tipografia clássica nas costas com a garrafa ilustrada e lacre vermelho. Uma celebração dos verões que ficam na memória.",
      "Preto", "Costas — lettering Every summer has a story com garrafa ilustrada", "R$ 109,90"],
    [10, "AL-009", "society-preto-laranja", "Aliance Society — Preto/Laranja", "Society",
      "O cavalo da Society em laranja sobre preto.",
      "O cavalo da Aliance Society em laranja queimado sobre preto, com o selo A Legacy of Excellence. Tradição com atitude.",
      "Preto com arte laranja", "Costas — cavalo Society em laranja com selo Brazil", "R$ 99,90"],
    [11, "AL-010", "society-off-white-azul", "Aliance Society — Off White/Azul", "Society",
      "O cavalo da Society em azul sobre off-white.",
      "O cavalo da Aliance Society em azul profundo sobre off-white, com o selo A Legacy of Excellence. O clássico do clube.",
      "Off-white com arte azul", "Costas — cavalo Society em azul com selo Brazil", "R$ 99,90"],
  ];

  const modelos = raw.map(([n, code, slug, name, collection, tagline, descricao, cor, estampa, preco]) => {
    const f = fotos(n);
    const precoNum = Number(preco.replace(/[^\d,]/g, "").replace(",", "."));
    return { code, slug, name, collection, tagline, descricao, cor, corEstoque: corEstoque(cor), estampa, preco, precoNum,
      tecido: TECIDO, tamanhos: TAMANHOS, img: f.conjunto, fotos: f };
  });

  const colecoes = Array.from(new Set(modelos.map((m) => m.collection)));

  const medidas = [
    { tamanho: "P", comprimento: "67 cm", largura: "50 cm" },
    { tamanho: "M", comprimento: "71 cm", largura: "52 cm" },
    { tamanho: "G", comprimento: "73 cm", largura: "56 cm" },
    { tamanho: "GG", comprimento: "76 cm", largura: "58 cm" },
  ];

  const heroSlides = [
    { img: "/assets/hero_1.jpg", colecao: "Coastal Club", tagline: "Sol, escadarias e mar. Clube costeiro desde sempre.", slug: "aliance-beach" },
    { img: "/assets/hero_2.jpg", colecao: "Autorais", tagline: "Estampas autorais, feitas para quem vive o verão.", slug: "do-what-you-love" },
    { img: "/assets/hero_3.jpg", colecao: "Society", tagline: "A legacy of excellence. O clássico do clube.", slug: "society-preto-laranja" },
    { img: "/assets/hero_4.jpg", colecao: "Autorais", tagline: "A Riviera em traço de nanquim, vestida com calma.", slug: "monte-carlo" },
  ];

  function whatsLink(phone, text) {
    return `https://api.whatsapp.com/send?phone=${phone}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  }

  return { WHATSAPP_PEDIDOS, FRETE, CUPONS, ESTOQUE_URL, OWNERS, INSTAGRAM, SUPPORT_EMAIL, modelos, colecoes, medidas, heroSlides, whatsLink };
})();
