/* =========================================================
   Логика на страницата
   ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const SVGNS = 'http://www.w3.org/2000/svg';
  const eur = n => '€ ' + Math.round(n).toLocaleString('de-DE');
  const fmtA = a => (Number.isInteger(a) ? a : a.toFixed(2).replace('.', ',')) + ' m²';
  const unitsOn = f => UNITS.filter(u => u.floor === f);
  const kindName = { flat: 'Стан', office: 'Канцеларија', shop: 'Деловен простор' };
  const bedsTxt = b => (b ? b + (b === 1 ? ' спална' : ' спални') : '—');
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  };

  let currentFloor = 2;

  /* ---------------- HERO: зграда од повеќе агли ---------------- */
  let viewIdx = 0, swapping = false;
  const small = () => window.innerWidth < 760;
  const stackedNow = () => window.innerWidth <= 1080;
  // десктоп: широк (продолжен) рендер; телефон/таблет: вертикален
  const curView = () => (stackedNow() ? VIEWS[viewIdx] : VIEWS[viewIdx].wide);
  const imgFor = v => (v.wide ? (small() ? v.srcM : v.src) : (window.innerWidth * (window.devicePixelRatio || 1) > 1280 ? v.src : v.srcS));
  let lastStacked = null;

  function renderHero() {
    const flats = UNITS.filter(u => u.kind === 'flat');
    const free = UNITS.filter(u => u.status === 'free').length;
    $('#heroStats').innerHTML = `
      <div><b>${flats.length}</b><span>стана</span></div>
      <div><b>${FLOORS.length}</b><span>нивоа</span></div>
      <div><b>${free}</b><span>слободни</span></div>
      <div><b>2027</b><span>вселување</span></div>`;

    const picker = $('#floorPicker');
    picker.innerHTML = '';
    [...FLOORS].reverse().forEach(f => {
      const us = unitsOn(f.id);
      const nFree = us.filter(u => u.status === 'free').length;
      const b = document.createElement('button');
      b.className = 'fp-row'; b.dataset.floor = f.id;
      b.innerHTML = `<span class="fp-num">${f.short}</span>
        <span class="fp-name">${f.name}<small>${nFree} слободн${nFree === 1 ? 'а' : 'и'} од ${us.length}</small></span>
        <span class="dots">${us.map(u => `<i style="background:${STATUS[u.status].color}" title="${u.label}"></i>`).join('')}</span>`;
      b.addEventListener('mouseenter', () => hoverFloor(f.id, true));
      b.addEventListener('mouseleave', () => hoverFloor(f.id, false));
      b.addEventListener('click', () => goFloor(f.id));
      picker.appendChild(b);
    });

    // избор на поглед
    const vs = $('#viewTabs');
    vs.innerHTML = VIEWS.map((v, i) => `<button data-v="${i}">${v.label}</button>`).join('');
    $$('#viewTabs button').forEach(b => b.addEventListener('click', () => setHeroView(+b.dataset.v)));
    $('#viewPrev').addEventListener('click', () => setHeroView(viewIdx - 1, -1));
    $('#viewNext').addEventListener('click', () => setHeroView(viewIdx + 1, 1));
    // претходно вчитај ги сите погледи (без чекање при ротација)
    VIEWS.forEach(v => { const im = new Image(); im.src = imgFor(stackedNow() ? v : v.wide); });

    // swipe на телефон
    let sx = null;
    $('#hero').addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    $('#hero').addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 60) setHeroView(viewIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });

    setHeroView(0, 0, true);
    let rt;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rt);
      rt = requestAnimationFrame(() => { if (stackedNow() !== lastStacked) applyView(); else frameBuilding(); });
    });
    const b = $('#building');
    b.classList.add('intro');
    setTimeout(() => b.classList.remove('intro'), 2800);
  }

  function drawPolys() {
    const v = curView(), svg = $('#buildingSvg');
    svg.setAttribute('viewBox', `0 0 ${v.size[0]} ${v.size[1]}`);
    svg.innerHTML = '';
    FLOORS.forEach(f => {
      const p = el('polygon', { points: f.polys[v.id], class: 'fl-poly', 'data-floor': f.id, tabindex: 0, role: 'button', 'aria-label': f.name });
      p.addEventListener('mouseenter', () => hoverFloor(f.id, true));
      p.addEventListener('mousemove', e => moveTip(e));
      p.addEventListener('mouseleave', () => hoverFloor(f.id, false));
      p.addEventListener('click', () => goFloor(f.id));
      p.addEventListener('keydown', e => { if (e.key === 'Enter') goFloor(f.id); });
      svg.appendChild(p);
    });
  }

  // зградата секогаш врамена: цела видлива, што поголема, центрирана
  function frameBuilding() {
    const v = curView(), m = $('#heroMedia'), st = $('#building');
    const W = m.clientWidth, H = m.clientHeight;
    const [iw, ih] = v.size, [x0, y0, x1, y1] = v.box, bw = x1 - x0, bh = y1 - y0;
    const bcx = x0 + bw / 2, bcy = y0 + bh / 2;
    let s, left, top;
    if (!stackedNow()) {
      // широк рендер преку цел екран; зградата во средина и цела видлива
      s = Math.max(W / iw, H / ih);
      if (bh * s > H - 150) s = (H - 150) / bh;
      left = W / 2 - bcx * s;
      top = H / 2 + 4 - bcy * s;
      if (iw * s >= W) left = Math.min(0, Math.max(W - iw * s, left));
      if (ih * s >= H) top = Math.min(0, Math.max(H - ih * s, top));
    } else {
      // вертикален рендер; зградата под насловот, горе е небо
      s = Math.min(0.96 * W / bw, (H - 330) / bh);
      left = W / 2 - bcx * s;
      top = 172 - y0 * s;
    }
    Object.assign(st.style, { left: left + 'px', top: top + 'px', width: iw * s + 'px', height: ih * s + 'px' });
    // позадина во бојата на небото/земјата (непрекинат премин ако остане празен простор)
    $('#hero').style.background = `linear-gradient(to bottom, ${v.sky} 0%, ${v.sky} 40%, ${v.ground} 75%, #1c1916 100%)`;
  }

  // ја поставува сликата + контурите за тековниот поглед и уред
  function applyView() {
    const v = curView(), img = $('#buildingImg');
    lastStacked = stackedNow();
    img.src = imgFor(v);
    document.querySelectorAll('#building .mirror').forEach(mi => { mi.src = imgFor(v); });
    drawPolys();
    frameBuilding();
  }

  function setHeroView(i, dir = 1, instant = false) {
    if (swapping) return;
    const next = (i + VIEWS.length) % VIEWS.length;
    if (next === viewIdx && !instant) return;
    if (!instant && next < viewIdx && dir === 1 && !(viewIdx === VIEWS.length - 1 && next === 0)) dir = -1;
    viewIdx = next;
    const v = VIEWS[viewIdx], st = $('#building'), img = $('#buildingImg');
    $$('#viewTabs button').forEach(b => b.classList.toggle('on', +b.dataset.v === viewIdx));
    hoverFloor(0, false);
    const apply = applyView;
    if (instant) { apply(); return; }
    swapping = true;
    const off = dir * Math.min(70, window.innerWidth * 0.05);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const out = st.animate([{ opacity: 1, transform: 'translateX(0) scale(1)' }, { opacity: 0, transform: `translateX(${-off}px) scale(.985)` }],
      { duration: 300, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    // тајмери (не promise од анимацијата) → никогаш не заглавува
    setTimeout(async () => {
      apply();
      try { await Promise.race([img.decode(), wait(700)]); } catch (_) {}
      out.cancel();
      st.animate([{ opacity: 0, transform: `translateX(${off}px) scale(.985)` }, { opacity: 1, transform: 'translateX(0) scale(1)' }],
        { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      setTimeout(() => { swapping = false; }, 540);
    }, 300);
  }

  function hoverFloor(id, on) {
    $$('.fl-poly').forEach(p => p.classList.toggle('hover', on && +p.dataset.floor === id));
    $$('.fp-row').forEach(r => r.classList.toggle('on', on && +r.dataset.floor === id));
    const tip = $('#floorTip');
    if (!on) { tip.classList.remove('show'); return; }
    const f = FLOORS[id], us = unitsOn(id);
    const nFree = us.filter(u => u.status === 'free').length;
    tip.innerHTML = `<b>${f.name}</b><div class="row"><span>${f.use}</span></div>
      <div class="row"><span>Кота ${f.elev}</span><span>${nFree} / ${us.length} слободни</span></div>
      <div class="cta">Кликни за влез во стан →</div>`;
    tip.classList.add('show');
    if (!tip.dataset.mouse) { // позиција ако е од листата
      const pr = $(`.fl-poly[data-floor="${id}"]`).getBoundingClientRect(), br = $('#hero').getBoundingClientRect();
      tip.style.left = (pr.left + pr.width / 2 - br.left) + 'px';
      placeTip(pr.top - br.top, pr.bottom - br.top);
    }
  }
  function placeTip(top, bottom) {
    const tip = $('#floorTip');
    const below = top < 170; // нема место над катот
    tip.classList.toggle('below', below);
    tip.style.top = (below ? bottom : top) + 'px';
  }
  function moveTip(e) {
    const r = $('#hero').getBoundingClientRect(), tip = $('#floorTip');
    tip.dataset.mouse = '1';
    tip.style.left = Math.min(Math.max(e.clientX - r.left, 120), r.width - 120) + 'px';
    placeTip(e.clientY - r.top, e.clientY - r.top + 10);
    clearTimeout(moveTip.t); moveTip.t = setTimeout(() => delete tip.dataset.mouse, 400);
  }

  /* Клик на кат: зум во зградата → влез во стан */
  let entering = false;
  function goFloor(id) {
    if (entering || swapping) return;
    const us = unitsOn(id);
    if (!us.length) return;
    const unit = us.find(u => u.status === 'free') || us[0];
    selectFloor(id);
    hoverFloor(id, false);
    const b = $('#building'), poly = $(`.fl-poly[data-floor="${id}"]`);
    const br = b.getBoundingClientRect(), pr = poly.getBoundingClientRect();
    if (window.scrollY > 10 || !pr.width) { openTour(unit.id); return; } // зградата не е видлива
    entering = true;
    zoomTo(b, br, pr);
    poly.classList.add('hover');
    $('#hero').classList.add('busy');
    void b.offsetWidth;
    setTimeout(() => { b.classList.add('zoom'); $('#heroFlash').classList.add('on'); }, 30);
    setTimeout(() => {
      openTour(unit.id, { fromBuilding: true });
      entering = false;
    }, 1050);
  }
  function zoomTo(b, br, pr) {
    const H = $('#hero').clientHeight;
    b.style.transformOrigin = `${pr.left + pr.width / 2 - br.left}px ${pr.top + pr.height / 2 - br.top}px`;
    b.style.setProperty('--z', Math.min(5, Math.max(2.2, (H * 0.5) / pr.height)).toFixed(2));
  }
  function resetBuilding() {
    const b = $('#building');
    b.classList.remove('zoom');
    $('#heroFlash').classList.remove('on');
    $('#hero').classList.remove('busy');
    $$('.fl-poly').forEach(p => p.classList.remove('hover'));
  }

  /* ---------------- ОСНОВА НА КАТ ----------------
     Шематска основа (метри): 28 x 16, улица долу (y = 16),
     заоблен агол напред-лево (радиус 6), јадро позади во средина. */
  const arcFL = (n = 18) => Array.from({ length: n + 1 }, (_, i) => { const t = Math.PI / 2 + (Math.PI / 2) * i / n; return [6 + 6 * Math.cos(t), 10 + 6 * Math.sin(t)]; });
  const CORE = [[12, 0], [12, 5], [17, 5], [17, 0]];
  const ZONES = {
    A: { pts: [[0, 0], [10, 0], [10, 16], ...arcFL(), [0, 10]], label: [5, 8.4] },
    B: { pts: [[10, 0], ...CORE, [19, 0], [19, 16], [10, 16]], label: [14.5, 10.8] },
    C: { pts: [[19, 0], [28, 0], [28, 16], [19, 16]], label: [23.5, 8.4] },
    AB: { pts: [[0, 0], ...CORE, [19, 0], [19, 16], ...arcFL(), [0, 10]], label: [9.5, 10.8] },
  };
  const FOOTPRINT = [[0, 0], [28, 0], [28, 16], ...arcFL(), [0, 10]];
  const toPath = pts => 'M' + pts.map(p => p.map(v => v.toFixed(3)).join(' ')).join(' L') + ' Z';

  function selectFloor(id) {
    currentFloor = id;
    const f = FLOORS[id], us = unitsOn(id);
    $('#floorTitle').textContent = f.name;
    $('#floorSub').textContent = `${f.use} · кота ${f.elev} · ${us.filter(u => u.status === 'free').length} слободни од ${us.length}`;
    $$('#floorTabs button').forEach(b => b.classList.toggle('on', +b.dataset.floor === id));

    const svg = $('#floorSvg');
    svg.innerHTML = '';
    svg.appendChild(el('defs', {}, `<pattern id="hatch" width="0.6" height="0.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.6" stroke="rgba(255,255,255,.35)" stroke-width="0.12"/></pattern>`));
    svg.appendChild(el('path', { d: toPath(FOOTPRINT), fill: 'rgba(255,255,255,.06)', stroke: '#fff', 'stroke-width': 0.5, 'stroke-linejoin': 'round' }));

    us.forEach(u => {
      const z = ZONES[u.zone], st = STATUS[u.status];
      const g = el('g', { class: 'zone', 'data-unit': u.id, tabindex: 0, role: 'button', 'aria-label': u.label });
      g.appendChild(el('path', { d: toPath(z.pts), class: 'zfill', fill: st.color, 'fill-opacity': 0.62, stroke: '#fff', 'stroke-width': 0.22 }));
      const [lx, ly] = z.label;
      g.appendChild(el('text', { x: lx, y: ly - 0.7, 'text-anchor': 'middle', fill: '#fff', 'font-size': 1.15, 'font-family': 'Cormorant Garamond, Georgia, serif', 'font-weight': 600 }, u.label));
      g.appendChild(el('text', { x: lx, y: ly + 0.5, 'text-anchor': 'middle', fill: '#fff', 'font-size': 0.78, 'font-family': 'Manrope, sans-serif', 'font-weight': 700 }, `${u.area} m²`));
      g.appendChild(el('text', { x: lx, y: ly + 1.5, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.85)', 'font-size': 0.62, 'font-family': 'Manrope, sans-serif', 'font-weight': 600, 'letter-spacing': 0.05 }, st.label.toUpperCase()));
      g.addEventListener('mouseenter', () => hlUnit(u.id, true));
      g.addEventListener('mouseleave', () => hlUnit(u.id, false));
      g.addEventListener('click', () => openTour(u.id));
      g.addEventListener('keydown', e => { if (e.key === 'Enter') openTour(u.id); });
      svg.appendChild(g);
    });
    // заеднички простори (лоби, гаража...)
    (COMMON[id] || []).forEach(c => {
      const z = ZONES[c.zone];
      svg.appendChild(el('path', { d: toPath(z.pts), fill: 'url(#hatch)', stroke: '#fff', 'stroke-width': 0.22 }));
      svg.appendChild(el('text', { x: z.label[0], y: z.label[1], 'text-anchor': 'middle', fill: '#fff', 'font-size': 0.7, 'font-family': 'Manrope, sans-serif', 'font-weight': 700, 'letter-spacing': 0.08 }, c.label));
    });
    // јадро (скали + лифт)
    svg.appendChild(el('path', { d: toPath(CORE), fill: 'url(#hatch)', stroke: '#fff', 'stroke-width': 0.22 }));
    svg.appendChild(el('rect', { x: 15.5, y: 0.6, width: 1.8, height: 1.8, fill: 'none', stroke: '#fff', 'stroke-width': 0.12 }));
    svg.appendChild(el('path', { d: 'M15.5 0.6 L17.3 2.4 M17.3 0.6 L15.5 2.4', stroke: '#fff', 'stroke-width': 0.08 }));
    svg.appendChild(el('text', { x: 14.3, y: 3.8, 'text-anchor': 'middle', fill: '#fff', 'font-size': 0.6, 'font-family': 'Manrope, sans-serif', 'font-weight': 600 }, 'СКАЛИ · ЛИФТ'));
    // улица и север
    svg.appendChild(el('line', { x1: 0, y1: 17.4, x2: 28, y2: 17.4, stroke: 'rgba(255,255,255,.35)', 'stroke-width': 0.06, 'stroke-dasharray': '0.4 0.3' }));
    svg.appendChild(el('text', { x: 14, y: 18.7, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.75)', 'font-size': 0.66, 'letter-spacing': 0.25, 'font-family': 'Manrope, sans-serif' }, 'ФАСАДА КОН УЛИЦА'));
    const n = el('g', { transform: 'translate(29.6 -1)' });
    n.appendChild(el('circle', { r: 0.9, fill: 'none', stroke: '#fff', 'stroke-width': 0.08 }));
    n.appendChild(el('path', { d: 'M0 -0.7 L0.35 0.4 L0 0.15 L-0.35 0.4 Z', fill: '#fff' }));
    n.appendChild(el('text', { y: -1.25, 'text-anchor': 'middle', fill: '#fff', 'font-size': 0.6, 'font-family': 'Manrope, sans-serif', 'font-weight': 700 }, 'С'));
    svg.appendChild(n);

    // картички
    const cards = $('#unitCards');
    cards.innerHTML = '';
    us.forEach(u => {
      const st = STATUS[u.status];
      const c = document.createElement('button');
      c.className = 'ucard'; c.dataset.unit = u.id;
      c.innerHTML = `<div><span class="status-pill" style="color:${st.color}">${st.label}</span><h3>${u.label}</h3></div>
        <div class="right"><b>${u.area}</b> m²<small>${u.status === 'sold' ? '—' : eur(u.price)}</small></div>
        <div class="meta">${kindName[u.kind]} · ${bedsTxt(u.beds)} · ${u.orient}${u.note ? ' · ' + u.note : ''}</div>
        <div class="open">Влези во станот →</div>`;
      c.addEventListener('mouseenter', () => hlUnit(u.id, true));
      c.addEventListener('mouseleave', () => hlUnit(u.id, false));
      c.addEventListener('click', () => openTour(u.id));
      cards.appendChild(c);
    });
  }

  function hlUnit(id, on) {
    $$(`.zone`).forEach(z => z.classList.toggle('hl', on && z.dataset.unit === id));
    $$(`.ucard`).forEach(z => z.classList.toggle('hl', on && z.dataset.unit === id));
  }

  function renderFloorTabs() {
    const t = $('#floorTabs');
    FLOORS.forEach(f => {
      const b = document.createElement('button');
      b.textContent = f.short; b.dataset.floor = f.id; b.title = f.name; b.role = 'tab';
      b.addEventListener('click', () => selectFloor(f.id));
      t.appendChild(b);
    });
  }

  /* ---------------- ТАБЕЛА ---------------- */
  function renderTable() {
    const ff = $('#fFloor').value, fk = $('#fKind').value, fa = $('#fArea').value, onlyFree = $('#fFree').checked;
    let list = UNITS.slice();
    if (ff !== '') list = list.filter(u => u.floor === +ff);
    if (fk) list = list.filter(u => u.kind === fk);
    if (fa) { const [a, b] = fa.split('-').map(Number); list = list.filter(u => u.area >= a && u.area < b); }
    if (onlyFree) list = list.filter(u => u.status === 'free');
    const body = $('#unitsBody');
    body.innerHTML = list.length ? '' : '<tr><td colspan="8" class="empty">Нема единици според избраните филтри.</td></tr>';
    list.forEach(u => {
      const st = STATUS[u.status];
      const tr = document.createElement('tr');
      if (u.status === 'sold') tr.className = 'sold-row';
      tr.innerHTML = `<td>${u.label}</td><td>${FLOORS[u.floor].name}</td><td class="num">${u.area} m²</td><td>${bedsTxt(u.beds)}</td>
        <td>${u.orient}</td><td class="num">${u.status === 'sold' ? '—' : eur(u.price)}</td>
        <td><span class="status-pill" style="color:${st.color}">${st.label}</span></td><td class="go">Влези →</td>`;
      tr.addEventListener('click', () => openTour(u.id));
      body.appendChild(tr);
    });
  }
  function initFilters() {
    FLOORS.forEach(f => $('#fFloor').insertAdjacentHTML('beforeend', `<option value="${f.id}">${f.name}</option>`));
    ['#fFloor', '#fKind', '#fArea', '#fFree'].forEach(s => $(s).addEventListener('change', renderTable));
  }

  /* ---------------- МОДАЛ: ЕДИНИЦА ---------------- */
  let viewer = null, modalUnit = null, view = '3d';
  const FLOOR_2D = { living: '#efe4d2', bed: '#efe4d2', kid: '#f1e8d9', hall: '#e9dfcf', office: '#efe4d2', meeting: '#efe4d2', kitchen: '#e6e3de', bath: '#dfe7ea', wc: '#dfe7ea', utility: '#e4e4e1', storage: '#dcd6cc', terrace: '#d3cec6', shop: '#ebe6de' };

  function openUnit(id) {
    const u = UNITS.find(x => x.id === id);
    if (!u) return;
    modalUnit = u;
    const L = LAYOUTS[u.layout], st = STATUS[u.status], f = FLOORS[u.floor];
    $('#mFloor').textContent = `${f.name} · ${f.elev} · ${L.name}`;
    $('#mTitle').textContent = u.label;
    const pill = $('#mStatus'); pill.textContent = st.label; pill.style.color = st.color;
    $('#mPrice').textContent = u.status === 'sold' ? 'Продаден' : eur(u.price);
    $('#mPpm').textContent = u.status === 'sold' ? '' : `${eur(u.price / u.area)} / m² · без ДДВ`;
    $('#mArea').textContent = u.area;
    const baths = L.rooms.filter(r => r.t === 'bath').length, wcs = L.rooms.filter(r => r.t === 'wc').length;
    const terr = L.rooms.filter(r => r.t === 'terrace').reduce((s, r) => s + r.a, 0);
    $('#mFacts').innerHTML = [
      ['Тип', kindName[u.kind]], ['Кат', `${f.name} (${f.elev})`],
      ['Спални', bedsTxt(u.beds)], ['Бањи / WC', `${baths} / ${wcs}`],
      ['Тераси', terr ? fmtA(terr) : '—'], ['Ориентација', u.orient],
      ['Паркинг', u.kind === 'shop' ? 'Пред објект' : 'Гаража, опција'], ['Вселување', PROJECT.completion],
    ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');

    const total = L.rooms.reduce((s, r) => s + r.a, 0);
    $('#mRooms').innerHTML = L.rooms.map(r => `<li data-k="${r.k}"><span class="k">${r.k}</span><span>${r.n}</span><span class="a">${fmtA(r.a)}</span></li>`).join('') +
      `<li class="total"><span></span><span>Вкупно</span><span class="a">${fmtA(Math.round(total * 100) / 100)}</span></li>`;
    $$('#mRooms li[data-k]').forEach(li => {
      li.addEventListener('mouseenter', () => roomHL(li.dataset.k));
      li.addEventListener('mouseleave', () => roomHL(null));
    });

    $('#tabPlan').style.display = L.planImage ? '' : 'none';
    $('#tabPhotos').style.display = u.kind === 'flat' ? '' : 'none';
    if (L.planImage) $('#vplan img').src = L.planImage;
    $('#vphotos').innerHTML = GALLERY.slice(2, 6).map((g, i) => `<img src="${g.src}" alt="${g.cap}" data-i="${i + 2}">`).join('');
    $$('#vphotos img').forEach(img => img.addEventListener('click', () => openLightbox(+img.dataset.i)));
    $('#mBook').onclick = () => { closeUnit(); closeTour(true); $('#contactUnit').value = u.id; $('#contact').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#contactForm [name=name]').focus(), 600); };

    render2D(L);
    const m = $('#unitModal');
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!viewer) viewer = new Viewer3D($('#v3d'), { onRoomHover: k => roomHL(k, true) });
    viewer.wallMode = 'cut';
    $('#wallToggle').textContent = 'Полни ѕидови';
    viewer.load(L);
    viewer.autoRotate = true;
    setView(view === 'plan' && !L.planImage ? '3d' : view === 'photos' && u.kind !== 'flat' ? '3d' : view);
    if (location.hash !== '#' + u.id) history.replaceState(null, '', '#' + u.id);
  }

  function roomHL(k, fromViewer) {
    $$('#mRooms li[data-k]').forEach(li => li.classList.toggle('on', li.dataset.k === k));
    $$('.r2d').forEach(g => g.classList.toggle('on', g.dataset.k === k));
    if (!fromViewer && viewer) viewer.highlight(k);
  }

  function render2D(L) {
    const xs = L.rooms.flatMap(r => [r.r[0], r.r[0] + r.r[2]]), ys = L.rooms.flatMap(r => [r.r[1], r.r[1] + r.r[3]]);
    const minX = Math.min(...xs), minY = Math.min(...ys), W = Math.max(...xs) - minX, H = Math.max(...ys) - minY;
    const svg = el('svg', { viewBox: `${minX - 0.8} ${minY - 0.8} ${W + 1.6} ${H + 1.6}`, preserveAspectRatio: 'xMidYMid meet' });
    L.rooms.forEach(r => {
      const [x, y, w, h] = r.r;
      const g = el('g', { class: 'r2d', 'data-k': r.k });
      g.appendChild(el('rect', { x, y, width: w, height: h, fill: FLOOR_2D[r.t] || '#eee', stroke: '#3b3733', 'stroke-width': r.t === 'terrace' ? 0.04 : 0.12, 'stroke-dasharray': r.t === 'terrace' ? '0.15 0.1' : '' }));
      const fs = Math.max(0.2, Math.min(0.42, Math.min(w, h) / 5.5));
      g.appendChild(el('text', { x: x + w / 2, y: y + h / 2 - fs * 0.2, 'text-anchor': 'middle', 'font-size': fs * 1.3, 'font-weight': 700, fill: '#b08a55', 'font-family': 'Manrope, sans-serif' }, r.k));
      if (Math.min(w, h) > 1.3) g.appendChild(el('text', { x: x + w / 2, y: y + h / 2 + fs * 1.1, 'text-anchor': 'middle', 'font-size': fs, fill: '#4a4641', 'font-family': 'Manrope, sans-serif' }, fmtA(r.a)));
      g.addEventListener('mouseenter', () => roomHL(r.k));
      g.addEventListener('mouseleave', () => roomHL(null));
      svg.appendChild(g);
    });
    $('#v2d').innerHTML = '';
    $('#v2d').appendChild(svg);
  }

  function setView(v) {
    view = v;
    $$('#viewerTabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    ['3d', '2d', 'plan', 'photos'].forEach(k => $('#v' + k).classList.toggle('on', k === v));
    $('#viewerTools').style.display = v === '3d' ? '' : 'none';
  }

  function closeUnit() {
    const m = $('#unitModal');
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    if (tourUnit) { setHash(tourUnit.id); return; }
    document.body.style.overflow = '';
    setHash(null);
  }
  function setHash(id) {
    const want = id ? '#' + id : '';
    if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
  }

  function stepUnit(d) {
    const i = UNITS.findIndex(u => u.id === modalUnit.id);
    openUnit(UNITS[(i + d + UNITS.length) % UNITS.length].id);
  }

  function initModal() {
    $('#mClose').addEventListener('click', closeUnit);
    $('#mPrev').addEventListener('click', () => stepUnit(-1));
    $('#mNext').addEventListener('click', () => stepUnit(1));
    $('#unitModal').addEventListener('click', e => { if (e.target.id === 'unitModal') closeUnit(); });
    $$('#viewerTabs button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
    $('#wallToggle').addEventListener('click', () => {
      const full = viewer.wallMode !== 'full';
      viewer.setWallMode(full ? 'full' : 'cut');
      $('#wallToggle').textContent = full ? 'Ниски ѕидови' : 'Полни ѕидови';
    });
    document.addEventListener('keydown', e => {
      if ($('#lightbox').classList.contains('open')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') stepLb(1);
        if (e.key === 'ArrowLeft') stepLb(-1);
        return;
      }
      if (!$('#unitModal').classList.contains('open')) {
        if (!tourUnit) return;
        if (e.key === 'Escape') closeTour();
        if (e.key === 'ArrowRight') stepRoom(1);
        if (e.key === 'ArrowLeft') stepRoom(-1);
        return;
      }
      if (e.key === 'Escape') closeUnit();
      if (e.key === 'ArrowRight') stepUnit(1);
      if (e.key === 'ArrowLeft') stepUnit(-1);
    });
  }

  /* ---------------- ТУР: ВЛЕЗ ВО СТАН, СОБА ПО СОБА ---------------- */
  const TOUR_ORDER = ['living', 'kitchen', 'bed', 'kid', 'office', 'meeting', 'shop', 'bath', 'terrace'];
  let tourViewer = null, tourUnit = null, tourRooms = [], tourIdx = -1, tourTimer = null;

  function tourRoomList(L) {
    return L.rooms
      .filter(r => TOUR_ORDER.includes(r.t))
      .sort((a, b) => TOUR_ORDER.indexOf(a.t) - TOUR_ORDER.indexOf(b.t) || b.a - a.a);
  }

  function openTour(id, opts = {}) {
    const u = UNITS.find(x => x.id === id);
    if (!u) return;
    const t = $('#tour');
    const first = !tourUnit;
    tourUnit = u;
    const L = LAYOUTS[u.layout], f = FLOORS[u.floor];
    $('#tourFloor').textContent = `${f.name} · ${f.elev} · ${STATUS[u.status].label}`;
    $('#tourUnit').textContent = `${u.label} · ${u.area} m²`;
    $('#tourUnits').innerHTML = unitsOn(u.floor).map(x =>
      `<button data-u="${x.id}" class="${x.id === u.id ? 'on' : ''}"><i style="background:${STATUS[x.status].color}"></i>${x.label}</button>`).join('');
    $$('#tourUnits button').forEach(b => b.addEventListener('click', () => { if (b.dataset.u !== tourUnit.id) switchTourUnit(b.dataset.u); }));

    tourRooms = tourRoomList(L);
    $('#tourChips').innerHTML = tourRooms.map((r, i) => `<button data-i="${i}">${r.n}</button>`).join('');
    $$('#tourChips button').forEach(b => b.addEventListener('click', () => goRoom(+b.dataset.i)));

    t.classList.add('open'); t.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!tourViewer) {
      tourViewer = new Viewer3D($('#tourCanvas'), { onRoomClick: k => { const i = tourRooms.findIndex(r => r.k === k); if (i >= 0) goRoom(i); } });
    }
    tourViewer.wallMode = 'full';
    tourViewer.setFov(46);
    tourViewer.load(L);
    tourViewer.setAerial();       // почеток: високо над станот
    tourIdx = -1;
    showRoomCard(null);
    $('#trOverview').classList.remove('on');
    setHash(u.id);

    // влез: од горе → цел стан → дневна соба → рендер
    const veil = $('#tourVeil');
    if (first && opts.fromBuilding) { veil.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.remove('on'))); }
    clearTimeout(tourTimer);
    tourViewer.flyTo(tourViewer.overviewPose(), 1300);
    tourTimer = setTimeout(() => goRoom(0), 1500);
    if (opts.fromBuilding) setTimeout(resetBuilding, 400);
  }

  function switchTourUnit(id) {
    const veil = $('#tourVeil');
    veil.classList.add('on');
    setTimeout(() => { openTour(id); veil.classList.remove('on'); }, 350);
  }

  function goRoom(i) {
    if (!tourRooms.length) return;
    clearTimeout(tourTimer);
    tourIdx = (i + tourRooms.length) % tourRooms.length;
    const r = tourRooms[tourIdx];
    tourViewer.focusRoom(r.k, 1500);
    $$('#tourChips button').forEach((b, j) => b.classList.toggle('on', j === tourIdx));
    const chip = $(`#tourChips button[data-i="${tourIdx}"]`);
    if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    $('#trOverview').classList.remove('on');
    showRoomCard(r);
  }

  function stepRoom(d) { goRoom(tourIdx < 0 ? 0 : tourIdx + d); }

  function showRoomCard(r) {
    const card = $('#tourRoom');
    card.classList.add('swap');
    setTimeout(() => {
      if (!r) { card.style.visibility = 'hidden'; return; }
      card.style.visibility = '';
      $('#trCount').textContent = `Просторија ${tourIdx + 1} од ${tourRooms.length}`;
      $('#trName').textContent = r.n;
      $('#trArea').innerHTML = `<b>${r.a.toFixed(2).replace('.', ',')}</b> m²`;
      card.classList.remove('swap');
    }, 220);
  }

  /* Враќање кон зградата: камерата се крева → бледнее → зградата се одзумира од катот */
  function closeTour(instant) {
    if (!tourUnit) return;
    const floor = tourUnit.floor;
    clearTimeout(tourTimer);
    const t = $('#tour');
    const done = () => { t.classList.remove('open'); t.setAttribute('aria-hidden', 'true'); $('#tourVeil').classList.remove('on'); };
    tourUnit = null;
    setHash(null);
    if (instant) { document.body.style.overflow = ''; resetBuilding(); done(); return; }
    showRoomCard(null);
    const o = tourViewer.orbit;
    tourViewer.flyTo({ theta: o.theta + 0.5, phi: 0.1, radius: tourViewer.overviewPose().radius * 2.4, target: new THREE.Vector3() }, 1150);
    setTimeout(() => $('#tourVeil').classList.add('on'), 500);
    setTimeout(() => {
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
      zoomOutFrom(floor);
      done();
    }, 1150);
  }

  function zoomOutFrom(floor) {
    const b = $('#building'), flash = $('#heroFlash'), poly = $(`.fl-poly[data-floor="${floor}"]`);
    resetBuilding();
    if (!poly) return;
    const br = b.getBoundingClientRect(), pr = poly.getBoundingClientRect();
    b.style.transition = 'none'; flash.style.transition = 'none';
    b.style.transformOrigin = `${pr.left + pr.width / 2 - br.left}px ${pr.top + pr.height / 2 - br.top}px`;
    b.style.setProperty('--z', Math.min(5, Math.max(2.2, ($('#hero').clientHeight * 0.5) / pr.height)).toFixed(2));
    b.classList.add('zoom'); flash.classList.add('on'); poly.classList.add('hover');
    $('#hero').classList.add('busy');
    void b.offsetWidth;
    b.style.transition = ''; flash.style.transition = 'opacity .8s ease .05s';
    setTimeout(() => {
      b.classList.remove('zoom'); flash.classList.remove('on');
      setTimeout(() => { poly.classList.remove('hover'); flash.style.transition = ''; $('#hero').classList.remove('busy'); }, 1150);
    }, 30);
  }

  function initTour() {
    $('#tourBack').addEventListener('click', () => closeTour());
    $('#tourDetails').addEventListener('click', () => openUnit(tourUnit.id));
    $('#trPrev').addEventListener('click', () => stepRoom(-1));
    $('#trNext').addEventListener('click', () => stepRoom(1));
    $('#trOverview').addEventListener('click', () => {
      tourIdx = -1; clearTimeout(tourTimer);
      tourViewer.overview(1400);
      $$('#tourChips button').forEach(b => b.classList.remove('on'));
      $('#trOverview').classList.add('on');
      showRoomCard(null);
    });
  }

  /* ---------------- ГАЛЕРИЈА ---------------- */
  let lbIndex = 0;
  function renderGallery() {
    $('#galleryGrid').innerHTML = GALLERY.map((g, i) => `<button data-i="${i}"><img src="${g.src}" alt="${g.cap}" loading="lazy"><span>${g.cap}</span></button>`).join('');
    $$('#galleryGrid button').forEach(b => b.addEventListener('click', () => openLightbox(+b.dataset.i)));
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', () => stepLb(-1));
    $('#lbNext').addEventListener('click', () => stepLb(1));
    $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') closeLightbox(); });
  }
  function openLightbox(i) { lbIndex = i; showLb(); $('#lightbox').classList.add('open'); }
  function closeLightbox() { $('#lightbox').classList.remove('open'); }
  function stepLb(d) { lbIndex = (lbIndex + d + GALLERY.length) % GALLERY.length; showLb(); }
  function showLb() { $('#lbImg').src = GALLERY[lbIndex].src; $('#lbCap').textContent = GALLERY[lbIndex].cap; }

  /* ---------------- КОНТАКТ ---------------- */
  function initContact() {
    UNITS.filter(u => u.status !== 'sold').forEach(u =>
      $('#contactUnit').insertAdjacentHTML('beforeend', `<option value="${u.id}">${u.label} — ${u.area} m² (${FLOORS[u.floor].name})</option>`));
    $('#contactForm').addEventListener('submit', e => {
      e.preventDefault();
      e.target.reset();
      toast('Ви благодариме! Ќе ве контактираме наскоро.');
    });
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------------- СТАРТ ---------------- */
  // навигација: проѕирна над зградата, полна по скролање
  const nav = $('.nav');
  const navState = () => nav.classList.toggle('solid', window.scrollY > $('#hero').offsetHeight - 90);
  window.addEventListener('scroll', navState, { passive: true });
  navState();

  renderHero();
  renderFloorTabs();
  selectFloor(currentFloor);
  initFilters();
  renderTable();
  renderGallery();
  initModal();
  initTour();
  initContact();
  // директен линк до стан: index.html#S6
  const fromHash = () => { const h = location.hash.slice(1); if (UNITS.some(u => u.id === h)) openTour(h); };
  window.addEventListener('hashchange', fromHash);
  fromHash();
  if (matchMedia('(hover: none)').matches) $('#hintText').textContent = 'Допрете кат за да влезете во станот';
})();
