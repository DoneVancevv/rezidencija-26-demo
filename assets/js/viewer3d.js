/* =========================================================
   3D приказ на стан: ѕидови, врати, прозорци и мебел
   се генерираат автоматски од правоаголниците во data.js
   ========================================================= */

(function () {
  const WALL_T = 0.12;
  const FLOOR_COL = {
    living: 0xc8a982, bed: 0xc8a982, kid: 0xcdb08b, hall: 0xc2a37c, office: 0xc8a982, meeting: 0xc8a982,
    kitchen: 0xd9d3c9, bath: 0xcdd6d9, wc: 0xcdd6d9, utility: 0xd3d3cf, storage: 0xbdb5a8,
    terrace: 0xa59e94, shop: 0xd8d2c7,
  };
  const WINDOWED = new Set(['living', 'bed', 'kid', 'kitchen', 'office', 'meeting', 'shop']);
  const PASSAGE = new Set(['hall', 'office', 'shop']);

  function openingRule(a, b) {
    if (a === 'terrace' && b === 'terrace') return 'open';
    if (a === 'terrace' || b === 'terrace') {
      const o = a === 'terrace' ? b : a;
      return ['living', 'kitchen', 'bed', 'kid', 'office', 'meeting'].includes(o) ? 'glass' : null;
    }
    if ((a === 'living' && b === 'kitchen') || (a === 'kitchen' && b === 'living')) return 'open';
    if (PASSAGE.has(a) || PASSAGE.has(b)) return 'door';
    return null;
  }

  function edgesOf(room, idx) {
    const [x, y, w, h] = room.r;
    return [
      { idx, axis: 'h', c: y, a0: x, a1: x + w, inward: 1 },
      { idx, axis: 'h', c: y + h, a0: x, a1: x + w, inward: -1 },
      { idx, axis: 'v', c: x, a0: y, a1: y + h, inward: 1 },
      { idx, axis: 'v', c: x + w, a0: y, a1: y + h, inward: -1 },
    ];
  }

  function subtract(range, cuts) {
    let out = [range];
    cuts.forEach(([c0, c1]) => {
      const next = [];
      out.forEach(([s, e]) => {
        if (c1 <= s || c0 >= e) { next.push([s, e]); return; }
        if (c0 > s) next.push([s, c0]);
        if (c1 < e) next.push([c1, e]);
      });
      out = next;
    });
    return out.filter(([s, e]) => e - s > 0.02);
  }

  /* Пресметува сегменти на ѕидови за секоја просторија */
  function computeWalls(rooms) {
    const all = rooms.flatMap((r, i) => edgesOf(r, i));
    const segs = [];
    all.forEach(e => {
      const tA = rooms[e.idx].t;
      const neighbours = all.filter(o => o.idx !== e.idx && o.axis === e.axis &&
        Math.abs(o.c - e.c) < 0.2 && o.inward === -e.inward &&
        Math.min(o.a1, e.a1) - Math.max(o.a0, e.a0) > 0.05);
      const covered = [], openings = [];
      neighbours.forEach(o => {
        const s = Math.max(o.a0, e.a0), en = Math.min(o.a1, e.a1), len = en - s, mid = (s + en) / 2;
        covered.push([s, en]);
        const tB = rooms[o.idx].t;
        const rule = len >= 0.85 ? openingRule(tA, tB) : null;
        if (rule === 'door') { const w = Math.min(0.9, len - 0.15); openings.push({ s: mid - w / 2, e: mid + w / 2, kind: 'door' }); }
        if (rule === 'open') { const w = len * 0.86; openings.push({ s: mid - w / 2, e: mid + w / 2, kind: 'open' }); }
        if (rule === 'glass') { const w = Math.min(len - 0.3, 2.4); openings.push({ s: mid - w / 2, e: mid + w / 2, kind: 'glass' }); }
        // тераса не црта ѕид кон внатрешна просторија (тоа го прави собата)
        if (tA === 'terrace' && tB !== 'terrace') openings.push({ s, e: en, kind: 'skip' });
      });
      const exterior = subtract([e.a0, e.a1], covered);
      if (tA === 'terrace') {
        exterior.forEach(([s, en]) => segs.push({ e, s, en, kind: 'rail' }));
        return;
      }
      if (WINDOWED.has(tA) && exterior.length) {
        const longest = exterior.reduce((m, x) => (x[1] - x[0] > m[1] - m[0] ? x : m));
        const len = longest[1] - longest[0];
        if (len > 1.5) {
          const mid = (longest[0] + longest[1]) / 2, w = Math.min(len * 0.6, tA === 'shop' ? 9 : 2.8);
          openings.push({ s: mid - w / 2, e: mid + w / 2, kind: tA === 'shop' ? 'vitrine' : 'window' });
        }
      }
      const cuts = openings.map(o => [o.s, o.e]);
      subtract([e.a0, e.a1], cuts).forEach(([s, en]) => segs.push({ e, s, en, kind: 'solid' }));
      openings.forEach(o => { if (o.kind !== 'skip') segs.push({ e, s: o.s, en: o.e, kind: o.kind }); });
    });
    return segs;
  }

  class Viewer3D {
    constructor(container, opts = {}) {
      this.el = container;
      this.onRoomHover = opts.onRoomHover || (() => {});
      this.onRoomClick = opts.onRoomClick || null;
      this.wallMode = 'cut';
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate = false; // сцената е статична: сенки само по промена
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.92;
      container.appendChild(this.renderer.domElement);
      this.labelLayer = document.createElement('div');
      this.labelLayer.className = 'v3d-labels';
      container.appendChild(this.labelLayer);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
      this.scene.add(new THREE.HemisphereLight(0xfffdf8, 0xb9ac99, 0.8));
      this.roomLight = new THREE.PointLight(0xffdcae, 0, 6.5, 1.6);
      this.scene.add(this.roomLight);
      const sun = new THREE.DirectionalLight(0xfff1dc, 1.25);
      sun.position.set(-10, 18, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1536, 1536);
      Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
      sun.shadow.bias = -0.0005;
      this.scene.add(sun);
      this.group = new THREE.Group();
      this.scene.add(this.group);

      this.orbit = { theta: -0.6, phi: 0.82, radius: 22, tTheta: -0.6, tPhi: 0.82, tRadius: 22, target: new THREE.Vector3() };
      this.autoRotate = true;
      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();
      this.floorMeshes = [];
      this._bindControls();
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(container);
      this._resize();
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }

    load(layout) {
      this.layout = layout;
      this.activeKey = null; this.tween = null;
      this._build();
      const b = this.bounds;
      const span = Math.max(b.w, b.d);
      const portrait = this.camera.aspect < 1 ? 1.45 : 1;
      this.orbit.tRadius = this.orbit.radius = (span * 1.15 + 3) * portrait;
      this.minR = span * 0.6; this.maxR = span * 3;
    }

    setWallMode(mode) { this.wallMode = mode; this._build(); }
    invalidate() { this.dirty = true; }

    highlight(key) {
      const active = this.activeKey;
      this.floorMeshes.forEach(m => {
        const k = m.userData.key;
        const on = key && k === key;
        const act = !on && active && k === active;
        m.material.emissive.setHex(on ? 0x8a6a3a : act ? 0x3a2c18 : 0x000000);
        m.material.emissiveIntensity = on ? 0.35 : act ? 0.12 : 0;
      });
      this.labels && this.labels.forEach(l => l.el.classList.toggle('on', l.key === key));
      this.dirty = true;
    }

    /* ---------- камера: летање ---------- */
    setFov(f) { this.camera.fov = f; this.camera.updateProjectionMatrix(); this.dirty = true; }

    flyTo(to, ms = 1400) {
      const o = this.orbit;
      const from = { theta: o.theta, phi: o.phi, radius: o.radius, target: o.target.clone() };
      let dt = (to.theta - from.theta) % (Math.PI * 2);
      if (dt > Math.PI) dt -= Math.PI * 2;
      if (dt < -Math.PI) dt += Math.PI * 2;
      this.autoRotate = false;
      this.tween = { t0: performance.now(), ms, from, to: { theta: from.theta + dt, phi: to.phi, radius: to.radius, target: to.target.clone() } };
    }

    overviewPose() {
      const span = Math.max(this.bounds.w, this.bounds.d);
      const portrait = this.camera.aspect < 1 ? 1.45 : 1;
      return { theta: this.orbit.theta, phi: 0.78, radius: (span * 1.15 + 3) * portrait, target: new THREE.Vector3(0, 0, 0) };
    }

    overview(ms = 1400) {
      this.activeKey = null; this.highlight(null);
      this.roomLight.intensity = 0;
      this.labels.forEach(l => l.el.classList.remove('current'));
      this.minR = Math.max(this.bounds.w, this.bounds.d) * 0.6;
      this.flyTo(this.overviewPose(), ms);
    }

    /* почетна поза: високо над станот (влез одозгора) */
    setAerial() {
      const p = this.overviewPose();
      const o = this.orbit;
      o.phi = o.tPhi = 0.12; o.radius = o.tRadius = p.radius * 2.2; o.theta = o.tTheta = -0.6;
      o.target.set(0, 0, 0);
      this.autoRotate = false;
    }

    focusRoom(key, ms = 1400) {
      const room = this.layout.rooms.find(r => r.k === key);
      if (!room) return;
      const [x, y, w, h] = room.r;
      const target = new THREE.Vector3(x + w / 2 - this.center.cx, 0.45, y + h / 2 - this.center.cy);
      const portrait = this.camera.aspect < 1 ? 1.35 : 1;
      const radius = Math.max(4.6, Math.max(w, h) * 1.2 + 2.6) * portrait;
      // најблиска дијагонала до тековниот агол (помалку вртење)
      const o = this.orbit;
      const base = Math.PI / 4, step = Math.PI / 2;
      const theta = base + Math.round((o.theta - base) / step) * step;
      this.activeKey = key;
      this.highlight(null);
      this.labels.forEach(l => l.el.classList.toggle('current', l.key === key));
      this.minR = 2.5;
      this.roomLight.position.set(target.x, 2.3, target.z);
      this.roomLight.intensity = 0.7;
      const size = Math.max(w, h);
      const phi = size < 3.6 ? 0.28 : size < 5 ? 0.48 : 0.6;
      this.flyTo({ theta, phi, radius: size < 3.6 ? Math.max(4.2, size * 1.3 + 1.6) * portrait : radius, target }, ms);
    }

    snapshot() { this.renderer.render(this.scene, this.camera); return this.renderer.domElement.toDataURL('image/png'); }

    dispose() {
      cancelAnimationFrame(this._raf);
      this._ro.disconnect();
      this._clear();
      this.renderer.dispose();
      this.el.innerHTML = '';
    }

    _clear() {
      this.group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && !o.material.userData.shared) { if (o.material.map && o.material.map.userData.own) o.material.map.dispose(); o.material.dispose(); }
      });
      this.group.clear();
      this.labelLayer.innerHTML = '';
      this.floorMeshes = [];
      this.labels = [];
    }

    _build() {
      this._clear();
      const rooms = this.layout.rooms;
      const xs = rooms.flatMap(r => [r.r[0], r.r[0] + r.r[2]]);
      const ys = rooms.flatMap(r => [r.r[1], r.r[1] + r.r[3]]);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      this.bounds = { w: maxX - minX, d: maxY - minY };
      this.center = { cx, cy };
      const g = this.group;
      g.position.set(-cx, 0, -cy);
      const H = this.wallMode === 'full' ? 2.7 : 1.25;
      // пресек: сè над ниските ѕидови се сече (мебел, ламби, завеси)
      this.renderer.clippingPlanes = this.wallMode === 'full' ? [] : [new THREE.Plane(new THREE.Vector3(0, -1, 0), H + 0.03)];

      // подлога
      const base = new THREE.Mesh(new THREE.BoxGeometry(this.bounds.w + 2.4, 0.25, this.bounds.d + 2.4),
        new THREE.MeshStandardMaterial({ color: 0xe6e0d6, roughness: 1 }));
      base.position.set(cx, -0.14, cy); base.receiveShadow = true; g.add(base);

      // кои страни имаат прозорци / стаклени врати (за распоред на мебел)
      const segs = computeWalls(rooms);
      const winSides = rooms.map(() => new Set());
      segs.forEach(({ e, kind }) => {
        if (!['window', 'vitrine', 'glass'].includes(kind)) return;
        winSides[e.idx].add(e.axis === 'h' ? (e.inward > 0 ? 'top' : 'bottom') : (e.inward > 0 ? 'left' : 'right'));
      });

      // подови
      rooms.forEach(room => {
        const [x, y, w, h] = room.r;
        const mat = window.Furnish ? Furnish.floorMaterial(room) : new THREE.MeshStandardMaterial({ color: FLOOR_COL[room.t] || 0xcccccc, roughness: 0.85 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, h), mat);
        m.position.set(x + w / 2, room.t === 'terrace' ? -0.04 : 0, y + h / 2);
        m.receiveShadow = true;
        m.userData.key = room.k;
        g.add(m); this.floorMeshes.push(m);
        if (window.Furnish) Furnish.furnishRoom(g, room, rooms, winSides[rooms.indexOf(room)]); else this._furnish(room);
      });

      // ѕидови
      const wallMat = window.Furnish ? Furnish.mats().wall : new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 0.9 });
      const capMat = new THREE.MeshStandardMaterial({ color: this.wallMode === 'full' ? 0x9a948b : 0x3b3733, roughness: 0.8 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xa9c7d6, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2f2d2b, roughness: 0.6 });
      const box = (e, s, en, y0, y1, mat, thick = WALL_T, cast = true) => {
        const len = en - s, hgt = y1 - y0;
        if (len <= 0.01 || hgt <= 0.01) return;
        const off = e.inward * thick / 2;
        const geo = e.axis === 'h' ? new THREE.BoxGeometry(len, hgt, thick) : new THREE.BoxGeometry(thick, hgt, len);
        const m = new THREE.Mesh(geo, mat);
        if (e.axis === 'h') m.position.set((s + en) / 2, y0 + hgt / 2, e.c + off);
        else m.position.set(e.c + off, y0 + hgt / 2, (s + en) / 2);
        m.castShadow = cast; m.receiveShadow = true;
        g.add(m);
      };
      segs.forEach(sg => {
        const { e, s, en, kind } = sg;
        if (kind === 'solid') { box(e, s, en, 0, H, wallMat); box(e, s, en, H, H + 0.02, capMat); }
        else if (kind === 'door') { if (H > 2.1) box(e, s, en, 2.1, H, wallMat); }
        else if (kind === 'open') { if (H > 2.3) box(e, s, en, 2.3, H, wallMat); }
        else if (kind === 'glass') { box(e, s, en, 0, Math.min(H, 2.3), glassMat, 0.04, false); box(e, s, en, 0, 0.04, frameMat, 0.06); if (H > 2.3) box(e, s, en, 2.3, H, wallMat); }
        else if (kind === 'window' || kind === 'vitrine') {
          const sill = kind === 'vitrine' ? 0.15 : 0.9, top = Math.min(H, 2.3);
          box(e, s, en, 0, Math.min(sill, H), wallMat);
          if (top > sill) { box(e, s, en, sill, top, glassMat, 0.04, false); box(e, s, en, sill, sill + 0.04, frameMat, WALL_T); }
          if (H > 2.3) box(e, s, en, 2.3, H, wallMat);
          box(e, s, en, Math.min(H, top), Math.min(H, top) + 0.02, capMat);
          if (window.Furnish && kind === 'window' && ['living', 'bed', 'kid', 'office', 'meeting'].includes(rooms[e.idx].t)) Furnish.curtains(g, e, s, en, H);
        } else if (kind === 'rail') {
          box(e, s, en, 0, 1.0, glassMat, 0.04, false);
          box(e, s, en, 1.0, 1.05, frameMat, 0.06);
        }
      });

      // ознаки
      this.labels = rooms.map(room => {
        const el = document.createElement('div');
        el.className = 'v3d-label' + (room.a < 6 ? ' small' : '');
        el.innerHTML = `<b>${room.n}</b><span>${room.a.toFixed(2).replace('.', ',')} m²</span>`;
        el.addEventListener('mouseenter', () => { this.highlight(room.k); this.onRoomHover(room.k); });
        el.addEventListener('click', () => { if (this.onRoomClick) this.onRoomClick(room.k); });
        if (room.k === this.activeKey) el.classList.add('current');
        el.addEventListener('mouseleave', () => { this.highlight(null); this.onRoomHover(null); });
        this.labelLayer.appendChild(el);
        const [x, y, w, h] = room.r;
        return { el, key: room.k, pos: new THREE.Vector3(x + w / 2 - cx, 0.3, y + h / 2 - cy) };
      });
      this.renderer.shadowMap.needsUpdate = true;
      this.dirty = true;
    }

    _furnish(room) {
      const [x, y, w, h] = room.r, g = this.group;
      const fabric = 0x8d8882, wood = 0x6e5745, white = 0xf6f4f0, dark = 0x2e2c2a, green = 0x5f7a52;
      const add = (fx, fz, fw, fd, fh, col, y0 = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
        m.position.set(x + fx, y0 + fh / 2 + 0.03, y + fz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
      };
      const cyl = (fx, fz, r, fh, col, y0 = 0) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, fh, 28), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }));
        m.position.set(x + fx, y0 + fh / 2 + 0.03, y + fz); m.castShadow = true; g.add(m); return m;
      };
      const long = w >= h; // ориентација
      switch (room.t) {
        case 'bed': {
          const bw = Math.min(1.7, w - 1.2), bl = Math.min(2.1, h - 0.6);
          if (long) { add(w / 2, 0.25 + bl / 2, bw, bl, 0.45, white); add(w / 2, 0.15, bw + 0.1, 0.12, 1.0, wood); add(w / 2 - bw / 2 - 0.35, 0.4, 0.45, 0.4, 0.5, dark); add(w / 2 + bw / 2 + 0.35, 0.4, 0.45, 0.4, 0.5, dark); add(w / 2, h - 0.35, Math.min(2.4, w - 0.6), 0.6, 2.1, wood); }
          else { add(0.25 + bl / 2, h / 2, bl, bw, 0.45, white); add(0.15, h / 2, 0.12, bw + 0.1, 1.0, wood); add(w - 0.35, h / 2, 0.6, Math.min(2.4, h - 0.6), 2.1, wood); }
          break;
        }
        case 'kid': {
          if (long) { add(0.2 + 1.0, 0.55, 2.0, 0.9, 0.42, white); add(w - 0.45, h - 0.4, 0.6, 1.2, 0.75, wood); }
          else { add(0.55, 0.2 + 1.0, 0.9, 2.0, 0.42, white); add(w - 0.4, h - 0.7, 1.2, 0.6, 0.75, wood); }
          break;
        }
        case 'living': {
          const sw = Math.min(2.8, (long ? w : h) - 1.2);
          if (long) { add(w * 0.35, h - 0.6, sw, 0.95, 0.75, fabric); cyl(w * 0.35, h - 1.7, 0.45, 0.4, wood); add(w * 0.35, 0.3, 1.8, 0.4, 0.5, dark); add(w * 0.78, h * 0.45, 1.6, 0.9, 0.75, wood); }
          else { add(0.6, h * 0.62, 0.95, sw, 0.75, fabric); cyl(1.7, h * 0.62, 0.45, 0.4, wood); add(w - 0.25, h * 0.62, 0.4, 1.8, 0.5, dark); add(w / 2, h * 0.2, 0.95, 1.7, 0.75, wood); }
          cyl(0.35, 0.35, 0.22, 1.0, green);
          break;
        }
        case 'kitchen': {
          if (long) { add(w / 2, 0.32, w - 0.4, 0.62, 0.9, white); if (h > 1.9) add(w / 2, h * 0.68, Math.min(2.2, w - 1.4), 0.8, 0.9, dark); }
          else { add(0.32, h / 2, 0.62, h - 0.4, 0.9, white); }
          break;
        }
        case 'bath': {
          if (long) { add(0.2 + 0.85, h - 0.4, 1.7, 0.75, 0.55, white); add(w - 0.35, 0.3, 0.5, 0.45, 0.85, white); }
          else { add(w / 2, 0.2 + 0.6, w - 0.3, 1.2, 0.05, white); add(w / 2, h - 0.3, 0.55, 0.45, 0.85, white); }
          break;
        }
        case 'wc': add(w / 2, h - 0.3, 0.4, 0.55, 0.4, white); break;
        case 'utility': add(w / 2, h / 2, 0.6, 0.6, 0.85, white); break;
        case 'terrace': {
          if (w > 1.5 && h > 1.5) { cyl(w / 2, h / 2, 0.4, 0.74, dark); cyl(w / 2 - 0.65, h / 2, 0.22, 0.45, 0xdedad3); cyl(w / 2 + 0.65, h / 2, 0.22, 0.45, 0xdedad3); }
          cyl(0.3, 0.3, 0.25, 0.8, green);
          break;
        }
        case 'office': {
          for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) add(1.6 + i * 2.3, 1.6 + j * 2.6, 1.6, 0.8, 0.74, white);
          break;
        }
        case 'meeting': add(w / 2, h / 2, Math.min(2.6, w - 1.2), 1.1, 0.74, wood); break;
        case 'shop': {
          add(w - 1.2, 1.4, 1.8, 0.7, 1.0, dark);
          for (let i = 0; i < 3; i++) add(1.5 + i * 2.6, h - 0.35, 2.0, 0.45, 1.8, wood);
          break;
        }
      }
    }

    _bindControls() {
      const c = this.renderer.domElement;
      const pts = new Map();
      let lastDist = 0;
      const stop = () => { this.autoRotate = false; };
      let down = null;
      c.addEventListener('pointerdown', e => { try { c.setPointerCapture(e.pointerId); } catch (_) {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = { x: e.clientX, y: e.clientY }; stop(); });
      c.addEventListener('pointerup', e => {
        pts.delete(e.pointerId); lastDist = 0;
        // клик (без влечење) на под → просторија
        if (down && this.onRoomClick && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
          const rect = c.getBoundingClientRect();
          this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
          this.raycaster.setFromCamera(this.pointer, this.camera);
          const hit = this.raycaster.intersectObjects(this.floorMeshes, false)[0];
          if (hit && hit.object.userData.key !== this.activeKey) this.onRoomClick(hit.object.userData.key);
        }
        down = null;
      });
      c.addEventListener('pointercancel', e => { pts.delete(e.pointerId); lastDist = 0; });
      c.addEventListener('pointermove', e => {
        const rect = c.getBoundingClientRect();
        this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        if (!pts.has(e.pointerId)) { this._hoverPick(); return; }
        const p = pts.get(e.pointerId);
        if (pts.size === 1) {
          this.orbit.tTheta -= (e.clientX - p.x) * 0.008;
          this.orbit.tPhi = Math.min(1.45, Math.max(0.12, this.orbit.tPhi - (e.clientY - p.y) * 0.006));
        } else if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (lastDist) this._zoom((lastDist - d) * 0.05);
          lastDist = d;
        }
        p.x = e.clientX; p.y = e.clientY;
      });
      c.addEventListener('wheel', e => { e.preventDefault(); stop(); this._zoom(e.deltaY * 0.012); }, { passive: false });
      c.addEventListener('pointerleave', () => { this.highlight(null); this.onRoomHover(null); });
    }

    _zoom(d) { this.orbit.tRadius = Math.min(this.maxR || 60, Math.max(this.minR || 4, this.orbit.tRadius + d)); }

    _hoverPick() {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.floorMeshes, false)[0];
      const key = hit ? hit.object.userData.key : null;
      if (key !== this._hoverKey) { this._hoverKey = key; this.highlight(key); this.onRoomHover(key); }
    }

    _resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = w + 'px';
      this.renderer.domElement.style.height = h + 'px';
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this._w = w; this._h = h;
      this.dirty = true;
    }

    _loop() {
      this._raf = requestAnimationFrame(this._loop);
      // не црта ништо кога прозорецот е скриен (тур / модал затворен)
      if (!this.el.offsetParent || document.hidden) return;
      const o = this.orbit;
      const prev = this._prev || (this._prev = { t: NaN, p: NaN, r: NaN, x: NaN, z: NaN });
      if (this.tween) {
        const tw = this.tween, k = Math.min(1, (performance.now() - tw.t0) / tw.ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        o.theta = o.tTheta = tw.from.theta + (tw.to.theta - tw.from.theta) * e;
        o.phi = o.tPhi = tw.from.phi + (tw.to.phi - tw.from.phi) * e;
        o.radius = o.tRadius = tw.from.radius + (tw.to.radius - tw.from.radius) * e;
        o.target.lerpVectors(tw.from.target, tw.to.target, e);
        if (k >= 1) { this.tween = null; if (this.onTweenEnd) this.onTweenEnd(); }
      } else {
        if (this.autoRotate) o.tTheta += 0.0016;
        o.theta += (o.tTheta - o.theta) * 0.12;
        o.phi += (o.tPhi - o.phi) * 0.12;
        o.radius += (o.tRadius - o.radius) * 0.12;
      }
      // мирна сцена → прескокни рендер (штеди процесор/батерија)
      const moved = Math.abs(o.theta - prev.t) > 1e-5 || Math.abs(o.phi - prev.p) > 1e-5 || Math.abs(o.radius - prev.r) > 1e-4 ||
        Math.abs(o.target.x - prev.x) > 1e-4 || Math.abs(o.target.z - prev.z) > 1e-4;
      if (!moved && !this.dirty) return;
      prev.t = o.theta; prev.p = o.phi; prev.r = o.radius; prev.x = o.target.x; prev.z = o.target.z;
      this.dirty = false;
      this.camera.position.set(
        o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta),
        o.target.y + o.radius * Math.cos(o.phi),
        o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta));
      this.camera.lookAt(o.target);
      this.renderer.render(this.scene, this.camera);
      if (this.labels) {
        const w = this._w || this.el.clientWidth, h = this._h || this.el.clientHeight, v = this._v || (this._v = new THREE.Vector3());
        this.labels.forEach(l => {
          v.copy(l.pos).project(this.camera);
          const vis = v.z < 1;
          if (l.vis !== vis) { l.el.style.display = vis ? '' : 'none'; l.vis = vis; }
          l.el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px,0) translate(-50%,-50%)`;
        });
      }
    }
  }

  window.Viewer3D = Viewer3D;
})();
