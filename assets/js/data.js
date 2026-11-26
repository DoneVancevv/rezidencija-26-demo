/* =========================================================
   ПОДАТОЦИ ЗА ПРОЕКТОТ
   Ова е единствениот фајл што се менува за нов проект:
   слики, погледи, катови, станови, цени, статуси, распореди.
   ========================================================= */

const PROJECT = {
  name: 'Резиденција 26',
  short: '26',
  tagline: 'Пет нивоа современо живеење. Заоблени тераси, топло дрво и светлина во секоја просторија.',
  address: 'Дебар Маало, Центар, Скопје',
  phone1: '072 250 259',
  phone1Raw: '+38972250259',
  phone2: '02 3214 756',
  phone2Raw: '+38923214756',
  completion: 'IV квартал 2027',
};

/* ---------- Погледи на зградата (херо) ----------
   size = големина на сликата, box = рамка на зградата [x0, y0, x1, y1]
   (се користи зградата секогаш убаво да се врами на кој било екран)   */
const VIEWS = [
  { id: 'front', sky: '#738993', ground: '#101b0e', label: 'Фасада', src: 'assets/img/front-dusk.jpg', srcM: 'assets/img/front-dusk-m.jpg', size: [1500, 2000], box: [130, 405, 1340, 1445] },
  { id: 'angle', sky: '#6b8aa4', ground: '#363941', label: 'Перспектива', src: 'assets/img/angle-dusk.jpg', srcM: 'assets/img/angle-dusk-m.jpg', size: [1500, 2000], box: [40, 365, 1455, 1700] },
  { id: 'side', sky: '#697f85', ground: '#142112', label: 'Бочна фасада', src: 'assets/img/side-dusk.jpg', srcM: 'assets/img/side-dusk-m.jpg', size: [1500, 2000], box: [250, 385, 1325, 1600] },
];

/* ---------- Катови ----------
   polys = контура на катот врз секој поглед (пиксели од оригиналната слика) */
const P = pts => pts.map(p => p.join(',')).join(' ');
// перспектива: катовите се прави линии од лево (x=40) кон десно (x=1452)
const ang = (yl0, yr0, yl1, yr1, xl = 40) => P([[xl, yl0], [1452, yr0], [1452, yr1], [xl, yl1]]);

const FLOORS = [
  {
    id: 0, short: 'П', name: 'Приземје', elev: '±0.00 m', use: 'Стан со двор · влез · гаража',
    polys: {
      front: P([[230, 1200], [1300, 1200], [1300, 1440], [230, 1440]]),
      angle: ang(1385, 1395, 1700, 1690, 175),
      side: P([[300, 1335], [1320, 1335], [1320, 1598], [300, 1598]]),
    },
  },
  {
    id: 1, short: '1', name: 'Кат 1', elev: '+3.40 m', use: 'Станови',
    polys: {
      front: P([[135, 1005], [1338, 1005], [1338, 1200], [150, 1200], [135, 1185]]),
      angle: ang(1120, 1180, 1385, 1395),
      side: P([[255, 1140], [1322, 1140], [1322, 1335], [255, 1335]]),
    },
  },
  {
    id: 2, short: '2', name: 'Кат 2', elev: '+6.50 m', use: 'Станови',
    polys: {
      front: P([[135, 805], [1338, 805], [1338, 1005], [135, 1005]]),
      angle: ang(860, 985, 1120, 1180),
      side: P([[250, 905], [1322, 905], [1322, 1140], [255, 1140]]),
    },
  },
  {
    id: 3, short: '3', name: 'Кат 3', elev: '+9.60 m', use: 'Станови',
    polys: {
      front: P([[135, 605], [1338, 605], [1338, 805], [135, 805]]),
      angle: ang(600, 780, 860, 985),
      side: P([[255, 690], [1325, 690], [1322, 905], [250, 905]]),
    },
  },
  {
    id: 4, short: '4', name: 'Кат 4', elev: '+12.70 m', use: 'Пентхаус станови',
    polys: {
      front: P([[150, 500], [175, 445], [240, 412], [1295, 412], [1295, 605], [135, 605], [135, 560]]),
      angle: P([[45, 600], [55, 440], [110, 375], [200, 365], [1410, 568], [1452, 575], [1452, 780]]),
      side: P([[290, 390], [1180, 390], [1245, 430], [1270, 500], [1270, 690], [255, 690]]),
    },
  },
];

/* ---------- Широки (продолжени) рендери за десктоп ----------
   Истиот рендер, проширен и исечен на идентичен формат 2000 x 1125,
   со зградата на иста големина и место. Контурите на катовите се
   пресметуваат од вертикалните: x' = a·x + b,  y' = a·y + c          */
const WIDE = {
  front: { src: 'assets/img/front-dusk-w.webp', srcS: 'assets/img/front-dusk-w-sm.webp', a: 0.6210, b: 541.0, c: -13.8 },
  angle: { src: 'assets/img/angle-dusk-w.webp', srcS: 'assets/img/angle-dusk-w-sm.webp', a: 0.4901, b: 627.0, c: 63.15, warp: { x0: 646.6, x1: 1340, y0: 242, y1: 896.2, dTop: -31.9 } },
  side: { src: 'assets/img/side-dusk-w.webp', srcS: 'assets/img/side-dusk-w-sm.webp', a: 0.5220, b: 590.8, c: 38.5 },
};
VIEWS.forEach(v => {
  const w = WIDE[v.id];
  const tx = x => w.a * x + w.b, ty = y => w.a * y + w.c;
  // мала перспективна корекција (поголема горе десно, нула долу)
  const warp = (X, Y) => { const q = w.warp; if (!q) return Y; return Y + q.dTop * ((X - q.x0) / (q.x1 - q.x0)) * Math.max(0, (q.y1 - Y) / (q.y1 - q.y0)); };
  const tp = poly => poly.split(' ').map(pt => { const [x, y] = pt.split(',').map(Number); const X = tx(x); return X.toFixed(1) + ',' + warp(X, ty(y)).toFixed(1); }).join(' ');
  v.wide = { id: v.id + 'W', label: v.label, src: w.src, srcS: w.srcS, size: [2000, 1125], box: [tx(v.box[0]), ty(v.box[1]), tx(v.box[2]), ty(v.box[3])], sky: v.sky, ground: v.ground };
  FLOORS.forEach(f => { f.polys[v.id + 'W'] = tp(f.polys[v.id]); });
});

/* ---------- Распореди (во метри; x десно, y надолу) ----------
   t = тип на просторија: living, kitchen, bed, kid, bath, wc, hall,
       storage, utility, terrace, office, shop                       */
const LAYOUTS = {
  A: {
    name: 'Тип А', planImage: null,
    rooms: [
      { k: 'а', n: 'Претпростор', a: 11.0, t: 'hall', r: [7.3, 3.0, 5.2, 2.1] },
      { k: 'б', n: 'Кујна', a: 11.0, t: 'kitchen', r: [1.8, 1.0, 5.5, 2.0] },
      { k: 'в', n: 'Остава', a: 4.5, t: 'storage', r: [7.3, 0.0, 1.5, 3.0] },
      { k: 'г', n: 'Дневна соба и трпезарија', a: 45.0, t: 'living', r: [1.8, 3.0, 5.5, 8.2] },
      { k: 'д', n: 'Дегажман', a: 5.0, t: 'hall', r: [8.7, 5.1, 1.2, 7.3] },
      { k: 'ѓ', n: 'Детска соба', a: 9.5, t: 'kid', r: [9.9, 5.1, 2.6, 3.65] },
      { k: 'е', n: 'Детска соба', a: 9.5, t: 'kid', r: [9.9, 8.75, 2.6, 3.65] },
      { k: 'ж', n: 'Спална соба', a: 18.0, t: 'bed', r: [7.3, 12.4, 5.2, 3.5] },
      { k: 'з', n: 'Бања', a: 4.5, t: 'bath', r: [7.3, 6.5, 1.4, 3.2] },
      { k: 's', n: 'Бања', a: 3.5, t: 'bath', r: [7.3, 9.7, 1.4, 2.7] },
      { k: 'и', n: 'Утилити', a: 2.0, t: 'utility', r: [7.3, 5.1, 1.4, 1.4] },
      { k: 'ј', n: 'Тоалет', a: 2.0, t: 'wc', r: [8.8, 1.6, 1.4, 1.4] },
      { k: 'к', n: 'Тераса', a: 7.5, t: 'terrace', r: [0.0, 1.0, 1.8, 4.2] },
      { k: 'л', n: 'Тераса', a: 4.0, t: 'terrace', r: [3.0, 11.2, 4.3, 1.0] },
    ],
  },
  B: {
    name: 'Тип Б', planImage: null,
    rooms: [
      { k: 'а', n: 'Претпростор', a: 4.5, t: 'hall', r: [6.4, 2.82, 1.9, 2.4] },
      { k: 'б', n: 'Кујна', a: 11.0, t: 'kitchen', r: [4.2, 0.0, 3.9, 2.82] },
      { k: 'в', n: 'Дневна соба и трпезарија', a: 37.0, t: 'living', r: [0.0, 2.82, 6.4, 5.78] },
      { k: 'г', n: 'Дегажман', a: 5.0, t: 'hall', r: [8.3, 4.0, 5.8, 1.0] },
      { k: 'д', n: 'Детска соба', a: 10.0, t: 'kid', r: [8.1, 0.0, 2.5, 4.0] },
      { k: 'ѓ', n: 'Детска соба', a: 10.0, t: 'kid', r: [10.6, 0.0, 2.5, 4.0] },
      { k: 'е', n: 'Спална соба', a: 15.0, t: 'bed', r: [13.1, 0.0, 3.9, 4.0] },
      { k: 'ж', n: 'Бања', a: 4.0, t: 'bath', r: [11.3, 5.0, 2.0, 2.0] },
      { k: 'з', n: 'Утилити', a: 2.0, t: 'utility', r: [10.3, 5.0, 1.0, 2.0] },
      { k: 's', n: 'Бања', a: 4.0, t: 'bath', r: [8.3, 5.0, 2.0, 2.0] },
      { k: 'и', n: 'Тоалет', a: 1.5, t: 'wc', r: [6.4, 5.22, 1.3, 1.2] },
      { k: 'ј', n: 'Тераса', a: 4.0, t: 'terrace', r: [2.2, 0.82, 2.0, 2.0] },
    ],
  },
  C: {
    name: 'Тип В', planImage: null,
    rooms: [
      { k: 'а', n: 'Претсобје', a: 6.5, t: 'hall', r: [3.7, 5.2, 2.6, 2.5] },
      { k: 'б', n: 'Дневна соба и трпезарија', a: 25.0, t: 'living', r: [0.0, 7.7, 5.0, 5.0] },
      { k: 'в', n: 'Кујна', a: 5.0, t: 'kitchen', r: [0.0, 5.7, 2.5, 2.0] },
      { k: 'г', n: 'Тоалет', a: 1.5, t: 'wc', r: [2.5, 5.7, 1.2, 1.25] },
      { k: 'д', n: 'Дегажман', a: 4.0, t: 'hall', r: [3.7, 0.8, 1.25, 4.4] },
      { k: 'ѓ', n: 'Бања', a: 7.0, t: 'bath', r: [0.0, 3.8, 3.7, 1.9] },
      { k: 'е', n: 'Спална соба', a: 14.0, t: 'bed', r: [0.0, 0.0, 3.7, 3.8] },
      { k: 'ж', n: 'Детска соба', a: 14.0, t: 'kid', r: [4.95, 0.0, 3.75, 3.73] },
      { k: 'з', n: 'Тераса', a: 4.0, t: 'terrace', r: [1.0, 12.7, 2.9, 1.38] },
    ],
  },
  OFFICE: {
    name: 'Канцеларија', planImage: null,
    rooms: [
      { k: 'а', n: 'Отворен работен простор', a: 58.0, t: 'office', r: [0.0, 0.0, 8.0, 7.25] },
      { k: 'б', n: 'Сала за состаноци', a: 14.0, t: 'meeting', r: [0.0, 7.25, 4.0, 3.5] },
      { k: 'в', n: 'Чајна кујна', a: 6.0, t: 'kitchen', r: [4.0, 7.25, 2.4, 2.5] },
      { k: 'г', n: 'Тоалет', a: 3.0, t: 'wc', r: [6.4, 7.25, 1.6, 1.9] },
      { k: 'д', n: 'Архива', a: 3.0, t: 'storage', r: [6.4, 9.15, 1.6, 1.6] },
    ],
  },
  SHOP_L: {
    name: 'Деловен простор', planImage: null,
    rooms: [
      { k: 'а', n: 'Продажен простор', a: 128.0, t: 'shop', r: [0.0, 0.0, 12.0, 10.7] },
      { k: 'б', n: 'Магацин', a: 14.0, t: 'storage', r: [0.0, 10.7, 4.5, 3.1] },
      { k: 'в', n: 'Тоалет', a: 4.0, t: 'wc', r: [4.5, 10.7, 2.0, 2.0] },
    ],
  },
  SHOP_R: {
    name: 'Деловен простор', planImage: null,
    rooms: [
      { k: 'а', n: 'Продажен простор', a: 96.0, t: 'shop', r: [0.0, 0.0, 12.0, 8.0] },
      { k: 'б', n: 'Магацин', a: 10.0, t: 'storage', r: [0.0, 8.0, 4.0, 2.5] },
      { k: 'в', n: 'Тоалет', a: 4.0, t: 'wc', r: [4.0, 8.0, 2.0, 2.0] },
    ],
  },
};
// Пентхаус = основен распоред + кровна тераса
LAYOUTS.PA = { name: 'Пентхаус А', planImage: null, rooms: LAYOUTS.A.rooms.concat([
  { k: 'м', n: 'Кровна тераса', a: 45.0, t: 'terrace', r: [0.0, 12.2, 7.3, 6.2] }]) };
LAYOUTS.PB = { name: 'Пентхаус Б', planImage: null, rooms: LAYOUTS.B.rooms.concat([
  { k: 'к', n: 'Кровна тераса', a: 45.0, t: 'terrace', r: [0.0, 8.6, 9.0, 5.0] }]) };

/* ---------- Единици ----------
   zone = позиција на основата на катот:
     A = лево (заоблен агол), B = средина, C = десно, AB = лево + средина (пентхаус)
   status: free | reserved | sold                                     */
const UNITS = [
  { id: 'S1', label: 'Стан 1', kind: 'flat', floor: 0, zone: 'A', layout: 'C', area: 81, beds: 2, orient: 'Југ / Запад', status: 'reserved', price: 172000, note: 'со приватен двор 40 m²' },

  { id: 'S2', label: 'Стан 2', kind: 'flat', floor: 1, zone: 'A', layout: 'B', area: 108, beds: 3, orient: 'Југ / Запад', status: 'sold', price: 232000 },
  { id: 'S3', label: 'Стан 3', kind: 'flat', floor: 1, zone: 'B', layout: 'C', area: 81, beds: 2, orient: 'Југ', status: 'free', price: 171000 },
  { id: 'S4', label: 'Стан 4', kind: 'flat', floor: 1, zone: 'C', layout: 'A', area: 137, beds: 3, orient: 'Југ / Исток', status: 'sold', price: 292000 },

  { id: 'S5', label: 'Стан 5', kind: 'flat', floor: 2, zone: 'A', layout: 'B', area: 108, beds: 3, orient: 'Југ / Запад', status: 'free', price: 238500 },
  { id: 'S6', label: 'Стан 6', kind: 'flat', floor: 2, zone: 'B', layout: 'C', area: 81, beds: 2, orient: 'Југ', status: 'sold', price: 175500 },
  { id: 'S7', label: 'Стан 7', kind: 'flat', floor: 2, zone: 'C', layout: 'A', area: 137, beds: 3, orient: 'Југ / Исток', status: 'reserved', price: 299500 },

  { id: 'S8', label: 'Стан 8', kind: 'flat', floor: 3, zone: 'A', layout: 'B', area: 108, beds: 3, orient: 'Југ / Запад', status: 'free', price: 244000 },
  { id: 'S9', label: 'Стан 9', kind: 'flat', floor: 3, zone: 'B', layout: 'C', area: 81, beds: 2, orient: 'Југ', status: 'free', price: 179500 },
  { id: 'S10', label: 'Стан 10', kind: 'flat', floor: 3, zone: 'C', layout: 'A', area: 137, beds: 3, orient: 'Југ / Исток', status: 'sold', price: 306000 },

  { id: 'S11', label: 'Пентхаус 11', kind: 'flat', floor: 4, zone: 'AB', layout: 'PA', area: 182, beds: 3, orient: 'Југ / Запад', status: 'free', price: 459000, note: 'вкл. 45 m² кровна тераса' },
  { id: 'S12', label: 'Пентхаус 12', kind: 'flat', floor: 4, zone: 'C', layout: 'PB', area: 153, beds: 3, orient: 'Југ / Исток', status: 'reserved', price: 382000, note: 'вкл. 45 m² кровна тераса' },
];

// заеднички простори на основата (не се продаваат)
const COMMON = {
  0: [{ zone: 'B', label: 'ВЛЕЗ · ЛОБИ' }, { zone: 'C', label: 'ГАРАЖА' }],
};

const GALLERY = [
  { src: 'assets/img/wide/front-dusk.webp', cap: 'Главна фасада во вечерните часови' },
  { src: 'assets/img/wide/front-day.webp', cap: 'Главна фасада преку ден' },
  { src: 'assets/img/wide/angle-dusk.webp', cap: 'Заоблените тераси на аголот' },
  { src: 'assets/img/wide/corner-left.webp', cap: 'Поглед кон аголот' },
  { src: 'assets/img/wide/side-dusk.webp', cap: 'Бочна фасада' },
  { src: 'assets/img/wide/corner-right-palms.webp', cap: 'Пергола и кровни тераси' },
  { src: 'assets/img/wide/corner-right.webp', cap: 'Објектот во населбата' },
  { src: 'assets/img/wide/entrance-detail.webp', cap: 'Влез и уредено зеленило' },
  { src: 'assets/img/living-1.jpg', cap: 'Ентериер · дневна соба' },
]

const STATUS = {
  free: { label: 'Слободен', color: '#3d8b5f' },
  reserved: { label: 'Резервиран', color: '#c4952f' },
  sold: { label: 'Продаден', color: '#b0513c' },
};
