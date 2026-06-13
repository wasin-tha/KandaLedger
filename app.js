/* ============================================================
   KandaLedger — Front-end (vanilla JS)
   Public viewer + PIN-gated entry, 2 modules: utility / purchase
   Backend: Google Apps Script Web App (see README.md)
   ============================================================ */
'use strict';

const CFG = window.KANDA_CONFIG || {};
const HAS_BACKEND = CFG.WEB_APP_URL && !/PASTE_/.test(CFG.WEB_APP_URL);

const MTH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MTH_FULL = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
// ประเมินนิพจน์บวก/ลบ เช่น "91+161" → 252, "100-30" → 70; ถ้าไม่ใช่นิพจน์ +/- ใช้ num() ปกติ
const evalNum = v => {
  const s = String(v).replace(/[,\s]/g, '');
  if (!s) return 0;
  if (!/^[+-]?\d*\.?\d+([+-]\d*\.?\d+)*$/.test(s)) return num(s);
  const m = s.match(/[+-]?\d*\.?\d+/g);
  return m ? m.reduce((a, t) => a + parseFloat(t), 0) : 0;
};
const fmt = n => Number(Math.round(n * 100) / 100).toLocaleString('th-TH');
const baht = n => fmt(n) + ' ฿';
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- icons ---------- */
const IC = {
  bolt: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  water: '<path d="M12 2.5S5 10 5 14a7 7 0 0 0 14 0c0-4-7-11.5-7-11.5z"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 18l6-6-6-6"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.5"/>',
  grip: '<circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
};
const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[name] || ''}</svg>`;

/* ---------- state ---------- */
// role-based access: ผู้ใช้ใส่ PIN เดียว → server คืน me={role,caps,roomsRead,roomsWrite}
// เก็บ PIN ใน localStorage = auto-login ข้ามการปิด/เปิดเบราว์เซอร์
const MODULES = ['utility', 'purchase', 'rooms'];
const todayBE = () => { const n = new Date(); return { y: n.getFullYear() + 543, m: n.getMonth() + 1, d: n.getDate() }; };
const _tb = todayBE();
const S = {
  module: MODULES.includes(localStorage.getItem('kanda_module')) ? localStorage.getItem('kanda_module') : 'utility',
  pin: localStorage.getItem('kanda_pin') || '',
  me: null,                       // { role, label, caps, roomsRead, roomsWrite }
  theme: localStorage.getItem('kanda_theme') || 'light',
  data: { workers: [], bills: [], rounds: [], items: [], images: [], products: [], rentals: [], rates: [], notes: [] },
  ui: {
    worker: null, fromIdx: 0, toIdx: 0, roundId: null, collapsedYears: new Set(), _initFor: null, newGroups: [], catalog: false, pasteGid: null, pasteRid: null, pastePid: null, roundSearch: '',
    roomY: _tb.y, roomM: _tb.m, roomD: _tb.d, roomSel: null,   // roomSel = source ('maid'/'plug') หรือ 'compare'
  },
  roomQueue: [],                  // คิว setRoom ที่รอส่ง (กันเน็ตหลุด)
  roomSync: 'ok',                 // ok | pending | syncing | offline
  _roomWantScroll: true,          // เลื่อนจอมาที่วันนี้ครั้งแรกที่เปิดหน้าจด
  loading: false,
  error: '',
};
// โหลดคิวห้องพักที่ค้างจาก session ก่อน (reload ไม่หาย)
try { const q = JSON.parse(localStorage.getItem('kanda_roomq') || '[]'); if (Array.isArray(q)) S.roomQueue = q; } catch (e) { }

/* ---------- permission helpers ---------- */
function loggedIn() { return !HAS_BACKEND || !!S.me; }
function can(cap) { return !!(S.me && S.me.caps && S.me.caps[cap]); }
function canWriteSource(src) { return !!(S.me && S.me.roomsWrite && S.me.roomsWrite.indexOf(src) >= 0); }
function allowedModules() {
  if (!HAS_BACKEND) return MODULES.slice();
  const c = (S.me && S.me.caps) || {};
  const a = [];
  if (c.utilityRead || c.utilityWrite) a.push('utility');
  if (c.purchaseRead) a.push('purchase');
  if (c.rooms) a.push('rooms');
  return a;
}

/* ============================================================
   API client (Apps Script). POST uses text/plain body to skip
   CORS preflight; GET for reads.
   ============================================================ */
const api = {
  async raw(body) {
    const r = await fetch(CFG.WEB_APP_URL, { method: 'POST', body: JSON.stringify(body) });
    return r.json();
  },
  // คืน { data, me } — ไม่แตะ S.data (ให้ผู้เรียกจัดการ เพื่อให้ pollOnce เทียบ diff ได้)
  async getAll() {
    if (!HAS_BACKEND) return { data: demoData(), me: demoMe() };
    const j = await this.raw({ action: 'getAll', pin: S.pin });
    if (!j.ok) throw new Error(j.error || 'load failed');
    return { data: j.data, me: j.me };
  },
  // mutation ทั่วไป — รับ data/me กลับมาแล้วอัปเดต state (ใช้กับ action ที่อยากให้ render ใหม่)
  async post(action, payload = {}) {
    if (!HAS_BACKEND) throw new Error('ยังไม่ได้เชื่อม backend — ดู README.md');
    const j = await this.raw({ action, pin: S.pin, payload });
    if (!j.ok) throw new Error(j.error || 'request failed');
    if (j.data) S.data = j.data;
    if (j.me) S.me = j.me;
    return j;
  },
  // เรียกแบบไม่มี side-effect ต่อ S.data (ใช้กับ autosave ห้องพัก ที่จัดการ state เองแบบ optimistic)
  async call(action, payload = {}) {
    if (!HAS_BACKEND) return { ok: true };
    const j = await this.raw({ action, pin: S.pin, payload });
    if (!j.ok) throw new Error(j.error || 'request failed');
    return j;
  },
};

/* ---------- toast ---------- */
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = (kind === 'ok' ? svg('check') : '') + `<span>${esc(msg)}</span>`;
  $('#toastWrap').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- modal ---------- */
function openModal(html) { $('#modalBox').innerHTML = html; $('#modalBg').classList.add('show'); }
function closeModal() { $('#modalBg').classList.remove('show'); }
$('#modalBg').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

/* ============================================================
   Calculations
   ============================================================ */
function workerObj(name) { return S.data.workers.find(w => w.name === name) || { name, elecRate: 7, waterRate: 30 }; }

// เรตต่อเดือน — ถ้าเดือนนั้นไม่มีเรต (ข้อมูลเก่า) ใช้ค่าเริ่มต้นของคนงาน (7/30)
function billRates(b, w) {
  return {
    er: num(b.elecRate) || num(w.elecRate) || 7,
    wr: num(b.waterRate) || num(w.waterRate) || 30,
  };
}
function calcBill(b, w) {
  const eU = Math.max(0, num(b.eNew) - num(b.eOld));
  const wU = Math.max(0, num(b.wNew) - num(b.wOld));
  const { er, wr } = billRates(b, w);
  const eC = eU * er, wC = wU * wr;
  return { eU, wU, eC, wC, total: num(b.rent) + eC + wC + num(b.extra) };
}
function workerBills(name) {
  return S.data.bills.filter(b => b.worker === name)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
}
function roundItems(rid) { return S.data.items.filter(i => i.roundId === rid); }
function roundImages(rid) { return (S.data.images || []).filter(i => i.roundId === rid); }
function roundTotals(rid) {
  return roundItems(rid).reduce((a, it) => ({
    price: a.price + num(it.price), shipping: a.shipping + num(it.shipping),
    discount: a.discount + num(it.discount), total: a.total + num(it.total), count: a.count + 1,
  }), { price: 0, shipping: 0, discount: 0, total: 0, count: 0 });
}

/* ---- receipt groups (ใบเสร็จ) within a round ---- */
function groupItems(gid) { return S.data.items.filter(i => i.groupId === gid); }
function groupImages(gid) { return (S.data.images || []).filter(i => i.groupId === gid); }
function groupTotals(gid) {
  return groupItems(gid).reduce((a, it) => ({
    price: a.price + num(it.price), shipping: a.shipping + num(it.shipping),
    discount: a.discount + num(it.discount), total: a.total + num(it.total), count: a.count + 1,
  }), { price: 0, shipping: 0, discount: 0, total: 0, count: 0 });
}
// รวม groupId ทั้งจากข้อมูลจริง + ใบเสร็จใหม่ที่เพิ่งสร้าง (ยังว่าง) ของรอบนี้ เรียงตามวันที่
/* ---- product catalog ---- */
function normProd(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
function productByName(name) { const k = normProd(name); return (S.data.products || []).find(p => normProd(p.name) === k); }
function productMatches(query) {
  const q = String(query).trim().toLowerCase();
  if (!q) return [];
  const toks = q.split(/\s+/);
  return (S.data.products || []).filter(p => { const n = p.name.toLowerCase(); return toks.every(t => n.includes(t)); }).slice(0, 8);
}

function roundGroups(rid) {
  const ids = new Set();
  S.data.items.forEach(i => { if (i.roundId === rid && i.groupId) ids.add(i.groupId); });
  (S.data.images || []).forEach(i => { if (i.roundId === rid && i.groupId) ids.add(i.groupId); });
  (S.ui.newGroups || []).forEach(g => { if (g.rid === rid) ids.add(g.gid); });
  const arr = [...ids].map(gid => {
    const its = groupItems(gid);
    const dates = its.map(x => x.date).filter(Boolean).sort();
    return { gid, minDate: dates[0] || '9999', count: its.length };
  });
  arr.sort((a, b) => a.minDate.localeCompare(b.minDate) || a.gid.localeCompare(b.gid));
  arr.forEach((g, i) => g.label = 'ใบเสร็จ ' + (i + 1));
  return arr;
}

/* ============================================================
   ROOT RENDER
   ============================================================ */
function render() {
  applyTheme();
  const view = $('#view');

  // Entry gate: must unlock the site once (real backend only)
  if (HAS_BACKEND && !loggedIn()) {
    $('#lockBtn').classList.add('hidden');
    $('#moduleSeg').classList.add('hidden');   // ซ่อนแท็บตอนยังไม่ล็อกอิน (กันกดแล้วฟอร์มหาย)
    if (!$('.gate')) entryGate();              // คงฟอร์ม login ไว้ ไม่ล้าง #view ทิ้ง
    return;
  }
  $('#lockBtn').classList.toggle('hidden', !HAS_BACKEND);
  $('#moduleSeg').classList.remove('hidden');

  // แสดงเฉพาะแท็บที่ role อนุญาต + เลือกโมดูลที่ถูกต้อง
  const allowed = allowedModules();
  if (allowed.length && !allowed.includes(S.module)) { S.module = allowed[0]; localStorage.setItem('kanda_module', S.module); }
  $$('#moduleSeg button').forEach(b => {
    const ok = allowed.includes(b.dataset.module);
    b.hidden = !ok;
    b.classList.toggle('active', b.dataset.module === S.module);
  });

  if (S.loading) { view.innerHTML = skeletonView(); return; }
  if (S.error) { view.innerHTML = errorView(S.error); return; }
  if (!HAS_BACKEND) renderBackendBanner();

  if (S.module === 'utility') view.innerHTML = renderUtility();
  else if (S.module === 'purchase') view.innerHTML = renderPurchase();
  else view.innerHTML = renderRooms();
}

function renderBackendBanner() {
  if ($('#beBanner')) return;
  const b = document.createElement('div');
  b.id = 'beBanner';
  b.className = 'no-print';
  b.style.cssText = 'background:var(--warning-50);color:var(--warning);border-bottom:1px solid var(--border);padding:8px 16px;font-size:13px;font-weight:600;text-align:center';
  b.textContent = '⚠ โหมดตัวอย่าง (ยังไม่ได้เชื่อม Google Sheet) — ทำตามขั้นตอนใน README.md แล้ววาง URL ใน config.js';
  $('.app-header').after(b);
}

/* ============================================================
   MODULE 1: UTILITY (ค่าน้ำค่าไฟ)
   ============================================================ */
function renderUtility() {
  const admin = can('utilityWrite');   // สิทธิ์แก้ค่าน้ำค่าไฟ (owner/plug)
  if (!S.ui.worker || !S.data.workers.find(w => w.name === S.ui.worker))
    S.ui.worker = S.data.workers[0] ? S.data.workers[0].name : null;

  if (!S.ui.worker) {
    return panelEmpty('box', 'ยังไม่มีคนงาน', admin ? 'กดปุ่มด้านล่างเพื่อเพิ่มคนงานคนแรก' : 'ผู้ดูแลยังไม่ได้เพิ่มข้อมูล') +
      (admin ? `<div class="mt4"><button class="btn btn-primary" onclick="addWorkerPrompt()">${svg('plus')} เพิ่มคนงาน</button></div>` : '');
  }

  const name = S.ui.worker;
  const w = workerObj(name);
  const rows = workerBills(name);
  initRangeFor(name, rows);
  clampRange(rows.length);
  const sum = rangeSummary(rows, w);
  // เรตล่าสุด (จากเดือนล่าสุด) ใช้เป็นค่าเริ่มต้นของฟอร์มเพิ่มเดือน
  const lastBill = rows[rows.length - 1];
  const lastErate = lastBill && num(lastBill.elecRate) ? num(lastBill.elecRate) : (num(w.elecRate) || 7);
  const lastWrate = lastBill && num(lastBill.waterRate) ? num(lastBill.waterRate) : (num(w.waterRate) || 30);

  return `
  ${tabsHTML(admin)}
  <div class="card card-pad">
    <div class="toolbar between" style="align-items:center">
      <div class="section-title">${svg('calendar')} สรุปยอดตามช่วงเดือน — ${esc(name)}</div>
      <div class="row no-print">
        ${admin ? `<button class="btn btn-danger btn-sm" onclick="deleteWorkerPrompt()">${svg('trash')} ลบคนงาน</button>` : ''}
      </div>
    </div>

    <div class="toolbar">
      <div class="field"><label>ตั้งแต่</label>${rangeSelect('from', rows)}</div>
      <div class="field"><label>ถึง</label>${rangeSelect('to', rows)}</div>
      <button class="btn btn-ghost btn-sm no-print" onclick="rangeAll()">ทั้งหมด</button>
      <button class="btn btn-ghost btn-sm no-print" onclick="rangeUnpaid()">เฉพาะค้างชำระ</button>
      <div class="grow"></div>
      <button class="btn btn-accent no-print" onclick="printUtility()">${svg('printer')} พิมพ์ช่วงที่เลือก</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi kpi-hero due"><div class="kpi-label">ยอดค้างชำระ</div><div class="kpi-value num">${baht(sum.dueTotal)}</div><div class="kpi-sub">${sum.dueCount} เดือน · ${esc(sum.rangeLabel)}</div></div>
      <div class="kpi kpi-hero paid"><div class="kpi-label">จ่ายแล้ว</div><div class="kpi-value num">${baht(sum.paidTotal)}</div><div class="kpi-sub">${sum.paidCount} เดือน</div></div>
      <div class="kpi is-success"><div class="kpi-label">ค่าเช่า</div><div class="kpi-value num">${fmt(sum.rent)}</div><div class="kpi-sub">${sum.count} เดือน</div></div>
      <div class="kpi is-accent"><div class="kpi-label">${svg('bolt')} ค่าไฟ</div><div class="kpi-value num">${fmt(sum.eC)}</div><div class="kpi-sub">${fmt(sum.eU)} หน่วย</div></div>
      <div class="kpi is-water"><div class="kpi-label">${svg('water')} ค่าน้ำ</div><div class="kpi-value num">${fmt(sum.wC)}</div><div class="kpi-sub">${fmt(sum.wU)} หน่วย</div></div>
      <div class="kpi is-danger"><div class="kpi-label">ค่าปรับ/อื่นๆ</div><div class="kpi-value num">${fmt(sum.extra)}</div><div class="kpi-sub">รวมทั้งช่วง ${fmt(sum.total)}</div></div>
    </div>

    <div class="row mt4" style="font-size:13px;color:var(--text-2)">
      <span>${svg('bolt')} เรตไฟล่าสุด <b>${fmt(lastErate)}</b> ฿/หน่วย · ${svg('water')} เรตน้ำล่าสุด <b>${fmt(lastWrate)}</b> ฿/หน่วย</span>
      ${admin ? '<span class="dim">— ปรับเรตได้ตอนเพิ่มเดือนใหม่ด้านล่าง</span>' : ''}
    </div>
  </div>

  <div class="card mt4">
    <div class="card-pad" style="padding-bottom:0"><div class="section-title">${svg('receipt')} บันทึกรายเดือน</div></div>
    <div class="table-scroll mt4">${utilityTable(rows, w, admin)}</div>
    ${admin ? utilityAddForm(lastErate, lastWrate) : ''}
  </div>`;
}

function tabsHTML(admin) {
  let h = '<div class="tabs no-print">';
  S.data.workers.forEach((w, i) => {
    h += `<button class="tab ${w.name === S.ui.worker ? 'active' : ''}" onclick="selectWorker(${i})">${svg('user')} ${esc(w.name)}</button>`;
  });
  if (admin) h += `<button class="tab tab-add" title="เพิ่มคนงาน" onclick="addWorkerPrompt()">+</button>`;
  h += '</div>';
  return h;
}

function rangeSelect(which, rows) {
  const sel = which === 'from' ? S.ui.fromIdx : S.ui.toIdx;
  let o = '';
  rows.forEach((b, i) => { o += `<option value="${i}" ${i === sel ? 'selected' : ''}>${MTH[b.month]} ${b.year}${b.paid ? ' ✓' : ''}</option>`; });
  if (!rows.length) o = '<option>—</option>';
  return `<select class="input" style="min-width:130px" onchange="setRange('${which}',this.value)">${o}</select>`;
}

function utilityTable(rows, w, admin) {
  if (!rows.length) return panelEmpty('receipt', 'ยังไม่มีรายการ', admin ? 'เพิ่มรายการเดือนแรกด้านล่าง' : '');
  const lo = Math.min(S.ui.fromIdx, S.ui.toIdx), hi = Math.max(S.ui.fromIdx, S.ui.toIdx);
  const collapsed = S.ui.collapsedYears || new Set();
  let lastY = null, body = '';

  rows.forEach((b, i) => {
    const c = calcBill(b, w);
    const { er, wr } = billRates(b, w);
    const sel = i >= lo && i <= hi;

    if (b.year !== lastY) {
      const yr = rows.filter(x => x.year === b.year);
      const yTotal = yr.reduce((a, x) => a + calcBill(x, w).total, 0);
      const yDue = yr.filter(x => !x.paid).length;
      const isCol = collapsed.has(b.year);
      body += `<tr class="row-group"><td class="l" colspan="14">
        <button class="yr-toggle" onclick="toggleYear(${b.year})">${isCol ? '▸' : '▾'} พ.ศ. ${b.year}</button>
        <span class="yr-sum">${yDue ? `<span class="badge due">ค้าง ${yDue} เดือน</span>` : '<span class="badge paid">จ่ายครบ</span>'} รวมทั้งปี ${fmt(yTotal)} ฿</span>
      </td></tr>`;
      lastY = b.year;
    }
    if (collapsed.has(b.year)) return;

    // ตัวเลขแก้ไขได้ + ใส่ลูกน้ำหลักพัน (ตอนแก้ไข num() ตัดลูกน้ำให้เอง)
    const ed = (f, v, cls) => admin
      ? `<td class="${cls || ''}"><span class="cell-edit" contenteditable="true" onblur="editBill('${b.id}','${f}',this.textContent)">${esc(fmt(v))}</span></td>`
      : `<td class="${cls || ''}">${esc(fmt(v))}</td>`;
    const edNote = admin
      ? `<span class="cell-edit" contenteditable="true" onblur="editBill('${b.id}','note',this.textContent)">${esc(b.note || '')}</span>`
      : esc(b.note || '');
    const rateHint = r => `<div class="dim" style="font-size:10px;font-weight:400;line-height:1">@${fmt(r)} ฿/น.</div>`;
    body += `<tr class="${b.paid ? 'paid' : ''} ${sel ? 'sel-row' : ''}">
      <td class="l strong"${b.updatedAt ? ` title="แก้ไขล่าสุด ${esc(b.updatedAt)}"` : ''}>${MTH[b.month]} ${b.year} ${b.paid ? '<span class="badge paid">จ่ายแล้ว</span>' : ''}</td>
      ${ed('rent', b.rent, 'gc-rent gstart')}
      ${ed('eOld', b.eOld, 'gc-elec gstart')}${ed('eNew', b.eNew, 'gc-elec')}
      <td class="gc-elec dim">${fmt(c.eU)}</td><td class="gc-elec" style="color:var(--accent);font-weight:600">${fmt(c.eC)}${rateHint(er)}</td>
      ${ed('wOld', b.wOld, 'gc-water gstart')}${ed('wNew', b.wNew, 'gc-water')}
      <td class="gc-water dim">${fmt(c.wU)}</td><td class="gc-water" style="color:var(--secondary);font-weight:600">${fmt(c.wC)}${rateHint(wr)}</td>
      ${ed('extra', b.extra, 'gstart')}
      <td class="total-cell strong" style="color:var(--danger)">${fmt(c.total)}</td>
      <td class="l" style="max-width:160px;font-size:12.5px;color:var(--text-2)">${edNote}</td>
      <td class="c col-action">
        <div class="row" style="gap:6px;justify-content:center;flex-wrap:nowrap">
          ${admin ? `<input class="cb" type="checkbox" ${b.paid ? 'checked' : ''} title="จ่ายแล้ว" onchange="togglePaid('${b.id}',this.checked)">
          <button class="btn btn-danger btn-sm" onclick="deleteBill('${b.id}')">${svg('trash')}</button>`
        : (b.paid ? svg('check', '') : '')}
        </div>
      </td>
    </tr>`;
  });

  return `<table class="data util-table">
    <thead>
      <tr>
        <th class="l" rowspan="2">เดือน</th>
        <th class="grp grp-rent gstart" rowspan="2">ค่าเช่า</th>
        <th class="grp grp-elec gstart" colspan="4">⚡ ไฟฟ้า</th>
        <th class="grp grp-water gstart" colspan="4">💧 น้ำประปา</th>
        <th class="gstart" rowspan="2">อื่นๆ</th>
        <th rowspan="2">รวม</th>
        <th class="l" rowspan="2">หมายเหตุ</th>
        <th class="c col-action" rowspan="2">จัดการ</th>
      </tr>
      <tr>
        <th class="sub-elec gstart">ไฟเก่า</th><th class="sub-elec">ไฟใหม่</th><th class="sub-elec">หน่วย</th><th class="sub-elec">ค่าไฟ</th>
        <th class="sub-water gstart">น้ำเก่า</th><th class="sub-water">น้ำใหม่</th><th class="sub-water">หน่วย</th><th class="sub-water">ค่าน้ำ</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function utilityAddForm(dErate, dWrate) {
  let mo = '';
  for (let m = 1; m <= 12; m++) mo += `<option value="${m}">${MTH_FULL[m]}</option>`;
  const yNow = new Date().getFullYear() + 543;
  return `<div class="card-pad no-print" style="border-top:1px solid var(--border);background:var(--surface-2)">
    <div class="section-title" style="margin-bottom:14px">${svg('plus')} เพิ่มรายการเดือนใหม่</div>
    <div class="addform-groups">

      <fieldset class="addgroup">
        <legend>${svg('calendar')} ข้อมูลเดือน</legend>
        <div class="addgrid">
          <div class="field"><label>ปี (พ.ศ.)</label><input class="input num-input" id="aY" type="number" value="${yNow}"></div>
          <div class="field"><label>เดือน</label><select class="input" id="aM">${mo}</select></div>
          <div class="field"><label>ค่าเช่า</label><input class="input num-input" id="aRent" type="number" value="2000"></div>
          <div class="field"><label>ค่าปรับ/อื่นๆ</label><input class="input num-input" id="aEx" type="number" value="0"></div>
          <div class="field" style="grid-column:1/-1"><label>หมายเหตุ</label><input class="input" id="aNote" placeholder="(ไม่บังคับ)"></div>
        </div>
      </fieldset>

      <fieldset class="addgroup g-elec">
        <legend>${svg('bolt')} ค่าไฟฟ้า</legend>
        <div class="addgrid">
          <div class="field"><label>มิเตอร์เก่า</label><input class="input num-input" id="aEO" type="number" placeholder="อัตโนมัติ"></div>
          <div class="field"><label>มิเตอร์ใหม่</label><input class="input num-input" id="aEN" type="number"></div>
          <div class="field"><label>ราคา/หน่วย</label><input class="input num-input" id="aErate" type="number" step="0.5" value="${dErate}"></div>
        </div>
      </fieldset>

      <fieldset class="addgroup g-water">
        <legend>${svg('water')} ค่าน้ำประปา</legend>
        <div class="addgrid">
          <div class="field"><label>มิเตอร์เก่า</label><input class="input num-input" id="aWO" type="number" placeholder="อัตโนมัติ"></div>
          <div class="field"><label>มิเตอร์ใหม่</label><input class="input num-input" id="aWN" type="number"></div>
          <div class="field"><label>ราคา/หน่วย</label><input class="input num-input" id="aWrate" type="number" step="1" value="${dWrate}"></div>
        </div>
      </fieldset>

    </div>
    <div class="mt4"><button class="btn btn-success" id="addBillBtn" onclick="addBill()">${svg('plus')} เพิ่มรายการ</button></div>
  </div>`;
}

/* utility range helpers */
function clampRange(len) {
  if (!len) { S.ui.fromIdx = 0; S.ui.toIdx = 0; return; }
  if (S.ui.fromIdx >= len) S.ui.fromIdx = 0;
  if (S.ui.toIdx >= len || S.ui.toIdx < 0) S.ui.toIdx = len - 1;
}
// ตั้งค่าเริ่มต้นต่อคนงาน (ครั้งเดียว): เลือกช่วงค้างชำระ + ย่อปีที่จ่ายครบ
function initRangeFor(name, rows) {
  if (S.ui._initFor === name) return;
  S.ui._initFor = name;
  const unpaid = rows.map((b, i) => b.paid ? -1 : i).filter(i => i >= 0);
  if (unpaid.length) { S.ui.fromIdx = unpaid[0]; S.ui.toIdx = unpaid[unpaid.length - 1]; }
  else { S.ui.fromIdx = 0; S.ui.toIdx = Math.max(0, rows.length - 1); }
  const years = {};
  rows.forEach(b => { (years[b.year] = years[b.year] || []).push(b); });
  S.ui.collapsedYears = new Set(Object.keys(years).filter(y => years[y].every(b => b.paid)).map(Number));
}
function rangeSummary(rows, w) {
  const lo = Math.min(S.ui.fromIdx, S.ui.toIdx), hi = Math.max(S.ui.fromIdx, S.ui.toIdx);
  // breakdown (ค่าเช่า/ค่าไฟ/ค่าน้ำ/อื่นๆ) = รวมทุกเดือนในช่วง  /  due,paid = แยกตามสถานะจ่าย
  const s = { rent: 0, eU: 0, eC: 0, wU: 0, wC: 0, extra: 0, total: 0, dueTotal: 0, paidTotal: 0, paidCount: 0, dueCount: 0, count: 0 };
  rows.forEach((b, i) => {
    if (i < lo || i > hi) return;
    const c = calcBill(b, w);
    s.rent += num(b.rent); s.eU += c.eU; s.eC += c.eC; s.wU += c.wU; s.wC += c.wC; s.extra += num(b.extra); s.total += c.total; s.count++;
    if (b.paid) { s.paidTotal += c.total; s.paidCount++; } else { s.dueTotal += c.total; s.dueCount++; }
  });
  s.rangeLabel = (rows[lo] && rows[hi]) ? `${MTH[rows[lo].month]} ${rows[lo].year} – ${MTH[rows[hi].month]} ${rows[hi].year}` : '';
  return s;
}
function toggleYear(y) {
  const set = S.ui.collapsedYears || (S.ui.collapsedYears = new Set());
  if (set.has(y)) set.delete(y); else set.add(y);
  render();
}

/* ============================================================
   MODULE 2: PURCHASE (สั่งซื้อ แบ่งรอบ)
   ============================================================ */
function renderPurchase() {
  const admin = can('purchaseWrite');   // สิทธิ์แก้สั่งซื้อ (owner เท่านั้น)
  if (S.ui.catalog) return renderCatalog(admin);
  if (S.ui.roundId) return renderRoundDetail(admin);

  const q = (S.ui.roundSearch || '').trim().toLowerCase();
  let all = [...S.data.rounds].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (q) {
    const toks = q.split(/\s+/);
    all = all.filter(r => {
      const prods = S.data.items.filter(it => it.roundId === r.roundId).map(it => it.product).join(' ');
      const hay = ((r.title || '') + ' ' + (r.date || '') + ' ' + prods).toLowerCase();
      return toks.every(t => hay.includes(t));
    });
  }
  const pending = all.filter(r => !r.done), done = all.filter(r => r.done);
  const orderPos = new Map(all.map((r, i) => [r.roundId, i + 1]));

  const card = r => {
    const t = roundTotals(r.roundId);
    const imgN = roundImages(r.roundId).length;
    const gN = roundGroups(r.roundId).length;
    return `<div class="round-cell">
      <button class="round-card ${r.done ? 'done' : ''}" onclick="openRound('${esc(r.roundId)}')">
        <div class="rc-top">
          <span class="rc-date">${svg('calendar')} ${esc(r.date || '-')}</span>
          ${r.done ? `<span class="badge paid">${svg('check')} จัดการแล้ว</span>` : '<span class="badge due">ยังไม่จัดการ</span>'}
        </div>
        <div class="rc-title">${esc(r.title || 'รอบสั่งซื้อ')}</div>
        <div class="rc-total num">${baht(t.total)}</div>
        <div class="rc-meta">${t.count} รายการ · ${gN} ใบเสร็จ${imgN ? ` · ${svg('image')} ${imgN}` : ''}</div>
      </button>
      ${roundPeekHtml(r, orderPos.get(r.roundId), all.length, 'left')}
    </div>`;
  };
  const section = (title, list, cls) => list.length ? `
    <div class="round-section">
      <div class="round-section-head ${cls}">${title} <span class="cnt">${list.length}</span></div>
      <div class="round-grid">${list.map(card).join('')}</div>
    </div>` : '';

  return `
  <div class="card card-pad">
    <div class="toolbar between" style="margin-bottom:0;align-items:center">
      <div class="section-title">${svg('cart')} รายการสั่งซื้อ แบ่งตามรอบ <span class="dim" style="font-weight:500;font-size:13px">(${all.length} รอบ)</span></div>
      <div class="row no-print">
        ${admin
      ? `<button class="btn btn-ghost btn-sm" onclick="openCatalog()">${svg('box')} จัดการสินค้า</button>
         <button class="btn btn-primary" onclick="addRoundPrompt()">${svg('plus')} เพิ่มรอบใหม่</button>`
      : `<span class="badge" style="background:var(--surface-3);color:var(--text-2)">${svg('lock')} อ่านอย่างเดียว</span>`}
      </div>
    </div>
    <div class="row mt2 no-print" style="gap:8px;align-items:center">
      <input id="roundSearch" class="input" style="max-width:340px" placeholder="ค้นหา: ชื่อรอบ / วันที่ / ชื่อสินค้า" value="${esc(S.ui.roundSearch || '')}" oninput="setRoundSearch(this.value)">
      ${q ? `<button class="btn btn-ghost btn-sm" onclick="setRoundSearch('')">✕ ล้าง</button><span class="dim" style="font-size:13px">พบ ${all.length} รอบ</span>` : ''}
    </div>
  </div>
  <div class="mt4">
    ${all.length
      ? section(`${svg('cart')} ยังไม่ได้จัดการ`, pending, 'pending') + section(`${svg('check')} จัดการแล้ว`, done, 'done')
      : (q ? panelEmpty('cart', 'ไม่พบรอบที่ตรงกับ “' + (S.ui.roundSearch || '').trim() + '”', 'ลองคำค้นอื่น หรือกดล้าง')
           : panelEmpty('cart', 'ยังไม่มีรอบสั่งซื้อ', admin ? 'กด “เพิ่มรอบใหม่”' : 'ผู้ดูแลยังไม่ได้เพิ่มข้อมูล'))}
  </div>`;
}

// การ์ด preview ตอน hover ปุ่มก่อนหน้า/ถัดไป — ลำดับ + รายการสินค้า + รูป
function roundPeekHtml(rd, pos, total, side) {
  const items = S.data.items.filter(it => it.roundId === rd.roundId);
  const rows = items.slice(0, 8).map(it => {
    const p = productByName(it.product);
    const thumb = p && p.url ? `<img src="${esc(p.url)}" alt="">` : '<span class="pk-noimg"></span>';
    return `<div class="pk-row">${thumb}<span class="pk-name">${esc(it.product)}</span><span class="pk-qty">×${fmt(it.qty)}</span></div>`;
  }).join('');
  const more = items.length > 8 ? `<div class="pk-more">+${items.length - 8} รายการ…</div>` : '';
  return `<div class="peek-pop ${side} no-print">
    <div class="pk-head">${pos}/${total} · ${esc(rd.date || '-')} · ${esc(rd.title || 'รอบสั่งซื้อ')}</div>
    ${rows || '<div class="pk-empty">ไม่มีสินค้า</div>'}${more}
  </div>`;
}
function renderRoundDetail(admin) {
  const r = S.data.rounds.find(x => x.roundId === S.ui.roundId);
  if (!r) { S.ui.roundId = null; return renderPurchase(); }
  const groups = roundGroups(r.roundId);
  const t = roundTotals(r.roundId);
  const ordered = [...S.data.rounds].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const idx = ordered.findIndex(x => x.roundId === r.roundId);
  const hasPrev = idx > 0, hasNext = idx >= 0 && idx < ordered.length - 1;

  return `
  <div class="row no-print" style="margin-bottom:12px">
    <button class="btn btn-ghost btn-sm" onclick="closeRound()">${svg('back')} กลับ</button>
    <span class="nav-peek">
      <button class="btn btn-ghost btn-sm" ${hasPrev ? '' : 'disabled'} onclick="gotoRound(-1)">${svg('chevL')} ก่อนหน้า</button>
      ${hasPrev ? roundPeekHtml(ordered[idx - 1], idx, ordered.length, 'left') : ''}
    </span>
    <span class="dim" style="font-size:12.5px">${idx + 1}/${ordered.length}</span>
    <span class="nav-peek">
      <button class="btn btn-ghost btn-sm" ${hasNext ? '' : 'disabled'} onclick="gotoRound(1)">ถัดไป ${svg('chevR')}</button>
      ${hasNext ? roundPeekHtml(ordered[idx + 1], idx + 2, ordered.length, 'right') : ''}
    </span>
    <div class="grow"></div>
    <button class="btn ${r.done ? 'btn-success' : 'btn-ghost'} btn-sm" onclick="toggleRoundDone('${esc(r.roundId)}', ${r.done ? 'false' : 'true'})">${svg('check')} ${r.done ? 'จัดการแล้ว' : 'ทำเครื่องหมายจัดการแล้ว'}</button>
    ${admin
      ? `<button class="btn btn-ghost btn-sm" onclick="editRoundPrompt('${esc(r.roundId)}')">${svg('edit')} แก้รอบ</button>
         <button class="btn btn-danger btn-sm" onclick="deleteRoundPrompt('${esc(r.roundId)}')">${svg('trash')} ลบรอบ</button>`
      : ''}
    <button class="btn btn-accent" onclick="printRound()">${svg('printer')} พิมพ์รอบนี้</button>
  </div>

  <div class="card card-pad">
    <div class="section-title">${svg('receipt')} ${esc(r.title || 'รอบสั่งซื้อ')} ${r.done ? `<span class="badge paid">${svg('check')} จัดการแล้ว</span>` : '<span class="badge due">ยังไม่จัดการ</span>'}</div>
    <div class="dim" style="font-size:13px;margin-top:2px">${svg('calendar')} ${esc(r.date || '-')} · ${groups.length} ใบเสร็จ</div>
    <div class="kpi-grid mt4">
      <div class="kpi kpi-hero total"><div class="kpi-label">ยอดสุทธิรอบนี้</div><div class="kpi-value num">${baht(t.total)}</div><div class="kpi-sub">${t.count} รายการ</div></div>
      <div class="kpi"><div class="kpi-label">ราคาสินค้า</div><div class="kpi-value num">${fmt(t.price)}</div></div>
      <div class="kpi is-accent"><div class="kpi-label">ค่าส่ง</div><div class="kpi-value num">${fmt(t.shipping)}</div></div>
      <div class="kpi is-success"><div class="kpi-label">ส่วนลด</div><div class="kpi-value num">${fmt(t.discount)}</div></div>
    </div>
  </div>

  <div class="mt4">
    ${groups.map(g => groupCard(r, g, admin)).join('')}
    ${admin ? `<button class="btn btn-ghost no-print mt2" onclick="addGroup('${esc(r.roundId)}')">${svg('plus')} เพิ่มใบเสร็จใหม่</button>` : ''}
    ${(!groups.length && !admin) ? panelEmpty('receipt', 'ยังไม่มีใบเสร็จในรอบนี้', '') : ''}
  </div>`;
}

function groupCard(r, g, admin) {
  const imgs = groupImages(g.gid);
  const t = groupTotals(g.gid);
  const gallery = imgs.map(im => `
    <div class="receipt-thumb">
      <img class="zoomable" src="${esc(im.url)}" alt="ใบเสร็จ" loading="lazy" onclick="lightbox('${esc(im.url)}')">
      ${admin ? `<button class="receipt-del no-print" title="ลบรูป" onclick="deleteRoundImage('${esc(im.id)}')">${svg('trash')}</button>` : ''}
    </div>`).join('');
  const armed = g.gid === S.ui.pasteGid;
  const uploadTile = admin ? `<div class="receipt-add ${armed ? 'armed' : ''} no-print" data-gid="${esc(g.gid)}" tabindex="0" title="คลิกเลือกใบนี้ แล้วกด Ctrl+V เพื่อวางรูป" onclick="armPaste('${esc(g.gid)}','${esc(r.roundId)}')" onfocus="armPaste('${esc(g.gid)}','${esc(r.roundId)}')">
      ${svg('camera')}<span>เพิ่มรูป</span>
      <span class="ra-hint">${armed ? 'พร้อมวาง · Ctrl+V' : 'คลิก แล้ว Ctrl+V'}</span>
      <button class="ra-file" onclick="event.stopPropagation();pickRoundImage('${esc(g.gid)}','${esc(r.roundId)}')">เลือกไฟล์</button>
    </div>` : '';
  const drop = admin ? `ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropItem(event,'${esc(g.gid)}')"` : '';
  return `<div class="receipt-card" ${drop}>
    <div class="receipt-card-head">
      <div class="section-title" style="font-size:14px">${svg('receipt')} ${esc(g.label)}
        <span class="dim" style="font-weight:500;font-size:12px">· ${t.count} ชิ้น · <b style="color:var(--primary)">${baht(t.total)}</b></span></div>
      ${admin ? `<button class="btn btn-danger btn-sm no-print" onclick="deleteGroupPrompt('${esc(g.gid)}')">${svg('trash')} ลบใบเสร็จ</button>` : ''}
    </div>
    ${(imgs.length || admin) ? `<div class="receipt-grid receipt-grid-sm">${gallery}${uploadTile}</div>` : ''}
    ${groupItemsTable(g.gid, admin)}
    ${admin ? groupAddForm(r, g.gid) : ''}
  </div>`;
}

function groupItemsTable(gid, admin) {
  const items = groupItems(gid).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const t = groupTotals(gid);
  const ed = (it, f, v, left) => admin
    ? `<span class="cell-edit" contenteditable="true" onblur="editItem('${it.id}','${f}',this.textContent)">${esc(left ? (v || '') : fmt(v))}</span>`
    : esc(left ? (v || '') : fmt(v));
  // ค่าส่ง/ส่วนลด: แสดง "-" ถ้าเป็น 0
  const edDash = (it, f, v) => admin
    ? `<span class="cell-edit" contenteditable="true" onblur="editItem('${it.id}','${f}',this.textContent)">${num(v) === 0 ? '-' : fmt(v)}</span>`
    : (num(v) === 0 ? '-' : esc(fmt(v)));
  const prodThumb = name => { const p = productByName(name); return p && p.url ? `<img class="item-thumb zoomable" src="${esc(p.url)}" alt="" onclick="lightbox('${esc(p.url)}')">` : ''; };
  const body = items.map(it => `<tr>
    <td class="l dim cell-date"${it.updatedAt ? ` title="แก้ไขล่าสุด ${esc(it.updatedAt)}"` : ''}>${ed(it, 'date', it.date, true)}</td>
    <td class="l">${prodThumb(it.product)}${ed(it, 'product', it.product, true)}</td>
    <td class="l">${ed(it, 'option', it.option, true)}</td>
    <td>${ed(it, 'qty', it.qty)}</td>
    <td>${ed(it, 'unitPrice', it.unitPrice)}</td>
    <td>${fmt(it.price)}</td>
    <td>${edDash(it, 'shipping', it.shipping)}</td>
    <td>${edDash(it, 'discount', it.discount)}</td>
    <td class="strong">${fmt(it.total)}</td>
    ${admin ? `<td class="c col-action"><div class="row-actions">
      <span class="drag-handle" draggable="true" ondragstart="dragItem(event,'${it.id}')" title="ลากไปวางที่ใบเสร็จอื่น (เดสก์ท็อป)">${svg('grip')}</span>
      <button class="btn btn-ghost btn-sm" title="ย้ายไปใบเสร็จอื่น" onclick="moveItemPrompt('${it.id}')">${svg('receipt')}</button>
      <button class="btn btn-danger btn-sm" onclick="deleteItem('${it.id}')">${svg('trash')}</button>
    </div></td>` : ''}
  </tr>`).join('');
  return `<div class="table-scroll"><table class="data">
    <thead><tr><th class="l">วันที่</th><th class="l">สินค้า</th><th class="l">ตัวเลือก</th><th>จำนวน</th><th>ต่อหน่วย</th><th>ราคา</th><th>ค่าส่ง</th><th>ส่วนลด</th><th>รวม</th>${admin ? '<th class="c col-action">จัดการ</th>' : ''}</tr></thead>
    <tbody>${body || `<tr><td colspan="${admin ? 10 : 9}" class="l dim" style="padding:16px">ยังไม่มีสินค้าในใบเสร็จนี้${admin ? ' — เพิ่มด้านล่าง' : ''}</td></tr>`}</tbody>
    <tfoot><tr><td class="l" colspan="5">รวมใบเสร็จ (${t.count})</td><td>${fmt(t.price)}</td><td>${num(t.shipping) === 0 ? '-' : fmt(t.shipping)}</td><td>${num(t.discount) === 0 ? '-' : fmt(t.discount)}</td><td>${fmt(t.total)}</td>${admin ? '<td class="col-action"></td>' : ''}</tr></tfoot>
  </table></div>`;
}

/* ---- catalog management view (PIN-2 only) ---- */
function renderCatalog(admin) {
  const prods = [...(S.data.products || [])].sort((a, b) => a.name.localeCompare(b.name, 'th'));
  return `
  <div class="row no-print" style="margin-bottom:12px">
    <button class="btn btn-ghost btn-sm" onclick="closeCatalog()">${svg('back')} กลับ</button>
    <div class="grow"></div>
    ${admin ? `<button class="btn btn-primary" onclick="addProductPrompt()">${svg('plus')} เพิ่มสินค้า</button>` : ''}
  </div>
  <div class="card card-pad">
    <div class="section-title">${svg('box')} แคตตาล็อกสินค้า <span class="dim" style="font-weight:500;font-size:13px">(${prods.length} รายการ)</span></div>
    <div class="dim" style="font-size:12.5px;margin-top:2px">ใช้สำหรับช่วยกรอกชื่อตอนเพิ่มสินค้า (พิมพ์แล้วเด้งให้เลือก) · แก้ชื่อ/ใส่รูปได้ที่นี่${admin ? ' · <b>คลิกเลือกสินค้า แล้วกด Ctrl+V เพื่อวางรูป</b>' : ''}</div>
    ${prods.length ? `<div class="catalog-list mt4">${prods.map(p => catalogRow(p, admin)).join('')}</div>` : panelEmpty('box', 'ยังไม่มีสินค้าในแคตตาล็อก', admin ? 'กด “เพิ่มสินค้า”' : '')}
  </div>`;
}
function catalogRow(p, admin) {
  const armed = admin && p.productId === S.ui.pastePid;
  const imgClick = p.url ? `onclick="event.stopPropagation();lightbox('${esc(p.url)}')"` : '';
  return `<div class="catalog-row${armed ? ' armed' : ''}"${admin ? ` data-pid="${esc(p.productId)}" onclick="armProductPaste('${esc(p.productId)}')" title="คลิกเลือกสินค้านี้ แล้วกด Ctrl+V เพื่อวางรูป"` : ''}>
    <div class="crow-img">
      ${p.url ? `<img class="zoomable" src="${esc(p.url)}" alt="${esc(p.name)}" loading="lazy" ${imgClick}>` : '<span class="dim" style="font-size:10px">ไม่มีรูป</span>'}
    </div>
    ${admin
      ? `<input class="input crow-name" value="${esc(p.name)}" onclick="event.stopPropagation()" onblur="updateProduct('${esc(p.productId)}',this.value)">
         <div class="crow-actions">
           <button class="btn btn-ghost btn-sm" onclick="pickProductImage('${esc(p.productId)}')">${svg('camera')} ${p.url ? 'เปลี่ยนรูป' : 'ใส่รูป'}</button>
           ${p.url ? `<button class="btn btn-ghost btn-sm" title="ลบรูป" onclick="deleteProductImage('${esc(p.productId)}')">${svg('image')}✕</button>` : ''}
           <button class="btn btn-danger btn-sm" onclick="deleteProductPrompt('${esc(p.productId)}')">${svg('trash')} ลบ</button>
         </div>`
      : `<div class="crow-name-ro">${esc(p.name)}</div>`}
  </div>`;
}

/* ---- product autocomplete dropdown ---- */
function prodAuto(inp) {
  const field = inp.closest('.ac-field'); if (!field) return;
  let box = field.querySelector('.ac-box');
  if (!box) { box = document.createElement('div'); box.className = 'ac-box'; field.appendChild(box); }
  const q = inp.value.trim();
  const matches = productMatches(q);
  let html = matches.map(p => `<div class="ac-item" data-name="${esc(p.name)}" onmousedown="prodPick(event,this,'${inp.id}')">${p.url ? `<img src="${esc(p.url)}" alt="">` : '<span class="ac-noimg"></span>'}<span>${esc(p.name)}</span></div>`).join('');
  // ถ้าพิมพ์ชื่อที่ยังไม่มีในแคตตาล็อก → เสนอเพิ่มลงแคตตาล็อก
  if (q && !productByName(q)) html += `<div class="ac-item ac-add" onmousedown="prodAddNew(event,'${inp.id}')">${svg('plus')}<span>เพิ่ม “${esc(q)}” ลงแคตตาล็อก</span></div>`;
  if (!html) { box.style.display = 'none'; box.innerHTML = ''; return; }
  box.innerHTML = html; box.style.display = 'block';
}
async function prodAddNew(ev, inpId) {
  ev.preventDefault();
  const inp = document.getElementById(inpId); if (!inp) return;
  const name = inp.value.trim(); if (!name) return;
  const box = inp.closest('.ac-field').querySelector('.ac-box'); if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  if (productByName(name)) { toast('มีในแคตตาล็อกแล้ว'); return; }
  try { await api.post('addProduct', { name }); toast('เพิ่มลงแคตตาล็อกแล้ว', 'ok'); }  // ไม่ render เพื่อไม่ให้ฟอร์มที่กำลังกรอกหาย
  catch (e) { toast(e.message || 'เพิ่มไม่สำเร็จ', 'err'); }
}
function prodPick(ev, el, inpId) {
  ev.preventDefault();
  const name = el.dataset.name;
  const inp = document.getElementById(inpId); if (!inp) return;
  inp.value = name;
  const box = el.closest('.ac-box'); if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  const gid = inpId.replace('iProduct_', '');
  const unit = document.getElementById('iUnit_' + gid);
  if (unit && !num(unit.value)) {
    const hist = S.data.items.filter(i => i.product === name);
    if (hist.length) unit.value = hist[hist.length - 1].unitPrice;
  }
}
function prodHide(inp) { setTimeout(() => { const f = inp.closest('.ac-field'); const b = f && f.querySelector('.ac-box'); if (b) b.style.display = 'none'; }, 150); }

function groupAddForm(r, gid) {
  return `<div class="receipt-addform no-print">
    <div class="addgrid">
      <div class="field"><label>วันที่</label><input class="input" id="iDate_${gid}" type="date" value="${esc(r.date || todayISO())}"></div>
      <div class="field ac-field" style="grid-column:span 2"><label>สินค้า <span class="req">*</span></label><input class="input" id="iProduct_${gid}" placeholder="พิมพ์เพื่อค้นหา/เพิ่ม" autocomplete="off" oninput="prodAuto(this)" onfocus="prodAuto(this)" onblur="prodHide(this)"></div>
      <div class="field"><label>ตัวเลือก</label><input class="input" id="iOption_${gid}" placeholder="เช่น สี/ขนาด"></div>
      <div class="field"><label>จำนวน</label><input class="input num-input" id="iQty_${gid}" type="number" value="1"></div>
      <div class="field"><label>ราคา/หน่วย</label><input class="input num-input" id="iUnit_${gid}" type="text" inputmode="text" value="0" title="ใส่บวก/ลบได้ เช่น 91+161"></div>
      <div class="field"><label>ค่าส่ง</label><input class="input num-input" id="iShip_${gid}" type="text" inputmode="text" value="0" title="ใส่บวก/ลบได้ เช่น 91+161"></div>
      <div class="field"><label>ส่วนลด</label><input class="input num-input" id="iDisc_${gid}" type="text" inputmode="text" value="0" title="ใส่บวก/ลบได้ เช่น 91+161"></div>
      <div class="field" style="justify-content:flex-end"><button class="btn btn-success" id="addItemBtn_${gid}" onclick="addItem('${esc(r.roundId)}','${esc(gid)}')">${svg('plus')} เพิ่มสินค้า</button></div>
    </div>
  </div>`;
}

/* ============================================================
   MODULE 3: ROOMS (ห้องพัก) — dual-entry maid/plug + เทียบ
   ============================================================ */
const SRC_LABEL = { maid: 'แม่บ้าน', plug: 'ปลั๊ก' };
function daysInMonth(y, m) { return new Date(y - 543, m, 0).getDate(); }
// เรตที่มีผล ณ ปี/เดือนนั้น (ไม่มี → default 300/500)
function roomRate(y, m) {
  const rs = (S.data.rates || []).filter(r => r.effectiveYear < y || (r.effectiveYear === y && r.effectiveMonth <= m))
    .sort((a, b) => a.effectiveYear !== b.effectiveYear ? a.effectiveYear - b.effectiveYear : a.effectiveMonth - b.effectiveMonth);
  const r = rs[rs.length - 1];
  return { temp: r ? r.tempRate : 300, overnight: r ? r.overnightRate : 500 };
}
function rentalCell(source, y, m, d, room) { return (S.data.rentals || []).find(r => r.source === source && r.year === y && r.month === m && r.day === d && r.room === room); }
function roomDayTotal(source, y, m, d) {
  const rate = roomRate(y, m); let t = 0, o = 0;
  (S.data.rentals || []).forEach(r => { if (r.source === source && r.year === y && r.month === m && r.day === d) { t += r.temp; o += r.overnight; } });
  return { temp: t, overnight: o, baht: t * rate.temp + o * rate.overnight };
}
function roomMonthTotal(source, y, m) {
  const rate = roomRate(y, m); let t = 0, o = 0;
  (S.data.rentals || []).forEach(r => { if (r.source === source && r.year === y && r.month === m) { t += r.temp; o += r.overnight; } });
  return { temp: t, overnight: o, baht: t * rate.temp + o * rate.overnight };
}
function roomDateLabel(y, m, d) { const g = new Date(y - 543, m - 1, d); const wd = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][g.getDay()]; return `${wd} ${d} ${MTH[m]} ${String(y).slice(-2)}`; }
function syncLabel(s) { return { ok: 'ซิงค์แล้ว ✓', pending: 'รอบันทึก…', syncing: 'กำลังบันทึก…', offline: 'เน็ตหลุด — เก็บไว้แล้ว จะส่งเองเมื่อกลับมา' }[s] || ''; }

function renderRooms() {
  const sources = S.me ? S.me.roomsRead : ['maid', 'plug'];
  const writeable = S.me ? S.me.roomsWrite : ['maid', 'plug'];
  const canCmp = !HAS_BACKEND || can('compare');
  const validSels = sources.concat(canCmp ? ['compare'] : []);
  let sel = S.ui.roomSel;
  if (!sel || validSels.indexOf(sel) < 0) sel = S.ui.roomSel = (writeable[0] || sources[0]);

  const tabBtns = validSels.map(v => {
    const active = v === sel ? 'active' : '';
    const label = v === 'compare' ? `${svg('check')} เทียบ`
      : (writeable.indexOf(v) >= 0 ? `${svg('edit')} จด: ${SRC_LABEL[v] || v}` : `${svg('user')} ดู: ${SRC_LABEL[v] || v}`);
    return `<button class="tab ${active}" onclick="roomSelectTab('${v}')">${label}</button>`;
  }).join('');
  const tabs = validSels.length > 1 ? `<div class="tabs no-print">${tabBtns}</div>` : '';

  if (sel === 'compare') return tabs + renderRoomsCompare();
  return tabs + renderRoomEntry(sel, writeable.indexOf(sel) >= 0);
}

function stepperHtml(source, y, m, d, room, field, val, editable, kind) {
  const lab = field === 'temp' ? 'ชั่วคราว' : 'ค้างคืน';
  if (!editable) return `<span class="st-lab ${kind}">${lab}</span><span class="st-val ro">${val}</span>`;
  return `<span class="st-lab ${kind}">${lab}</span>
    <button class="st-btn" ${val <= 0 ? 'disabled' : ''} onclick="roomStep('${source}',${y},${m},${d},${room},'${field}',-1)" aria-label="ลด">−</button>
    <span class="st-val">${val}</span>
    <button class="st-btn ${kind}" ${val >= 5 ? 'disabled' : ''} onclick="roomStep('${source}',${y},${m},${d},${room},'${field}',1)" aria-label="เพิ่ม">+</button>`;
}

// หน้าจด = ปฏิทินทั้งเดือน (ช่องสรุป 3 ตัวเลข + จุดสี) + แตะวัน = ช่องจด 12 ห้องโผล่ใต้ปฏิทิน
function renderRoomEntry(source, editable) {
  const y = S.ui.roomY, m = S.ui.roomM;
  const dim = daysInMonth(y, m);
  const rate = roomRate(y, m);
  const mt = roomMonthTotal(source, y, m);
  const t = todayBE();
  const isCurMonth = (y === t.y && m === t.m);
  const openDay = S.ui.roomD;
  const syncCls = S.roomSync || 'ok';

  // ช่องว่างนำหน้าวันที่ 1 (จันทร์ขึ้นต้นสัปดาห์)
  const lead = (new Date(y - 543, m - 1, 1).getDay() + 6) % 7;
  let cells = '';
  for (let i = 0; i < lead; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= dim; d++) {
    const dt = roomDayTotal(source, y, m, d);
    const has = dt.temp || dt.overnight;
    const isToday = isCurMonth && d === t.d;
    const isSel = d === openDay;
    cells += `<button class="cal-cell ${has ? 'has' : ''} ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}" onclick="roomToggleDay(${d})">
      <span class="cal-day">${d}</span>
      ${has
        ? `<span class="cal-n t"><i class="cdot t"></i>${dt.temp}</span><span class="cal-n n"><i class="cdot n"></i>${dt.overnight}</span><span class="cal-b">${fmt(dt.baht)}</span>`
        : `<span class="cal-empty">−</span>`}
    </button>`;
  }
  const wd = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(w => `<div class="cal-wd">${w}</div>`).join('');
  const editor = (openDay && openDay <= dim)
    ? `<div id="dayEditor" class="card card-pad mt4">${roomEditorHtml(source, y, m, openDay, editable, rate)}</div>` : '';
  // แตะวัน → เลื่อนจอมาที่ช่องจด (ไม่เลื่อนทุก re-render เวลาแตะ stepper)
  if (S._roomWantScroll && openDay) {
    setTimeout(() => { const el = document.getElementById('dayEditor'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40);
    S._roomWantScroll = false;
  }

  return `
  <div class="card card-pad room-bar">
    <div class="room-datenav">
      <button class="btn btn-ghost btn-sm" onclick="roomShiftMonth(-1)" aria-label="เดือนก่อน">${svg('chevL')}</button>
      <button class="room-date" onclick="roomToday()" title="แตะเพื่อกลับมาเดือน/วันนี้">${svg('calendar')} ${MTH_FULL[m]} ${y}</button>
      <button class="btn btn-ghost btn-sm" onclick="roomShiftMonth(1)" aria-label="เดือนถัดไป">${svg('chevR')}</button>
      <span class="room-sync ${syncCls}" id="roomSync" title="${esc(syncLabel(syncCls))}"></span>
    </div>
    <div class="room-who">${editable ? svg('edit') : svg('user')} ${editable ? 'กำลังจดของ' : 'กำลังดู (อ่านอย่างเดียว)'} <b>${esc(SRC_LABEL[source] || source)}</b> · ยอดเดือน <b class="num" style="color:var(--primary)">${baht(mt.baht)}</b></div>
    <div class="cal-legend"><span><i class="cdot t"></i> ชั่วคราว</span><span><i class="cdot n"></i> ค้างคืน</span><span class="cal-bk">฿ ยอด</span></div>
  </div>

  <div class="card card-pad mt4">
    <div class="cal-grid cal-head">${wd}</div>
    <div class="cal-grid">${cells}</div>
  </div>

  ${editor}
  ${roomNotesPanel(source, y, m, editable)}`;
}

// ช่องจด 12 ห้องของวันที่กางอยู่ (stepper เดิม)
function roomEditorHtml(source, y, m, d, editable, rate) {
  const dt = roomDayTotal(source, y, m, d);
  let rooms = '';
  for (let room = 1; room <= 12; room++) {
    const cell = rentalCell(source, y, m, d, room);
    const tt = cell ? cell.temp : 0, oo = cell ? cell.overnight : 0;
    const bv = tt * rate.temp + oo * rate.overnight;
    rooms += `<div class="room-row ${tt || oo ? 'has' : ''}">
      <div class="room-head"><span class="room-name">ห้อง ${room}</span><span class="room-baht">${bv ? bv.toLocaleString('th-TH') + ' ฿' : '-'}</span></div>
      <div class="st-line">${stepperHtml(source, y, m, d, room, 'temp', tt, editable, 'temp')}</div>
      <div class="st-line">${stepperHtml(source, y, m, d, room, 'overnight', oo, editable, 'night')}</div>
    </div>`;
  }
  return `<div class="day-edit-inner">
    <div class="day-edit-head">${svg('edit')} จดห้อง · ${esc(roomDateLabel(y, m, d))}</div>
    <div class="room-grid">${rooms}</div>
    <div class="day-edit-foot"><span>${svg('calendar')} ยอดวันนี้</span><b class="num">${baht(dt.baht)}</b></div>
  </div>`;
}

function roomNotesPanel(source, y, m, editable) {
  const list = (S.data.notes || []).filter(n => n.source === source && n.year === y && n.month === m);
  const items = list.map(n => `<div class="note-row">
    ${editable
      ? `<input class="input note-text" value="${esc(n.text)}" onblur="editRoomNote('${esc(n.id)}','text',this.value)">
         <input class="input note-amt num-input" type="text" inputmode="numeric" value="${n.amount ? esc(fmt(n.amount)) : ''}" placeholder="บาท" onblur="editRoomNote('${esc(n.id)}','amount',this.value)">
         <button class="btn btn-danger btn-sm" onclick="deleteRoomNote('${esc(n.id)}')">${svg('trash')}</button>`
      : `<span class="note-text-ro">${esc(n.text)}</span><span class="note-amt-ro">${n.amount ? esc(baht(n.amount)) : ''}</span>`}
  </div>`).join('');
  return `<div class="card card-pad room-notes">
    <div class="section-title" style="font-size:14px">${svg('edit')} หมายเหตุเดือน ${MTH_FULL[m]} ${y}</div>
    <div class="note-list">${items || '<div class="dim" style="font-size:13px">— ยังไม่มีหมายเหตุ —</div>'}</div>
    ${editable ? `<div class="note-add no-print">
      <input class="input" id="noteText" placeholder="เช่น เบียร์ลีโอ 8 ขวด">
      <input class="input num-input" id="noteAmt" type="text" inputmode="numeric" placeholder="บาท" style="max-width:96px">
      <button class="btn btn-success btn-sm" onclick="addRoomNote('${source}',${y},${m})">${svg('plus')} เพิ่ม</button></div>` : ''}
  </div>`;
}

function renderRoomsCompare() {
  const y = S.ui.roomY, m = S.ui.roomM;
  const dim = daysInMonth(y, m);
  const diffs = [];
  for (let d = 1; d <= dim; d++) for (let room = 1; room <= 12; room++) {
    const a = rentalCell('maid', y, m, d, room), b = rentalCell('plug', y, m, d, room);
    const at = a ? a.temp : 0, ao = a ? a.overnight : 0, bt = b ? b.temp : 0, bo = b ? b.overnight : 0;
    if (at !== bt || ao !== bo) diffs.push({ d, room, at, ao, bt, bo });
  }
  const mt = roomMonthTotal('maid', y, m), pt = roomMonthTotal('plug', y, m);
  const diffBaht = pt.baht - mt.baht;
  const diffRows = diffs.map(x => `<tr>
     <td>${x.d}</td><td class="l">ห้อง ${x.room}</td>
     <td class="${x.at !== x.bt ? 'cmp-bad' : ''}">${x.at} / ${x.bt}</td>
     <td class="${x.ao !== x.bo ? 'cmp-bad' : ''}">${x.ao} / ${x.bo}</td></tr>`).join('');
  const mnotes = (S.data.notes || []).filter(n => n.source === 'maid' && n.year === y && n.month === m);
  const pnotes = (S.data.notes || []).filter(n => n.source === 'plug' && n.year === y && n.month === m);
  const noteList = arr => arr.length ? arr.map(n => `<li>${esc(n.text)}${n.amount ? ` · ${esc(baht(n.amount))}` : ''}</li>`).join('') : '<li class="dim">—</li>';
  return `
  <div class="card card-pad room-bar">
    <div class="room-datenav">
      <button class="btn btn-ghost btn-sm" onclick="roomShiftMonth(-1)" aria-label="เดือนก่อน">${svg('chevL')}</button>
      <span class="room-date">${svg('calendar')} ${MTH_FULL[m]} ${y}</span>
      <button class="btn btn-ghost btn-sm" onclick="roomShiftMonth(1)" aria-label="เดือนถัดไป">${svg('chevR')}</button>
    </div>
  </div>
  <div class="card card-pad mt4">
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">${svg('user')} แม่บ้าน</div><div class="kpi-value num">${baht(mt.baht)}</div><div class="kpi-sub">ชั่วคราว ${mt.temp} · ค้างคืน ${mt.overnight}</div></div>
      <div class="kpi"><div class="kpi-label">${svg('user')} ปลั๊ก</div><div class="kpi-value num">${baht(pt.baht)}</div><div class="kpi-sub">ชั่วคราว ${pt.temp} · ค้างคืน ${pt.overnight}</div></div>
      <div class="kpi ${diffBaht !== 0 ? 'is-danger' : 'is-success'}"><div class="kpi-label">ผลต่าง (ปลั๊ก−แม่บ้าน)</div><div class="kpi-value num">${diffBaht > 0 ? '+' : ''}${baht(diffBaht)}</div><div class="kpi-sub">${diffs.length} จุดที่ต่าง</div></div>
    </div>
  </div>
  <div class="card card-pad mt4">
    <div class="section-title" style="font-size:14px">${svg('check')} จุดที่จดไม่ตรง <span class="dim" style="font-weight:500;font-size:12px">· คอลัมน์ = แม่บ้าน / ปลั๊ก</span></div>
    ${diffs.length ? `<div class="table-scroll mt4"><table class="data cmp-table"><thead><tr><th>วันที่</th><th class="l">ห้อง</th><th>ชั่วคราว</th><th>ค้างคืน</th></tr></thead><tbody>${diffRows}</tbody></table></div>`
      : `<div class="empty" style="padding:28px">${svg('check')}<p><strong>ตรงกันทุกวัน 🎉</strong></p><p class="dim">ทั้งสองคนจดตรงกันหมดในเดือนนี้</p></div>`}
  </div>
  <div class="card card-pad mt4">
    <div class="section-title" style="font-size:14px">${svg('edit')} หมายเหตุ — เทียบ</div>
    <div class="cmp-notes mt4"><div><div class="dim" style="font-weight:600;margin-bottom:4px">แม่บ้าน</div><ul>${noteList(mnotes)}</ul></div><div><div class="dim" style="font-weight:600;margin-bottom:4px">ปลั๊ก</div><ul>${noteList(pnotes)}</ul></div></div>
  </div>`;
}

/* ---- rooms handlers ---- */
function roomSelectTab(v) { S.ui.roomSel = v; render(); }
// แตะวันในปฏิทิน = เลือกวันนั้น → ช่องจดโผล่ใต้ปฏิทิน + เลื่อนจอลงมา
function roomToggleDay(d) { S.ui.roomD = d; S._roomWantScroll = true; render(); }
function roomShiftMonth(delta) {
  const g = new Date(S.ui.roomY - 543, S.ui.roomM - 1 + delta, 1);
  S.ui.roomY = g.getFullYear() + 543; S.ui.roomM = g.getMonth() + 1;
  const t = todayBE();
  S.ui.roomD = (S.ui.roomY === t.y && S.ui.roomM === t.m) ? t.d : null;   // เดือนนี้→กางวันนี้, เดือนอื่น→ปิดหมด
  S._roomWantScroll = S.ui.roomD != null;
  render();
}
function roomToday() { const t = todayBE(); S.ui.roomY = t.y; S.ui.roomM = t.m; S.ui.roomD = t.d; S._roomWantScroll = true; render(); }

function roomStep(source, y, m, d, room, field, delta) {
  if (!canWriteSource(source)) return;
  const cell = rentalCell(source, y, m, d, room);
  let t = cell ? cell.temp : 0, o = cell ? cell.overnight : 0;
  if (field === 'temp') t = Math.max(0, Math.min(5, t + delta)); else o = Math.max(0, Math.min(5, o + delta));
  applyRoomLocal(source, y, m, d, room, t, o);
  queueRoom({ source, year: y, month: m, day: d, room, temp: t, overnight: o });
  render();
}
function applyRoomLocal(source, y, m, d, room, t, o) {
  S.data.rentals = S.data.rentals || [];
  const i = S.data.rentals.findIndex(r => r.source === source && r.year === y && r.month === m && r.day === d && r.room === room);
  if (t === 0 && o === 0) { if (i >= 0) S.data.rentals.splice(i, 1); return; }
  if (i >= 0) { S.data.rentals[i].temp = t; S.data.rentals[i].overnight = o; }
  else S.data.rentals.push({ id: 'local-' + uid(), source, year: y, month: m, day: d, room, temp: t, overnight: o, updatedAt: '' });
}
// แตะ = เซฟทันที — เก็บคิว + debounce ส่ง (กันเน็ตหลุด)
function queueRoom(item) {
  S.roomQueue = S.roomQueue.filter(q => !(q.source === item.source && q.year === item.year && q.month === item.month && q.day === item.day && q.room === item.room));
  S.roomQueue.push(item); persistQueue();
  S.roomSync = 'pending';
  clearTimeout(S._roomT); S._roomT = setTimeout(flushRoomQueue, 600);
}
function persistQueue() { try { localStorage.setItem('kanda_roomq', JSON.stringify(S.roomQueue)); } catch (e) { } }
async function flushRoomQueue() {
  if (!HAS_BACKEND) { S.roomQueue = []; persistQueue(); S.roomSync = 'ok'; updateSyncDot(); return; }
  if (S._roomFlushing || !S.roomQueue.length) return;
  S._roomFlushing = true; S.roomSync = 'syncing'; updateSyncDot();
  try {
    while (S.roomQueue.length) { await api.call('setRoom', S.roomQueue[0]); S.roomQueue.shift(); persistQueue(); }
    S.roomSync = 'ok';
  } catch (e) { S.roomSync = 'offline'; }
  finally {
    S._roomFlushing = false; updateSyncDot();
    if (S.roomQueue.length) { clearTimeout(S._roomT); S._roomT = setTimeout(flushRoomQueue, 5000); }   // เน็ตหลุด → ลองใหม่
  }
}
function updateSyncDot() { const el = $('#roomSync'); if (el) { el.className = 'room-sync ' + (S.roomSync || 'ok'); el.title = syncLabel(S.roomSync || 'ok'); } }

function addRoomNote(source, y, m) {
  if (!canWriteSource(source)) return;
  const text = ($('#noteText').value || '').trim(); if (!text) { toast('ใส่ข้อความก่อน', 'err'); return; }
  const amount = num($('#noteAmt').value);
  withBusy(null, async () => { await api.post('addNote', { source, year: y, month: m, text, amount }); toast('เพิ่มหมายเหตุแล้ว', 'ok'); render(); });
}
function editRoomNote(id, field, val) {
  const n = (S.data.notes || []).find(x => x.id === id); if (!n) return;
  const v = field === 'amount' ? num(val) : String(val).trim();
  if (n[field] === v) return;
  n[field] = v;
  withBusy(null, async () => { await api.post('updateNote', { id, field, value: v }); softRender(); });
}
function deleteRoomNote(id) {
  confirmDialog('ลบหมายเหตุนี้?', async () => { await api.post('deleteNote', { id }); toast('ลบแล้ว', 'ok'); render(); });
}

/* ============================================================
   Shared bits
   ============================================================ */
function panelEmpty(icon, title, sub) {
  return `<div class="empty">${svg(icon)}<p><strong>${esc(title)}</strong></p>${sub ? `<p class="dim">${esc(sub)}</p>` : ''}</div>`;
}
function loaderScreen(msg) {
  return `<div class="load-caption"><span class="spinner"></span> ${esc(msg || 'กำลังโหลด')}</div>` + skeletonView();
}
function showLoader(msg) { $('#lockBtn').classList.add('hidden'); $('#view').innerHTML = loaderScreen(msg); }
function skeletonView() {
  return `<div class="card card-pad"><div class="skeleton" style="height:24px;width:240px"></div>
    <div class="kpi-grid mt4">${'<div class="skeleton" style="height:88px"></div>'.repeat(5)}</div></div>
    <div class="card card-pad mt4"><div class="skeleton" style="height:240px"></div></div>`;
}
function errorView(msg) {
  return `<div class="card card-pad"><div class="empty">${svg('box')}<p><strong>โหลดข้อมูลไม่สำเร็จ</strong></p><p class="dim">${esc(msg)}</p>
    <div class="mt4"><button class="btn btn-primary" onclick="boot()">ลองใหม่</button></div></div></div>`;
}

/* ============================================================
   EVENT HANDLERS (exposed on window)
   ============================================================ */
async function withBusy(btnId, fn, label) {
  const btn = btnId && $('#' + btnId);
  if (btn) { btn.disabled = true; btn.dataset.html = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span> ' + (label || 'กำลังบันทึก'); }
  S._busy = true;
  try { await fn(); }
  catch (e) { toast(e.message || 'เกิดข้อผิดพลาด', 'err'); }
  finally { S._busy = false; if (btn && document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = btn.dataset.html; } }
}

// render ซ้ำด้วยข้อมูลจาก server หลัง mutation — ข้ามถ้ากำลังพิมพ์/เปิด modal (กัน focus หลุด)
function softRender() {
  const ae = document.activeElement;
  if (ae && (ae.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(ae.tagName))) return;
  if ($('#modalBg').classList.contains('show')) return;
  render();
}

/* ---------- auto-sync (polling every 10s) ---------- */
let _pollTimer = null;
function startPolling() {
  if (_pollTimer || !HAS_BACKEND) return;
  _pollTimer = setInterval(pollOnce, 10000);
}
async function pollOnce() {
  // หยุดถ้า: ยังไม่ล็อกอิน / แท็บไม่ได้โฟกัส / กำลังบันทึก / เปิด modal / กำลังพิมพ์ / มีคิวห้องพักค้าง (กันทับงานที่ยังไม่ส่ง)
  if (!loggedIn() || document.hidden || S._busy || S.roomQueue.length) return;
  if ($('#modalBg').classList.contains('show')) return;
  const ae = document.activeElement;
  if (ae && (ae.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(ae.tagName))) return;
  try {
    const { data, me } = await api.getAll();
    if (me) S.me = me;
    if (JSON.stringify(data) !== JSON.stringify(S.data)) { S.data = data; render(); }
  } catch (e) { /* เงียบไว้ ครั้งหน้าค่อยลองใหม่ */ }
}

/* module switching */
$('#moduleSeg').addEventListener('click', e => {
  if (HAS_BACKEND && !loggedIn()) return;   // ยังไม่ล็อกอิน → ไม่สลับโมดูล
  const b = e.target.closest('button'); if (!b || b.hidden) return;
  if (!allowedModules().includes(b.dataset.module)) return;
  S.module = b.dataset.module; S.ui.roundId = null; S.ui.catalog = false;
  localStorage.setItem('kanda_module', S.module);   // จำแท็บล่าสุด
  render();
});
/* lock / logout */
$('#lockBtn').addEventListener('click', () => {
  S.me = null; S.pin = '';
  localStorage.removeItem('kanda_pin');
  entryGate();
});
$('#themeBtn').addEventListener('click', () => {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('kanda_theme', S.theme); applyTheme();
});
function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme);
  const i = $('#themeIcon');
  if (i) i.innerHTML = S.theme === 'dark'
    ? '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
}

/* ---- ENTRY gate (รหัสที่ 1 — เข้าเว็บ) : full-screen, ปิดไม่ได้ ---- */
function entryGate() {
  $('#moduleSeg').classList.add('hidden');
  $('#lockBtn').classList.add('hidden');
  $('#view').innerHTML = `
    <div class="gate">
      <div class="card card-pad gate-card">
        <div class="logo-lg">${svg('lock')}</div>
        <h2>เข้าสู่ระบบ</h2>
        <p>ใส่รหัสผ่านเพื่อเข้าใช้งาน KandaLedger</p>
        <div class="field"><input class="input pin-input" id="entryIn" type="password" inputmode="numeric" autocomplete="off" placeholder="••••" onkeydown="if(event.key==='Enter')submitEntry()"></div>
        <div class="field-error" id="entryErr" style="display:none;text-align:center;margin-top:8px">รหัสไม่ถูกต้อง</div>
        <div class="mt4"><button class="btn btn-primary" id="entryBtn" style="width:100%" onclick="submitEntry()">เข้าสู่ระบบ</button></div>
      </div>
    </div>`;
  setTimeout(() => $('#entryIn') && $('#entryIn').focus(), 80);
}
async function submitEntry() {
  const v = $('#entryIn').value.trim(); if (!v) return;
  S.pin = v;
  let ok = false;
  await withBusy('entryBtn', async () => {
    const { data, me } = await api.getAll();   // server ตรวจ PIN → คืน role/caps
    S.data = data; S.me = me;
    ok = true;
  }, 'กำลังเข้าสู่ระบบ').catch(() => { });
  if (ok) {
    localStorage.setItem('kanda_pin', v);
    S.ui.roomSel = null;
    toast('เข้าสู่ระบบแล้ว' + (S.me && S.me.label ? ' · ' + S.me.label : ''), 'ok');
    render(); startPolling(); flushRoomQueue();
  } else {
    S.pin = ''; S.loading = false;
    const e = $('#entryErr'); if (e) e.style.display = 'block';
  }
}

/* ---- utility handlers ---- */
function selectWorker(idx) { const w = S.data.workers[idx]; if (!w) return; S.ui.worker = w.name; S.ui._initFor = null; render(); }
function setRange(which, v) { if (which === 'from') S.ui.fromIdx = +v; else S.ui.toIdx = +v; render(); }
function rangeAll() { const n = workerBills(S.ui.worker).length; S.ui.fromIdx = 0; S.ui.toIdx = Math.max(0, n - 1); render(); }
function rangeUnpaid() {
  const rows = workerBills(S.ui.worker);
  const idx = rows.map((b, i) => b.paid ? -1 : i).filter(i => i >= 0);
  if (!idx.length) { toast('ไม่มีรายการค้างชำระ'); return; }
  S.ui.fromIdx = idx[0]; S.ui.toIdx = idx[idx.length - 1]; render();
}
function addWorkerPrompt() {
  openModal(`<h3>${svg('user')} เพิ่มคนงานใหม่</h3>
    <div class="field"><label>ชื่อคนงาน</label><input class="input" id="wName" placeholder="เช่น ช่างสมชาย" onkeydown="if(event.key==='Enter')confirmAddWorker()"></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-success" id="wBtn" onclick="confirmAddWorker()">เพิ่ม</button></div>`);
  setTimeout(() => $('#wName') && $('#wName').focus(), 60);
}
function confirmAddWorker() {
  const name = $('#wName').value.trim(); if (!name) return;
  if (S.data.workers.find(w => w.name === name)) { toast('มีชื่อนี้แล้ว', 'err'); return; }
  withBusy('wBtn', async () => {
    await api.post('addWorker', { name });
    S.ui.worker = name; closeModal(); toast('เพิ่มคนงานแล้ว', 'ok'); render();
  });
}
function deleteWorkerPrompt() {
  if (S.data.workers.length <= 1) { toast('ต้องมีคนงานอย่างน้อย 1 คน', 'err'); return; }
  confirmDialog(`ลบ “${S.ui.worker}” และข้อมูลทั้งหมด?`, async () => {
    await api.post('deleteWorker', { name: S.ui.worker });
    S.ui.worker = S.data.workers[0] ? S.data.workers[0].name : null; toast('ลบแล้ว', 'ok'); render();
  });
}
function addBill() {
  const y = num($('#aY').value), m = +$('#aM').value;
  if (!y || !m) { toast('กรอกปีและเดือน', 'err'); return; }
  if (S.data.bills.find(b => b.worker === S.ui.worker && b.year === y && b.month === m)) { toast('มีเดือนนี้แล้ว', 'err'); return; }
  const prev = workerBills(S.ui.worker).filter(b => b.year < y || (b.year === y && b.month < m)).pop();
  const eo = $('#aEO').value, wo = $('#aWO').value;
  const payload = {
    worker: S.ui.worker, year: y, month: m,
    rent: num($('#aRent').value), extra: num($('#aEx').value), note: $('#aNote').value || '',
    eOld: eo !== '' ? num(eo) : (prev ? num(prev.eNew) : 0), eNew: num($('#aEN').value),
    wOld: wo !== '' ? num(wo) : (prev ? num(prev.wNew) : 0), wNew: num($('#aWN').value),
    elecRate: num($('#aErate').value) || 7, waterRate: num($('#aWrate').value) || 30,
  };
  const save = () => withBusy('addBillBtn', async () => { await api.post('addBill', payload); toast('เพิ่มรายการแล้ว', 'ok'); render(); });
  // เตือนถ้ามิเตอร์ใหม่ < เก่า (อาจกรอกผิด — แต่ก็เป็นได้ถ้ามิเตอร์รีเซ็ต/เปลี่ยนลูก) → ค่าหน่วยจะคิดเป็น 0
  const warns = [];
  if (payload.eNew < payload.eOld) warns.push(`ไฟ ${fmt(payload.eNew)} < ${fmt(payload.eOld)}`);
  if (payload.wNew < payload.wOld) warns.push(`น้ำ ${fmt(payload.wNew)} < ${fmt(payload.wOld)}`);
  if (warns.length) confirmDialog(`มิเตอร์ใหม่น้อยกว่าเก่า (${warns.join(' · ')}) — ค่าหน่วยจะคิดเป็น 0. ถ้ากรอกผิดให้กดยกเลิกแล้วแก้ก่อน. ยืนยันบันทึก?`, save, { label: 'บันทึกต่อ', danger: false, icon: 'check' });
  else save();
}
function editBill(id, field, val) {
  const b = S.data.bills.find(x => x.id === id); if (!b) return;
  const v = field === 'note' ? val.trim() : num(val);
  if (b[field] === v) return;
  b[field] = v; render();
  withBusy(null, async () => { await api.post('updateBill', { id, field, value: v }); softRender(); });
}
function togglePaid(id, checked) {
  const b = S.data.bills.find(x => x.id === id); if (b) b.paid = checked; render();
  withBusy(null, async () => { await api.post('togglePaid', { id, paid: checked }); softRender(); });
}
function deleteBill(id) {
  const b = S.data.bills.find(x => x.id === id); if (!b) return;
  confirmDialog(`ลบ ${MTH_FULL[b.month]} ${b.year}?`, async () => { await api.post('deleteBill', { id }); toast('ลบแล้ว', 'ok'); render(); });
}

/* ---- purchase handlers ---- */
/* ---- image lightbox (popup ในหน้าเว็บ แทนการเปิดแท็บใหม่) ---- */
function lightbox(url) {
  let el = document.getElementById('lightbox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lightbox'; el.className = 'lightbox';
    el.addEventListener('click', () => el.classList.remove('show'));
    document.body.appendChild(el);
  }
  el.innerHTML = `<button class="lb-close" aria-label="ปิด">✕</button><img src="${esc(url)}" alt="">`;
  el.classList.add('show');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const lb = document.getElementById('lightbox'); if (lb) lb.classList.remove('show'); } });

function openRound(id) { S.ui.roundId = id; S.ui.pasteGid = null; render(); }
// ไปรอบก่อนหน้า/ถัดไป (เรียงตามวันที่ใหม่→เก่า เหมือนหน้ารายการ)
function gotoRound(dir) {
  const ordered = [...S.data.rounds].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const idx = ordered.findIndex(x => x.roundId === S.ui.roundId);
  const tgt = ordered[idx + dir];
  if (tgt) { openRound(tgt.roundId); window.scrollTo(0, 0); }
}
function closeRound() { S.ui.roundId = null; S.ui.pasteGid = null; S.ui.newGroups = []; render(); }
// ค้นหารอบ — render ใหม่แล้วคืน focus + เคอร์เซอร์ท้ายข้อความ (กัน focus หลุดตอนพิมพ์)
function setRoundSearch(v) {
  S.ui.roundSearch = v; render();
  const el = $('#roundSearch'); if (el) { el.focus(); const n = el.value.length; el.setSelectionRange(n, n); }
}
/* เลือกใบเสร็จเป็นเป้าหมายของการวางรูป (Ctrl+V) */
function armPaste(gid, rid) {
  S.ui.pasteGid = gid; S.ui.pasteRid = rid;
  $$('.receipt-add').forEach(b => {
    const on = b.dataset.gid === gid;
    b.classList.toggle('armed', on);
    const h = b.querySelector('.ra-hint'); if (h) h.textContent = on ? 'พร้อมวาง · Ctrl+V' : 'คลิก แล้ว Ctrl+V';
  });
}
/* เลือกสินค้าเป็นเป้าหมายของการวางรูป (Ctrl+V) ในหน้าแคตตาล็อก */
function armProductPaste(productId) {
  S.ui.pastePid = productId;
  $$('.catalog-row').forEach(r => r.classList.toggle('armed', r.dataset.pid === productId));
}
async function handlePaste(e) {
  if (!can('purchaseWrite') || S.module !== 'purchase') return;
  const inCatalog = S.ui.catalog;
  if (!inCatalog && !S.ui.roundId) return;
  const list = (e.clipboardData && e.clipboardData.items) || [];
  let file = null;
  for (const it of list) { if (it.type && it.type.indexOf('image') === 0) { file = it.getAsFile(); break; } }
  if (!file) return;                       // ไม่ใช่รูป → ปล่อยให้ paste ปกติ
  e.preventDefault();
  if (inCatalog) {
    if (!S.ui.pastePid) { toast('คลิกเลือกสินค้าที่ต้องการก่อน แล้วค่อย Ctrl+V'); return; }
    try {
      const dataUrl = await compressImage(file, 1000, 0.75);
      toast('กำลังอัปโหลดรูปที่วาง…');
      await api.post('addProductImage', { productId: S.ui.pastePid, dataUrl });
      toast('วางรูปสินค้าแล้ว', 'ok'); render();
    } catch (err) { toast(err.message || 'วางรูปไม่สำเร็จ', 'err'); }
    return;
  }
  if (!S.ui.pasteGid) { toast('คลิกช่อง “เพิ่มรูป” ของใบเสร็จที่ต้องการก่อน แล้วค่อย Ctrl+V'); return; }
  try {
    const dataUrl = await compressImage(file, 1400, 0.72);
    toast('กำลังอัปโหลดรูปที่วาง…');
    await api.post('addRoundImage', { roundId: S.ui.pasteRid, groupId: S.ui.pasteGid, dataUrl, name: 'paste-' + Date.now() });
    toast('วางรูปแล้ว', 'ok'); render();
  } catch (err) { toast(err.message || 'วางรูปไม่สำเร็จ', 'err'); }
}
document.addEventListener('paste', handlePaste);
function addRoundPrompt() {
  openModal(`<h3>${svg('cart')} เพิ่มรอบสั่งซื้อใหม่</h3>
    <div class="field"><label>วันที่</label><input class="input" id="rDate" type="date" value="${todayISO()}"></div>
    <div class="field mt2"><label>ชื่อรอบ</label><input class="input" id="rTitle" placeholder="เช่น ของเดือน พ.ค." onkeydown="if(event.key==='Enter')confirmAddRound()"></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-success" id="rBtn" onclick="confirmAddRound()">สร้างรอบ</button></div>`);
  setTimeout(() => $('#rTitle') && $('#rTitle').focus(), 60);
}
function confirmAddRound() {
  const date = $('#rDate').value || todayISO();
  const title = $('#rTitle').value.trim() || ('รอบ ' + date);
  withBusy('rBtn', async () => {
    const r = await api.post('addRound', { date, title });
    closeModal(); toast('สร้างรอบแล้ว', 'ok');
    if (r.newId) S.ui.roundId = r.newId; render();
  });
}
function deleteRoundPrompt(id) {
  confirmDialog('ลบรอบนี้และสินค้าทั้งหมดในรอบ?', async () => { await api.post('deleteRound', { roundId: id }); S.ui.roundId = null; toast('ลบรอบแล้ว', 'ok'); render(); });
}
/* ---- receipt groups (ใบเสร็จ) ---- */
function addGroup(rid) {
  S.ui.newGroups = (S.ui.newGroups || []).filter(g => g.rid !== rid || groupItems(g.gid).length || groupImages(g.gid).length);
  S.ui.newGroups.push({ rid, gid: 'g' + uid() });
  render();
}
function deleteGroupPrompt(gid) {
  const hasData = groupItems(gid).length || groupImages(gid).length;
  if (!hasData) { // ใบเสร็จเปล่าที่เพิ่งสร้าง — ลบจาก state ได้เลย
    S.ui.newGroups = (S.ui.newGroups || []).filter(g => g.gid !== gid); render(); return;
  }
  confirmDialog('ลบใบเสร็จนี้ (สินค้า+ รูปทั้งหมดในใบ)?', async () => { await api.post('deleteGroup', { groupId: gid }); toast('ลบใบเสร็จแล้ว', 'ok'); render(); });
}
/* ---- drag item between receipts ---- */
function dragItem(e, id) { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; S._dragId = id; }
function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drop-target'); }
function dragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove('drop-target'); }
function dropItem(e, gid) {
  e.preventDefault(); e.currentTarget.classList.remove('drop-target');
  const id = e.dataTransfer.getData('text/plain') || S._dragId; S._dragId = null;
  const it = id && S.data.items.find(x => x.id === id);
  if (!it || it.groupId === gid) return;
  it.groupId = gid; render();
  withBusy(null, async () => { await api.post('updateItem', { id, field: 'groupId', value: gid }); toast('ย้ายใบเสร็จแล้ว', 'ok'); softRender(); });
}
// ย้ายสินค้าไปใบเสร็จอื่น (modal — ใช้ได้ทุกอุปกรณ์ ไม่ต้อง drag)
function moveItemPrompt(id) {
  const it = S.data.items.find(x => x.id === id); if (!it) return;
  const groups = roundGroups(it.roundId).filter(g => g.gid !== it.groupId);
  if (!groups.length) { toast('ไม่มีใบเสร็จอื่นให้ย้าย — เพิ่มใบเสร็จก่อน'); return; }
  const btns = groups.map(g => `<button class="btn btn-ghost" style="width:100%;justify-content:flex-start;margin-bottom:6px" onclick="moveItemTo('${esc(id)}','${esc(g.gid)}')">${svg('receipt')} ${esc(g.label)} <span class="dim" style="font-weight:500">· ${g.count} ชิ้น</span></button>`).join('');
  openModal(`<h3>${svg('receipt')} ย้ายสินค้าไปใบเสร็จอื่น</h3>
    <p class="muted" style="font-size:13px;margin-bottom:12px">${esc(it.product)}</p>${btns}
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button></div>`);
}
function moveItemTo(id, gid) {
  const it = S.data.items.find(x => x.id === id); closeModal();
  if (!it || it.groupId === gid) return;
  it.groupId = gid; render();
  withBusy(null, async () => { await api.post('updateItem', { id, field: 'groupId', value: gid }); toast('ย้ายใบเสร็จแล้ว', 'ok'); softRender(); });
}
function addItem(rid, gid) {
  const g = id => $('#' + id + '_' + gid);
  const product = g('iProduct').value.trim();
  if (!product) { toast('กรอกชื่อสินค้า', 'err'); g('iProduct').focus(); return; }
  const payload = {
    roundId: rid, groupId: gid, date: g('iDate').value || todayISO(), product,
    option: g('iOption').value.trim(),
    qty: evalNum(g('iQty').value) || 1, unitPrice: evalNum(g('iUnit').value),
    shipping: evalNum(g('iShip').value), discount: evalNum(g('iDisc').value),
  };
  withBusy('addItemBtn_' + gid, async () => {
    await api.post('addItem', payload);
    toast('เพิ่มสินค้าแล้ว', 'ok'); render();
    setTimeout(() => { const p = $('#iProduct_' + gid); if (p) p.focus(); }, 50);
  });
}
function editItem(id, field, val) {
  const it = S.data.items.find(x => x.id === id); if (!it) return;
  const isText = field === 'product' || field === 'date' || field === 'option';
  const v = isText ? val.trim() : evalNum(val);
  if (it[field] === v) return;
  it[field] = v;
  // recompute derived locally for snappy UI
  it.price = num(it.qty) * num(it.unitPrice);
  it.total = it.price + num(it.shipping) - num(it.discount);
  render();
  withBusy(null, async () => { await api.post('updateItem', { id, field, value: v }); softRender(); });
}
function deleteItem(id) {
  confirmDialog('ลบสินค้ารายการนี้?', async () => { await api.post('deleteItem', { id }); toast('ลบแล้ว', 'ok'); render(); });
}

/* ---- round status / edit ---- */
function toggleRoundDone(rid, done) {
  withBusy(null, async () => { await api.post('updateRound', { roundId: rid, field: 'done', value: done }); toast(done ? 'ทำเครื่องหมายจัดการแล้ว' : 'ยกเลิกเครื่องหมายแล้ว', 'ok'); render(); });
}
function editRoundPrompt(rid) {
  const r = S.data.rounds.find(x => x.roundId === rid); if (!r) return;
  openModal(`<h3>${svg('edit')} แก้ไขรอบสั่งซื้อ</h3>
    <div class="field"><label>วันที่</label><input class="input" id="erDate" type="date" value="${esc(r.date || '')}"></div>
    <div class="field mt2"><label>ชื่อรอบ</label><input class="input" id="erTitle" value="${esc(r.title || '')}"></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" id="erBtn" onclick="confirmEditRound('${esc(rid)}')">บันทึก</button></div>`);
  setTimeout(() => $('#erTitle') && $('#erTitle').focus(), 60);
}
function confirmEditRound(rid) {
  const date = $('#erDate').value, title = $('#erTitle').value.trim();
  withBusy('erBtn', async () => {
    await api.post('updateRound', { roundId: rid, field: 'date', value: date });
    await api.post('updateRound', { roundId: rid, field: 'title', value: title });
    closeModal(); toast('บันทึกแล้ว', 'ok'); render();
  });
}

/* ---- receipt images (ต่อใบเสร็จ) ---- */
function pickRoundImage(gid, rid) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  inp.onchange = async () => {
    const f = inp.files[0];
    if (f) {
      try {
        const dataUrl = await compressImage(f, 1400, 0.72);
        toast('กำลังอัปโหลดรูป…');
        await api.post('addRoundImage', { roundId: rid, groupId: gid, dataUrl, name: 'receipt-' + Date.now() });
        toast('เพิ่มรูปแล้ว', 'ok'); render();
      } catch (e) { toast(e.message || 'อัปโหลดรูปไม่สำเร็จ', 'err'); }
    }
    inp.remove();
  };
  document.body.appendChild(inp); inp.click();
}
function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านไฟล์รูปไม่ได้')); };
    img.src = url;
  });
}
function deleteRoundImage(id) {
  confirmDialog('ลบรูปใบเสร็จนี้?', async () => { await api.post('deleteRoundImage', { id }); toast('ลบรูปแล้ว', 'ok'); render(); });
}

/* ---- catalog handlers ---- */
function openCatalog() { S.ui.catalog = true; S.ui.pastePid = null; render(); }
function closeCatalog() { S.ui.catalog = false; S.ui.pastePid = null; render(); }
function addProductPrompt() {
  openModal(`<h3>${svg('box')} เพิ่มสินค้าใหม่</h3>
    <div class="field"><label>ชื่อสินค้า</label><input class="input" id="pName" placeholder="เช่น หัวฉีดชำระ ABS" onkeydown="if(event.key==='Enter')confirmAddProduct()"></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-success" id="pBtn" onclick="confirmAddProduct()">เพิ่ม</button></div>`);
  setTimeout(() => $('#pName') && $('#pName').focus(), 60);
}
function confirmAddProduct() {
  const name = $('#pName').value.trim(); if (!name) return;
  if (productByName(name)) { toast('มีสินค้านี้แล้ว', 'err'); return; }
  withBusy('pBtn', async () => { await api.post('addProduct', { name }); closeModal(); toast('เพิ่มสินค้าแล้ว', 'ok'); render(); });
}
function updateProduct(productId, name) {
  const p = (S.data.products || []).find(x => x.productId === productId); if (!p) return;
  const v = String(name).trim(); if (!v || p.name === v) return;
  p.name = v;
  withBusy(null, async () => { await api.post('updateProduct', { productId, name: v }); });
}
function deleteProductPrompt(productId) {
  const p = (S.data.products || []).find(x => x.productId === productId);
  const name = p ? p.name : '';
  confirmDialog(`ลบสินค้า “${name}” ออกจากแคตตาล็อก?`, async () => { await api.post('deleteProduct', { productId }); toast('ลบแล้ว', 'ok'); render(); });
}
function pickProductImage(productId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  inp.onchange = async () => {
    const f = inp.files[0];
    if (f) {
      try {
        const dataUrl = await compressImage(f, 1000, 0.75);
        toast('กำลังอัปโหลดรูป…');
        await api.post('addProductImage', { productId, dataUrl });
        toast('ใส่รูปสินค้าแล้ว', 'ok'); render();
      } catch (e) { toast(e.message || 'อัปโหลดรูปไม่สำเร็จ', 'err'); }
    }
    inp.remove();
  };
  document.body.appendChild(inp); inp.click();
}
function deleteProductImage(productId) {
  confirmDialog('ลบรูปสินค้านี้?', async () => { await api.post('deleteProductImage', { productId }); toast('ลบรูปแล้ว', 'ok'); render(); });
}

/* confirm dialog */
function confirmDialog(msg, onYes, opts = {}) {
  const icon = opts.icon || 'trash';
  const label = opts.label || 'ลบ';
  const cls = opts.danger === false ? 'btn-primary' : 'btn-danger';
  openModal(`<h3>${svg(icon)} ยืนยัน</h3><p class="muted">${esc(msg)}</p>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn ${cls}" id="cfBtn">${esc(label)}</button></div>`);
  $('#cfBtn').onclick = () => withBusy('cfBtn', async () => { await onYes(); closeModal(); });
}

/* ============================================================
   PRINT  — build a self-contained printout in #printArea
   ============================================================ */
function ensurePrintArea() {
  let p = $('#printArea');
  if (!p) { p = document.createElement('div'); p.id = 'printArea'; p.className = 'print-only'; document.body.appendChild(p); }
  return p;
}
function printDoc(html) { ensurePrintArea().innerHTML = html; window.print(); }

function printUtility() {
  const name = S.ui.worker, w = workerObj(name), rows = workerBills(name);
  const lo = Math.min(S.ui.fromIdx, S.ui.toIdx), hi = Math.max(S.ui.fromIdx, S.ui.toIdx);
  const sum = rangeSummary(rows, w);
  let lastY = null, body = '';
  rows.forEach((b, i) => {
    const c = calcBill(b, w);
    if (i < lo || i > hi) return;
    if (b.year !== lastY) { body += `<tr class="row-group"><td class="l" colspan="10">พ.ศ. ${b.year}</td></tr>`; lastY = b.year; }
    body += `<tr>
      <td class="l">${MTH[b.month]} ${b.year}${b.paid ? ' (จ่ายแล้ว)' : ''}</td>
      <td>${fmt(b.rent)}</td><td>${fmt(c.eU)}</td><td>${fmt(c.eC)}</td>
      <td>${fmt(c.wU)}</td><td>${fmt(c.wC)}</td><td>${fmt(b.extra)}</td>
      <td><b>${fmt(c.total)}</b></td><td class="l">${esc(b.note || '')}</td><td>${b.paid ? '✓' : '-'}</td></tr>`;
  });
  printDoc(`
    <div class="print-head"><h1>ใบสรุปค่าน้ำค่าไฟ — ${esc(name)}</h1>
      <div class="pmeta">${esc(CFG.ORG_NAME || '')} · ช่วง ${esc(sum.rangeLabel)} · พิมพ์ ${new Date().toLocaleDateString('th-TH')}</div></div>
    <div class="print-kpis">
      <div class="pk due"><div class="l">ยอดค้างชำระ</div><div class="v">${baht(sum.dueTotal)}</div></div>
      <div class="pk paid"><div class="l">จ่ายแล้ว</div><div class="v">${baht(sum.paidTotal)}</div></div>
      <div class="pk rent"><div class="l">ค่าเช่า</div><div class="v">${baht(sum.rent)}</div></div>
      <div class="pk elec"><div class="l">ค่าไฟ</div><div class="v">${baht(sum.eC)}</div></div>
      <div class="pk water"><div class="l">ค่าน้ำ</div><div class="v">${baht(sum.wC)}</div></div>
      <div class="pk extra"><div class="l">ค่าปรับ/อื่นๆ</div><div class="v">${baht(sum.extra)}</div></div>
    </div>
    <table class="data"><thead><tr><th class="l">เดือน</th><th>ค่าเช่า</th><th>หน่วยไฟ</th><th>ค่าไฟ</th><th>หน่วยน้ำ</th><th>ค่าน้ำ</th><th>อื่นๆ</th><th>รวม</th><th class="l">หมายเหตุ</th><th>จ่าย</th></tr></thead>
    <tbody>${body}</tbody></table>
    <div class="print-foot">KandaLedger · ${esc(CFG.ORG_NAME || '')}</div>`);
}

function printRound() {
  const r = S.data.rounds.find(x => x.roundId === S.ui.roundId); if (!r) return;
  const groups = roundGroups(r.roundId);
  const t = roundTotals(r.roundId);

  const pthumb = name => { const p = productByName(name); return p && p.url ? `<img class="pthumb" src="${esc(p.url)}" alt="">` : ''; };
  const groupBlocks = groups.map(g => {
    const items = groupItems(g.gid).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const gt = groupTotals(g.gid);
    const imgs = groupImages(g.gid);
    const body = items.map(it => `<tr>
      <td class="l pdate">${esc(it.date || '-')}</td><td class="l"><span class="pcell">${pthumb(it.product)}<span>${esc(it.product)}</span></span></td><td class="l">${esc(it.option || '-')}</td>
      <td>${fmt(it.qty)}</td><td>${fmt(it.unitPrice)}</td><td>${fmt(it.price)}</td>
      <td>${num(it.shipping) === 0 ? '-' : fmt(it.shipping)}</td><td>${num(it.discount) === 0 ? '-' : fmt(it.discount)}</td><td><b>${fmt(it.total)}</b></td></tr>`).join('');
    return `<div class="print-group">
      <div class="prh">${esc(g.label)} — ${gt.count} ชิ้น · สุทธิ ${baht(gt.total)}</div>
      <table class="data"><thead><tr><th class="l">วันที่</th><th class="l">สินค้า</th><th class="l">ตัวเลือก</th><th>จำนวน</th><th>ต่อหน่วย</th><th>ราคา</th><th>ค่าส่ง</th><th>ส่วนลด</th><th>รวม</th></tr></thead>
      <tbody>${body || '<tr><td colspan="9" class="l">— ไม่มีสินค้า —</td></tr>'}</tbody></table>
      ${imgs.length ? `<div class="print-receipts">${imgs.map(im => `<img src="${esc(im.url)}" alt="ใบเสร็จ">`).join('')}</div>` : ''}
    </div>`;
  }).join('');

  printDoc(`
    <div class="print-head"><h1>ใบสรุปการสั่งซื้อ — ${esc(r.title || 'รอบสั่งซื้อ')}</h1>
      <div class="pmeta">พิมพ์ ${new Date().toLocaleDateString('th-TH')}</div></div>
    <div class="print-kpis">
      <div class="pk hero"><div class="l">ยอดสุทธิรวม</div><div class="v">${baht(t.total)}</div><div class="sub">${t.count} รายการ</div></div>
      <div class="pk price"><div class="l">ราคาสินค้า</div><div class="v">${baht(t.price)}</div></div>
      <div class="pk ship"><div class="l">ค่าส่ง</div><div class="v">${baht(t.shipping)}</div></div>
      <div class="pk disc"><div class="l">ส่วนลด</div><div class="v">${baht(t.discount)}</div></div>
    </div>
    ${groupBlocks}
    <div class="print-foot">KandaLedger · ${esc(CFG.ORG_NAME || '')}</div>`);
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  // No backend → demo preview, no gate
  if (!HAS_BACKEND) {
    S.me = demoMe();
    S.loading = true; render();
    try { const r = await api.getAll(); S.data = r.data; } catch (e) { S.error = e.message; }
    S.loading = false; render();
    return;
  }
  // Backend → ลองกู้ PIN ที่จำไว้
  if (S.pin) {
    showLoader('กำลังโหลดข้อมูลจาก Google Sheet');
    try { const { data, me } = await api.getAll(); S.data = data; S.me = me; }
    catch (e) { S.pin = ''; S.me = null; localStorage.removeItem('kanda_pin'); }
  }
  if (S.me) { render(); startPolling(); flushRoomQueue(); } else entryGate();
}

/* expose handlers used in inline HTML */
Object.assign(window, {
  boot, selectWorker, setRange, rangeAll, rangeUnpaid, toggleYear, addWorkerPrompt, confirmAddWorker,
  deleteWorkerPrompt, addBill, editBill, togglePaid, deleteBill,
  openRound, closeRound, gotoRound, setRoundSearch, addRoundPrompt, confirmAddRound, deleteRoundPrompt, addItem, editItem, deleteItem, moveItemPrompt, moveItemTo,
  addGroup, deleteGroupPrompt, dragItem, dragOver, dragLeave, dropItem, armPaste, lightbox, toggleRoundDone, editRoundPrompt, confirmEditRound, pickRoundImage, deleteRoundImage,
  prodAuto, prodPick, prodHide, prodAddNew, openCatalog, closeCatalog, addProductPrompt, confirmAddProduct,
  updateProduct, deleteProductPrompt, pickProductImage, deleteProductImage, armProductPaste,
  printUtility, printRound, submitEntry, closeModal,
  roomSelectTab, roomToggleDay, roomShiftMonth, roomToday, roomStep, addRoomNote, editRoomNote, deleteRoomNote,
});

/* ============================================================
   DEMO data (used only when backend not configured)
   ============================================================ */
function demoMe() {
  return { role: 'owner', label: 'เจ้าของ (เดโม)', caps: { utilityRead: 1, utilityWrite: 1, purchaseRead: 1, purchaseWrite: 1, purchaseDone: 1, rooms: 1, compare: 1, rates: 1 }, roomsRead: ['maid', 'plug'], roomsWrite: ['maid', 'plug'] };
}
function demoData() {
  const t = todayBE();
  return {
    rates: [{ effectiveYear: 2569, effectiveMonth: 1, tempRate: 300, overnightRate: 500 }],
    rentals: [
      { id: 'rt1', source: 'maid', year: t.y, month: t.m, day: t.d, room: 2, temp: 0, overnight: 1, updatedAt: '' },
      { id: 'rt2', source: 'maid', year: t.y, month: t.m, day: t.d, room: 3, temp: 2, overnight: 0, updatedAt: '' },
      { id: 'rt3', source: 'plug', year: t.y, month: t.m, day: t.d, room: 2, temp: 0, overnight: 1, updatedAt: '' },
      { id: 'rt4', source: 'plug', year: t.y, month: t.m, day: t.d, room: 3, temp: 1, overnight: 0, updatedAt: '' },
    ],
    notes: [{ id: 'n1', source: 'maid', year: t.y, month: t.m, text: 'เบียร์ลีโอ 8 ขวด', amount: 640, updatedAt: '' }],
    workers: [{ name: 'คนงาน 1', elecRate: 7, waterRate: 30 }],
    bills: [
      { id: 'b1', worker: 'คนงาน 1', year: 2569, month: 1, rent: 2000, eOld: 100, eNew: 145, wOld: 20, wNew: 24, extra: 0, note: '', paid: true },
      { id: 'b2', worker: 'คนงาน 1', year: 2569, month: 2, rent: 2000, eOld: 145, eNew: 198, wOld: 24, wNew: 29, extra: 0, note: '', paid: false },
      { id: 'b3', worker: 'คนงาน 1', year: 2569, month: 3, rent: 2000, eOld: 198, eNew: 250, wOld: 29, wNew: 35, extra: 100, note: 'ค่าซ่อม', paid: false },
    ],
    rounds: [
      { roundId: 'R-demo1', date: '2026-05-07', title: 'ของเดือน พ.ค.', note: '', done: false },
      { roundId: 'R-demo2', date: '2026-04-12', title: 'รีโมท/หมึกพิมพ์', note: '', done: true },
    ],
    items: [
      { id: 'd1', roundId: 'R-demo1', groupId: 'R-demo1-1', option: '', date: '2026-05-07', product: 'หัวฉีดชำระ PT012', qty: 10, unitPrice: 45, price: 450, shipping: 0, discount: 0, total: 450 },
      { id: 'd2', roundId: 'R-demo1', groupId: 'R-demo1-2', option: 'สีเทา', date: '2026-05-07', product: 'พัดลมติดผนัง Hatari 16 นิ้ว', qty: 2, unitPrice: 998, price: 1996, shipping: 134, discount: 434, total: 1696 },
      { id: 'd3', roundId: 'R-demo2', groupId: 'R-demo2-1', option: '', date: '2026-04-12', product: 'หมึก HP 682 Black', qty: 2, unitPrice: 415, price: 830, shipping: 38, discount: 162, total: 706 },
    ],
    images: [],
    products: [
      { productId: 'P1', name: 'หัวฉีดชำระ PT012', fileId: '', url: '' },
      { productId: 'P2', name: 'พัดลมติดผนัง Hatari 16 นิ้ว', fileId: '', url: '' },
      { productId: 'P3', name: 'หมึก HP 682 Black', fileId: '', url: '' },
    ],
  };
}

boot();
