(function () {
  const { FRETE_GRATIS_LOCAL, freteGratisLocal, PROMOCAO, ESTOQUE_URL, WHATSAPP_PEDIDOS, FRETE, CUPONS, OWNERS, SUPPORT_EMAIL, modelos, colecoes, medidas, heroSlides, whatsLink } = window.ALIANCE;
  const app = document.getElementById("app");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Ícones (traço fino, estilo lucide) ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  };
  const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
  document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));

  /* ---------- Foto ausente → placeholder elegante ---------- */
  window.__imgFallback = function (img) {
    if (img.dataset.fb) return;
    img.dataset.fb = "1";
    const label = img.alt || "ALIANCE®";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#2b241d"/><text x="300" y="285" text-anchor="middle" font-family="Georgia,serif" font-size="34" letter-spacing="6" fill="#ece3d3">ALIANCE®</text><text x="300" y="330" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="22" fill="#b9a98f">${esc(label)}</text></svg>`;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };
  const IMG = (src, alt, cls = "", extra = "") => `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" ${extra} onerror="__imgFallback(this)">`;

  /* ---------- Sacola (localStorage) ---------- */
  const KEY = "aliance-sacola";
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { bag = []; }
  const saveBag = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch {} updateCount(); };
  /* ---------- Estoque (planilha do Google) ---------- */
  // estoque = { "OFF-WHITE": { P: 1, G: 3 }, "PRETA": {} }  — null enquanto não carregou / desligado
  let estoque = null;
  // Último estoque visto neste aparelho (até 6 h): limita a sacola na hora, enquanto a planilha responde.
  const ESTOQUE_CACHE = "aliance-estoque";
  if (ESTOQUE_URL) {
    try {
      const c = JSON.parse(localStorage.getItem(ESTOQUE_CACHE) || "null");
      if (c && c.url === ESTOQUE_URL && Date.now() - c.t < 6 * 3600e3) estoque = c.estoque;
    } catch {}
  }
  const modeloDe = (code) => modelos.find((x) => x.code === code);
  const disponivel = (m, size) => (estoque ? (estoque[m.corEstoque] || {})[size] || 0 : Infinity);
  const naSacola = (cor, size) => bag.reduce((a, i) => { const mm = modeloDe(i.code); return a + (mm && mm.corEstoque === cor && i.size === size ? i.qty : 0); }, 0);
  const resta = (m, size) => disponivel(m, size) - naSacola(m.corEstoque, size);
  const esgotado = (m) => !!estoque && m.tamanhos.every((t) => disponivel(m, t) <= 0);
  const nomeCor = (cor) => String(cor).toLowerCase();
  async function carregarEstoque() {
    if (!ESTOQUE_URL) return;
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(ESTOQUE_URL, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(t);
      const j = await r.json();
      if (j && j.ok && j.estoque) {
        estoque = j.estoque;
        try { localStorage.setItem(ESTOQUE_CACHE, JSON.stringify({ url: ESTOQUE_URL, t: Date.now(), estoque })); } catch {}
        aplicarEstoque(); if (currentPath === "/sacola") Sacola();
      }
    } catch {}
  }
  // Marca tamanhos esgotados e peças esgotadas na página atual
  function aplicarEstoque() {
    if (!estoque) return;
    document.querySelectorAll(".card[data-code]").forEach((c) => {
      const m = modeloDe(c.dataset.code); if (!m) return;
      c.classList.toggle("esgotado", esgotado(m));
      c.querySelectorAll(".card-size").forEach((b) => {
        const off = disponivel(m, b.dataset.size) <= 0;
        b.disabled = off; b.classList.toggle("off", off); b.title = off ? "Esgotado" : "";
        if (off && b.classList.contains("on")) { b.classList.remove("on"); delete c.dataset.size; }
      });
    });
    const pg = document.querySelector("[data-produto]");
    if (pg) {
      const m = modeloDe(pg.dataset.produto);
      pg.querySelectorAll(".size").forEach((b) => {
        const n = disponivel(m, b.dataset.size), off = n <= 0;
        b.disabled = off; b.classList.toggle("off", off); b.title = off ? "Esgotado" : (n <= 3 ? `Últimas ${n}` : "");
      });
      const add = document.getElementById("add-bag");
      if (add) { add.disabled = esgotado(m); add.textContent = esgotado(m) ? "Esgotado" : "Adicionar à sacola"; }
    }
  }
  const addBag = (code, size) => {
    const m = modeloDe(code);
    if (m && resta(m, size) <= 0) {
      const d = disponivel(m, size);
      toast(d <= 0 ? `Tamanho ${size} esgotado` : `Só temos ${d} camisa${d > 1 ? "s" : ""} ${nomeCor(m.corEstoque)} ${size} — já estão na sua sacola`);
      return false;
    }
    const f = bag.find((i) => i.code === code && i.size === size);
    if (f) f.qty += 1; else bag.push({ code, size, qty: 1 });
    saveBag();
    return true;
  };
  const removeBag = (code, size) => { bag = bag.filter((i) => !(i.code === code && i.size === size)); saveBag(); };
  const updateCount = () => { document.getElementById("bag-count").textContent = bag.reduce((a, i) => a + i.qty, 0); };
  updateCount();

  /* ---------- Favoritos (localStorage) ---------- */
  const FAV_KEY = "aliance-favoritos";
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { favs = []; }
  const isFav = (code) => favs.includes(code);
  const updateFavCount = () => {
    const el = document.getElementById("fav-count");
    el.textContent = favs.length;
    el.hidden = favs.length === 0;
  };
  const toggleFav = (code) => {
    favs = isFav(code) ? favs.filter((c) => c !== code) : [...favs, code];
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch {}
    updateFavCount();
    return isFav(code);
  };
  updateFavCount();

  /* ---------- Toast ---------- */
  function toast(msg, action) {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<a href="${action.href}">${esc(action.label)}</a>` : ""}`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  /* ---------- Header / navegação ---------- */
  const links = [["/", "Início"], ["/colecoes", "Coleções"], ["/produtos", "Produtos"], ["/sobre", "Sobre a Marca"], ["/contato", "Contato"]];
  const navD = document.getElementById("nav-desktop");
  const navM = document.getElementById("nav-mobile");
  navD.innerHTML = links.map(([to, l]) => `<a href="${to}" data-to="${to}">${l}</a>`).join("");
  navM.innerHTML = [...links, ["/minhas-compras", "Minhas compras"]].map(([to, l]) => `<a href="${to}">${l}</a>`).join("");
  const header = document.getElementById("header");
  const menuBtn = document.getElementById("menu-btn");
  let menuOpen = false, currentPath = "/";
  const setMenu = (v) => { menuOpen = v; navM.hidden = !v; menuBtn.innerHTML = icon(v ? "x" : "menu"); updateHeader(); };
  menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  const updateHeader = () => header.classList.toggle("solid", window.scrollY > 40 || currentPath !== "/" || menuOpen);
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Componentes ---------- */
  const card = (m) => {
    const fav = isFav(m.code);
    const slides = [[m.fotos.costas, "Costas"], [m.fotos.modelo, "No corpo"], [m.fotos.frente, "Frente"]];
    return `
    <article class="card" data-code="${m.code}">
      <div class="card-media">
        <a href="/produtos/${m.slug}" class="card-track" tabindex="-1" aria-hidden="true" draggable="false">
          ${slides.map(([src, label]) => IMG(src, `${m.name} — ${label}`, src === m.fotos.modelo ? "foto-modelo" : "", 'loading="lazy" draggable="false"')).join("")}
        </a>
        <span class="card-code">${m.code}</span>
        ${promoAtiva() ? `<span class="card-promo">${esc(PROMOCAO.nome)}</span>` : ""}
        <span class="card-esgotado">Esgotado</span>
        <button class="card-fav ${fav ? "on" : ""}" aria-pressed="${fav}" aria-label="Favoritar ${esc(m.name)}">${icon("heart")}</button>
        <button class="card-arrow prev" aria-label="Foto anterior">${icon("left")}</button>
        <button class="card-arrow next" aria-label="Próxima foto">${icon("right")}</button>
        <div class="card-dots" aria-hidden="true">${slides.map((_, k) => `<span class="${k ? "" : "on"}"></span>`).join("")}</div>
        <button class="card-quick" aria-label="Escolher tamanho de ${esc(m.name)}" aria-expanded="false">${icon("bag")}</button>
        <div class="card-panel" role="group" aria-label="Adicionar ${esc(m.name)} à sacola">
          <span class="card-panel-title">Adicionar</span>
          <div class="card-sizes">${m.tamanhos.map((t) => `<button class="card-size" data-size="${t}" aria-label="Adicionar tamanho ${t} à sacola">${t}</button>`).join("")}</div>
        </div>
      </div>
      <a href="/produtos/${m.slug}" class="card-info">
        <p class="eyebrow">${esc(m.collection)}</p>
        <p class="card-name">${esc(m.name)}</p>
        <p class="card-price">${promoAtiva() ? `<s>${m.preco}</s> <span class="preco-promo">a partir de ${brl(precoPromo(m))}</span>` : m.preco}</p>
      </a>
    </article>`;
  };

  /* ---------- Interações do card (valem para todas as grades) ---------- */
  const goSlide = (cardEl, k) => {
    const tr = cardEl.querySelector(".card-track");
    const n = tr.children.length;
    k = (k + n) % n;
    tr.scrollTo({ left: k * tr.clientWidth, behavior: "smooth" });
  };
  const curSlide = (tr) => Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth));
  document.addEventListener("scroll", (e) => {
    const tr = e.target;
    if (!(tr instanceof Element) || !tr.classList.contains("card-track")) return;
    const k = curSlide(tr);
    tr.parentElement.querySelectorAll(".card-dots span").forEach((d, i) => d.classList.toggle("on", i === k));
  }, true);

  // Painel de tamanhos: abre ao passar o mouse ou pelo botão da sacola (toque).
  // Fecha ao sair com o mouse, ao tocar fora, ao abrir outro card, ou sozinho
  // depois de 30 segundos sem nenhum tamanho escolhido.
  const PANEL_TIMEOUT = 30000;
  const clearSize = (c) => {
    delete c.dataset.size;
    c.querySelectorAll(".card-size").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
  };
  const armTimer = (c) => {
    clearTimeout(c._panelTimer);
    c._panelTimer = setTimeout(() => { if (!c.dataset.size) setOpen(c, false); }, PANEL_TIMEOUT);
  };
  const canHoverNow = (c) => c.classList.contains("hovering");
  const setOpen = (c, v) => {
    if (v) document.querySelectorAll(".card.open").forEach((o) => { if (o !== c) setOpen(o, false); });
    c.classList.toggle("open", v);
    c.querySelector(".card-quick").setAttribute("aria-expanded", String(v));
    if (v) armTimer(c);
    else { clearTimeout(c._panelTimer); clearSize(c); }
  };
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const c = e.target.closest && e.target.closest(".card");
    if (c && !c.contains(e.relatedTarget)) { c.classList.add("hovering"); goSlide(c, 1); setOpen(c, true); }
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const c = e.target.closest && e.target.closest(".card");
    if (c && !c.contains(e.relatedTarget)) { c.classList.remove("hovering"); goSlide(c, 0); setOpen(c, false); }
  });
  document.addEventListener("pointerdown", (e) => {
    const inside = e.target.closest && e.target.closest(".card.open");
    document.querySelectorAll(".card.open").forEach((o) => { if (o !== inside) setOpen(o, false); });
  });

  // Arrastar as fotos com o mouse (no celular o dedo já funciona nativamente)
  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const tr = e.target.closest && e.target.closest(".card-track");
    if (!tr) return;
    drag = { tr, x: e.clientX, left: tr.scrollLeft, start: curSlide(tr), moved: false };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.tr.classList.add("dragging"); }
    drag.tr.scrollLeft = drag.left - dx;
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    d.tr.classList.remove("dragging");
    const dx = e.clientX - d.x;
    const n = d.tr.children.length;
    const k = Math.abs(dx) > 40 ? Math.min(n - 1, Math.max(0, d.start + (dx < 0 ? 1 : -1))) : d.start;
    d.tr.scrollTo({ left: k * d.tr.clientWidth, behavior: "smooth" });
    // não abrir a peça ao soltar depois de arrastar
    const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    d.tr.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => d.tr.removeEventListener("click", stop, { capture: true }), 50);
  };
  document.addEventListener("dragstart", (e) => { if (e.target.closest && e.target.closest(".card-track")) e.preventDefault(); });
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".card button");
    if (!btn) return;
    e.preventDefault();
    const c = btn.closest(".card");
    const m = modelos.find((x) => x.code === c.dataset.code);
    if (btn.classList.contains("card-fav")) {
      const on = toggleFav(m.code);
      document.querySelectorAll(`.card[data-code="${m.code}"] .card-fav`).forEach((b) => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
      toast(on ? `${m.name} foi para os favoritos` : `${m.name} saiu dos favoritos`, on ? { label: "Ver favoritos", href: "/favoritos" } : null);
      if (!on && currentPath === "/favoritos") Favoritos();
    } else if (btn.classList.contains("card-arrow")) {
      goSlide(c, curSlide(c.querySelector(".card-track")) + (btn.classList.contains("next") ? 1 : -1));
    } else if (btn.classList.contains("card-quick")) {
      setOpen(c, !c.classList.contains("open"));
    } else if (btn.classList.contains("card-size")) {
      // clicar no tamanho já adiciona à sacola (se tiver estoque)
      const size = btn.dataset.size;
      if (!addBag(m.code, size)) return;
      toast(`${m.name} · ${size} foi para a sacola`, { label: "Ver sacola", href: "/sacola" });
      if (!canHoverNow(c)) setOpen(c, false);
    }
  });

  const pageTitle = (eyebrow, title, text) => `
    <div class="page-title"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${text ? `<p class="text">${text}</p>` : ""}</div>`;
  const colecaoHref = (c) => `/produtos?colecao=${encodeURIComponent(c)}`;

  /* ---------- Páginas ---------- */
  let heroTimer = null;

  function Home() {
    const items = ["Beyond trends", "Tiragem limitada", "Peças numeradas", "Made in Brasil", "Acabamento de ateliê"];
    const marquee = [...items, ...items, ...items, ...items].map((t) => `<span>${t}<span class="accent">✦</span></span>`).join("");
    app.innerHTML = `
      <section class="hero">
        ${heroSlides.map((s, k) => `<img src="${s.img}" alt="${esc(s.colecao)}" class="cover ${k === 0 ? "on" : ""}" data-k="${k}">`).join("")}
        <div class="fade"></div>
        <div class="hero-content"><div id="hero-text"></div></div>
        <div class="hero-counter"><span class="line"></span><span id="hero-num"></span><span class="line"></span></div>
        <div class="hero-dots">${heroSlides.map((s, k) => `<button aria-label="Ver coleção ${esc(s.colecao)}" data-k="${k}"></button>`).join("")}</div>
      </section>
      <div class="marquee"><div class="marquee-track">${marquee}</div></div>
      <section class="container section">
        <div class="section-head">
          <div><p class="eyebrow">Mostruário</p><h2 class="h2">O acervo</h2></div>
          <a href="/produtos" class="link-underline">Ver todas as peças ⟶</a>
        </div>
        <div class="grid grid-4">${modelos.map(card).join("")}</div>
      </section>
      <section class="banner">
        <img src="${heroSlides[3].img}" alt="Aliance em Monte Carlo" class="cover">
        <div class="fade"></div>
        <div class="container banner-inner">
          <p class="eyebrow light">Sobre a marca</p>
          <h2 class="h2">Uma visão. Uma união. <em class="accent">Uma nova história.</em></h2>
          <a href="/sobre" class="btn-outline">Conhecer a Aliance ⟶</a>
        </div>
      </section>
      <section class="container section center">
        <p class="eyebrow">Atendimento direto</p>
        <h2 class="h2">Como podemos ajudar?</h2>
        <p class="lead">Para ajuda ou reclamações, entre em contato com a equipe Aliance por e-mail.</p>
        <a href="/contato" class="btn-primary mt-10">Falar com a Aliance</a>
      </section>`;

    let i = 0;
    const imgs = app.querySelectorAll(".hero .cover");
    const dots = app.querySelectorAll(".hero-dots button");
    const show = (n) => {
      i = n;
      const s = heroSlides[i];
      imgs.forEach((im, k) => {
        im.classList.remove("on");
        if (k === i) { void im.offsetWidth; im.classList.add("on"); }
      });
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
      document.getElementById("hero-text").outerHTML = `
        <div id="hero-text" class="hero-text">
          <div class="hero-rule"></div>
          <p class="hero-kicker">Coleção</p>
          <h1>${esc(s.colecao)}</h1>
          <p class="hero-tag">${esc(s.tagline)}</p>
          <a href="/produtos/${s.slug}" class="btn-outline">Conhecer <span aria-hidden="true">⟶</span></a>
        </div>`;
      const pad = (x) => String(x).padStart(2, "0");
      document.getElementById("hero-num").innerHTML = `${pad(i + 1)} <span class="dim">/ ${pad(heroSlides.length)}</span>`;
    };
    const restart = () => { clearInterval(heroTimer); heroTimer = setInterval(() => show((i + 1) % heroSlides.length), 6000); };
    dots.forEach((d) => d.addEventListener("click", () => { show(+d.dataset.k); restart(); }));
    show(0); restart();
  }

  function Colecoes() {
    app.innerHTML = `<div class="container page">
      ${pageTitle("Coleções", "Universos Aliance", "Cada coleção nasce de um lugar e de uma ideia. Escolha a sua.")}
      <div class="colecoes">
        ${colecoes.map((c, k) => {
          const pecas = modelos.filter((m) => m.collection === c);
          const capa = pecas[0];
          return `<a href="${colecaoHref(c)}" class="colecao">
            ${IMG(capa.img, c, "cover")}
            <div class="fade"></div>
            <div class="colecao-inner">
              <p class="eyebrow light">0${k + 1} · ${pecas.length} ${pecas.length === 1 ? "peça" : "peças"}</p>
              <p class="colecao-kicker">Coleção</p>
              <h2>${esc(c)}</h2>
              <p class="colecao-tag">${esc(capa.tagline)}</p>
              <span class="colecao-cta">Ver peças ⟶</span>
            </div>
          </a>`;
        }).join("")}
      </div>
    </div>`;
  }

  function Produtos(query) {
    const colecao = query.get("colecao") || "";
    const lista = colecao ? modelos.filter((m) => m.collection === colecao) : modelos;
    app.innerHTML = `<div class="container page">
      ${pageTitle("Produtos", "O acervo", "Camisetas 100% algodão, do P ao GG. Toque em uma peça para ver todos os detalhes.")}
      <div class="chips">
        <a href="/produtos" class="chip ${!colecao ? "on" : ""}">Todas</a>
        ${colecoes.map((c) => `<a href="${colecaoHref(c)}" class="chip ${colecao === c ? "on" : ""}">${esc(c)}</a>`).join("")}
      </div>
      <div class="grid grid-34" style="row-gap:3rem">${lista.map(card).join("")}</div>
    </div>`;
  }

  function Produto(slug) {
    const m = modelos.find((x) => x.slug === slug);
    if (!m) return NotFound("Peça não encontrada", "/produtos", "Ver o acervo");
    document.title = `${m.name} — ALIANCE®`;
    const outros = modelos.filter((x) => x.slug !== slug);
    const views = [[m.fotos.costas, "Costas"], [m.fotos.frente, "Frente"], [m.fotos.conjunto, "Frente e verso"]];
    let size = null;

    app.innerHTML = `<div class="container" style="padding-top:8rem;padding-bottom:6rem">
      <nav class="crumbs"><a href="/produtos">Produtos</a> / <a href="${colecaoHref(m.collection)}">${esc(m.collection)}</a> / <span class="cur">${esc(m.name)}</span></nav>
      <div class="produto">
        <div class="gallery" aria-label="Fotos de ${esc(m.name)}">
          ${views.map(([src, label], k) => `<button class="${k === 0 ? "wide" : ""}" data-src="${src}" data-label="${label}" aria-label="Ampliar ${esc(m.name)} — ${label}">
            ${IMG(src, `${m.name} — ${label}`, "", k ? 'loading="lazy"' : "")}<span class="zoom">${icon("zoom")}</span></button>`).join("")}
        </div>
        <div class="produto-info">
          <p class="eyebrow">${m.code} — Coleção ${esc(m.collection)}</p>
          <h1>${esc(m.name)}</h1>
          <p class="p-tag">${esc(m.tagline)}</p>
          <p class="p-price">${promoAtiva() ? `<s>${m.preco}</s> <span class="preco-promo">a partir de ${brl(precoPromo(m))}</span>` : m.preco}</p>
          ${promoAtiva() ? `<p class="p-promo"><span class="promo-tag">${esc(PROMOCAO.nome)}</span> ${PROMOCAO.faixas.map((f) => `${f.min} un. <strong>−${f.pct}%</strong>`).join(" · ")}</p>` : ""}
          <p class="p-desc">${esc(m.descricao)}</p>
          <div class="mt-8">
            <p class="eyebrow mb-3">Tamanho <span id="size-label" style="color:var(--foreground)"></span></p>
            <div class="sizes" data-produto="${m.code}">${m.tamanhos.map((t) => `<button class="size" data-size="${t}">${t}</button>`).join("")}</div>
          </div>
          <button class="btn-block" id="add-bag">Adicionar à sacola</button>
          <div class="wa-grid" id="wa-grid"></div>
          <dl class="specs">
            <div class="spec"><dt class="eyebrow">Cor</dt><dd>${esc(m.cor)}</dd></div>
            <div class="spec"><dt class="eyebrow">Arte</dt><dd>${esc(m.estampa)}</dd></div>
            <div class="spec"><dt class="eyebrow">Tecido</dt><dd>${esc(m.tecido)}</dd></div>
          </dl>
          <div class="mt-10">
            <p class="eyebrow mb-3">Tabela de medidas</p>
            <table class="medidas">
              <thead><tr><th class="eyebrow">Tamanho</th><th class="eyebrow">Comprimento</th><th class="eyebrow">Largura</th></tr></thead>
              <tbody>${medidas.map((md) => `<tr><td>${md.tamanho}</td><td>${md.comprimento}</td><td>${md.largura}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
      </div>
      <section class="mt-28">
        <p class="eyebrow">Você também pode gostar</p>
        <div class="grid grid-3" style="margin-top:2rem">${outros.map(card).join("")}</div>
      </section>
    </div>`;

    const renderWa = () => {
      const msg = `Olá! Tenho interesse na peça ${m.name} (${m.code})${size ? `, tamanho ${size}` : ""}.`;
      document.getElementById("wa-grid").innerHTML = OWNERS.filter((o) => o.phone).map((o) => `<a href="${whatsLink(o.phone, msg)}" target="_blank" rel="noopener">WhatsApp ${o.name}</a>`).join("");
    };
    renderWa();
    app.querySelectorAll(".size").forEach((b) => b.addEventListener("click", () => {
      size = b.dataset.size;
      app.querySelectorAll(".size").forEach((x) => x.classList.toggle("on", x === b));
      document.getElementById("size-label").textContent = `· ${size}`;
      renderWa();
    }));
    document.getElementById("add-bag").addEventListener("click", () => {
      if (!size) return toast("Escolha um tamanho primeiro");
      if (!addBag(m.code, size)) return;
      toast(`${m.name} · ${size} foi para a sacola`, { label: "Ver sacola", href: "/sacola" });
    });
    app.querySelectorAll(".gallery button").forEach((b) => b.addEventListener("click", () => openLightbox(b.dataset.src, `${m.name} — ${b.dataset.label}`)));
  }

  function openLightbox(src, alt) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", alt);
    box.innerHTML = `${IMG(src, alt)}<button class="close" aria-label="Fechar foto ampliada">${icon("x")}</button>`;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = () => { box.remove(); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    box.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
    box.querySelector(".close").focus();
  }

  /* ---------- Pedido: valores, cupom e mensagem ---------- */
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
  /* ---------- Promoção por quantidade (Black Friday) ---------- */
  const PROMO_INI = PROMOCAO ? Date.parse(PROMOCAO.inicio) : 0, PROMO_FIM = PROMOCAO ? Date.parse(PROMOCAO.fim) : 0;
  const promoEstado = (agora = Date.now()) => (!PROMOCAO ? "off" : agora < PROMO_INI ? "antes" : agora < PROMO_FIM ? "ativa" : "off");
  const promoAtiva = () => promoEstado() === "ativa";
  const pctPromo = (qtd) => { if (!promoAtiva()) return 0; let p = 0; for (const f of PROMOCAO.faixas) if (qtd >= f.min) p = f.pct; return p; };
  const pctMin = () => (PROMOCAO ? PROMOCAO.faixas[0].pct : 0);
  const precoPromo = (m) => Math.round(m.precoNum * (100 - pctMin())) / 100;

  const CUPOM_KEY = "aliance-cupom";
  const getCupomCode = () => { try { return localStorage.getItem(CUPOM_KEY) || ""; } catch { return ""; } };
  const setCupomCode = (c) => { try { c ? localStorage.setItem(CUPOM_KEY, c) : localStorage.removeItem(CUPOM_KEY); } catch {} };
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  // Confere um cupom para um subtotal. Retorna { ok, cupom } ou { ok:false, erro }.
  function checarCupom(codigo, subtotal) {
    const c = CUPONS.find((x) => x.codigo.toUpperCase() === String(codigo).trim().toUpperCase());
    if (!c || c.ativo === false) return { ok: false, erro: "Cupom inválido." };
    if (c.validoAte && hoje() > c.validoAte) return { ok: false, erro: "Este cupom expirou." };
    if (c.minimo && subtotal < c.minimo) return { ok: false, erro: `Este cupom vale para compras a partir de ${brl(c.minimo)} em peças.` };
    return { ok: true, cupom: c };
  }
  function linhasSacola() {
    return bag.map((i) => ({ ...i, m: modelos.find((m) => m.code === i.code) })).filter((l) => l.m);
  }
  // endereco (opcional): { cep, cidade, uf } — frete grátis para São José do Rio Preto
  function resumo(endereco) {
    const linhas = linhasSacola();
    const subtotal = Math.round(linhas.reduce((a, l) => a + l.m.precoNum * l.qty, 0) * 100) / 100;
    const freteLocal = !!(endereco && freteGratisLocal(endereco));
    const freteBase = linhas.length && !freteLocal ? FRETE : 0;
    let descCupom = 0, frete = freteBase, cupom = null, cupomErro = "", cupomIgnorado = null;
    const code = getCupomCode();
    if (code && linhas.length) {
      const r = checarCupom(code, subtotal);
      if (r.ok) {
        cupom = r.cupom;
        if (cupom.tipo === "percentual") descCupom = Math.round(subtotal * cupom.valor) / 100;
        else if (cupom.tipo === "valor") descCupom = Math.min(subtotal, cupom.valor);
        else if (cupom.tipo === "frete") frete = 0;
      } else cupomErro = r.erro;
    }
    // Promoção: não acumula com cupom, vale o maior desconto
    const qtd = linhas.reduce((a, l) => a + l.qty, 0);
    const pct = pctPromo(qtd);
    let descPromo = pct ? Math.round(subtotal * pct) / 100 : 0, promoIgnorada = false;
    if (pct && cupom) {
      const economiaCupom = cupom.tipo === "frete" ? freteBase : descCupom;
      if (descPromo >= economiaCupom) { cupomIgnorado = cupom; cupom = null; descCupom = 0; frete = freteBase; }
      else { descPromo = 0; promoIgnorada = true; }
    }
    const desconto = Math.round((descCupom + descPromo) * 100) / 100;
    const total = Math.round((subtotal - desconto + frete) * 100) / 100;
    const promo = descPromo ? { pct, qtd, valor: descPromo } : null;
    return { linhas, subtotal, desconto, descCupom, frete, freteLocal, comEndereco: !!endereco, total, cupom, cupomErro, cupomIgnorado, promoIgnorada, promo, qtd };
  }
  const resumoHTML = (r) => `
    <dl class="totais">
      <div><dt>Peças</dt><dd>${brl(r.subtotal)}</dd></div>
      ${r.promo ? `<div class="desc"><dt>${esc(PROMOCAO.nome)} · ${r.promo.qtd} un. · ${r.promo.pct}% OFF</dt><dd>− ${brl(r.promo.valor)}</dd></div>` : ""}
      ${r.cupom ? `<div class="desc"><dt>Cupom ${esc(r.cupom.codigo.toUpperCase())}</dt><dd>${r.cupom.tipo === "frete" ? "Frete grátis" : "− " + brl(r.descCupom)}</dd></div>` : ""}
      <div><dt>Frete${r.freteLocal ? ` <span class="frete-local">${esc(FRETE_GRATIS_LOCAL.nome)}</span>` : ""}</dt><dd>${r.frete ? brl(r.frete) : "Grátis"}</dd></div>
      ${!r.comEndereco && r.frete ? `<p class="frete-aviso">Frete grátis para ${esc(FRETE_GRATIS_LOCAL.nome)}: o valor é recalculado quando você informar o endereço.</p>` : ""}
      <div class="total"><dt>Total</dt><dd>${brl(r.total)}</dd></div>
    </dl>
    ${r.cupomIgnorado ? `<p class="hint">O cupom ${esc(r.cupomIgnorado.codigo.toUpperCase())} não acumula com a ${esc(PROMOCAO.nome)}: aplicamos o maior desconto.</p>` : ""}
    ${r.promoIgnorada ? `<p class="hint">Cupom e ${esc(PROMOCAO.nome)} não acumulam: o seu cupom dá mais desconto, então usamos ele.</p>` : ""}`;

  function promoProgresso(qtd) {
    if (!promoAtiva()) return "";
    const fx = PROMOCAO.faixas, atual = pctPromo(qtd), prox = fx.find((f) => f.min > qtd);
    const largura = Math.min(100, (qtd / fx[fx.length - 1].min) * 100);
    const texto = prox
      ? `${atual ? `<strong>${atual}% OFF</strong> aplicado · ` : ""}Adicione mais ${prox.min - qtd} ${prox.min - qtd > 1 ? "camisetas" : "camiseta"} e ganhe <strong>${prox.pct}% OFF</strong>`
      : `<strong>${atual}% OFF</strong> aplicado na sua sacola`;
    return `<div class="promo-prog"><p><span class="promo-tag">${esc(PROMOCAO.nome)}</span> ${texto}</p>
      <div class="promo-barra"><span style="width:${largura}%"></span>${fx.map((f) => `<i style="left:${(f.min / fx[fx.length - 1].min) * 100}%"><b>${f.pct}%</b></i>`).join("")}</div></div>`;
  }

  function Sacola() {
    const r = resumo();
    if (r.cupomErro) setCupomCode("");
    let body;
    if (!r.linhas.length) {
      body = `<div class="empty"><p>Sua sacola está vazia.</p><a href="/produtos" class="btn-outline">Ver o acervo</a></div>`;
    } else {
      body = `${r.promoIgnorada ? "" : promoProgresso(r.qtd)}<ul class="bag-list">${r.linhas.map((l) => `
          <li>
            ${IMG(l.m.img, l.m.name)}
            <div style="min-width:0">
              <a href="/produtos/${l.m.slug}" class="name">${esc(l.m.name)}</a>
              <p class="meta">${l.code} · ${l.m.cor.split(" ")[0]} · Tamanho ${l.size} · ${l.m.preco}</p>
              ${estoque && naSacola(l.m.corEstoque, l.size) > disponivel(l.m, l.size)
                ? `<p class="stock-warn">${disponivel(l.m, l.size) <= 0 ? "Esgotado" : `Só ${disponivel(l.m, l.size)} disponível(is) em ${nomeCor(l.m.corEstoque)} ${l.size}`} — ajuste a quantidade</p>` : ""}
              <div class="qty" aria-label="Quantidade">
                <button data-qty="-1" data-k="${l.code}|${l.size}" aria-label="Diminuir">−</button>
                <span>${l.qty}</span>
                <button data-qty="1" data-k="${l.code}|${l.size}" aria-label="Aumentar" ${resta(l.m, l.size) <= 0 ? "disabled" : ""}>+</button>
              </div>
            </div>
            <div class="bag-right">
              <p class="line-total">${brl(l.m.precoNum * l.qty)}</p>
              <button class="small-btn" data-remove="${l.code}|${l.size}">Remover</button>
            </div>
          </li>`).join("")}</ul>
        <div class="bag-bottom">
          <form class="cupom" id="cupom-form" novalidate>
            <label class="eyebrow" for="cupom-input">Cupom de desconto</label>
            ${r.cupom
              ? `<div class="cupom-on"><span>✓ <strong>${esc(r.cupom.codigo.toUpperCase())}</strong> aplicado</span><button type="button" class="small-btn" id="cupom-remove">Remover</button></div>`
              : `<div class="cupom-row"><input id="cupom-input" name="cupom" autocomplete="off" autocapitalize="characters" placeholder="Digite o código" /><button type="submit">Aplicar</button></div>
                 <p class="cupom-msg" id="cupom-msg" role="status">${r.cupomErro ? esc(r.cupomErro) : ""}</p>`}
          </form>
          <div class="bag-summary">
            ${resumoHTML(r)}
            ${r.linhas.some((l) => estoque && naSacola(l.m.corEstoque, l.size) > disponivel(l.m, l.size))
              ? `<p class="stock-warn">Algumas peças passaram do estoque. Ajuste a sacola para continuar.</p><button class="btn-primary block" disabled>Continuar para entrega</button>`
              : `<a href="/finalizar" class="btn-primary block">Continuar para entrega</a>`}
            <button class="small-btn" id="clear-bag">Esvaziar sacola</button>
          </div>
        </div>`;
    }
    app.innerHTML = `<div class="container page" style="max-width:56rem">
      ${pageTitle("Sacola", "Suas peças", "Confira suas peças, aplique seu cupom e siga para a entrega.")}${body}</div>`;
    app.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => { const [c, sz] = b.dataset.remove.split("|"); removeBag(c, sz); Sacola(); }));
    app.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
      const [c, sz] = b.dataset.k.split("|");
      const it = bag.find((i) => i.code === c && i.size === sz);
      if (!it) return;
      it.qty += Number(b.dataset.qty);
      if (it.qty < 1) bag = bag.filter((i) => i !== it);
      saveBag(); Sacola();
    }));
    const clr = document.getElementById("clear-bag");
    if (clr) clr.addEventListener("click", () => { bag = []; saveBag(); Sacola(); });
    const form = document.getElementById("cupom-form");
    if (form && !r.cupom) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = document.getElementById("cupom-input").value.trim();
      const msg = document.getElementById("cupom-msg");
      if (!code) { msg.textContent = "Digite o código do cupom."; return; }
      const res = checarCupom(code, resumo().subtotal);
      if (!res.ok) { msg.textContent = res.erro; return; }
      setCupomCode(res.cupom.codigo);
      Sacola();
      toast(`Cupom ${res.cupom.codigo.toUpperCase()} aplicado`);
    });
    const rm = document.getElementById("cupom-remove");
    if (rm) rm.addEventListener("click", () => { setCupomCode(""); Sacola(); });
  }

  /* ---------- Finalizar pedido: dados, endereço e pagamento ---------- */
  const CLIENTE_KEY = "aliance-cliente";
  const onlyDigits = (v) => String(v || "").replace(/\D/g, "");
  const maskPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const maskCpf = (v) => { const d = onlyDigits(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2"); };
  function cpfValido(v) {
    const d = onlyDigits(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
  }
  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim());
  const maskCep = (v) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
  const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
  const PAGAMENTOS = ["Pix", "Cartão de débito", "Cartão de crédito"];

  function Finalizar() {
    let salvoEnd = {};
    try { salvoEnd = JSON.parse(localStorage.getItem(CLIENTE_KEY) || "{}"); } catch {}
    const r = resumo({ cep: salvoEnd.cep || "", cidade: salvoEnd.cidade || "", uf: salvoEnd.uf || "" });
    if (!r.linhas.length) {
      app.innerHTML = `<div class="container page" style="max-width:56rem">${pageTitle("Finalizar pedido", "Sua sacola está vazia")}
        <div class="empty"><p>Escolha suas peças antes de finalizar.</p><a href="/produtos" class="btn-outline">Ver o acervo</a></div></div>`;
      return;
    }
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CLIENTE_KEY) || "{}"); } catch {}
    const v = (k) => esc(salvo[k] || "");
    const field = (id, label, attrs = "", wide = "") => `
      <div class="field ${wide}">
        <label for="f-${id}">${label}</label>
        <input id="f-${id}" name="${id}" value="${v(id)}" ${attrs} />
        <p class="field-err" id="e-${id}"></p>
      </div>`;
    app.innerHTML = `<div class="container page">
      ${pageTitle("Finalizar pedido", "Entrega e pagamento", "Preencha seus dados. Antes de concluir, você revisa tudo e pode mudar o que quiser.")}
      <div class="checkout" id="checkout-grid">
        <div class="ck-main">
        <form id="checkout" class="checkout-form" novalidate>
          <fieldset>
            <legend class="eyebrow">Seus dados</legend>
            <div class="fields">
              ${field("nome", "Nome completo", 'autocomplete="name" required', "wide")}
              ${field("telefone", "WhatsApp / telefone", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="(17) 99999-9999" required')}
              ${field("cpf", "CPF", 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" required')}
              ${field("email", "E-mail", 'type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="voce@email.com" required', "wide")}
            </div>
          </fieldset>
          <fieldset>
            <legend class="eyebrow">Endereço de entrega</legend>
            <div class="fields">
              ${field("cep", "CEP", 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" required')}
              <p class="cep-msg" id="cep-msg" role="status"></p>
              ${field("rua", "Rua / avenida", 'autocomplete="address-line1" required', "wide")}
              ${field("numero", "Número", 'inputmode="numeric" required')}
              ${field("complemento", "Complemento (opcional)", 'autocomplete="address-line2" placeholder="Apto, bloco, referência"')}
              ${field("bairro", "Bairro", "required")}
              ${field("cidade", "Cidade", 'autocomplete="address-level2" required')}
              <div class="field">
                <label for="f-uf">Estado</label>
                <select id="f-uf" name="uf" autocomplete="address-level1" required>
                  <option value="">UF</option>${UFS.map((u) => `<option ${salvo.uf === u ? "selected" : ""}>${u}</option>`).join("")}
                </select>
                <p class="field-err" id="e-uf"></p>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend class="eyebrow">Forma de pagamento</legend>
            <div class="pay">
              ${PAGAMENTOS.map((pg) => `<label class="pay-opt"><input type="radio" name="pagamento" value="${pg}" ${salvo.pagamento === pg ? "checked" : ""} required><span>${pg}</span></label>`).join("")}
            </div>
            <p class="field-err" id="e-pagamento"></p>
            <p class="hint" id="pay-hint">O pagamento é combinado com a loja pelo WhatsApp depois do envio do pedido.</p>
          </fieldset>
          <label class="optin"><input type="checkbox" name="novidades" ${salvo.novidades ? "checked" : ""}> <span>Quero receber cupons e novidades da Aliance pelo WhatsApp.</span></label>
          <p class="hint">Seus dados são usados só para identificar e entregar o pedido e, se você autorizar acima, para enviar cupons e novidades.</p>
          <button type="submit" class="btn-primary block" id="revisar">Revisar pedido</button>
        </form>
        <div id="revisao" class="revisao" hidden></div>
        </div>
        <aside class="checkout-summary">
          <p class="eyebrow">Resumo</p>
          <ul class="mini-list">${r.linhas.map((l) => `<li>${IMG(l.m.img, l.m.name)}<div><p>${esc(l.m.name)}</p><span>Tamanho ${l.size} · ${l.qty}x</span></div><strong>${brl(l.m.precoNum * l.qty)}</strong></li>`).join("")}</ul>
          <div id="ck-totais">${resumoHTML(r)}</div>
          <a href="/sacola" class="small-btn">Alterar sacola ou cupom</a>
        </aside>
      </div>
    </div>`;

    const f = document.getElementById("checkout");
    const enderecoDoForm = () => ({ cep: f.elements.cep.value, cidade: f.elements.cidade.value, uf: f.elements.uf.value });
    const atualizarTotais = () => { const el = document.getElementById("ck-totais"); if (el) el.innerHTML = resumoHTML(resumo(enderecoDoForm())); };
    ["input", "change"].forEach((ev) => f.addEventListener(ev, (e) => { if (["cep", "cidade", "uf"].includes(e.target.name)) atualizarTotais(); }));
    // Pagamento online (Mercado Pago): só liga se a chave estiver configurada no Cloudflare
    pagamentoOnline().then((pg) => {
      if (!pg.ativo || !document.body.contains(f)) return;
      document.getElementById("pay-hint").innerHTML = "Você paga com segurança pelo <strong>Mercado Pago</strong> na próxima tela." +
        (pg.teste ? ' <span class="badge-teste">Modo de teste — nenhuma cobrança real</span>' : "");
    });
    const tel = f.elements.telefone, cep = f.elements.cep, cpf = f.elements.cpf;
    tel.value = maskPhone(tel.value); cep.value = maskCep(cep.value); cpf.value = maskCpf(cpf.value);
    tel.addEventListener("input", () => { tel.value = maskPhone(tel.value); });
    cpf.addEventListener("input", () => { cpf.value = maskCpf(cpf.value); });
    let ultimoCep = onlyDigits(cep.value);
    cep.addEventListener("input", async () => {
      cep.value = maskCep(cep.value);
      const d = onlyDigits(cep.value);
      if (d.length !== 8 || d === ultimoCep) return;
      ultimoCep = d;
      const msg = document.getElementById("cep-msg");
      msg.textContent = "Buscando endereço…";
      try {
        const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
        const j = await res.json();
        if (j.erro) { msg.textContent = "CEP não encontrado. Preencha o endereço abaixo."; return; }
        if (j.logradouro) f.elements.rua.value = j.logradouro;
        if (j.bairro) f.elements.bairro.value = j.bairro;
        if (j.localidade) f.elements.cidade.value = j.localidade;
        if (j.uf) f.elements.uf.value = j.uf;
        atualizarTotais();
        ["rua", "bairro", "cidade", "uf"].forEach((k) => { if (f.elements[k].value) limparErro({ target: f.elements[k] }); });
        msg.textContent = "";
        (j.logradouro ? f.elements.numero : f.elements.rua).focus();
      } catch { msg.textContent = "Não deu para buscar o CEP agora. Preencha o endereço abaixo."; }
    });

    const limparErro = (e) => {
      const name = e.target.name; if (!name) return;
      const err = document.getElementById("e-" + name); if (err) err.textContent = "";
      f.querySelectorAll(`[name="${name}"]`).forEach((el) => el.removeAttribute("aria-invalid"));
    };
    f.addEventListener("input", limparErro);
    f.addEventListener("change", limparErro);
    // O CEP preenche rua/bairro/cidade/UF sozinho: limpa os erros desses campos também
    cep.addEventListener("change", () => ["rua", "bairro", "cidade", "uf"].forEach((k) => { if (f.elements[k].value) limparErro({ target: f.elements[k] }); }));

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      data.novidades = f.elements.novidades.checked;
      const erros = {};
      if ((data.nome || "").trim().split(/\s+/).length < 2) erros.nome = "Digite seu nome e sobrenome.";
      if (onlyDigits(data.telefone).length < 10) erros.telefone = "Digite um telefone com DDD.";
      if (!cpfValido(data.cpf)) erros.cpf = onlyDigits(data.cpf).length === 11 ? "CPF inválido. Confira os números." : "Digite os 11 números do CPF.";
      if (!emailValido(data.email)) erros.email = "Digite um e-mail válido.";
      if (onlyDigits(data.cep).length !== 8) erros.cep = "Digite um CEP válido.";
      for (const k of ["rua", "numero", "bairro", "cidade"]) if (!(data[k] || "").trim()) erros[k] = "Campo obrigatório.";
      if (!data.uf) erros.uf = "Escolha o estado.";
      if (!data.pagamento) erros.pagamento = "Escolha a forma de pagamento.";
      f.querySelectorAll(".field-err").forEach((el) => (el.textContent = ""));
      f.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      const keys = Object.keys(erros);
      if (keys.length) {
        keys.forEach((k) => { document.getElementById("e-" + k).textContent = erros[k]; const el = f.elements[k]; if (el && el.setAttribute) el.setAttribute("aria-invalid", "true"); });
        const first = f.elements[keys[0]]; (first instanceof RadioNodeList ? first[0] : first).focus();
        return;
      }
      data.email = data.email.trim().toLowerCase();
      try { localStorage.setItem(CLIENTE_KEY, JSON.stringify({ ...data })); } catch {}
      mostrarRevisao(data);
    });

    /* ---------- Passo 2: revisar (e editar) antes de concluir ---------- */
    const revisao = document.getElementById("revisao");
    const grid = document.getElementById("checkout-grid");
    let dados = null;
    const editar = (campo) => {
      revisao.hidden = true; f.hidden = false; grid.classList.remove("revisando");
      const el = f.elements[campo]; const alvo = el instanceof RadioNodeList ? el[0] : el;
      if (alvo) { alvo.scrollIntoView({ block: "center" }); alvo.focus({ preventScroll: true }); }
    };
    async function mostrarRevisao(data) {
      dados = data;
      const r = resumo({ cep: data.cep, cidade: data.cidade, uf: data.uf });
      if (!r.linhas.length) { Finalizar(); return; }
      const online = (await pagamentoOnline()).ativo;
      const k = (l) => `${l.code}|${l.size}`;
      f.hidden = true; revisao.hidden = false; grid.classList.add("revisando");
      revisao.innerHTML = `
        <p class="eyebrow">Revise seu pedido</p>
        <p class="hint">Confira tudo antes de ${online ? "pagar" : "enviar"}. Se precisar, mude aqui mesmo.</p>
        <section class="rev-bloco">
          <header><h3>Peças</h3><a href="/sacola" class="rev-editar">Trocar peças ou cupom</a></header>
          <ul class="bag-list rev-itens">${r.linhas.map((l) => `<li>
            ${IMG(l.m.img, l.m.name)}
            <div style="min-width:0"><a href="/produtos/${l.m.slug}" class="name">${esc(l.m.name)}</a>
              <p class="meta">${l.code} · ${l.m.cor.split(" ")[0]} · Tamanho ${l.size} · ${l.m.preco}</p>
              <div class="qty" aria-label="Quantidade"><button type="button" data-rq="-1" data-k="${k(l)}" aria-label="Diminuir">−</button><span>${l.qty}</span><button type="button" data-rq="1" data-k="${k(l)}" aria-label="Aumentar" ${resta(l.m, l.size) <= 0 ? "disabled" : ""}>+</button></div>
            </div>
            <div class="bag-right"><p class="line-total">${brl(l.m.precoNum * l.qty)}</p><button type="button" class="small-btn" data-rrm="${k(l)}">Remover</button></div>
          </li>`).join("")}</ul>
        </section>
        <section class="rev-bloco">
          <header><h3>Seus dados</h3><button type="button" class="rev-editar" data-editar="nome">Editar</button></header>
          <p>${esc(data.nome.trim())}<br>CPF ${maskCpf(data.cpf)}<br>${maskPhone(data.telefone)}<br>${esc(data.email)}</p>
        </section>
        <section class="rev-bloco">
          <header><h3>Entrega</h3><button type="button" class="rev-editar" data-editar="cep">Editar</button></header>
          <p>${esc(data.rua.trim())}, ${esc(data.numero.trim())}${data.complemento.trim() ? " — " + esc(data.complemento.trim()) : ""}<br>${esc(data.bairro.trim())} — ${esc(data.cidade.trim())}/${esc(data.uf)}<br>CEP ${maskCep(data.cep)}</p>
        </section>
        <section class="rev-bloco">
          <header><h3>Pagamento</h3><button type="button" class="rev-editar" data-editar="pagamento">Editar</button></header>
          <p>${esc(data.pagamento)}${online ? " · pelo Mercado Pago, na próxima tela" : " · combinado com a loja pelo WhatsApp"}</p>
        </section>
        <div class="rev-totais">${resumoHTML(r)}</div>
        <p class="form-erro" id="form-erro" role="alert"></p>
        <button type="button" class="btn-primary block" id="finish">${online ? "Ir para o pagamento" : "Finalizar pedido pelo WhatsApp"}</button>
        <p class="center"><button type="button" class="small-btn" data-editar="nome">Voltar e editar</button></p>`;
      revisao.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => editar(b.dataset.editar)));
      const mudar = (key, delta) => {
        const [c, sz] = key.split("|");
        const it = bag.find((i) => i.code === c && i.size === sz); if (!it) return;
        it.qty = delta === null ? 0 : it.qty + delta;
        if (it.qty < 1) bag = bag.filter((i) => i !== it);
        saveBag(); atualizarLateral(); mostrarRevisao(dados);
      };
      revisao.querySelectorAll("[data-rq]").forEach((b) => b.addEventListener("click", () => mudar(b.dataset.k, Number(b.dataset.rq))));
      revisao.querySelectorAll("[data-rrm]").forEach((b) => b.addEventListener("click", () => mudar(b.dataset.rrm, null)));
      document.getElementById("finish").addEventListener("click", () => enviarPedido(dados));
      const topo = grid.getBoundingClientRect().top + window.scrollY - 120;
      if (window.scrollY > topo) window.scrollTo(0, Math.max(0, topo));
    }
    const atualizarLateral = () => {
      const r0 = resumo(enderecoDoForm());
      const ml = app.querySelector(".checkout-summary .mini-list");
      if (ml) ml.innerHTML = r0.linhas.map((l) => `<li>${IMG(l.m.img, l.m.name)}<div><p>${esc(l.m.name)}</p><span>Tamanho ${l.size} · ${l.qty}x</span></div><strong>${brl(l.m.precoNum * l.qty)}</strong></li>`).join("");
      atualizarTotais();
    };

    async function enviarPedido(data) {
      const btn = document.getElementById("finish"); btn.disabled = true; btn.textContent = "Enviando…";
      const erroEl = document.getElementById("form-erro"); erroEl.textContent = "";
      const pg = await pagamentoOnline();
      if (pg.ativo) {
        try {
          const res = await fetch("/api/pagamento", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itens: bag.map(({ code, size, qty }) => ({ code, size, qty })), cupom: getCupomCode(), pagamento: data.pagamento, cliente: data }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok || !j.url) throw new Error(j.erro || "Não foi possível iniciar o pagamento. Tente de novo.");
          // reserva as camisas na planilha antes de ir pagar (se faltar peça, não vai)
          const est = await baixarEstoque(j.id, data, resumo(), "Ir para o pagamento");
          if (!est.ok) return;
          try { localStorage.setItem("aliance-pedido-pendente", JSON.stringify({ id: j.id, total: brl(j.total), forma: data.pagamento })); } catch {}
          salvarCompra({ id: j.id, data: new Date().toISOString(), canal: "mercadopago", status: "criado", situacao: "Aguardando pagamento",
            itens: itensCompra(resumo().linhas), total: brl(j.total), forma: data.pagamento, telefone: onlyDigits(data.telefone) });
          window.location.href = j.url;
        } catch (err) {
          erroEl.textContent = err.message;
          btn.disabled = false; btn.textContent = "Ir para o pagamento";
        }
        return;
      }
      const r2 = resumo({ cep: data.cep, cidade: data.cidade, uf: data.uf });
      const d = new Date();
      const id = `AL${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const endereco = `${data.rua.trim()}, ${data.numero.trim()}${data.complemento.trim() ? " — " + data.complemento.trim() : ""}\n${data.bairro.trim()} — ${data.cidade.trim()}/${data.uf}\nCEP ${maskCep(data.cep)}`;
      const itens = r2.linhas.map((l) => `• ${l.qty}x ${l.m.name} (${l.code}) — ${l.m.cor.split(" ")[0]} — Tam. ${l.size} — ${brl(l.m.precoNum * l.qty)}`).join("\n");
      const est = await baixarEstoque(id, data, r2, "Finalizar pedido pelo WhatsApp");
      if (!est.ok) return;
      const avisoEstoque = est.aviso;
      const msg = [
        `*NOVO PEDIDO — ALIANCE®*`, `Pedido: ${id}`, ``,
        `*Peças*`, itens, ``,
        `Subtotal: ${brl(r2.subtotal)}`,
        r2.promo ? `${PROMOCAO.nome} (${r2.promo.qtd} un., ${r2.promo.pct}%): − ${brl(r2.promo.valor)}` : null,
        r2.cupom ? `Cupom: ${r2.cupom.codigo.toUpperCase()} (${r2.cupom.tipo === "frete" ? "frete grátis" : "− " + brl(r2.descCupom)})` : null,
        `Frete: ${r2.frete ? brl(r2.frete) : r2.freteLocal ? `Grátis (${FRETE_GRATIS_LOCAL.nome})` : "Grátis"}`,
        `*Total: ${brl(r2.total)}*`,
        `Pagamento: ${data.pagamento}`, ``,
        `*Cliente*`, `Nome: ${data.nome.trim()}`, `CPF: ${maskCpf(data.cpf)}`, `Telefone: ${maskPhone(data.telefone)}`, `E-mail: ${data.email}`,
        `Quer receber cupons e novidades: ${data.novidades ? "Sim" : "Não"}`, ``,
        `*Endereço de entrega*`, endereco,
        avisoEstoque ? `\n${avisoEstoque}` : null,
      ].filter((x) => x !== null).join("\n");
      const pedido = { id, msg, total: brl(r2.total), wa: whatsLink(WHATSAPP_PEDIDOS, msg) };
      try { sessionStorage.setItem("aliance-ultimo-pedido", JSON.stringify(pedido)); } catch {}
      salvarCompra({ id, data: d.toISOString(), canal: "whatsapp", status: "whatsapp", situacao: "Enviado pelo WhatsApp",
        itens: itensCompra(r2.linhas), total: brl(r2.total), forma: data.pagamento, telefone: onlyDigits(data.telefone) });
      bag = []; saveBag(); setCupomCode("");
      history.pushState(null, "", "/pedido-enviado");
      router();
      window.location.href = pedido.wa;
    }
  }

  // Baixa no estoque: apaga da planilha as camisas lisas do pedido (cor + tamanho).
  // Se faltar peça, mostra o aviso no formulário e devolve { ok: false }.
  // Se a planilha não responder, segue com um aviso para os donos conferirem.
  async function baixarEstoque(id, data, r2, textoBotao) {
    if (!ESTOQUE_URL) return { ok: true, aviso: null };
    const erroEl = document.getElementById("form-erro");
    const btn = document.getElementById("finish");
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(ESTOQUE_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, signal: ctrl.signal,
        body: JSON.stringify({ pedido: id, total: brl(r2.total), cliente: { nome: data.nome.trim(), telefone: maskPhone(data.telefone) },
          itens: r2.linhas.map((l) => ({ peca: `${l.m.name} (${l.code})`, cor: l.m.corEstoque, tamanho: l.size, qtd: l.qty })) }),
      });
      clearTimeout(t);
      const j = await res.json();
      if (j.estoque) estoque = j.estoque;
      if (!j.ok) {
        const falta = (j.faltando || []).map((x) => `${nomeCor(x.cor)} ${x.tamanho} (${x.disponivel ? "restam " + x.disponivel : "esgotado"})`).join(", ");
        erroEl.innerHTML = `Enquanto você escolhia, acabou o estoque de: <strong>${esc(falta || "algumas peças")}</strong>. <a href="/sacola">Ajustar a sacola</a>`;
        btn.disabled = false; btn.textContent = textoBotao;
        return { ok: false };
      }
      return { ok: true, aviso: null };
    } catch {
      return { ok: true, aviso: "⚠️ Estoque NÃO foi baixado automaticamente — conferir a planilha." };
    }
  }

  let _pg = null;
  function pagamentoOnline() {
    if (!_pg) _pg = fetch("/api/pagamento", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : { ativo: false }))
      .catch(() => ({ ativo: false }));
    return _pg;
  }

  function PagamentoRetorno(query) {
    const st = query.get("collection_status") || query.get("status") || "";
    const ref = query.get("external_reference") || "";
    let pend = null;
    try { pend = JSON.parse(localStorage.getItem("aliance-pedido-pendente") || "null"); } catch {}
    const id = esc(ref || (pend && pend.id) || "");
    const total = pend && pend.id === ref ? esc(pend.total) : "";
    const contato = (t) => `<a href="${whatsLink(WHATSAPP_PEDIDOS, t)}" class="btn-outline" target="_blank" rel="noopener">Falar com a loja no WhatsApp</a>`;
    const idCompra = ref || (pend && pend.id) || "";
    if (idCompra && lerCompras().some((c) => c.id === idCompra)) {
      if (st === "approved") salvarCompra({ id: idCompra, status: "approved", situacao: "Pago" });
      else if (st === "pending" || st === "in_process") salvarCompra({ id: idCompra, status: st, situacao: st === "pending" ? "Aguardando pagamento" : "Em análise" });
    }
    const verCompras = `<a href="/minhas-compras" class="small-btn">Ver minhas compras</a>`;
    let html;
    if (st === "approved") {
      bag = []; saveBag(); setCupomCode("");
      try { localStorage.removeItem("aliance-pedido-pendente"); } catch {}
      html = `${pageTitle("Pedido " + id, "Pagamento aprovado!", "Obrigado pela compra. A loja já recebeu seu pedido e vai preparar o envio.")}
        <div class="done">${total ? `<p class="hint">Total pago: <strong>${total}</strong></p>` : ""}
        <p class="hint">Qualquer dúvida sobre a entrega, fale com a gente:</p>
        <div class="done-actions">${contato(`Olá! Fiz o pedido ${ref} pelo site e o pagamento foi aprovado.`)}${verCompras}<a href="/produtos" class="small-btn">Continuar comprando</a></div></div>`;
    } else if (st === "pending" || st === "in_process") {
      bag = []; saveBag(); setCupomCode("");
      html = `${pageTitle("Pedido " + id, "Aguardando pagamento", "Seu pedido foi registrado. Assim que o pagamento for confirmado pelo Mercado Pago, a loja prepara o envio.")}
        <div class="done"><p class="hint">Se escolheu Pix, conclua o pagamento no app do seu banco usando o código do Mercado Pago.</p>
        <div class="done-actions">${contato(`Olá! Fiz o pedido ${ref} pelo site e o pagamento está em processamento.`)}${verCompras}<a href="/produtos" class="small-btn">Continuar comprando</a></div></div>`;
    } else {
      html = `${pageTitle(id ? "Pedido " + id : "Pagamento", "Pagamento não concluído", "O pagamento não foi aprovado ou foi cancelado. Suas peças continuam na sacola.")}
        <div class="done"><a href="/finalizar" class="btn-primary block">Tentar pagar de novo</a>
        <div class="done-actions"><a href="/sacola" class="small-btn">Voltar para a sacola</a></div></div>`;
    }
    app.innerHTML = `<div class="container page" style="max-width:48rem">${html}</div>`;
  }

  /* ---------- Página dos donos: pedidos pagos (lidos do Mercado Pago) ---------- */
  const SENHA_KEY = "aliance-painel";
  async function Pedidos() {
    let senha = "";
    try { senha = sessionStorage.getItem(SENHA_KEY) || ""; } catch {}
    const pedirSenha = (msg = "") => {
      app.innerHTML = `<div class="container page" style="max-width:32rem">
        ${pageTitle("Área da loja", "Pedidos")}
        <form id="painel-login" class="painel-login">
          <label for="painel-senha">Senha</label>
          <input id="painel-senha" type="password" autocomplete="current-password" required />
          <p class="form-erro">${esc(msg)}</p>
          <button class="btn-primary block" type="submit">Entrar</button>
        </form></div>`;
      document.getElementById("painel-login").addEventListener("submit", (e) => {
        e.preventDefault();
        try { sessionStorage.setItem(SENHA_KEY, document.getElementById("painel-senha").value); } catch {}
        Pedidos();
      });
      document.getElementById("painel-senha").focus();
    };
    if (!senha) return pedirSenha();
    app.innerHTML = `<div class="container page">${pageTitle("Área da loja", "Pedidos")}<p class="hint">Carregando pedidos do Mercado Pago…</p></div>`;
    let r, j;
    try { r = await fetch("/api/pedidos", { headers: { "x-senha": senha }, cache: "no-store" }); j = await r.json(); } catch { j = { erro: "Não foi possível carregar agora." }; }
    if (currentPath !== "/pedidos") return;
    if (r && r.status === 401) { try { sessionStorage.removeItem(SENHA_KEY); } catch {} return pedirSenha("Senha incorreta."); }
    if (!r || !r.ok) { app.innerHTML = `<div class="container page">${pageTitle("Área da loja", "Pedidos")}<p class="form-erro">${esc(j.erro || "Erro ao carregar.")}</p></div>`; return; }
    // O mesmo pedido pode ter várias tentativas no Mercado Pago (ex.: o cliente gerou o Pix duas vezes).
    // Mostra um cartão por pedido, com a tentativa mais avançada (paga > em análise > aguardando > outras).
    const ordem = { approved: 0, authorized: 1, in_process: 1, pending: 2 };
    const grupos = new Map();
    for (const p of j.pedidos) { const k = p.pedido || "#" + p.id; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); }
    const pedidos = [...grupos.values()].map((ps) => {
      const melhor = [...ps].sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9) || String(b.data).localeCompare(String(a.data)))[0];
      return { ...melhor, tentativas: ps.length };
    }).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    let filtro = "pagos";
    const render = () => {
      const lista = pedidos.filter((p) => filtro === "todos" || p.status === "approved");
      const quando = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      const zap = (t) => { const d = String(t).replace(/\D/g, ""); return d.length >= 10 ? `https://api.whatsapp.com/send?phone=55${d}` : ""; };
      app.innerHTML = `<div class="container page">
        ${pageTitle("Área da loja", "Pedidos", "Pagamentos feitos pelo site nos últimos 90 dias, lidos direto do Mercado Pago.")}
        <div class="chips">
          <button class="chip ${filtro === "pagos" ? "on" : ""}" data-f="pagos">Pagos (${pedidos.filter((p) => p.status === "approved").length})</button>
          <button class="chip ${filtro === "todos" ? "on" : ""}" data-f="todos">Todos (${pedidos.length})</button>
          <button class="chip" id="painel-atualizar">Atualizar</button>
          <button class="chip" id="painel-sair">Sair</button>
        </div>
        ${lista.length ? `<div class="pedidos">${lista.map((p) => `
          <article class="pedido">
            <header><strong>${esc(p.pedido || "#" + p.id)}</strong><span class="sit sit-${esc(p.status)}">${esc(p.situacao)}</span></header>
            <p class="ped-meta">${quando(p.data)} · ${esc(p.valor)} · ${esc(p.forma)}${p.tentativas > 1 ? ` · ${p.tentativas} tentativas de pagamento (é um pedido só)` : ""}</p>
            <p><b>${esc(p.nome || "—")}</b>${p.telefone ? ` · ${zap(p.telefone) ? `<a href="${zap(p.telefone)}" target="_blank" rel="noopener">${esc(p.telefone)}</a>` : esc(p.telefone)}` : ""}</p>
            ${p.cpf || p.email ? `<p class="ped-meta">${[p.cpf && "CPF " + esc(p.cpf), p.email && `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`].filter(Boolean).join(" · ")}</p>` : ""}
            ${p.itens ? `<p>${esc(p.itens).replace(/; /g, "<br>")}</p>` : ""}
            ${p.endereco ? `<p class="ped-end">${esc(p.endereco).replace(/ \| /g, "<br>")}</p>` : ""}
            ${p.cupom ? `<p class="ped-meta">Cupom: ${esc(p.cupom)}</p>` : ""}
            ${p.novidades ? `<p class="ped-meta">Aceita receber novidades: ${esc(p.novidades)}</p>` : ""}
          </article>`).join("")}</div>` : `<div class="empty"><p>Nenhum pedido ${filtro === "pagos" ? "pago " : ""}ainda.</p></div>`}
      </div>`;
      app.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { filtro = b.dataset.f; render(); }));
      document.getElementById("painel-atualizar").addEventListener("click", () => Pedidos());
      document.getElementById("painel-sair").addEventListener("click", () => { try { sessionStorage.removeItem(SENHA_KEY); } catch {} Pedidos(); });
    };
    render();
  }

  function PedidoEnviado() {
    let p = null;
    try { p = JSON.parse(sessionStorage.getItem("aliance-ultimo-pedido") || "null"); } catch {}
    if (!p) { app.innerHTML = `<div class="container page" style="max-width:48rem">${pageTitle("Pedido", "Nenhum pedido recente")}<div class="empty"><a href="/produtos" class="btn-outline">Ver o acervo</a></div></div>`; return; }
    app.innerHTML = `<div class="container page" style="max-width:48rem">
      ${pageTitle("Pedido " + esc(p.id), "Quase lá!", "Seu pedido abriu no WhatsApp da Aliance. Toque em enviar por lá para confirmar — a loja responde com o pagamento e o prazo de entrega.")}
      <div class="done">
        <a href="${p.wa}" class="btn-primary block" target="_blank" rel="noopener">Abrir o WhatsApp de novo</a>
        <p class="hint">Se o WhatsApp não abriu, toque no botão acima. Total do pedido: <strong>${esc(p.total)}</strong>.</p>
        <pre class="pedido-txt">${esc(p.msg).replace(/\*/g, "")}</pre>
        <div class="done-actions"><a href="/minhas-compras" class="small-btn">Ver minhas compras</a><a href="/produtos" class="small-btn">Continuar comprando</a></div>
      </div>
    </div>`;
  }

  /* ---------- Minhas compras (cliente) ----------
     Fica guardado no aparelho onde a compra foi feita. Em outro aparelho, o cliente busca
     pelo número do pedido + telefone (só pedidos pagos pelo site, lidos do Mercado Pago). */
  const COMPRAS_KEY = "aliance-compras";
  const lerCompras = () => { try { const v = JSON.parse(localStorage.getItem(COMPRAS_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const gravarCompras = (l) => { try { localStorage.setItem(COMPRAS_KEY, JSON.stringify(l.slice(0, 50))); } catch {} };
  function salvarCompra(c) {
    const l = lerCompras(), i = l.findIndex((x) => x.id === c.id);
    if (i >= 0) l[i] = { ...l[i], ...c }; else l.unshift(c);
    l.sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
    gravarCompras(l);
  }
  const itensCompra = (linhas) => linhas.map((l) => ({ code: l.code, name: l.m.name, size: l.size, qty: l.qty }));
  // "2x Monte Carlo (AL-006) Tam. G; 1x ..." (como o servidor guarda) → lista
  const itensDeTexto = (t) => String(t || "").split(/;\s*/).map((x) => x.match(/^(\d+)x (.+?) \((AL-\d+)\) Tam\. (\S+)/)).filter(Boolean)
    .map(([, qty, name, code, size]) => ({ qty: Number(qty), name, code, size }));
  const STATUS_CLASSE = { approved: "approved", pending: "pending", in_process: "pending", criado: "pending", whatsapp: "whatsapp" };

  async function consultarCompra(pedido, contato) {
    const r = await fetch("/api/minhas-compras", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ pedido, contato }) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }
  const compraDoServidor = (j, contato, antiga = {}) => ({ ...antiga, id: j.pedido, data: antiga.data || j.data, canal: "mercadopago",
    status: j.status, situacao: j.situacao, total: j.valor, forma: j.forma, telefone: antiga.telefone || contato,
    itens: itensDeTexto(j.itens).length ? itensDeTexto(j.itens) : antiga.itens || [], frete: j.frete, desconto: j.desconto, promocao: j.promocao, cupom: j.cupom });

  function MinhasCompras() {
    const quando = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
    const cartao = (c) => {
      const m0 = (code) => modelos.find((m) => m.code === code);
      const zap = whatsLink(WHATSAPP_PEDIDOS, `Olá! Queria saber do meu pedido ${c.id} feito pelo site.`);
      return `<article class="compra">
        <header><div><strong>Pedido ${esc(c.id)}</strong><p class="ped-meta">${esc(quando(c.data))}</p></div>
          <span class="sit sit-${esc(STATUS_CLASSE[c.status] || c.status || "")}">${esc(c.situacao || "")}</span></header>
        <ul class="compra-itens">${(c.itens || []).map((it) => { const m = m0(it.code); return `<li>
          ${m ? `<a href="/produtos/${m.slug}" class="compra-foto">${IMG(m.fotos.costas, m.name)}</a>` : `<span class="compra-foto"></span>`}
          <div>${m ? `<a href="/produtos/${m.slug}">${esc(it.name)}</a>` : esc(it.name)}<p class="ped-meta">${esc(it.code)} · Tam. ${esc(it.size)} · ${esc(it.qty)} un.</p></div></li>`; }).join("")}</ul>
        <p class="compra-total"><span>${esc(c.forma || "")}</span><strong>${esc(c.total || "")}</strong></p>
        ${c.canal === "whatsapp" ? `<p class="ped-meta">Pedido enviado pelo WhatsApp: o pagamento e a entrega são combinados direto com a loja.</p>` : ""}
        ${c.status === "nao_concluido" ? `<p class="ped-meta">O pagamento não foi concluído no Mercado Pago, então este pedido não foi confirmado.</p>` : ""}
        <a href="${zap}" class="small-btn" target="_blank" rel="noopener">Falar com a loja sobre este pedido</a>
      </article>`;
    };
    const render = (busca = {}) => {
      const lista = lerCompras();
      app.innerHTML = `<div class="container page" style="max-width:52rem">
        ${pageTitle("Sua conta", "Minhas compras", lista.length ? "As compras feitas neste aparelho aparecem aqui sozinhas." : "Ainda não há compras feitas por este aparelho.")}
        ${lista.length ? `<div class="compras">${lista.map(cartao).join("")}</div>` : `<div class="empty"><a href="/produtos" class="btn-outline">Ver o acervo</a></div>`}
        <section class="busca-compra">
          <h2>Comprou em outro aparelho?</h2>
          <p class="hint">Digite o número do pedido (começa com AL, está no comprovante e na mensagem da compra) e o telefone, CPF ou e-mail usado na compra. Vale para pedidos pagos pelo site.</p>
          <form id="busca-compra" novalidate>
            <div class="field"><label for="bc-pedido">Número do pedido</label><input id="bc-pedido" name="pedido" placeholder="AL261127-AB12" autocapitalize="characters" autocomplete="off" value="${esc(busca.pedido || "")}" /></div>
            <div class="field"><label for="bc-tel">Telefone, CPF ou e-mail</label><input id="bc-tel" name="contato" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Como você se identificou na compra" value="${esc(busca.contato || "")}" /></div>
            <button class="btn-primary" type="submit">Buscar pedido</button>
          </form>
          <p class="form-erro" id="bc-erro">${esc(busca.erro || "")}</p>
        </section>
        ${lista.length ? `<p class="limpar-compras"><button type="button" id="limpar-compras">Apagar o histórico deste aparelho</button></p>` : ""}
      </div>`;
      const f = document.getElementById("busca-compra");
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const bruto = f.elements.contato.value.trim(), pedido = f.elements.pedido.value.trim().toUpperCase();
        const contato = bruto.includes("@") ? bruto.toLowerCase() : onlyDigits(bruto);
        const btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Buscando…";
        let r;
        try { r = await consultarCompra(pedido, contato); } catch { r = { ok: false, j: { erro: "Sem conexão. Tente de novo." } }; }
        if (currentPath !== "/minhas-compras") return;
        if (!r.ok) return render({ pedido, contato: bruto, erro: r.j.erro || "Não foi possível buscar agora." });
        salvarCompra(compraDoServidor(r.j, contato, lerCompras().find((c) => c.id === r.j.pedido)));
        render();
        toast("Pedido encontrado e salvo neste aparelho.");
      });
      const limpar = document.getElementById("limpar-compras");
      if (limpar) limpar.addEventListener("click", () => {
        if (!confirm("Apagar a lista de compras deste aparelho? (As compras não são canceladas.)")) return;
        gravarCompras([]); render();
      });
    };
    render();
    // atualiza a situação das compras pagas pelo site (ex.: Pix que caiu depois, estorno)
    const DIA = 86400000;
    const paraAtualizar = lerCompras().filter((c) => c.canal === "mercadopago" && c.telefone && Date.now() - new Date(c.data).getTime() < 120 * DIA).slice(0, 10);
    if (!paraAtualizar.length) return;
    Promise.all(paraAtualizar.map(async (c) => {
      try {
        const r = await consultarCompra(c.id, c.telefone);
        if (r.ok) salvarCompra(compraDoServidor(r.j, c.telefone, c));
        else if (r.status === 404 && Date.now() - new Date(c.data).getTime() > 2 * DIA && c.status !== "approved")
          salvarCompra({ id: c.id, status: "nao_concluido", situacao: "Pagamento não concluído" });
      } catch {}
    })).then(() => { if (currentPath === "/minhas-compras" && !document.activeElement?.closest?.("#busca-compra")) render(); });
  }

  function Sobre() {
    const pilares = [
      ["Autoral", "Modelagem própria, desenhada do zero. Nada de prateleira, nada de cópia."],
      ["Limitada", "Tiragens curtas e numeradas. Quando esgota, não volta."],
      ["Made in Brasil", "Corte, costura e acabamento em ateliê brasileiro, peça por peça."],
    ];
    app.innerHTML = `
      <section class="sobre-hero">
        ${IMG(modelos[2].img, "Aliance no mar", "cover")}
        <div class="fade"></div>
        <div class="container sobre-hero-inner">
          <p class="eyebrow light">Sobre a marca</p>
          <h1>Uma visão. Uma união. <em class="accent">Uma nova história.</em></h1>
        </div>
      </section>
      <section class="container section two-col">
        <p class="quote">More than clothes — a lifestyle.</p>
        <div class="body">
          <p>A Aliance nasce para quem entende que roupa é linguagem. Trabalhamos com tecidos selecionados, caimento pensado e tiragens fechadas.</p>
          <p>Cada peça passa pelas mãos do ateliê antes de chegar até você. Sem estoque infinito, sem repetição.</p>
          <p>Por trás da marca estão ${OWNERS.map((o) => o.name).join(" e ")}, que atendem cada cliente pessoalmente.</p>
        </div>
      </section>
      <section class="band">
        <div class="container three-col">
          ${pilares.map(([t, d], k) => `<div class="pilar"><p class="n">0${k + 1}</p><h2>${t}</h2><p>${d}</p></div>`).join("")}
        </div>
      </section>
      <section class="section center"><a href="/produtos" class="btn-outline">Ver o acervo ⟶</a></section>`;
  }

  function Contato() {
    app.innerHTML = `<div class="container page">
      ${pageTitle("Contato", "Como podemos ajudar?", "Para ajuda ou reclamações, fale com a equipe Aliance pelo e-mail abaixo.")}
      <div class="contact-box">
        <a href="mailto:${SUPPORT_EMAIL}">
          <p class="eyebrow">E-mail de atendimento</p>
          <p class="mail">${SUPPORT_EMAIL}</p>
          <p class="cta">Enviar e-mail ⟶</p>
        </a>
      </div>
      <p class="muted-text" style="margin-top:2.5rem;color:var(--muted-foreground)">Atendimento em todo o Brasil.</p>
    </div>`;
  }

  function Favoritos() {
    const lista = modelos.filter((m) => isFav(m.code));
    app.innerHTML = `<div class="container page">
      ${pageTitle("Favoritos", "Suas favoritas", "As peças que você marcou com o coração ficam guardadas aqui, neste aparelho.")}
      ${lista.length
        ? `<div class="grid grid-34" style="row-gap:3rem">${lista.map(card).join("")}</div>`
        : `<div class="empty"><p>Você ainda não favoritou nenhuma peça.</p><a href="/produtos" class="btn-outline">Ver o acervo</a></div>`}
    </div>`;
  }

  function NotFound(title = "Página não encontrada", href = "/", label = "Voltar ao início") {
    app.innerHTML = `<div class="notfound"><h1>${title}</h1><a href="${href}">${label}</a></div>`;
  }

  /* ---------- Roteador (endereços normais, sem #) ---------- */
  const TITLES = { "/": "ALIANCE® — Camisetas autorais em tiragem limitada", "/colecoes": "Coleções — ALIANCE®", "/produtos": "Produtos — ALIANCE®", "/sacola": "Sacola — ALIANCE®", "/favoritos": "Favoritos — ALIANCE®", "/finalizar": "Finalizar pedido — ALIANCE®", "/pedido-enviado": "Pedido enviado — ALIANCE®", "/pagamento-retorno": "Pagamento — ALIANCE®", "/pedidos": "Pedidos — ALIANCE®", "/minhas-compras": "Minhas compras — ALIANCE®", "/sobre": "Sobre a Marca — ALIANCE®", "/contato": "Contato — ALIANCE®" };
  /* ---------- Faixa da promoção no topo, com contador ---------- */
  const bfBar = document.getElementById("bf-bar");
  let bfUltimoEstado = promoEstado();
  function tickPromo() {
    if (!bfBar) return;
    const agora = Date.now(), est = promoEstado(agora);
    if (est !== bfUltimoEstado) { bfUltimoEstado = est; router(); return; }
    document.body.classList.toggle("tem-promo", est !== "off");
    if (est === "off") return;
    const alvo = est === "antes" ? PROMO_INI : PROMO_FIM;
    let seg = Math.max(0, Math.floor((alvo - agora) / 1000));
    const d = Math.floor(seg / 86400); seg %= 86400;
    const h = Math.floor(seg / 3600); seg %= 3600;
    const mi = Math.floor(seg / 60), s2 = seg % 60, z = (n) => String(n).padStart(2, "0");
    const tempo = `${d ? d + "d " : ""}${z(h)}h ${z(mi)}m ${z(s2)}s`;
    bfBar.querySelector(".bf-msg").innerHTML = est === "antes"
      ? `<strong>${esc(PROMOCAO.nome.toUpperCase())} ALIANCE</strong><span class="bf-sep">·</span>Começa em <span class="bf-tempo">${tempo}</span>`
      : `<strong>${esc(PROMOCAO.nome.toUpperCase())}</strong><span class="bf-sep">·</span><span class="bf-esconde-cel">Leve mais, pague menos: </span>${PROMOCAO.faixas.map((f) => f.pct + "%").join(", ").replace(/, ([^,]*)$/, " e $1")} OFF<span class="bf-sep">·</span>termina em <span class="bf-tempo">${tempo}</span>`;
  }
  if (bfBar && PROMOCAO) {
    bfBar.querySelector(".bf-tabela").innerHTML = `<p class="bf-tit">Descontos ${esc(PROMOCAO.nome)}</p>
      <table>${PROMOCAO.faixas.map((f) => `<tr><td>${f.min} ${f.min > 1 ? "camisetas" : "camiseta"}</td><td>${f.pct}% OFF</td></tr>`).join("")}</table>
      <p class="bf-obs">Desconto nas camisetas, somando todas da sacola (estampas e tamanhos diferentes valem). Frete à parte. Não acumula com cupons.</p>`;
    bfBar.querySelector(".bf-btn").addEventListener("click", () => {
      const aberto = bfBar.classList.toggle("aberto");
      bfBar.querySelector(".bf-btn").setAttribute("aria-expanded", String(aberto));
    });
    tickPromo();
    setInterval(tickPromo, 1000);
    const btnBf = bfBar.querySelector(".bf-btn");
    const medirBf = () => document.documentElement.style.setProperty("--bf-h", btnBf.offsetHeight + "px");
    medirBf();
    if ("ResizeObserver" in window) new ResizeObserver(medirBf).observe(btnBf); else window.addEventListener("resize", medirBf);
  }

  function router() {
    clearInterval(heroTimer);
    // Aceita links antigos com # (ex.: /#/produtos/monte-carlo)
    if (location.hash.startsWith("#/")) { history.replaceState(null, "", location.hash.slice(1)); }
    const path = location.pathname.replace(/\/index\.html$/, "/").replace(/(.)\/$/, "$1") || "/";
    const query = new URLSearchParams(location.search);
    currentPath = path;
    document.body.classList.toggle("modo-painel", path === "/pedidos");
    document.body.classList.toggle("pg-inicio", path === "/");
    document.title = TITLES[path] || "ALIANCE®";
    setMenu(false);
    navD.querySelectorAll("a").forEach((a) => {
      const to = a.dataset.to;
      a.classList.toggle("active", to === "/" ? path === "/" : path.startsWith(to));
    });
    const prod = path.match(/^\/produtos\/([^/]+)$/);
    if (path === "/") Home();
    else if (path === "/colecoes") Colecoes();
    else if (path === "/produtos") Produtos(query);
    else if (prod) Produto(decodeURIComponent(prod[1]));
    else if (path === "/sacola") Sacola();
    else if (path === "/favoritos") Favoritos();
    else if (path === "/finalizar") Finalizar();
    else if (path === "/pedido-enviado") PedidoEnviado();
    else if (path === "/pagamento-retorno") PagamentoRetorno(query);
    else if (path === "/pedidos") Pedidos();
    else if (path === "/minhas-compras") MinhasCompras();
    else if (path === "/sobre") Sobre();
    else if (path === "/contato") Contato();
    else NotFound();
    window.scrollTo(0, 0);
    updateHeader();
    aplicarEstoque();
    if (bfBar) { bfBar.classList.remove("aberto"); tickPromo(); }
  }
  window.addEventListener("popstate", router);
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//") || a.target) return;
    e.preventDefault();
    if (href !== location.pathname + location.search) history.pushState(null, "", href);
    router();
  });
  router();
  carregarEstoque();
})();
