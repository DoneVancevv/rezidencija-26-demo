/* =========================================================
   Реалистичен ентериер: процедурални текстури (паркет, плочки,
   килими, ткаенини) и детален мебел според типот на просторијата.
   Стилот е земен од рендерите: светол даб, сиви ткаенини,
   орев, бел мермер, црни детали.
   ========================================================= */
(function () {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* ---------------- текстури ---------------- */
  const TEX = {};
  function canvasTex(key, size, draw) {
    if (TEX[key]) return TEX[key];
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    seed = 7 + key.length * 131;
    draw(g, size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    TEX[key] = t;
    return t;
  }

  // светол даб паркет (текстурата покрива 2 x 2 m, штици од 20 cm)
  const woodTex = () => canvasTex('wood', 1024, (g, s) => {
    const rows = 10, rh = s / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * s * 0.5;
      while (x < s) {
        const len = (0.35 + rnd() * 0.35) * s;
        const v = rnd() * 26 - 13;
        g.fillStyle = `rgb(${206 + v},${176 + v * 0.9},${138 + v * 0.8})`;
        g.fillRect(x, r * rh, len, rh);
        for (let k = 0; k < 16; k++) {
          g.strokeStyle = `rgba(${120 + rnd() * 30},${84 + rnd() * 20},50,${0.05 + rnd() * 0.08})`;
          g.lineWidth = 0.6 + rnd() * 1.6;
          const yy = r * rh + 3 + rnd() * (rh - 6), ph = rnd() * 6;
          g.beginPath(); g.moveTo(x, yy);
          for (let xx = x; xx <= x + len; xx += 16) g.lineTo(xx, yy + Math.sin(xx * 0.012 + ph) * 2.2);
          g.stroke();
        }
        if (rnd() > 0.6) { // чвор
          g.fillStyle = 'rgba(110,75,45,.18)';
          g.beginPath(); g.ellipse(x + rnd() * len, r * rh + rh / 2, 10 + rnd() * 8, 4, 0, 0, 7); g.fill();
        }
        g.fillStyle = 'rgba(80,55,35,.4)'; g.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(80,55,35,.32)'; g.fillRect(0, r * rh, s, 1.5);
    }
  });

  // светли мермерни плочки 60 x 60 (текстурата = 1.2 m)
  const tileTex = () => canvasTex('tile', 1024, (g, s) => {
    g.fillStyle = '#e6e4df'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(130,130,135,${0.05 + rnd() * 0.12})`;
      g.lineWidth = 0.5 + rnd() * 2;
      g.beginPath();
      const x0 = rnd() * s, y0 = rnd() * s;
      g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + rnd() * 300 - 150, y0 + rnd() * 300, x0 + rnd() * 400 - 200, y0 + rnd() * 400, x0 + rnd() * 500 - 250, y0 + rnd() * 500);
      g.stroke();
    }
    g.fillStyle = '#c4c0b9';
    for (let i = 0; i <= 2; i++) { g.fillRect(i * s / 2 - 2, 0, 4, s); g.fillRect(0, i * s / 2 - 2, s, 4); }
  });

  // мермер за работна плоча
  const marbleTex = () => canvasTex('marble', 512, (g, s) => {
    g.fillStyle = '#f1efeb'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(120,120,128,${0.08 + rnd() * 0.18})`;
      g.lineWidth = 0.4 + rnd() * 1.8;
      g.beginPath();
      let x = rnd() * s, y = 0;
      g.moveTo(x, y);
      while (y < s) { x += rnd() * 40 - 20; y += 20 + rnd() * 30; g.lineTo(x, y); }
      g.stroke();
    }
  });

  // деке за тераса
  const deckTex = () => canvasTex('deck', 512, (g, s) => {
    const rows = 8, rh = s / rows;
    for (let r = 0; r < rows; r++) {
      const v = rnd() * 14 - 7;
      g.fillStyle = `rgb(${112 + v},${106 + v},${99 + v})`;
      g.fillRect(0, r * rh, s, rh);
      for (let k = 0; k < 8; k++) { g.fillStyle = `rgba(60,55,50,${0.06 + rnd() * 0.06})`; g.fillRect(0, r * rh + rnd() * rh, s, 1); }
      g.fillStyle = 'rgba(40,36,32,.7)'; g.fillRect(0, r * rh, s, 4);
    }
  });

  // бел килим со лавиринт шара (како на рендерот)
  const rugTex = () => canvasTex('rug', 512, (g, s) => {
    g.fillStyle = '#ece9e3'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(175,170,162,.85)'; g.lineWidth = 3;
    const cell = s / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      for (let k = 1; k <= 4; k++) {
        const p = k * cell / 10;
        g.strokeRect(i * cell + p, j * cell + p, cell - 2 * p, cell - 2 * p);
      }
    }
    for (let n = 0; n < 4000; n++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.25})`; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
  });

  // плетено ќебе
  const knitTex = () => canvasTex('knit', 256, (g, s) => {
    g.fillStyle = '#5d5b58'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) for (let x = 0; x < s; x += 8) {
      const l = 70 + rnd() * 40;
      g.fillStyle = `rgb(${l},${l - 2},${l - 4})`;
      g.beginPath(); g.ellipse(x + 4, y + 4, 3.4, 2.4, rnd() * 3, 0, 7); g.fill();
    }
  });

  // летви од орев (ѕид зад кревет / ТВ)
  const slatTex = () => canvasTex('slat', 512, (g, s) => {
    const n = 16, sw = s / n;
    for (let i = 0; i < n; i++) {
      const v = rnd() * 10 - 5;
      g.fillStyle = `rgb(${86 + v},${64 + v},${50 + v})`;
      g.fillRect(i * sw, 0, sw, s);
      for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(40,28,20,${0.08 + rnd() * 0.1})`; g.fillRect(i * sw + rnd() * sw, 0, 1, s); }
      g.fillStyle = '#231a14'; g.fillRect(i * sw, 0, 3, s);
    }
  });

  // пепит (houndstooth) за фотелја
  const houndTex = () => canvasTex('hound', 256, (g, s) => {
    g.fillStyle = '#e9e6e1'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#2d2c2a';
    const c = s / 16;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      if ((i + j) % 2) continue;
      g.beginPath();
      g.moveTo(i * c, j * c); g.lineTo(i * c + c, j * c); g.lineTo(i * c + c * 1.4, j * c + c * 0.6); g.lineTo(i * c + c * 0.4, j * c + c); g.closePath(); g.fill();
    }
  });

  // ткаенина (суптилна текстура)
  const fabricTex = () => canvasTex('fabric', 256, (g, s) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
    for (let n = 0; n < 9000; n++) { const l = 110 + rnd() * 50; g.fillStyle = `rgba(${l},${l},${l},.35)`; g.fillRect(rnd() * s, rnd() * s, 1.5, 1.5); }
  });

  function texRepeat(base, rx, ry) {
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(rx, ry);
    t.userData.own = true;
    return t;
  }

  /* ---------------- материјали ---------------- */
  let M = null;
  function mats() {
    if (M) return M;
    const std = (o) => { const m = new THREE.MeshStandardMaterial(o); m.userData.shared = true; return m; };
    const fab = fabricTex();
    M = {
      wall: std({ color: 0xf2efe9, roughness: 0.95 }),
      fabric: std({ color: 0x8f8b86, roughness: 1, map: fab }),
      fabricLight: std({ color: 0xc9c5bf, roughness: 1, map: fab }),
      fabricDark: std({ color: 0x5f5c58, roughness: 1, map: fab }),
      hound: std({ color: 0xffffff, roughness: 1, map: texRepeat(houndTex(), 3, 3) }),
      knit: std({ color: 0xffffff, roughness: 1, map: texRepeat(knitTex(), 4, 4) }),
      white: std({ color: 0xf5f3ef, roughness: 0.55 }),
      gloss: std({ color: 0xfbfbfa, roughness: 0.15 }),
      walnut: std({ color: 0x48301f, roughness: 0.5 }),
      oak: std({ color: 0xc7a57d, roughness: 0.55 }),
      black: std({ color: 0x1f1f1f, roughness: 0.45 }),
      greyCab: std({ color: 0x6b6865, roughness: 0.55 }),
      grey: std({ color: 0x9c9a96, roughness: 0.7 }),
      stone: std({ color: 0xd7d1c7, roughness: 0.45 }),
      leather: std({ color: 0x3e2a22, roughness: 0.5 }),
      marble: std({ color: 0xffffff, roughness: 0.25, map: marbleTex() }),
      metal: std({ color: 0xb9bcbf, roughness: 0.25, metalness: 0.85 }),
      mirror: std({ color: 0xdde5e8, roughness: 0.04, metalness: 0.95 }),
      screen: std({ color: 0x0d0e10, roughness: 0.15, metalness: 0.4 }),
      glassDark: std({ color: 0x2a2724, roughness: 0.1, transparent: true, opacity: 0.5 }),
      glass: std({ color: 0xc7dbe3, roughness: 0.05, transparent: true, opacity: 0.22 }),
      green: std({ color: 0x4d6a3c, roughness: 0.85 }),
      green2: std({ color: 0x6f8f4c, roughness: 0.85 }),
      pot: std({ color: 0xd9d3c9, roughness: 0.9 }),
      lamp: std({ color: 0xfffaf0, emissive: 0xfff1d6, emissiveIntensity: 0.55, roughness: 0.8 }),
      led: std({ color: 0xffe7c2, emissive: 0xffd9a0, emissiveIntensity: 1.2 }),
      curtain: std({ color: 0xa29e98, roughness: 1, map: fab }),
      sheer: std({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
      slat: std({ color: 0xffffff, roughness: 0.6, map: texRepeat(slatTex(), 3, 1) }),
      books: [0x8b3a2f, 0x2f4a5e, 0xc9a15b, 0x3f5b3a, 0xe8e2d6].map(c => std({ color: c, roughness: 0.8 })),
    };
    return M;
  }

  // под по тип на просторија (со правилно повторување на текстурата)
  function floorMaterial(room) {
    const [, , w, h] = room.r;
    const t = room.t;
    if (t === 'bath' || t === 'wc' || t === 'utility' || t === 'kitchen' || t === 'shop')
      return new THREE.MeshStandardMaterial({ map: texRepeat(tileTex(), w / 1.2, h / 1.2), roughness: 0.35, color: t === 'shop' ? 0xf0ede8 : 0xffffff });
    if (t === 'terrace') return new THREE.MeshStandardMaterial({ map: texRepeat(deckTex(), w / 1.2, h / 1.2), roughness: 0.85 });
    if (t === 'storage') return new THREE.MeshStandardMaterial({ color: 0xc9c2b6, roughness: 0.9 });
    return new THREE.MeshStandardMaterial({ map: texRepeat(woodTex(), w / 2, h / 2), roughness: 0.62 });
  }

  /* ---------------- геометрија ---------------- */
  function rboxGeo(w, h, d, r) {
    r = Math.max(0.004, Math.min(r, w / 2 - 0.002, d / 2 - 0.002, h / 2 - 0.002));
    const b = r * 0.65, ww = w - 2 * b, dd = d - 2 * b, cr = Math.max(0.001, r - b);
    const s = new THREE.Shape(), x0 = -ww / 2, y0 = -dd / 2;
    s.moveTo(x0 + cr, y0); s.lineTo(x0 + ww - cr, y0); s.quadraticCurveTo(x0 + ww, y0, x0 + ww, y0 + cr);
    s.lineTo(x0 + ww, y0 + dd - cr); s.quadraticCurveTo(x0 + ww, y0 + dd, x0 + ww - cr, y0 + dd);
    s.lineTo(x0 + cr, y0 + dd); s.quadraticCurveTo(x0, y0 + dd, x0, y0 + dd - cr);
    s.lineTo(x0, y0 + cr); s.quadraticCurveTo(x0, y0, x0 + cr, y0);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 5 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, b - h / 2, 0);
    return g;
  }

  // помошни функции: сè се додава во група p, y0 = долна висина
  function B(p, w, h, d, mat, x, y0, z, r = 0, cast = true) {
    const geo = r > 0 ? rboxGeo(w, h, d, r) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y0 + h / 2, z);
    m.castShadow = cast; m.receiveShadow = true;
    p.add(m); return m;
  }
  function C(p, rt, rb, h, mat, x, y0, z, seg = 28) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y0 + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    p.add(m); return m;
  }
  function S(p, r, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    m.castShadow = true; p.add(m); return m;
  }
  function grp(p, x, z, rot = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; p.add(g); return g; }
  function rug(p, w, d, x, z, rot = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.015, d), new THREE.MeshStandardMaterial({ map: texRepeat(rugTex(), w / 1.2, d / 1.2), roughness: 1 }));
    m.position.set(x, 0.04, z); m.rotation.y = rot; m.receiveShadow = true; p.add(m); return m;
  }

  /* ---------------- мебел (гледа кон +Z, центар на основата = 0,0) ---------------- */
  const F = {
    sofa(p, len, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats(), dep = 0.95;
      B(g, len, 0.36, dep, m.fabric, 0, 0.05, 0, 0.06);
      B(g, len, 0.42, 0.22, m.fabric, 0, 0.32, -dep / 2 + 0.11, 0.08);
      B(g, 0.2, 0.3, dep, m.fabric, -len / 2 + 0.1, 0.36, 0, 0.08);
      B(g, 0.2, 0.3, dep, m.fabric, len / 2 - 0.1, 0.36, 0, 0.08);
      const n = len > 2.3 ? 3 : 2, cw = (len - 0.4) / n;
      for (let i = 0; i < n; i++) {
        const cx = -len / 2 + 0.2 + cw * (i + 0.5);
        B(g, cw - 0.03, 0.14, dep - 0.28, m.fabricLight, cx, 0.4, 0.1, 0.06);
        const bc = B(g, cw - 0.05, 0.42, 0.18, m.fabricLight, cx, 0.46, -dep / 2 + 0.3, 0.08);
        bc.rotation.x = -0.18;
      }
      const pl = B(g, 0.42, 0.4, 0.13, m.hound, -len / 2 + 0.48, 0.52, -dep / 2 + 0.42, 0.07); pl.rotation.set(-0.25, 0.25, 0.1);
      return g;
    },
    armchair(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.42, 32), m.hound);
      base.position.y = 0.26; base.castShadow = true; g.add(base);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.42, 0.36, 32, 1, true, Math.PI * 0.62, Math.PI * 1.76), m.hound);
      back.position.y = 0.62; back.material.side = THREE.DoubleSide; back.castShadow = true; g.add(back);
      C(g, 0.36, 0.36, 0.1, m.fabricLight, 0, 0.47, 0.04);
      return g;
    },
    coffeeTable(p, x, z) {
      const m = mats();
      C(p, 0.5, 0.5, 0.045, m.walnut, x, 0.38, z, 48);
      C(p, 0.12, 0.3, 0.36, m.black, x, 0.03, z);
      B(p, 0.3, 0.05, 0.22, m.black, x + 0.08, 0.425, z - 0.05, 0.01);
      B(p, 0.26, 0.03, 0.2, m.white, x + 0.08, 0.475, z - 0.05, 0.01);
    },
    tvWall(p, len, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, len, 2.5, 0.04, m.slat, 0, 0.05, -0.2, 0, false);
      B(g, Math.min(2.2, len - 0.3), 0.42, 0.42, m.walnut, 0, 0.14, 0.03, 0.02);
      B(g, Math.min(1.0, len * 0.4), 0.3, 0.02, m.white, Math.min(2.2, len - 0.3) * 0.22, 0.2, 0.245);
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => C(g, 0.012, 0.012, 0.12, m.black, sx * (Math.min(2.2, len - 0.3) / 2 - 0.08), 0.03, 0.03 + sz * 0.15, 8)));
      B(g, 1.45, 0.83, 0.04, m.screen, 0, 1.0, -0.15, 0.01);
      return g;
    },
    cloudLamp(p, x, z, y = 2.05) {
      const m = mats();
      C(p, 0.004, 0.004, 2.7 - y - 0.3, m.black, x, y + 0.3, z, 6);
      [[0.12, 0.1], [0.22, 0.09], [0.3, 0.07]].forEach(([r, h], i) => {
        const c = C(p, r * 0.85, r, h, m.lamp, x, y + 0.2 - i * 0.1, z, 20); c.castShadow = false;
      });
    },
    lineLamp(p, len, x, z, rot, y = 1.75) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, len, 0.03, 0.05, m.black, 0, y + 0.3, 0, 0, false);
      [-len / 3, 0, len / 3].forEach(u => { C(g, 0.003, 0.003, 0.3, m.black, u, y, 0, 6); C(g, 0.035, 0.035, 0.18, m.black, u, y - 0.12, 0, 12); });
      return g;
    },
    ringLamp(p, x, z, y = 2.2) {
      const m = mats();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 40, 1, true), m.black);
      t.material.side = THREE.DoubleSide; t.position.set(x, y, z); p.add(t);
      C(p, 0.33, 0.33, 0.01, m.lamp, x, y - 0.05, z, 40).castShadow = false;
      [-0.25, 0.25].forEach(o => C(p, 0.002, 0.002, 2.7 - y, m.black, x + o, y + 0.05, z, 4));
    },
    dining(p, len, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, len, 0.04, 0.9, m.stone, 0, 0.72, 0, 0.012);
      [-1, 1].forEach(s => { const l = B(g, 0.06, 0.7, 0.65, m.black, s * len * 0.3, 0.02, 0, 0); l.rotation.z = s * 0.25; });
      const per = len >= 1.5 ? 2 : 1;
      for (let i = 0; i < per; i++) {
        const u = per === 1 ? 0 : (i - 0.5) * len * 0.5;
        F.chair(g, u, 0.62, Math.PI);
        F.chair(g, u, -0.62, 0);
      }
      return g;
    },
    chair(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.48, 0.09, 0.46, m.fabricLight, 0, 0.44, 0, 0.04);
      const b = B(g, 0.5, 0.36, 0.08, m.leather, 0, 0.52, -0.22, 0.04); b.rotation.x = -0.12;
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => C(g, 0.013, 0.01, 0.44, m.black, sx * 0.19, 0, sz * 0.18, 8)));
      return g;
    },
    plant(p, x, z, h = 1.0, big = false) {
      const m = mats();
      C(p, big ? 0.22 : 0.16, big ? 0.17 : 0.12, big ? 0.42 : 0.3, m.pot, x, 0.03, z);
      const n = big ? 9 : 6;
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, rr = rnd() * (big ? 0.22 : 0.14);
        S(p, (big ? 0.2 : 0.14) + rnd() * 0.1, rnd() > 0.5 ? m.green : m.green2,
          x + Math.cos(a) * rr, 0.35 + h * (0.35 + rnd() * 0.6), z + Math.sin(a) * rr, 1, 0.8 + rnd() * 0.5, 1);
      }
    },
    bed(p, w, l, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, w + 0.16, 0.32, l + 0.1, m.fabricLight, 0, 0.04, 0, 0.08);
      B(g, w, 0.2, l - 0.05, m.white, 0, 0.34, 0.02, 0.07);
      B(g, w + 0.08, 0.07, l * 0.66, m.knit, 0, 0.52, l * 0.18, 0.035);
      B(g, w * 0.98, 0.05, l * 0.22, m.white, 0, 0.53, -l * 0.17, 0.025);
      [-1, 1].forEach(s => { const pl = B(g, w * 0.4, 0.15, 0.42, m.white, s * w * 0.23, 0.55, -l / 2 + 0.3, 0.07); pl.rotation.x = -0.35; });
      B(g, w + 0.24, 1.0, 0.12, m.fabricLight, 0, 0.04, -l / 2 - 0.06, 0.05);
      return g;
    },
    nightstand(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.5, 0.48, 0.4, m.grey, 0, 0.1, 0, 0.02);
      B(g, 0.2, 0.015, 0.02, m.black, 0, 0.45, 0.205);
      B(g, 0.2, 0.015, 0.02, m.black, 0, 0.27, 0.205);
      [-1, 1].forEach(sx => C(g, 0.015, 0.015, 0.1, m.black, sx * 0.2, 0, 0, 8));
      B(g, 0.2, 0.04, 0.15, m.books[0], -0.08, 0.58, 0, 0.005);
      return g;
    },
    wardrobe(p, len, x, z, rot, h = 2.35) {
      const g = grp(p, x, z, rot), m = mats(), d = 0.6;
      B(g, len, h, 0.03, m.walnut, 0, 0, -d / 2 + 0.015, 0);
      B(g, 0.04, h, d, m.black, -len / 2 + 0.02, 0, 0); B(g, 0.04, h, d, m.black, len / 2 - 0.02, 0, 0);
      B(g, len, 0.04, d, m.black, 0, h - 0.04, 0);
      const bays = Math.max(2, Math.round(len / 0.8));
      for (let i = 1; i < bays; i++) B(g, 0.03, h, d - 0.04, m.black, -len / 2 + i * len / bays, 0, 0);
      [0.5, 1.15, 1.75].forEach(y => {
        B(g, len - 0.06, 0.025, d - 0.06, m.walnut, 0, y, 0);
        B(g, len - 0.06, 0.01, 0.02, m.led, 0, y - 0.012, d / 2 - 0.08, 0, false);
        for (let i = 0; i < bays; i++) if (rnd() > 0.3) B(g, 0.36, 0.12, 0.3, m.fabricDark, -len / 2 + (i + 0.5) * len / bays, y + 0.03, 0, 0.05);
      });
      B(g, len - 0.04, h - 0.04, 0.015, m.glassDark, 0, 0.02, d / 2 - 0.01, 0, false);
      return g;
    },
    singleBed(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.98, 0.3, 2.05, m.oak, 0, 0.05, 0, 0.03);
      B(g, 0.9, 0.18, 1.98, m.white, 0, 0.32, 0, 0.06);
      B(g, 0.96, 0.06, 1.3, m.fabricLight, 0, 0.48, 0.32, 0.03);
      const pl = B(g, 0.6, 0.13, 0.38, m.white, 0, 0.5, -0.75, 0.06); pl.rotation.x = -0.3;
      B(g, 1.0, 0.7, 0.06, m.oak, 0, 0.05, -1.03, 0.02);
      return g;
    },
    desk(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 1.2, 0.035, 0.6, m.white, 0, 0.72, 0, 0.01);
      [-1, 1].forEach(s => B(g, 0.03, 0.72, 0.55, m.black, s * 0.57, 0, 0));
      B(g, 0.32, 0.22, 0.02, m.black, -0.25, 0.755, -0.2, 0.005);
      C(g, 0.06, 0.08, 0.02, m.black, 0.35, 0.755, -0.12, 16);
      C(g, 0.006, 0.006, 0.35, m.black, 0.35, 0.77, -0.12, 6);
      F.officeChair(g, 0, 0.55, Math.PI);
      for (let i = 0; i < 4; i++) B(g, 0.04, 0.24, 0.17, m.books[i], 0.15 + i * 0.05, 0.755, -0.2);
      return g;
    },
    officeChair(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      C(g, 0.25, 0.25, 0.03, m.black, 0, 0.03, 0, 5);
      C(g, 0.025, 0.025, 0.4, m.metal, 0, 0.05, 0, 8);
      B(g, 0.48, 0.08, 0.46, m.fabricDark, 0, 0.45, 0, 0.04);
      B(g, 0.46, 0.5, 0.06, m.fabricDark, 0, 0.55, -0.22, 0.03);
      return g;
    },
    shelf(p, len, x, z, rot, h = 1.8) {
      const g = grp(p, x, z, rot), m = mats();
      [0.02, h * 0.33, h * 0.66, h - 0.03].forEach((y, i) => {
        B(g, len, 0.025, 0.32, m.oak, 0, y, 0);
        if (i < 3) { let u = -len / 2 + 0.06; while (u < len / 2 - 0.1) { const bw = 0.03 + rnd() * 0.03; if (rnd() > 0.25) B(g, bw, 0.18 + rnd() * 0.1, 0.2, m.books[Math.floor(rnd() * 5)], u, y + 0.025, 0); u += bw + 0.005; if (rnd() > 0.85) u += 0.15; } }
      });
      [-1, 1].forEach(s => B(g, 0.025, h, 0.32, m.oak, s * (len / 2 - 0.012), 0, 0));
      return g;
    },
    kitchenRun(p, len, x, z, rot, opts = {}) {
      const g = grp(p, x, z, rot), m = mats();
      const tall = opts.tall !== false && len > 2.4, tw = tall ? 0.62 : 0, bl = len - tw;
      const bx = -len / 2 + bl / 2;
      B(g, bl, 0.84, 0.6, m.greyCab, bx, 0.02, 0, 0.01);
      B(g, bl + 0.02, 0.04, 0.63, m.marble, bx, 0.86, 0.01, 0.006);
      B(g, bl, 0.62, 0.02, m.marble, bx, 0.9, -0.29, 0, false);
      const n = Math.max(2, Math.round(bl / 0.6));
      for (let i = 1; i < n; i++) B(g, 0.004, 0.8, 0.005, m.black, -len / 2 + i * bl / n, 0.04, 0.302, 0, false);
      B(g, 0.55, 0.012, 0.42, m.metal, bx + bl * 0.18, 0.9, 0.03);
      C(g, 0.012, 0.012, 0.3, m.metal, bx + bl * 0.18, 0.9, -0.2, 8);
      B(g, 0.6, 0.01, 0.5, m.screen, bx - bl * 0.22, 0.9, 0.02);
      if (opts.uppers !== false) {
        B(g, bl * 0.75, 0.72, 0.35, m.greyCab, bx - bl * 0.12, 1.52, -0.13, 0.01);
        B(g, bl * 0.75 - 0.04, 0.68, 0.01, m.glassDark, bx - bl * 0.12, 1.54, 0.05, 0, false);
      }
      if (tall) { B(g, tw, 2.2, 0.62, m.greyCab, len / 2 - tw / 2, 0.02, 0, 0.01); B(g, 0.02, 0.5, 0.03, m.metal, len / 2 - tw + 0.06, 0.9, 0.32); }
      return g;
    },
    island(p, len, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, len, 0.86, 0.85, m.white, 0, 0.02, 0, 0.01);
      B(g, len + 0.1, 0.04, 0.95, m.marble, 0, 0.88, 0.05, 0.006);
      const n = Math.max(1, Math.floor(len / 0.6));
      for (let i = 0; i < n; i++) {
        const u = -len / 2 + (i + 0.5) * len / n;
        C(g, 0.18, 0.18, 0.06, m.fabricLight, u, 0.66, 0.72, 20);
        C(g, 0.02, 0.02, 0.66, m.black, u, 0, 0.72, 8);
        C(g, 0.15, 0.15, 0.015, m.black, u, 0.02, 0.72, 16);
      }
      return g;
    },
    toilet(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.38, 0.38, 0.16, m.gloss, 0, 0.42, -0.22, 0.05);
      B(g, 0.36, 0.38, 0.5, m.gloss, 0, 0.04, 0.02, 0.15);
      B(g, 0.34, 0.03, 0.44, m.gloss, 0, 0.42, 0.04, 0.12);
      return g;
    },
    vanity(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.8, 0.42, 0.45, m.walnut, 0, 0.45, 0, 0.015);
      B(g, 0.6, 0.12, 0.4, m.gloss, 0, 0.87, 0.01, 0.06);
      C(g, 0.012, 0.012, 0.22, m.metal, 0, 0.99, -0.17, 8);
      B(g, 0.7, 0.85, 0.02, m.mirror, 0, 1.1, -0.215, 0.01, false);
      B(g, 0.7, 0.012, 0.03, m.led, 0, 1.96, -0.2, 0, false);
      return g;
    },
    shower(p, w, d, x, z) {
      const m = mats();
      B(p, w, 0.04, d, m.gloss, x, 0.03, z, 0.01);
      B(p, 0.012, 2.0, d * 0.65, m.glass, x - w / 2, 0.07, z - d * 0.17, 0, false);
      C(p, 0.12, 0.12, 0.01, m.metal, x, 2.1, z, 20);
    },
    tub(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 1.65, 0.55, 0.75, m.gloss, 0, 0.03, 0, 0.12);
      B(g, 1.45, 0.05, 0.55, mats().glass, 0, 0.55, 0, 0.1, false);
      return g;
    },
    washer(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 0.6, 0.85, 0.58, m.gloss, 0, 0.03, 0, 0.03);
      const d = C(g, 0.17, 0.17, 0.02, m.glassDark, 0, 0.3, 0.3, 28); d.rotation.x = Math.PI / 2; d.position.y = 0.42;
      B(g, 0.6, 0.85, 0.58, m.gloss, 0, 0.9, 0, 0.03);
      return g;
    },
    bistro(p, x, z) {
      const m = mats();
      C(p, 0.36, 0.36, 0.025, m.white, x, 0.72, z, 32);
      C(p, 0.03, 0.03, 0.7, m.black, x, 0.02, z, 8);
      [-1, 1].forEach(s => {
        const g = grp(p, x + s * 0.62, z, s > 0 ? -Math.PI / 2 : Math.PI / 2);
        B(g, 0.42, 0.04, 0.42, m.white, 0, 0.44, 0, 0.02);
        B(g, 0.42, 0.4, 0.03, m.white, 0, 0.48, -0.2, 0.015);
        [-1, 1].forEach(a => [-1, 1].forEach(b => C(g, 0.012, 0.012, 0.44, m.white, a * 0.17, 0, b * 0.17, 6)));
      });
    },
    planter(p, len, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, len, 0.42, 0.36, m.fabricDark, 0, 0.02, 0, 0.02);
      const n = Math.max(1, Math.round(len / 0.45));
      for (let i = 0; i < n; i++) S(g, 0.2 + rnd() * 0.08, rnd() > 0.5 ? m.green : m.green2, -len / 2 + (i + 0.5) * len / n, 0.62 + rnd() * 0.1, 0, 1.1, 0.9, 0.9);
      return g;
    },
    console(p, x, z, rot) {
      const g = grp(p, x, z, rot), m = mats();
      B(g, 1.0, 0.8, 0.32, m.walnut, 0, 0.02, 0, 0.015);
      const mr = C(g, 0.38, 0.38, 0.02, m.mirror, 0, 1.25, -0.14, 40); mr.rotation.x = Math.PI / 2; mr.position.y = 1.45;
      return g;
    },
  };

  /* ---------------- распоредување по просторија ----------------
     Локален систем: u по долгата оска (-L/2..L/2), v по кратката (-S/2..S/2).
     put(fn, u, v, rot) → мебел гледа кон +v кога rot = 0.               */
  function furnishRoom(group, room, rooms, winSides = new Set()) {
    const [x, y, w, h] = room.r;
    const rot = h > w;
    const T = room.t === 'terrace' ? 0.05 : 0.13; // дебелина на ѕид (внатре во собата)
    const L = (rot ? h : w) - 2 * T, S = (rot ? w : h) - 2 * T;
    const frame = new THREE.Group();
    frame.position.set(x + w / 2, 0.03, y + h / 2);
    if (rot) frame.rotation.y = Math.PI / 2;
    group.add(frame);
    seed = 11 + room.k.charCodeAt(0) * 7 + Math.round(w * 13 + h * 17);

    // локални страни → светски (за прозорци): -v, +v, -u, +u
    const side = rot ? { nv: 'left', pv: 'right', nu: 'bottom', pu: 'top' } : { nv: 'top', pv: 'bottom', nu: 'left', pu: 'right' };
    // ТВ / узглавје одат на ѕидот -v; ако таму има прозорец, а спроти нема → огледало
    let flipV = 1;
    if (['living', 'bed'].includes(room.t) && winSides.has(side.nv) && !winSides.has(side.pv)) flipV = -1;
    // трпезаријата оди кон кујната (+u)
    let flipU = 1;
    const toLocal = (wx, wz) => (rot ? { u: -wz, v: wx } : { u: wx, v: wz });
    if (room.t === 'living') {
      const k = rooms.find(r => r.t === 'kitchen');
      if (k) {
        const d = toLocal(k.r[0] + k.r[2] / 2 - (x + w / 2), k.r[1] + k.r[3] / 2 - (y + h / 2));
        if (d.u < 0) flipU = -1;
      }
    }
    frame.scale.set(flipU, 1, flipV);
    const U = u => u;

    switch (room.t) {
      case 'living': {
        const loungeEnd = L >= 6 ? 0.1 * L : L / 2 - 0.2;
        const lx = (-L / 2 + loungeEnd) / 2;
        const sofaLen = Math.min(2.9, Math.max(1.8, (loungeEnd + L / 2) - 1.0));
        if (S >= 3.2) {
          F.sofa(frame, sofaLen, U(lx), S / 2 - 0.55, Math.PI);
          rug(frame, Math.min(2.8, sofaLen + 0.4), Math.min(2.0, S - 1.8), U(lx), S / 2 - 1.75);
          F.coffeeTable(frame, U(lx), S / 2 - 1.7);
          F.tvWall(frame, Math.min(3.2, (loungeEnd + L / 2) - 0.4), U(lx), -S / 2 + 0.22, 0);
          if (S >= 4) F.armchair(frame, U(lx + sofaLen / 2 + 0.2), S / 2 - 2.0, -Math.PI / 2 - 0.5);
          F.cloudLamp(frame, U(lx), S / 2 - 1.7);
          F.plant(frame, U(-L / 2 + 0.35), S / 2 - 0.35, 1.2, true);
        } else {
          F.sofa(frame, Math.min(2.4, L * 0.45), U(lx), S / 2 - 0.55, Math.PI);
          F.coffeeTable(frame, U(lx), S / 2 - 1.6);
        }
        if (L >= 5) {
          const dx = (loungeEnd + L / 2) / 2;
          F.dining(frame, 1.6, U(dx), 0, Math.PI / 2);
          F.lineLamp(frame, 1.1, U(dx), 0, Math.PI / 2);
          F.plant(frame, U(L / 2 - 0.35), -S / 2 + 0.4, 0.9);
        }
        break;
      }
      case 'kitchen': {
        F.kitchenRun(frame, L - 0.15, 0, -S / 2 + 0.32, 0, { tall: L > 3 });
        if (S >= 2.6 && L >= 3) F.island(frame, Math.min(2.2, L - 1.6), 0, S / 2 - 0.75, 0);
        break;
      }
      case 'bed': {
        const bw = Math.min(1.6, L - 1.4), bl = 2.0;
        if (S >= 3.3) { // креветот по кратката оска, глава на ѕид v = -S/2
          const bu = L >= 4.6 ? 0.45 : 0;
          F.bed(frame, bw, bl, bu, -S / 2 + 0.17 + bl / 2, 0);
          B(frame, bw + 1.6, 2.4, 0.03, mats().slat, bu, 0.02, -S / 2 + 0.03, 0, false);
          B(frame, bw + 1.6, 0.012, 0.03, mats().led, bu, 2.42, -S / 2 + 0.05, 0, false);
          F.nightstand(frame, bu - bw / 2 - 0.38, -S / 2 + 0.25, 0);
          F.nightstand(frame, bu + bw / 2 + 0.38, -S / 2 + 0.25, 0);
          F.ringLamp(frame, bu, -S / 2 + 1.2);
          rug(frame, bw + 1.0, 1.4, bu, -S / 2 + 1.6);
          if (L >= 4.6) F.wardrobe(frame, Math.min(2.4, S - 0.4), -L / 2 + 0.31, 0, Math.PI / 2);
          else if (S >= 4) F.wardrobe(frame, Math.min(2.4, L - 0.4), 0, S / 2 - 0.31, Math.PI);
          if (L >= 4.6 && S >= 3.5) F.armchair(frame, L / 2 - 0.55, S / 2 - 0.55, -Math.PI * 0.75);
        } else { // тесна соба: глава на ѕид u = -L/2
          F.bed(frame, Math.min(1.6, S - 1.0), bl, -L / 2 + 0.17 + bl / 2, 0, Math.PI / 2);
          F.nightstand(frame, -L / 2 + 0.25, -S / 2 + 0.25, Math.PI / 2);
          F.ringLamp(frame, -L / 2 + 1.2, 0);
          if (L >= 3.4) F.wardrobe(frame, Math.min(2.2, S - 0.2), L / 2 - 0.31, 0, -Math.PI / 2);
        }
        break;
      }
      case 'kid': {
        F.singleBed(frame, -L / 2 + 1.1, -S / 2 + 0.52, Math.PI / 2);
        if (S >= 2.4) F.desk(frame, L / 2 - 0.75, S / 2 - 0.32, Math.PI);
        else F.desk(frame, L / 2 - 0.32, 0, -Math.PI / 2);
        if (L >= 3.4) F.shelf(frame, 0.9, L / 2 - 0.2, -S / 2 + 0.7, -Math.PI / 2);
        rug(frame, 1.2, 1.0, 0.3, 0.2);
        F.plant(frame, -L / 2 + 0.3, S / 2 - 0.3, 0.6);
        break;
      }
      case 'bath': {
        if (L >= 2.6) F.tub(frame, -L / 2 + 0.85, -S / 2 + 0.4, 0);
        else F.shower(frame, Math.min(0.9, L * 0.45), S - 0.1, L / 2 - Math.min(0.9, L * 0.45) / 2 - 0.04, 0);
        if (L >= 2.6) F.vanity(frame, L / 2 - 0.5, S / 2 - 0.24, Math.PI);
        else F.vanity(frame, -L / 2 + 0.45, -S / 2 + 0.24, 0);
        F.toilet(frame, L >= 2.6 ? 0.2 : -L / 2 + 0.3, S / 2 - 0.3, Math.PI);
        break;
      }
      case 'wc': F.toilet(frame, L / 2 - 0.3, 0, -Math.PI / 2); break;
      case 'utility': F.washer(frame, 0, -S / 2 + 0.32, 0); break;
      case 'storage': F.shelf(frame, L - 0.2, 0, -S / 2 + 0.18, 0, 2.0); break;
      case 'hall': {
        if (S >= 1.8 && L >= 2.4) { F.console(frame, L / 2 - 0.8, -S / 2 + 0.17, 0); F.plant(frame, -L / 2 + 0.3, -S / 2 + 0.3, 0.7); }
        else rug(frame, Math.max(0.6, L - 0.6), Math.max(0.4, S - 0.5), 0, 0);
        break;
      }
      case 'terrace': {
        if (S >= 1.5 && L >= 1.8) F.bistro(frame, 0, 0);
        F.planter(frame, Math.max(0.5, L - 0.4), 0, S / 2 - 0.2, Math.PI);
        if (L >= 5) F.plant(frame, -L / 2 + 0.35, -S / 2 + 0.35, 1.1, true);
        break;
      }
      case 'office': {
        const rows = Math.max(1, Math.floor((S - 1) / 2.6)), cols = Math.max(1, Math.floor((L - 1) / 2.1));
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) F.desk(frame, -L / 2 + 1.2 + i * 2.1, -S / 2 + 0.6 + j * 2.6, 0);
        F.plant(frame, L / 2 - 0.4, S / 2 - 0.4, 1.0, true);
        F.shelf(frame, Math.min(2.4, L * 0.35), L / 2 - Math.min(2.4, L * 0.35) / 2 - 0.2, S / 2 - 0.18, Math.PI);
        break;
      }
      case 'meeting': {
        const g = grp(frame, 0, 0, 0), m = mats();
        B(g, Math.min(2.4, L - 1.2), 0.04, 1.0, m.oak, 0, 0.72, 0, 0.012);
        B(g, 0.6, 0.7, 0.5, m.black, 0, 0.02, 0, 0.02);
        const n = Math.min(3, Math.floor((L - 1.2) / 0.7));
        for (let i = 0; i < n; i++) { const u = (i - (n - 1) / 2) * 0.7; F.officeChair(g, u, 0.75, Math.PI); F.officeChair(g, u, -0.75, 0); }
        B(frame, 1.6, 0.9, 0.04, m.screen, 0, 1.0, -S / 2 + 0.05);
        break;
      }
      case 'shop': {
        const m = mats();
        F.kitchenRun(frame, 2.2, L / 2 - 1.4, -S / 2 + 0.32, 0, { uppers: false, tall: false });
        for (let i = 0; i < Math.floor((L - 3) / 2.2); i++) F.shelf(frame, 2.0, -L / 2 + 1.2 + i * 2.2, S / 2 - 0.2, Math.PI, 2.0);
        F.bistro(frame, -L / 4, -S / 6);
        F.bistro(frame, L / 6, S / 8);
        F.plant(frame, -L / 2 + 0.4, -S / 2 + 0.4, 1.2, true);
        F.plant(frame, L / 2 - 0.4, S / 2 - 0.4, 1.0, true);
        break;
      }
    }
  }

  /* завеси на прозорец (сегмент од ѕид) */
  function curtains(group, e, s, en, H) {
    const m = mats(), top = Math.min(H, 2.6) - 0.05, len = en - s;
    const off = e.inward * 0.2;
    const panel = (a, b, mat, th) => {
      const L = b - a;
      const geo = e.axis === 'h' ? new THREE.BoxGeometry(L, top, th) : new THREE.BoxGeometry(th, top, L);
      const mesh = new THREE.Mesh(geo, mat);
      if (e.axis === 'h') mesh.position.set((a + b) / 2, top / 2 + 0.03, e.c + off);
      else mesh.position.set(e.c + off, top / 2 + 0.03, (a + b) / 2);
      mesh.castShadow = mat !== m.sheer;
      group.add(mesh);
    };
    panel(s - 0.25, s + 0.3, m.curtain, 0.07);
    panel(en - 0.3, en + 0.25, m.curtain, 0.07);
    panel(s + 0.3, en - 0.3, m.sheer, 0.01);
    // рамки на прозорец (црн алуминиум)
    const fr = (u, w) => {
      const geo = e.axis === 'h' ? new THREE.BoxGeometry(w, Math.min(H, 2.3) - 0.9, 0.06) : new THREE.BoxGeometry(0.06, Math.min(H, 2.3) - 0.9, w);
      const mesh = new THREE.Mesh(geo, m.black);
      const yy = 0.9 + (Math.min(H, 2.3) - 0.9) / 2;
      if (e.axis === 'h') mesh.position.set(u, yy, e.c + e.inward * 0.06); else mesh.position.set(e.c + e.inward * 0.06, yy, u);
      group.add(mesh);
    };
    [s + 0.025, (s + en) / 2, en - 0.025].forEach(u => fr(u, 0.05));
    void len;
  }

  window.Furnish = { furnishRoom, floorMaterial, curtains, mats };
})();
