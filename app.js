(function () {
  const { OWNERS, SUPPORT_EMAIL, modelos, colecoes, medidas, heroSlides, whatsLink } = window.ALIANCE;
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
  const addBag = (code, size) => {
    const f = bag.find((i) => i.code === code && i.size === size);
    if (f) f.qty += 1; else bag.push({ code, size, qty: 1 });
    saveBag();
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
  navM.innerHTML = links.map(([to, l]) => `<a href="${to}">${l}</a>`).join("");
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
    const slides = [[m.fotos.frente, "Frente"], [m.fotos.costas, "Costas"]];
    return `
    <article class="card" data-code="${m.code}">
      <div class="card-media">
        <a href="/produtos/${m.slug}" class="card-track" tabindex="-1" aria-hidden="true" draggable="false">
          ${slides.map(([src, label]) => IMG(src, `${m.name} — ${label}`, "", 'loading="lazy" draggable="false"')).join("")}
        </a>
        <span class="card-code">${m.code}</span>
        <button class="card-fav ${fav ? "on" : ""}" aria-pressed="${fav}" aria-label="Favoritar ${esc(m.name)}">${icon("heart")}</button>
        <button class="card-arrow prev" aria-label="Foto anterior">${icon("left")}</button>
        <button class="card-arrow next" aria-label="Próxima foto">${icon("right")}</button>
        <div class="card-dots" aria-hidden="true">${slides.map((_, k) => `<span class="${k ? "" : "on"}"></span>`).join("")}</div>
        <button class="card-quick" aria-label="Escolher tamanho de ${esc(m.name)}" aria-expanded="false">${icon("bag")}</button>
        <div class="card-panel">
          <p class="card-panel-title">Escolha o tamanho</p>
          <div class="card-sizes">${m.tamanhos.map((t) => `<button class="card-size" data-size="${t}" aria-pressed="false">${t}</button>`).join("")}</div>
          <button class="card-add">Adicionar à sacola</button>
        </div>
      </div>
      <a href="/produtos/${m.slug}" class="card-info">
        <p class="eyebrow">${esc(m.collection)}</p>
        <p class="card-name">${esc(m.name)}</p>
        <p class="card-price">${m.preco}</p>
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
      const unselect = c.dataset.size === btn.dataset.size;
      c.querySelectorAll(".card-size").forEach((b) => { const on = !unselect && b === btn; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
      if (unselect) delete c.dataset.size; else c.dataset.size = btn.dataset.size;
      armTimer(c);
    } else if (btn.classList.contains("card-add")) {
      const size = c.dataset.size;
      if (!size) { toast("Escolha um tamanho primeiro"); return; }
      addBag(m.code, size);
      toast(`${m.name} · ${size} foi para a sacola`, { label: "Ver sacola", href: "/sacola" });
      setOpen(c, false);
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
          <p class="p-price">${m.preco}</p>
          <p class="p-desc">${esc(m.descricao)}</p>
          <div class="mt-8">
            <p class="eyebrow mb-3">Tamanho <span id="size-label" style="color:var(--foreground)"></span></p>
            <div class="sizes">${m.tamanhos.map((t) => `<button class="size" data-size="${t}">${t}</button>`).join("")}</div>
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
      document.getElementById("wa-grid").innerHTML = OWNERS.map((o) => `<a href="${whatsLink(o.phone, msg)}" target="_blank" rel="noopener">WhatsApp ${o.name}</a>`).join("");
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
      addBag(m.code, size);
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

  function Sacola() {
    const linhas = bag.map((i) => ({ ...i, m: modelos.find((m) => m.code === i.code) })).filter((l) => l.m);
    let body;
    if (!linhas.length) {
      body = `<div class="empty"><p>Sua sacola está vazia.</p><a href="/produtos" class="btn-outline">Ver o acervo</a></div>`;
    } else {
      const pedido = `Olá! Quero fazer um pedido pelo site da Aliance:\n${linhas.map((l) => `• ${l.m.name} (${l.code}) — tamanho ${l.size} — ${l.qty}x`).join("\n")}`;
      body = `<ul class="bag-list">${linhas.map((l) => `
          <li>
            ${IMG(l.m.img, l.m.name)}
            <div style="min-width:0"><a href="/produtos/${l.m.slug}" class="name">${esc(l.m.name)}</a><p class="meta">${l.code} · Tamanho ${l.size} · ${l.qty}x</p></div>
            <button class="small-btn" data-remove="${l.code}|${l.size}">Remover</button>
          </li>`).join("")}</ul>
        <div class="bag-send">
          <p class="eyebrow mb-4">Enviar pedido para</p>
          <div class="bag-send-grid">${OWNERS.map((o) => `<a href="${whatsLink(o.phone, pedido)}" target="_blank" rel="noopener">WhatsApp ${o.name}</a>`).join("")}</div>
          <button class="small-btn" id="clear-bag" style="margin-top:1.5rem">Esvaziar sacola</button>
        </div>`;
    }
    app.innerHTML = `<div class="container page" style="max-width:56rem">
      ${pageTitle("Sacola", "Suas peças", "Monte sua seleção e envie o pedido para um de nós pelo WhatsApp.")}${body}</div>`;
    app.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => { const [c, s] = b.dataset.remove.split("|"); removeBag(c, s); Sacola(); }));
    const clr = document.getElementById("clear-bag");
    if (clr) clr.addEventListener("click", () => { bag = []; saveBag(); Sacola(); });
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
  const TITLES = { "/": "ALIANCE® — Camisetas autorais em tiragem limitada", "/colecoes": "Coleções — ALIANCE®", "/produtos": "Produtos — ALIANCE®", "/sacola": "Sacola — ALIANCE®", "/favoritos": "Favoritos — ALIANCE®", "/sobre": "Sobre a Marca — ALIANCE®", "/contato": "Contato — ALIANCE®" };
  function router() {
    clearInterval(heroTimer);
    // Aceita links antigos com # (ex.: /#/produtos/monte-carlo)
    if (location.hash.startsWith("#/")) { history.replaceState(null, "", location.hash.slice(1)); }
    const path = location.pathname.replace(/\/index\.html$/, "/").replace(/(.)\/$/, "$1") || "/";
    const query = new URLSearchParams(location.search);
    currentPath = path;
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
    else if (path === "/sobre") Sobre();
    else if (path === "/contato") Contato();
    else NotFound();
    window.scrollTo(0, 0);
    updateHeader();
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
})();
