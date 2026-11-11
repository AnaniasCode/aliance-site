(function () {
  const { WHATSAPP_PEDIDOS, FRETE, CUPONS, OWNERS, SUPPORT_EMAIL, modelos, colecoes, medidas, heroSlides, whatsLink } = window.ALIANCE;
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
    const slides = [[m.fotos.costas, "Costas"], [m.fotos.frente, "Frente"]];
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

  /* ---------- Pedido: valores, cupom e mensagem ---------- */
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
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
  function resumo() {
    const linhas = linhasSacola();
    const subtotal = Math.round(linhas.reduce((a, l) => a + l.m.precoNum * l.qty, 0) * 100) / 100;
    let desconto = 0, frete = linhas.length ? FRETE : 0, cupom = null, cupomErro = "";
    const code = getCupomCode();
    if (code && linhas.length) {
      const r = checarCupom(code, subtotal);
      if (r.ok) {
        cupom = r.cupom;
        if (cupom.tipo === "percentual") desconto = Math.round(subtotal * cupom.valor) / 100;
        else if (cupom.tipo === "valor") desconto = Math.min(subtotal, cupom.valor);
        else if (cupom.tipo === "frete") frete = 0;
      } else cupomErro = r.erro;
    }
    const total = Math.round((subtotal - desconto + frete) * 100) / 100;
    return { linhas, subtotal, desconto, frete, total, cupom, cupomErro };
  }
  const resumoHTML = (r) => `
    <dl class="totais">
      <div><dt>Peças</dt><dd>${brl(r.subtotal)}</dd></div>
      ${r.cupom ? `<div class="desc"><dt>Cupom ${esc(r.cupom.codigo.toUpperCase())}</dt><dd>${r.cupom.tipo === "frete" ? "Frete grátis" : "− " + brl(r.desconto)}</dd></div>` : ""}
      <div><dt>Frete</dt><dd>${r.frete ? brl(r.frete) : "Grátis"}</dd></div>
      <div class="total"><dt>Total</dt><dd>${brl(r.total)}</dd></div>
    </dl>`;

  function Sacola() {
    const r = resumo();
    if (r.cupomErro) setCupomCode("");
    let body;
    if (!r.linhas.length) {
      body = `<div class="empty"><p>Sua sacola está vazia.</p><a href="/produtos" class="btn-outline">Ver o acervo</a></div>`;
    } else {
      body = `<ul class="bag-list">${r.linhas.map((l) => `
          <li>
            ${IMG(l.m.img, l.m.name)}
            <div style="min-width:0">
              <a href="/produtos/${l.m.slug}" class="name">${esc(l.m.name)}</a>
              <p class="meta">${l.code} · Tamanho ${l.size} · ${l.m.preco}</p>
              <div class="qty" aria-label="Quantidade">
                <button data-qty="-1" data-k="${l.code}|${l.size}" aria-label="Diminuir">−</button>
                <span>${l.qty}</span>
                <button data-qty="1" data-k="${l.code}|${l.size}" aria-label="Aumentar">+</button>
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
            <a href="/finalizar" class="btn-primary block">Continuar para entrega</a>
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
  const maskCep = (v) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
  const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
  const PAGAMENTOS = ["Pix", "Cartão de débito", "Cartão de crédito"];

  function Finalizar() {
    const r = resumo();
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
      ${pageTitle("Finalizar pedido", "Entrega e pagamento", "Preencha seus dados. No final, o pedido abre pronto no WhatsApp da loja — é só enviar.")}
      <div class="checkout">
        <form id="checkout" class="checkout-form" novalidate>
          <fieldset>
            <legend class="eyebrow">Seus dados</legend>
            <div class="fields">
              ${field("nome", "Nome completo", 'autocomplete="name" required', "wide")}
              ${field("telefone", "WhatsApp / telefone", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="(17) 99999-9999" required', "wide")}
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
            <p class="hint">O pagamento é combinado com a loja pelo WhatsApp depois do envio do pedido.</p>
          </fieldset>
          <label class="optin"><input type="checkbox" name="novidades" ${salvo.novidades ? "checked" : ""}> <span>Quero receber cupons e novidades da Aliance pelo WhatsApp.</span></label>
          <p class="hint">Seus dados são usados só para entregar o pedido e, se você autorizar acima, para enviar cupons e novidades.</p>
          <button type="submit" class="btn-primary block" id="finish">Finalizar pedido pelo WhatsApp</button>
        </form>
        <aside class="checkout-summary">
          <p class="eyebrow">Resumo</p>
          <ul class="mini-list">${r.linhas.map((l) => `<li>${IMG(l.m.img, l.m.name)}<div><p>${esc(l.m.name)}</p><span>Tamanho ${l.size} · ${l.qty}x</span></div><strong>${brl(l.m.precoNum * l.qty)}</strong></li>`).join("")}</ul>
          ${resumoHTML(r)}
          <a href="/sacola" class="small-btn">Alterar sacola ou cupom</a>
        </aside>
      </div>
    </div>`;

    const f = document.getElementById("checkout");
    const tel = f.elements.telefone, cep = f.elements.cep;
    tel.value = maskPhone(tel.value); cep.value = maskCep(cep.value);
    tel.addEventListener("input", () => { tel.value = maskPhone(tel.value); });
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
      try { localStorage.setItem(CLIENTE_KEY, JSON.stringify({ ...data })); } catch {}
      const btn = document.getElementById("finish"); btn.disabled = true; btn.textContent = "Enviando…";
      const r2 = resumo();
      const d = new Date();
      const id = `AL${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const endereco = `${data.rua.trim()}, ${data.numero.trim()}${data.complemento.trim() ? " — " + data.complemento.trim() : ""}\n${data.bairro.trim()} — ${data.cidade.trim()}/${data.uf}\nCEP ${maskCep(data.cep)}`;
      const itens = r2.linhas.map((l) => `• ${l.qty}x ${l.m.name} (${l.code}) — Tam. ${l.size} — ${brl(l.m.precoNum * l.qty)}`).join("\n");
      const msg = [
        `*NOVO PEDIDO — ALIANCE®*`, `Pedido: ${id}`, ``,
        `*Peças*`, itens, ``,
        `Subtotal: ${brl(r2.subtotal)}`,
        r2.cupom ? `Cupom: ${r2.cupom.codigo.toUpperCase()} (${r2.cupom.tipo === "frete" ? "frete grátis" : "− " + brl(r2.desconto)})` : null,
        `Frete: ${r2.frete ? brl(r2.frete) : "Grátis"}`,
        `*Total: ${brl(r2.total)}*`,
        `Pagamento: ${data.pagamento}`, ``,
        `*Cliente*`, `Nome: ${data.nome.trim()}`, `Telefone: ${maskPhone(data.telefone)}`,
        `Quer receber cupons e novidades: ${data.novidades ? "Sim" : "Não"}`, ``,
        `*Endereço de entrega*`, endereco,
      ].filter((x) => x !== null).join("\n");
      const pedido = { id, msg, total: brl(r2.total), wa: whatsLink(WHATSAPP_PEDIDOS, msg) };
      // Guarda uma cópia na Netlify (aviso por e-mail para a loja). Se falhar, segue pelo WhatsApp.
      const campos = {
        "form-name": "pedido", pedido: id, nome: data.nome.trim(), telefone: maskPhone(data.telefone),
        cep: maskCep(data.cep), endereco: endereco.replace(/\n/g, " | "), pagamento: data.pagamento,
        itens, cupom: r2.cupom ? r2.cupom.codigo.toUpperCase() : "", subtotal: brl(r2.subtotal),
        desconto: brl(r2.desconto), frete: brl(r2.frete), total: brl(r2.total),
        novidades: data.novidades ? "Sim" : "Não",
      };
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000);
        await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(campos).toString(), signal: ctrl.signal });
        clearTimeout(t);
      } catch {}
      try { sessionStorage.setItem("aliance-ultimo-pedido", JSON.stringify(pedido)); } catch {}
      bag = []; saveBag(); setCupomCode("");
      history.pushState(null, "", "/pedido-enviado");
      router();
      window.location.href = pedido.wa;
    });
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
        <a href="/produtos" class="small-btn">Continuar comprando</a>
      </div>
    </div>`;
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
  const TITLES = { "/": "ALIANCE® — Camisetas autorais em tiragem limitada", "/colecoes": "Coleções — ALIANCE®", "/produtos": "Produtos — ALIANCE®", "/sacola": "Sacola — ALIANCE®", "/favoritos": "Favoritos — ALIANCE®", "/finalizar": "Finalizar pedido — ALIANCE®", "/pedido-enviado": "Pedido enviado — ALIANCE®", "/sobre": "Sobre a Marca — ALIANCE®", "/contato": "Contato — ALIANCE®" };
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
    else if (path === "/finalizar") Finalizar();
    else if (path === "/pedido-enviado") PedidoEnviado();
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
