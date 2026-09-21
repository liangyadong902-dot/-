const pptxgen = require('/Users/lyd1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = '途个惊喜项目组';
pptx.subject = '创新创业项目介绍';
pptx.title = '途个惊喜｜随盒出发，途个好心情';
pptx.company = '途个惊喜';
pptx.lang = 'zh-CN';
pptx.theme = {
  headFontFace: 'STHeiti',
  bodyFontFace: 'STHeiti',
  lang: 'zh-CN'
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F6F1E6' },
  objects: [
    { line: { x: 0.55, y: 7.12, w: 12.22, h: 0, line: { color: 'E7DCCE', width: 0.8 } } },
    { text: { text: '途个惊喜  /  随盒出发，途个好心情', options: { x: 0.58, y: 7.22, w: 4.6, h: 0.18, fontFace: 'STHeiti', fontSize: 8, color: '8F8376', margin: 0, breakLine: false } } },
    { text: { text: 'INNOVATION & ENTREPRENEURSHIP', options: { x: 9.7, y: 7.22, w: 2.5, h: 0.18, fontFace: 'Aptos', fontSize: 7, color: '8F8376', align: 'right', charSpacing: 1.2, margin: 0 } } }
  ],
  slideNumber: { x: 12.35, y: 7.19, color: '8F8376', fontFace: 'Aptos', fontSize: 8 }
});

const C = {
  cream: 'F6F1E6', cream2: 'EFE6D6', sage: '8EA47C', deep: '6C7E58', mist: 'E4EDD8',
  soft: 'C9D6B8', ink: '3C342C', muted: '8F8376', paper: 'FFFDF8', line: 'E7DCCE',
  blush: 'E8B4A2', rust: 'C97A59', blue: '506A79', darkBlue: '385160', white: 'FFFFFF',
  yellow: 'D9B560'
};
const W = 13.333, H = 7.5;

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: opts.fontFace || 'STHeiti',
    fontSize: opts.fontSize || 16,
    color: opts.color || C.ink,
    bold: opts.bold || false,
    italic: opts.italic || false,
    margin: opts.margin === undefined ? 0 : opts.margin,
    breakLine: false,
    fit: 'shrink',
    valign: opts.valign || 'mid',
    align: opts.align || 'left',
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
    bullet: opts.bullet,
    charSpacing: opts.charSpacing,
    transparency: opts.transparency,
    isTextBox: true,
    ...opts.extra
  });
}
function rect(slide, x, y, w, h, fill, radius = 0.16, line = fill, transparency = 0) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: radius, fill: { color: fill, transparency }, line: { color: line, transparency: line === fill ? 100 : 0, width: 0.8 } });
}
function line(slide, x, y, w, h, color = C.line, width = 1.2, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, { x, y, w, h, line: { color, width, dashType: dash, beginArrowType: 'none', endArrowType: 'none' } });
}
function circle(slide, x, y, d, fill, lineColor = fill, lineWidth = 0) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: lineColor, width: lineWidth, transparency: lineWidth ? 0 : 100 } });
}
function pill(slide, label, x, y, w, fill, color = C.ink, stroke = fill) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.15, fill: { color: fill }, line: { color: stroke, width: stroke === fill ? 0 : 0.8 } });
  addText(slide, label, x, y + 0.005, w, 0.28, { fontSize: 10, color, bold: true, align: 'center' });
}
function title(slide, kicker, head, sub) {
  addText(slide, kicker.toUpperCase(), 0.65, 0.45, 3.8, 0.24, { fontSize: 10, color: C.deep, bold: true, charSpacing: 1.8 });
  addText(slide, head, 0.65, 0.75, 10.9, 0.56, { fontSize: 29, color: C.ink, bold: true });
  if (sub) addText(slide, sub, 0.67, 1.37, 10.9, 0.34, { fontSize: 13, color: C.muted });
}
function badge(slide, n, x, y, fill = C.sage) {
  circle(slide, x, y, 0.38, fill);
  addText(slide, String(n).padStart(2, '0'), x, y + 0.01, 0.38, 0.34, { fontSize: 11, color: C.white, bold: true, align: 'center' });
}
function addImageSvg(slide, svg, x, y, w, h) {
  slide.addImage({ data: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), x, y, w, h });
}
function mapPathSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="330" viewBox="0 0 780 330">
    <path d="M28 284 C130 255 96 167 208 178 S330 277 401 210 S520 60 614 120 S690 237 748 50" fill="none" stroke="#8EA47C" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 22"/>
    <circle cx="28" cy="284" r="12" fill="#C97A59"/><circle cx="401" cy="210" r="12" fill="#6C7E58"/><circle cx="748" cy="50" r="12" fill="#385160"/>
    <path d="M62 52 l24 19 -11 30 -35 -7z M240 62 l30 -10 13 23 -24 22 -24 -14z M560 250 l34 -14 18 28 -25 20 -31 -10z" fill="#E4EDD8" stroke="#C9D6B8" stroke-width="3"/>
    <path d="M130 237 q21 -42 42 0 q-21 30 -42 0 M635 198 q22 -46 44 0 q-22 31 -44 0" fill="none" stroke="#D9B560" stroke-width="4"/>
  </svg>`;
}
function phoneSvg(kind = 'home') {
  const bg = '#F6F1E6', paper = '#FFFDF8', ink = '#3C342C', sage = '#8EA47C', deep = '#6C7E58', mist = '#E4EDD8', soft = '#C9D6B8', muted = '#8F8376', line = '#E7DCCE', blush = '#E8B4A2';
  const header = `<rect x="0" y="0" width="390" height="112" fill="#E8F0DC"/><path d="M0 84 C48 102 70 66 113 84 S186 109 225 82 S313 103 390 77 L390 112 L0 112Z" fill="${bg}"/>
    <text x="20" y="36" font-family="Arial" font-size="20" fill="${deep}">☰</text>
    <text x="55" y="31" font-family="Georgia" font-size="18" fill="${deep}" font-style="italic">Good morning</text>
    <text x="55" y="62" font-family="Arial" font-size="23" font-weight="700" fill="${ink}">途个惊喜</text>
    <text x="55" y="86" font-family="Arial" font-size="10" fill="${muted}">随盒出发，途个好心情</text>`;
  const nav = `<rect x="0" y="782" width="390" height="62" fill="#FFFDF8" stroke="${line}" stroke-width="1"/><text x="40" y="812" font-family="Arial" font-size="20" fill="${sage}">⌂</text><text x="32" y="832" font-family="Arial" font-size="9" fill="${deep}">首页</text><text x="118" y="812" font-family="Arial" font-size="20" fill="${muted}">◌</text><text x="106" y="832" font-family="Arial" font-size="9" fill="${muted}">AI搭子</text><text x="204" y="812" font-family="Arial" font-size="20" fill="${muted}">◇</text><text x="193" y="832" font-family="Arial" font-size="9" fill="${muted}">图鉴</text><text x="294" y="812" font-family="Arial" font-size="20" fill="${muted}">⌁</text><text x="283" y="832" font-family="Arial" font-size="9" fill="${muted}">行程</text><text x="354" y="812" font-family="Arial" font-size="20" fill="${muted}">○</text><text x="344" y="832" font-family="Arial" font-size="9" fill="${muted}">我的</text>`;
  let body = '';
  if (kind === 'home') {
    body = `${header}
      <text x="20" y="141" font-family="Arial" font-size="12" fill="${deep}" font-weight="700">今天的心情，适合去哪儿？</text>
      <rect x="20" y="154" width="76" height="27" rx="14" fill="${sage}"/><text x="32" y="172" font-family="Arial" font-size="11" fill="#fff">全部心情</text>
      <rect x="105" y="154" width="55" height="27" rx="14" fill="#E4EDD8"/><text x="119" y="172" font-family="Arial" font-size="11" fill="${deep}">开心</text>
      <rect x="169" y="154" width="55" height="27" rx="14" fill="#E4EDD8"/><text x="183" y="172" font-family="Arial" font-size="11" fill="${deep}">emo</text>
      <rect x="233" y="154" width="55" height="27" rx="14" fill="#E4EDD8"/><text x="244" y="172" font-family="Arial" font-size="11" fill="${deep}">无聊</text>
      <rect x="297" y="154" width="63" height="27" rx="14" fill="#E4EDD8"/><text x="310" y="172" font-family="Arial" font-size="11" fill="${deep}">迷茫</text>
      <rect x="20" y="201" width="350" height="122" rx="18" fill="${mist}"/>
      <path d="M250 201 C280 212 288 278 370 246 L370 323 L220 323Z" fill="#C9D6B8"/>
      <circle cx="294" cy="256" r="30" fill="#FFFDF8" opacity=".9"/><path d="M277 270 q18 -34 36 0" fill="none" stroke="${deep}" stroke-width="4"/>
      <text x="38" y="235" font-family="Arial" font-size="9" fill="${deep}" letter-spacing="2">MOOD MATCH</text><text x="38" y="265" font-family="Arial" font-size="22" fill="${ink}" font-weight="700">把心情交给路</text><text x="38" y="286" font-family="Arial" font-size="12" fill="${muted}">AI 为你挑一份专属惊喜</text>
      <text x="20" y="358" font-family="Arial" font-size="12" fill="${deep}" font-weight="700">盲盒货架</text><text x="318" y="358" font-family="Arial" font-size="10" fill="${muted}">全部 · 6 个</text>
      <rect x="20" y="374" width="166" height="206" rx="16" fill="${paper}" stroke="${line}"/>
      <rect x="31" y="385" width="144" height="80" rx="12" fill="#D7E3CC"/><path d="M31 446 q50 -53 90 -9 q25 22 54 -6 v34 H31Z" fill="#B3C59F"/><circle cx="143" cy="411" r="18" fill="#E8B4A2"/>
      <text x="35" y="489" font-family="Arial" font-size="13" fill="${ink}" font-weight="700">周边微度假盲盒</text><text x="35" y="510" font-family="Arial" font-size="10" fill="${muted}">1天短途 · 周末说走就走</text><text x="35" y="551" font-family="Arial" font-size="17" fill="${deep}" font-weight="700">¥99</text><text x="120" y="551" font-family="Arial" font-size="10" fill="${muted}">保底 ¥120</text>
      <rect x="204" y="374" width="166" height="206" rx="16" fill="${paper}" stroke="${line}"/>
      <rect x="215" y="385" width="144" height="80" rx="12" fill="#E8E0D2"/><path d="M215 450 q38 -55 76 -20 q28 22 68 -15 v50 H215Z" fill="#C6B99A"/>
      <text x="219" y="489" font-family="Arial" font-size="13" fill="${ink}" font-weight="700">山野露营观星</text><text x="219" y="510" font-family="Arial" font-size="10" fill="${muted}">湖畔星空 · 篝火治愈夜</text><text x="219" y="551" font-family="Arial" font-size="17" fill="${deep}" font-weight="700">¥159</text><text x="306" y="551" font-family="Arial" font-size="10" fill="${muted}">保底 ¥200</text>
      ${nav}`;
  } else if (kind === 'ai') {
    body = `${header}<text x="22" y="145" font-family="Arial" font-size="13" fill="${deep}" font-weight="700">小途 · AI 旅行搭子</text><circle cx="334" cy="139" r="5" fill="${sage}"/><text x="345" y="144" font-family="Arial" font-size="10" fill="${muted}">在线</text>
      <rect x="20" y="182" width="260" height="62" rx="18" fill="${paper}" stroke="${line}"/><text x="36" y="208" font-family="Arial" font-size="12" fill="${ink}">你好呀，把心情告诉我。</text><text x="36" y="226" font-family="Arial" font-size="12" fill="${ink}">今天想吹吹山风吗？</text>
      <rect x="114" y="272" width="256" height="48" rx="18" fill="${sage}"/><text x="133" y="302" font-family="Arial" font-size="12" fill="#fff">推荐散心的地方</text>
      <rect x="20" y="350" width="300" height="84" rx="18" fill="${paper}" stroke="${line}"/><text x="36" y="379" font-family="Arial" font-size="12" fill="${ink}">可以看看「隐世古村慢生活盒」，</text><text x="36" y="399" font-family="Arial" font-size="12" fill="${ink}">让古村的风吹走一点烦恼。</text><rect x="36" y="412" width="130" height="7" rx="4" fill="${soft}"/>
      <rect x="20" y="690" width="350" height="38" rx="19" fill="${paper}" stroke="${line}"/><text x="36" y="715" font-family="Arial" font-size="11" fill="${muted}">把心情告诉小途…</text><circle cx="345" cy="709" r="13" fill="${sage}"/><text x="339" y="714" font-family="Arial" font-size="14" fill="#fff">↑</text>${nav}`;
  } else {
    body = `${header}<text x="20" y="143" font-family="Arial" font-size="12" fill="${deep}" font-weight="700">旅行图鉴</text><rect x="20" y="164" width="350" height="84" rx="20" fill="${mist}"/><text x="38" y="192" font-family="Arial" font-size="9" fill="${deep}" letter-spacing="2">TRAVEL DNA</text><text x="38" y="220" font-family="Arial" font-size="18" fill="${ink}" font-weight="700">AI 旅行人格测试</text><text x="254" y="214" font-family="Arial" font-size="11" fill="${deep}">30 秒测出你的旅行 DNA →</text>
      <text x="20" y="290" font-family="Arial" font-size="12" fill="${deep}" font-weight="700">徽章收集</text><text x="309" y="290" font-family="Arial" font-size="10" fill="${muted}">3 / 12</text><rect x="20" y="304" width="350" height="7" rx="4" fill="#E0D7C9"/><rect x="20" y="304" width="88" height="7" rx="4" fill="${sage}"/>
      ${['村','山','味','徽','文','海','红','乡','探','营','学','影'].map((m,i)=>{const x=24+(i%4)*88,y=338+Math.floor(i/4)*91; return `<circle cx="${x+28}" cy="${y+28}" r="26" fill="${i<3?'#8EA47C':'#D9D2C6'}"/><text x="${x+18}" y="${y+36}" font-family="Arial" font-size="15" fill="#fff" font-weight="700">${m}</text><text x="${x+12}" y="${y+70}" font-family="Arial" font-size="10" fill="${i<3?ink:muted}">${['古村','山野','美食','徽派','文艺','海滨','红色','乡村','探险','露营','研学','摄影'][i]}</text>`}).join('')}${nav}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect x="0" y="0" width="390" height="844" rx="32" fill="${bg}"/>${body}</svg>`;
}

function addPhone(slide, x, y, w, h, kind, label) {
  rect(slide, x - 0.05, y - 0.05, w + 0.1, h + 0.1, C.ink, 0.33, C.ink);
  addImageSvg(slide, phoneSvg(kind), x, y, w, h);
  if (label) addText(slide, label, x, y + h + 0.12, w, 0.24, { fontSize: 11, color: C.muted, align: 'center', bold: true });
}

function card(slide, x, y, w, h, opts = {}) {
  rect(slide, x, y, w, h, opts.fill || C.paper, opts.radius || 0.18, opts.line || C.line);
  if (opts.accent) slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color: opts.accent }, line: { color: opts.accent, transparency: 100 } });
}
function footerNote(slide, text) {
  addText(slide, text, 0.67, 6.78, 8.8, 0.18, { fontSize: 8.5, color: C.muted, italic: true });
}

// Slide 1 — Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.cream };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.cream }, line: { color: C.cream } });
  s.addShape(pptx.ShapeType.arc, { x: 7.78, y: -0.58, w: 5.9, h: 5.9, adjustPoint: 0.3, rotate: 16, line: { color: C.sage, width: 2.4, transparency: 15, dashType: 'dash' }, fill: { color: C.cream, transparency: 100 } });
  addImageSvg(s, mapPathSvg(), 6.45, 2.45, 6.4, 2.7);
  rect(s, 8.63, 1.08, 2.58, 3.32, C.paper, 0.24, C.paper);
  rect(s, 8.86, 1.34, 2.12, 2.52, C.mist, 0.18, C.mist);
  addText(s, '惊喜', 9.05, 1.78, 1.76, 0.48, { fontSize: 30, color: C.deep, bold: true, align: 'center' });
  addText(s, '盒', 9.05, 2.35, 1.76, 0.75, { fontSize: 44, color: C.ink, bold: true, align: 'center' });
  pill(s, 'OPEN A NEW ROUTE', 9.04, 3.28, 1.76, C.ink, C.paper, C.ink);
  circle(s, 8.45, 3.86, 0.34, C.blush); circle(s, 11.06, 1.66, 0.26, C.yellow);
  addText(s, '途个惊喜', 0.78, 1.02, 5.6, 0.82, { fontSize: 48, color: C.ink, bold: true });
  addText(s, '随盒出发，途个好心情', 0.82, 1.98, 4.8, 0.35, { fontSize: 19, color: C.deep, bold: true });
  addText(s, '面向 Z 世代的惊喜旅游盲盒攻略平台', 0.82, 2.58, 5.5, 0.34, { fontSize: 16, color: C.muted });
  line(s, 0.82, 3.28, 1.0, 0, C.sage, 3);
  addText(s, '把“想出发”变成一次轻松、有趣、可被记住的旅程。', 0.82, 3.58, 5.45, 0.48, { fontSize: 22, color: C.ink, bold: true });
  addText(s, 'INNOVATION & ENTREPRENEURSHIP PROJECT', 0.83, 6.78, 4.8, 0.2, { fontSize: 9, color: C.muted, charSpacing: 1.8 });
}

// Slide 2 — Opportunity
{
  const s = pptx.addSlide('MASTER');
  title(s, '01  项目契机', '年轻人不是不想旅行，只是不想先做一份项目管理。', '当出行从“观光打卡”转向“轻量、情绪、兴趣体验”，传统攻略的入口正在失效。');
  const items = [
    ['轻量出行', '周末微度假、城市周边游成为更高频的出行选择。', C.sage],
    ['情绪价值', '年轻用户希望被治愈、被点亮，而不是被信息淹没。', C.blush],
    ['兴趣匹配', '徒步、美食、拍照、放空等圈层需求越来越清晰。', C.yellow],
    ['安全社交', '想结伴，但不想交换隐私、不想进入低质量随机撮合。', C.blue]
  ];
  items.forEach((it, i) => {
    const x = 0.72 + i * 3.05;
    card(s, x, 2.06, 2.68, 2.25, { fill: C.paper, accent: it[2] });
    circle(s, x + 0.28, 2.34, 0.44, it[2]);
    addText(s, String(i + 1), x + 0.28, 2.39, 0.44, 0.26, { fontSize: 12, color: C.white, bold: true, align: 'center' });
    addText(s, it[0], x + 0.28, 2.98, 2.1, 0.3, { fontSize: 20, color: C.ink, bold: true });
    addText(s, it[1], x + 0.28, 3.42, 2.05, 0.62, { fontSize: 13, color: C.muted, valign: 'top' });
  });
  rect(s, 0.72, 4.82, 11.9, 1.1, C.mist, 0.18, C.mist);
  addText(s, '行业判断', 1.02, 5.08, 1.1, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.2 });
  addText(s, '传统文旅是“大市场、高饱和”；青年轻文旅是“需求增长、产品稀缺”。', 2.12, 5.02, 8.9, 0.34, { fontSize: 22, color: C.ink, bold: true });
  footerNote(s, '依据：项目组提供的市场调研与项目契机材料；正式申报时可补充官方统计口径。');
}

// Slide 3 — Market and policy
{
  const s = pptx.addSlide('MASTER');
  title(s, '02  市场空间', '四股力量，把轻量化文旅推到新的入口。', '市场容量来自高频年轻用户，政策环境来自文旅数字化与青年创新创业。');
  const cols = [
    ['用户基数', '18–32 岁年轻群体是短途文旅的重要消费人群。', '亿级年轻用户', C.sage],
    ['需求增量', '“想出游、怕做攻略、怕踩雷、怕纠结”正在成为共性。', '省心 + 惊喜', C.blush],
    ['复制空间', '纯线上内容产品，不受地域、季节和线下场地强约束。', '轻资产可扩张', C.yellow],
    ['政策方向', '智慧文旅、数字文创、青年双创、网络合规共同形成支持面。', '文旅 × 数字', C.blue]
  ];
  cols.forEach((it, i) => {
    const x = 0.72 + i * 3.02;
    card(s, x, 2.1, 2.68, 2.9, { fill: C.paper });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.1, w: 2.68, h: 0.12, fill: { color: it[3] }, line: { color: it[3], transparency: 100 } });
    addText(s, it[0], x + 0.28, 2.46, 2.1, 0.32, { fontSize: 18, color: C.ink, bold: true });
    addText(s, it[1], x + 0.28, 2.98, 2.05, 0.78, { fontSize: 13, color: C.muted, valign: 'top' });
    addText(s, it[2], x + 0.28, 4.23, 2.1, 0.32, { fontSize: 17, color: it[3], bold: true });
  });
  line(s, 0.95, 5.63, 11.25, 0, C.line, 1);
  addText(s, '切入口', 0.95, 5.84, 1.1, 0.25, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.2 });
  addText(s, '用一款低决策成本的内容产品，先占住“周末去哪儿”的情绪入口。', 2.04, 5.78, 9.4, 0.36, { fontSize: 21, color: C.ink, bold: true });
  footerNote(s, '市场容量与政策支持依据用户提供材料整理，未额外虚构市场规模数字。');
}

// Slide 4 — Target users
{
  const s = pptx.addSlide('MASTER');
  title(s, '03  目标用户', '四类人，背后是同一个愿望：少一点纠结，多一点出发。', '他们并不缺旅行信息，缺的是能替自己完成第一步的产品。');
  const people = [
    ['出行懒人', '想旅行，但不想花两小时做攻略。', '省心'],
    ['潮流猎奇', '拒绝千篇一律，期待未知与仪式感。', '新鲜'],
    ['垂直兴趣', '徒步、美食、治愈、拍照，各有自己的路线。', '匹配'],
    ['温和轻社交', '想认识同频的人，但拒绝隐私交换与随机撮合。', '安全']
  ];
  people.forEach((p, i) => {
    const x = 0.72 + i * 3.02;
    card(s, x, 2.18, 2.68, 3.22, { fill: i % 2 ? C.paper : C.mist, line: i % 2 ? C.line : C.mist });
    circle(s, x + 0.28, 2.48, 0.72, [C.sage, C.blush, C.yellow, C.blue][i]);
    addText(s, ['懒', '奇', '趣', '伴'][i], x + 0.28, 2.64, 0.72, 0.28, { fontSize: 24, color: C.white, bold: true, align: 'center' });
    addText(s, p[0], x + 0.28, 3.5, 2.1, 0.32, { fontSize: 19, color: C.ink, bold: true });
    addText(s, p[1], x + 0.28, 4.02, 2.05, 0.76, { fontSize: 13, color: C.muted, valign: 'top' });
    pill(s, p[2], x + 0.28, 5.04, 0.76, C.paper, C.deep, C.paper);
  });
  addText(s, '共同特征', 0.72, 5.9, 1.2, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.2 });
  addText(s, '年轻、移动端、高频周末决策、重视情绪价值、愿意为“省心”付费。', 1.85, 5.84, 9.8, 0.32, { fontSize: 20, color: C.ink, bold: true });
}

// Slide 5 — Pain points
{
  const s = pptx.addSlide('MASTER');
  title(s, '04  用户痛点', '出发前的疲惫，正在吞掉旅行本该有的期待。', '项目调研把问题拆成五个具体摩擦点，并追溯到供给侧的四个成因。');
  const pain = [
    ['规划成本高', '查资料、比路线、做预算，出发前先累一遍。'],
    ['体验过于固化', '模板化攻略让每次旅行都像复制粘贴。'],
    ['匹配度不足', '通用内容无法回应真实兴趣与当下心情。'],
    ['社交不安全', '想结伴，却担心隐私泄露和低质量撮合。'],
    ['缺少仪式感', '信息很多，但没有“打开它”的期待。']
  ];
  pain.forEach((p, i) => {
    const x = 0.72 + (i % 3) * 3.02;
    const y = 2.1 + Math.floor(i / 3) * 1.55;
    card(s, x, y, 2.68, 1.22, { fill: C.paper, accent: [C.rust, C.sage, C.yellow, C.blue, C.blush][i] });
    addText(s, p[0], x + 0.28, y + 0.2, 2.05, 0.27, { fontSize: 16, color: C.ink, bold: true });
    addText(s, p[1], x + 0.28, y + 0.56, 2.05, 0.48, { fontSize: 11.5, color: C.muted, valign: 'top' });
  });
  rect(s, 9.86, 3.65, 2.68, 2.7, C.ink, 0.18, C.ink);
  addText(s, '根因', 10.16, 3.97, 1.0, 0.25, { fontSize: 11, color: C.soft, bold: true, charSpacing: 1.1 });
  addText(s, '传统模式固化\n市场细分空白\n轻量创新缺失\n社交体系不规范', 10.16, 4.42, 1.95, 1.2, { fontSize: 17, color: C.paper, bold: true, valign: 'top', extra: { breakLine: true } });
  addText(s, '结果：用户想出发，但第一步总是被推迟。', 0.72, 5.76, 8.7, 0.38, { fontSize: 21, color: C.ink, bold: true });
}

// Slide 6 — Solution
{
  const s = pptx.addSlide('MASTER');
  title(s, '05  解决方案', '把复杂的旅行规划，折叠成一次有回应的开盒。', '途个惊喜不是再做一个攻略库，而是把“选择”变成“被理解之后的惊喜”。');
  const steps = [
    ['选心情', '开心 / emo / 无聊 / 迷茫', C.sage],
    ['挑盲盒', '按分类浏览，低成本决策', C.blush],
    ['开惊喜', '随机解锁结构化路线', C.yellow],
    ['去旅行', '行程、徽章、日记沉淀', C.blue],
    ['再回来', 'AI 搭子与兴趣社交留存', C.deep]
  ];
  steps.forEach((st, i) => {
    const x = 0.82 + i * 2.43;
    circle(s, x, 2.42, 0.64, st[2]);
    addText(s, String(i + 1), x, 2.57, 0.64, 0.25, { fontSize: 18, color: C.white, bold: true, align: 'center' });
    if (i < steps.length - 1) line(s, x + 0.72, 2.74, 1.68, 0, C.soft, 2, 'dash');
    addText(s, st[0], x - 0.1, 3.35, 0.86, 0.27, { fontSize: 17, color: C.ink, bold: true, align: 'center' });
    addText(s, st[1], x - 0.52, 3.75, 1.7, 0.48, { fontSize: 11.5, color: C.muted, align: 'center', valign: 'top' });
  });
  rect(s, 0.82, 5.18, 11.48, 0.92, C.mist, 0.18, C.mist);
  addText(s, '四大解决思路', 1.12, 5.5, 1.25, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.1 });
  addText(s, '盲盒轻量化  ·  兴趣垂直化  ·  视觉潮玩化  ·  社交合规化', 2.45, 5.43, 8.75, 0.32, { fontSize: 21, color: C.ink, bold: true, align: 'center' });
}

// Slide 7 — Product anatomy
{
  const s = pptx.addSlide('MASTER');
  title(s, '06  产品结构', '一个盲盒，背后是一套可复用的内容系统。', '内容不是随机拼接，而是被结构化、分级、校验后再进入盲盒。');
  card(s, 0.72, 2.05, 4.1, 3.85, { fill: C.paper });
  addText(s, '四大主题盲盒', 1.02, 2.35, 2.8, 0.28, { fontSize: 20, color: C.ink, bold: true });
  const themes = [['户外徒步', '自然探索', C.sage], ['美食逛吃', '城市烟火', C.rust], ['休闲治愈', '放空与恢复', C.blush], ['拍照打卡', '审美与分享', C.blue]];
  themes.forEach((t, i) => {
    const y = 2.92 + i * 0.62;
    circle(s, 1.02, y, 0.28, t[2]);
    addText(s, t[0], 1.46, y - 0.01, 1.3, 0.25, { fontSize: 15, color: C.ink, bold: true });
    addText(s, t[1], 2.88, y, 1.2, 0.2, { fontSize: 11, color: C.muted });
    line(s, 1.02, y + 0.43, 3.25, 0, C.line, 0.8);
  });
  pill(s, '轻量化', 1.02, 5.2, 0.78, C.mist, C.deep, C.mist); pill(s, '可复制', 1.95, 5.2, 0.78, C.mist, C.deep, C.mist); pill(s, '低决策', 2.88, 5.2, 0.78, C.mist, C.deep, C.mist);
  card(s, 5.25, 2.05, 7.3, 3.85, { fill: C.ink, line: C.ink });
  addText(s, '结构化攻略内容', 5.62, 2.36, 3.6, 0.28, { fontSize: 20, color: C.paper, bold: true });
  const modules = [['景点', '去哪儿'], ['交通', '怎么到'], ['预算', '花多少'], ['美食', '吃什么'], ['避雷', '少踩坑'], ['穿搭', '怎么拍']];
  modules.forEach((m, i) => {
    const x = 5.62 + (i % 3) * 2.1;
    const y = 3.08 + Math.floor(i / 3) * 1.02;
    rect(s, x, y, 1.72, 0.73, i % 2 ? C.deep : C.sage, 0.15, i % 2 ? C.deep : C.sage);
    addText(s, m[0], x + 0.16, y + 0.13, 1.35, 0.22, { fontSize: 15, color: C.paper, bold: true });
    addText(s, m[1], x + 0.16, y + 0.41, 1.35, 0.18, { fontSize: 10, color: C.soft });
  });
  addText(s, '内容池 → 盲盒标签 → 情绪匹配 → 路线解锁', 5.62, 5.34, 6.1, 0.24, { fontSize: 14, color: C.soft, bold: true });
}

// Slide 8 — Prototype experience
{
  const s = pptx.addSlide('MASTER');
  title(s, '07  原型体验', '用户看到的不是一张信息表，而是一种“打开它”的期待。', '原型以奶油白、鼠尾草绿和纸张质感构成产品识别度；界面、文案与动效共同服务于惊喜感。');
  addPhone(s, 0.86, 1.88, 2.64, 5.72, 'home', '首页：选心情 → 浏览盲盒');
  addPhone(s, 4.18, 1.88, 2.64, 5.72, 'ai', 'AI 搭子：把心情交给小途');
  addPhone(s, 7.5, 1.88, 2.64, 5.72, 'badges', '图鉴：收集旅途中的印章');
  rect(s, 10.55, 2.2, 1.92, 2.15, C.mist, 0.18, C.mist);
  addText(s, '视觉语言', 10.86, 2.5, 1.25, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.2 });
  addText(s, '奶油白\n鼠尾草绿\n纸张纹理\n杂志式排版', 10.86, 2.94, 1.2, 1.0, { fontSize: 18, color: C.ink, bold: true, valign: 'top', extra: { breakLine: true } });
  addText(s, '这些不是装饰，而是把“旅行”从工具感拉回到情绪体验。', 10.56, 4.82, 1.9, 0.8, { fontSize: 13, color: C.muted, valign: 'top' });
}

// Slide 9 — Innovation
{
  const s = pptx.addSlide('MASTER');
  title(s, '08  三大创新', '创新不只在界面，更在产品逻辑、内容方法和关系边界。', '三个层次叠加，构成“途个惊喜”的差异化壁垒。');
  const innovations = [
    ['玩法创新', '攻略盲盒化', '把被动搜索变成一次开箱；用随机、稀有度、动效和收集制造仪式感。', C.sage],
    ['内容创新', '结构化萃取', '把景点、交通、预算、美食、避雷、穿搭拆成可组合的原创内容单元。', C.yellow],
    ['模式创新', '合规轻社交', '以内容付费为核心，以兴趣交流为增值；不做隐私交换和恶意撮合。', C.blue]
  ];
  innovations.forEach((it, i) => {
    const x = 0.82 + i * 4.1;
    card(s, x, 2.12, 3.55, 3.72, { fill: i === 1 ? C.ink : C.paper, line: i === 1 ? C.ink : C.line });
    badge(s, i + 1, x + 0.3, 2.45, it[3]);
    addText(s, it[0], x + 0.3, 3.08, 1.8, 0.23, { fontSize: 11, color: i === 1 ? C.soft : C.deep, bold: true, charSpacing: 1.1 });
    addText(s, it[1], x + 0.3, 3.44, 2.8, 0.36, { fontSize: 23, color: i === 1 ? C.paper : C.ink, bold: true });
    addText(s, it[2], x + 0.3, 4.15, 2.7, 0.86, { fontSize: 14, color: i === 1 ? C.soft : C.muted, valign: 'top' });
    line(s, x + 0.3, 5.3, 2.8, 0, i === 1 ? C.deep : C.line, 1);
    addText(s, ['惊喜感', '内容壁垒', '信任感'][i], x + 0.3, 5.46, 1.4, 0.22, { fontSize: 13, color: i === 1 ? C.paper : C.ink, bold: true });
  });
}

// Slide 10 — Competitor matrix
{
  const s = pptx.addSlide('MASTER');
  title(s, '09  竞品差异', '我们不和所有旅游平台拼信息量，而是重新定义“怎么开始一趟旅行”。', '避开传统攻略红海，切入攻略盲盒、兴趣匹配与合规轻社交的交叉空白。');
  const x0 = 0.72, y0 = 2.06;
  const widths = [2.0, 2.45, 2.45, 2.45, 2.45];
  const headers = ['对比维度', '传统攻略平台', '线下实体旅游盲盒', '旅行社交平台', '途个惊喜'];
  let x = x0;
  headers.forEach((h, i) => { rect(s, x, y0, widths[i], 0.6, i === 4 ? C.ink : C.mist, 0.04, i === 4 ? C.ink : C.mist); addText(s, h, x + 0.12, y0 + 0.12, widths[i] - 0.24, 0.26, { fontSize: 12, color: i === 4 ? C.paper : C.deep, bold: true, align: 'center' }); x += widths[i]; });
  const rows = [
    ['产品属性', '信息资讯工具', '线下套餐，重资产', '社交撮合', '轻量化内容产品'],
    ['玩法创意', '被动搜索', '有惊喜但玩法固化', '无开箱体验', '开盒 + 随机 + 收集'],
    ['内容精准度', '通用内容', '固定套餐', '兴趣标签弱', '四大兴趣垂直匹配'],
    ['安全边界', '无体系化结伴', '无社交属性', '隐私与撮合风险', '兴趣交流、隐私脱敏'],
    ['可复制性', '市场饱和', '成本与地域约束', '内容治理复杂', '线上交付、全国扩展']
  ];
  rows.forEach((r, ri) => {
    let xx = x0; const yy = y0 + 0.6 + ri * 0.68;
    r.forEach((v, ci) => { const fill = ci === 4 ? C.mist : (ri % 2 ? C.paper : C.cream2); rect(s, xx, yy, widths[ci], 0.68, fill, 0.01, C.line); addText(s, v, xx + 0.12, yy + 0.15, widths[ci] - 0.24, 0.28, { fontSize: 11.5, color: ci === 4 ? C.deep : C.ink, bold: ci === 0 || ci === 4, align: ci === 0 ? 'left' : 'center' }); xx += widths[ci]; });
  });
  addText(s, '差异化结论', 0.72, 6.04, 1.15, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.1 });
  addText(s, '不是更大的信息库，而是更低的决策成本、更高的情绪价值和更清晰的安全边界。', 2.0, 5.97, 10.15, 0.34, { fontSize: 18, color: C.ink, bold: true });
  footerNote(s, '竞品维度依据用户提供的“产品详情 + 产品亮点 + 竞品分析”材料整理。');
}

// Slide 11 — Business model
{
  const s = pptx.addSlide('MASTER');
  title(s, '10  商业模式', '先把一次出行做得值得，再让用户愿意回来。', '收入来自盲盒销售，留存来自内容、收集和 AI；轻资产让复制速度快于线下扩张。');
  card(s, 0.72, 2.08, 4.12, 3.75, { fill: C.ink, line: C.ink });
  addText(s, '收入引擎', 1.05, 2.4, 1.5, 0.24, { fontSize: 11, color: C.soft, bold: true, charSpacing: 1.2 });
  addText(s, '盲盒销售', 1.05, 2.9, 2.6, 0.4, { fontSize: 28, color: C.paper, bold: true });
  addText(s, '单次开盒 → 复购开盒 → 内容转化', 1.05, 3.5, 2.8, 0.26, { fontSize: 15, color: C.soft, bold: true });
  line(s, 1.05, 4.1, 3.05, 0, C.deep, 1);
  addText(s, '用户买到的是一次结构化的出行决策，平台沉淀的是内容资产与兴趣画像。', 1.05, 4.45, 2.95, 0.74, { fontSize: 15, color: C.paper, valign: 'top' });
  const loops = [['内容资产', '线路池、主题、城市'], ['用户资产', '偏好、徽章、日记'], ['运营资产', '筛选、复购、转化']];
  loops.forEach((l, i) => { const x = 5.55 + (i % 3) * 2.35; const y = 2.28 + Math.floor(i / 3) * 1.6; card(s, x, y, 2.05, 1.25, { fill: i === 1 ? C.mist : C.paper }); addText(s, l[0], x + 0.2, y + 0.24, 1.58, 0.25, { fontSize: 16, color: C.ink, bold: true }); addText(s, l[1], x + 0.2, y + 0.64, 1.6, 0.3, { fontSize: 11.5, color: C.muted }); });
  rect(s, 5.55, 5.12, 7.0, 0.72, C.mist, 0.16, C.mist);
  addText(s, '成本结构', 5.85, 5.36, 0.85, 0.2, { fontSize: 11, color: C.deep, bold: true });
  addText(s, '内容研发  ·  技术与模型  ·  渠道获客  ·  线路结算与售后', 6.9, 5.3, 5.15, 0.28, { fontSize: 15, color: C.ink, bold: true });
}

// Slide 12 — Technology
{
  const s = pptx.addSlide('MASTER');
  title(s, '11  技术与风控', '轻量化产品，也可以有完整的工程承重墙。', '技术架构围绕内容下发、交易闭环、智能推荐与隐私合规展开。');
  rect(s, 0.72, 2.08, 11.9, 0.72, C.paper, 0.16, C.line);
  const top = [['微信小程序', C.sage], ['管理端 Web', C.blush], ['支付宝沙箱', C.yellow]];
  top.forEach((v, i) => { const x = 1.1 + i * 3.75; pill(s, v[0], x, 2.28, 1.6, v[1], C.ink, v[1]); if (i < 2) line(s, x + 1.72, 2.43, 1.55, 0, C.soft, 2, 'dash'); });
  rect(s, 0.72, 3.12, 11.9, 1.18, C.ink, 0.16, C.ink);
  addText(s, 'Spring Boot 3  ·  MyBatis-Plus  ·  JWT  ·  Spring AI', 1.05, 3.43, 10.8, 0.32, { fontSize: 22, color: C.paper, bold: true, align: 'center' });
  const bottom = [['MySQL', '业务数据 / 内容池', C.blue], ['Redis', '验证码 / 会话 / AI 记忆', C.sage], ['内容安全', '权限 / 脱敏 / 审核', C.rust], ['可演示交易', '沙箱支付 / 异步通知', C.blush]];
  bottom.forEach((v, i) => { const x = 0.72 + i * 3.02; card(s, x, 4.78, 2.68, 1.15, { fill: C.paper }); circle(s, x + 0.23, 5.05, 0.25, v[2]); addText(s, v[0], x + 0.62, 4.98, 1.55, 0.22, { fontSize: 15, color: C.ink, bold: true }); addText(s, v[1], x + 0.23, 5.34, 2.1, 0.22, { fontSize: 11, color: C.muted }); });
}

// Slide 13 — Content and operations loop
{
  const s = pptx.addSlide('MASTER');
  title(s, '12  运营闭环', '管理端配置一次，用户端每次都能看到真实、可售、可更新的内容。', '内容域先跑通，交易、AI、统计和社交才有稳定的地基。');
  const nodes = [
    ['管理端', '盲盒 / 线路 / 徽章 / Banner', C.ink],
    ['内容服务', '状态 / 标签 / 保底 / 权限', C.sage],
    ['用户端', '首页 / 图鉴 / 心情筛选', C.blush],
    ['行为数据', '心情 / 浏览 / 开盒 / 收集', C.yellow],
    ['智能留存', 'AI 搭子 / 推荐 / 日记', C.blue]
  ];
  nodes.forEach((n, i) => {
    const x = 0.78 + i * 2.42;
    circle(s, x, 2.63, 0.76, n[2]);
    addText(s, String(i + 1), x, 2.84, 0.76, 0.24, { fontSize: 20, color: C.white, bold: true, align: 'center' });
    addText(s, n[0], x - 0.25, 3.64, 1.25, 0.25, { fontSize: 18, color: C.ink, bold: true, align: 'center' });
    addText(s, n[1], x - 0.62, 4.06, 2.0, 0.52, { fontSize: 11.5, color: C.muted, align: 'center', valign: 'top' });
    if (i < nodes.length - 1) line(s, x + 0.92, 3.01, 1.36, 0, C.soft, 2, 'dash');
  });
  rect(s, 1.0, 5.38, 11.3, 0.74, C.mist, 0.16, C.mist);
  addText(s, '阶段二的价值：先让“配置下发 → 用户看见”成为稳定可验证的产品能力。', 1.35, 5.62, 10.5, 0.25, { fontSize: 18, color: C.ink, bold: true, align: 'center' });
}

// Slide 14 — Roadmap
{
  const s = pptx.addSlide('MASTER');
  title(s, '13  实施路线', '先跑通闭环，再把留存和生态做厚。', '六阶段从内容地基走向交易、AI、社交与商家合作；每一阶段都有可演示的交付物。');
  const phases = [
    ['1', '地基与承重墙', '三端骨架 / 数据库 / 契约', false],
    ['2', '内容域', '盲盒 / 线路 / 图鉴 / Banner', true],
    ['3', '交易域', '登录 / 支付 / 开盒 / 行程', false],
    ['4', '用户资产与 AI', '统计 / 人格 / 小途 / 日记', false],
    ['5', '社交增强', '社区 / 打卡 / 成就', false],
    ['6', '商家合作与积分', '优惠券 / 积分商城', false]
  ];
  phases.forEach((p, i) => {
    const x = 0.72 + (i % 3) * 4.05; const y = 2.08 + Math.floor(i / 3) * 1.7;
    card(s, x, y, 3.6, 1.35, { fill: p[3] ? C.ink : C.paper, line: p[3] ? C.ink : C.line });
    circle(s, x + 0.24, y + 0.28, 0.5, p[3] ? C.sage : C.mist);
    addText(s, p[0], x + 0.24, y + 0.41, 0.5, 0.2, { fontSize: 16, color: p[3] ? C.white : C.deep, bold: true, align: 'center' });
    addText(s, p[1], x + 0.94, y + 0.24, 2.3, 0.25, { fontSize: 16, color: p[3] ? C.paper : C.ink, bold: true });
    addText(s, p[2], x + 0.94, y + 0.67, 2.3, 0.28, { fontSize: 11.5, color: p[3] ? C.soft : C.muted });
  });
  addText(s, '当前重点', 0.72, 5.78, 1.05, 0.22, { fontSize: 11, color: C.deep, bold: true, charSpacing: 1.2 });
  addText(s, '阶段二先把内容供给做实，阶段三再把“支付 → 开盒 → 行程”跑成可演示闭环。', 1.88, 5.72, 10.4, 0.34, { fontSize: 19, color: C.ink, bold: true });
}

// Slide 15 — Closing
{
  const s = pptx.addSlide();
  s.background = { color: C.ink };
  addImageSvg(s, mapPathSvg(), 5.8, 2.9, 6.7, 2.8);
  rect(s, 8.75, 1.18, 2.35, 3.02, C.mist, 0.22, C.mist);
  addText(s, '打开', 9.08, 1.77, 1.7, 0.45, { fontSize: 28, color: C.deep, bold: true, align: 'center' });
  addText(s, '下一站', 9.08, 2.36, 1.7, 0.52, { fontSize: 30, color: C.ink, bold: true, align: 'center' });
  addText(s, '途个惊喜', 0.82, 1.18, 5.4, 0.68, { fontSize: 43, color: C.paper, bold: true });
  addText(s, '把选择交给心情，把惊喜留给旅程。', 0.84, 2.16, 5.55, 0.42, { fontSize: 24, color: C.soft, bold: true });
  line(s, 0.84, 3.02, 1.05, 0, C.sage, 3);
  addText(s, '一个面向年轻人的轻量化文旅创新项目', 0.84, 3.38, 4.9, 0.28, { fontSize: 16, color: C.paper });
  pill(s, '随盒出发  /  途个好心情', 0.84, 4.08, 2.6, C.sage, C.paper, C.sage);
  addText(s, 'THANK YOU', 0.84, 6.75, 2.2, 0.18, { fontSize: 10, color: C.soft, charSpacing: 2.2 });
}

pptx.writeFile({ fileName: '/Users/lyd1/Bsproject/盲盒/未命名/途个惊喜_创新创业项目介绍.pptx' });
