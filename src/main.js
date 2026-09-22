import './styles.css';

const KEY = 'field-sales-visit-app-v1';
const defaults = { employee: '', beat: '', rate: 12, started: false, start: null, last: null, distance: 0, valid: 0, invalid: 0, visits: [], active: null, close: null };
let state = { ...defaults, ...readState() };
const $ = (id) => document.getElementById(id);
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const readState = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const gps = (done, fail) => {
  if (!navigator.geolocation) return fail('GPS is not supported by this browser.');
  navigator.geolocation.getCurrentPosition(
    (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
    () => fail('GPS permission is required. Please allow location access.'),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};
const distance = (a, b) => {
  if (!a || !b) return 0;
  const r = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const setStatus = (id, text, type = '') => { $(id).textContent = text; $(id).className = `status ${type}`; };
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const report = () => `*Daily Closing Report*\nEmployee: ${state.employee || 'N/A'}\nBeat: ${state.beat || 'N/A'}\nValid Visits: ${state.valid}/20\nInvalid Visits: ${state.invalid}\nOutlets Checked: ${state.visits.length}\nTravel Distance: ${state.distance.toFixed(2)} km\nTravel Claim: ₹${(state.distance * Number(state.rate || 0)).toFixed(2)}\nClosing GPS: ${state.close ? `${state.close.lat.toFixed(5)}, ${state.close.lng.toFixed(5)}` : 'N/A'}`;

$('app').innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">FS</div><div><strong>FieldPro</strong><span>FMCG Sales Suite</span></div></div>
      <nav><a class="active"><span>▦</span> Beat planner</a><a><span>◎</span> Today's route</a><a><span>▤</span> Outlet history</a><a><span>⌁</span> Reports</a></nav>
      <div class="sidebar-footer"><div class="help-icon">?</div><div><strong>Need help?</strong><span>Contact your supervisor</span></div></div>
    </aside>
    <main class="content">
      <div class="mobile-brand"><div class="brand-mark">FS</div><strong>FieldPro</strong></div>
      <header class="page-header"><div><div class="eyebrow">FIELD EXECUTIVE WORKSPACE</div><h1>Good morning, <span id="headerName">Sales Executive</span> <span class="wave">✦</span></h1><p id="todayLabel"></p></div><div class="header-actions"><span class="sync-dot"><i></i> GPS ready</span><button class="avatar">SE</button></div></header>
      <section class="hero card"><div><span class="pill blue">TODAY'S BEAT PLAN</span><h2 id="beatTitle">Start your day with a focused route</h2><p>Capture attendance, execute outlet visits and close your day with an accurate claim.</p></div><div class="hero-illustration"><div class="route-line"></div><span class="pin pin-one">●</span><span class="pin pin-two">●</span><span class="pin pin-three">●</span></div></section>
      <section class="metrics"><div class="metric card"><div class="metric-icon blue-bg">⌖</div><div><span>Distance travelled</span><strong id="distance">0.00 km</strong><small>Since morning check-in</small></div></div><div class="metric card"><div class="metric-icon green-bg">₹</div><div><span>Travel claim</span><strong id="claim">₹0.00</strong><small>Based on ₹12/km</small></div></div><div class="metric card"><div class="metric-icon orange-bg">✓</div><div><span>Valid visits</span><strong id="valid">0 <em>/ 20</em></strong><small id="visitProgress">20 visits planned</small></div></div><div class="metric card"><div class="metric-icon purple-bg">◷</div><div><span>Route status</span><strong id="routeStatus">Not started</strong><small id="startTime">Start your route</small></div></div></section>
      <div class="section-heading"><div><span class="eyebrow">YOUR WORKFLOW</span><h2>Daily execution</h2></div><span class="date-chip" id="dateChip"></span></div>
      <section class="workflow-grid">
        <article class="card workflow-card start-card"><div class="card-top"><div class="step-number">01</div><span class="step-state" id="startState">PENDING</span></div><h3>Start your beat</h3><p>Mark attendance and begin travel tracking from your current GPS location.</p><div class="form-grid"><label>Employee name<input id="employee" placeholder="Your name" /></label><label>Assigned beat<input id="beat" placeholder="e.g. North Market" /></label><label>Travel rate / km<input id="rate" type="number" min="0" value="12" /></label><label>Start time<input id="startInput" readonly value="Not started" /></label></div><button id="start" class="primary full-btn">Start beat & capture GPS <span>→</span></button><button id="reset" class="text-btn">Reset today's route</button><div id="startStatus" class="status">Ready to start your assigned beat.</div></article>
        <article class="card workflow-card visit-card"><div class="card-top"><div class="step-number">02</div><span class="step-state">10–30 MIN VISIT</span></div><h3>Execute outlet visit</h3><p>Complete the outlet checklist before checking out. Visits outside the time window are invalid.</p><label>Outlet name<input id="outlet" placeholder="Search or enter outlet name" /></label><div class="two-col"><label>Stock check (SKU wise)<textarea id="stock" placeholder="SKU : quantity"></textarea></label><label>Order booking (SKU wise)<textarea id="orders" placeholder="SKU : order quantity"></textarea></label></div><div class="upload-row"><label class="upload"><span>▧</span> Display / competition photo<input id="photo" type="file" accept="image/*" capture="environment" /></label><label class="upload"><span>⌕</span> No-order reason<input id="reason" placeholder="Add reason if no order" /></label></div><div class="button-group"><button id="in" class="secondary">Check in <span>↗</span></button><button id="out" class="primary">Check out <span>↘</span></button></div><div id="outletStatus" class="status">No outlet visit in progress.</div></article>
        <article class="card workflow-card close-card"><div class="card-top"><div class="step-number">03</div><span class="step-state">END OF DAY</span></div><h3>Close & submit</h3><p>Capture your final GPS location and generate the WhatsApp-ready day report.</p><label class="upload upload-large"><span>▣</span><div><strong>Closing GPS photo</strong><small>Take a photo at the end of your route</small></div><input id="closingPhoto" type="file" accept="image/*" capture="environment" /></label><button id="close" class="danger full-btn">Closing check-out with GPS <span>↘</span></button><div id="closeStatus" class="status">Day is still in progress.</div><textarea id="message" class="report" readonly placeholder="Your closing report will appear here"></textarea><button id="copy" class="text-btn copy-btn">▣ Copy WhatsApp report</button></article>
      </section>
      <section class="card log-card"><div class="section-heading compact"><div><span class="eyebrow">LIVE ACTIVITY</span><h2>Today's outlet visits</h2></div><span class="count-chip" id="countChip">0 visits</span></div><div class="table-wrap"><table><thead><tr><th>OUTLET</th><th>CHECK-IN</th><th>DURATION</th><th>STATUS</th></tr></thead><tbody id="log"><tr><td colspan="4" class="empty">No visits recorded yet. Start with your first outlet.</td></tr></tbody></table></div></section>
    </main>
  </div>`;

function refresh() {
  $('distance').textContent = `${state.distance.toFixed(2)} km`;
  $('claim').textContent = `₹${(state.distance * Number(state.rate || 0)).toFixed(2)}`;
  $('valid').innerHTML = `${state.valid} <em>/ 20</em>`;
  $('visitProgress').textContent = `${Math.min(state.valid / 20 * 100, 100).toFixed(0)}% of target complete`;
  $('claim').nextElementSibling.textContent = `Based on ₹${state.rate || 0}/km`;
  $('employee').value = state.employee; $('beat').value = state.beat; $('rate').value = state.rate;
  $('headerName').textContent = state.employee || 'Sales Executive'; $('beatTitle').textContent = state.beat ? `${state.beat} · today's route` : 'Start your day with a focused route';
  $('startInput').value = state.start ? new Date(state.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not started';
  $('startTime').textContent = state.start ? `Started ${new Date(state.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Start your route';
  $('routeStatus').textContent = state.started ? 'In progress' : 'Not started'; $('startState').textContent = state.started ? 'ACTIVE' : 'PENDING';
  $('countChip').textContent = `${state.visits.length} visit${state.visits.length === 1 ? '' : 's'}`;
  $('log').innerHTML = state.visits.length ? state.visits.map(v => `<tr><td><strong>${escapeHtml(v.name)}</strong></td><td>${v.at ? new Date(v.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td><td>${v.minutes.toFixed(1)} min</td><td><span class="tag ${v.valid ? 'valid' : 'invalid'}">${v.valid ? '✓ Valid visit' : '× Invalid visit'}</span></td></tr>`).join('') : '<tr><td colspan="4" class="empty">No visits recorded yet. Start with your first outlet.</td></tr>';
}
$('todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); $('dateChip').textContent = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
$('start').onclick = () => { state.employee = $('employee').value.trim(); state.beat = $('beat').value.trim(); state.rate = Number($('rate').value || 0); if (!state.employee || !state.beat) return setStatus('startStatus', 'Enter employee name and assigned beat first.', 'bad'); gps(p => { state.started = true; state.start = Date.now(); state.last = p; state.distance = 0; save(); refresh(); setStatus('startStatus', `Beat started successfully. GPS accuracy ±${Math.round(p.accuracy || 0)}m.`, 'good'); }, e => setStatus('startStatus', e, 'bad')); };
$('in').onclick = () => { if (!state.started) return setStatus('outletStatus', 'Start the assigned beat first.', 'bad'); const name = $('outlet').value.trim(); if (!name) return setStatus('outletStatus', 'Enter an outlet name.', 'bad'); if (state.active) return setStatus('outletStatus', 'Check out from the current outlet first.', 'bad'); gps(p => { state.active = { name, at: Date.now(), gps: p }; save(); setStatus('outletStatus', `Checked in to ${name}. Visit window: 10–30 minutes.`, 'good'); }, e => setStatus('outletStatus', e, 'bad')); };
$('out').onclick = () => { if (!state.active) return setStatus('outletStatus', 'Check in to an outlet first.', 'bad'); gps(p => { const minutes = (Date.now() - state.active.at) / 60000, valid = minutes >= 10 && minutes <= 30; state.distance += distance(state.last, p); state.last = p; state.visits.push({ name: state.active.name, at: state.active.at, minutes, valid }); valid ? state.valid++ : state.invalid++; state.active = null; save(); refresh(); setStatus('outletStatus', valid ? `Valid visit recorded (${minutes.toFixed(1)} minutes).` : 'Invalid visit: duration must be between 10 and 30 minutes.', valid ? 'good' : 'bad'); }, e => setStatus('outletStatus', e, 'bad')); };
$('close').onclick = () => { if (!state.started) return setStatus('closeStatus', 'Start the day first.', 'bad'); gps(p => { state.close = p; $('message').value = report(); save(); setStatus('closeStatus', 'Closing GPS captured. Report is ready to share.', 'good'); }, e => setStatus('closeStatus', e, 'bad')); };
$('copy').onclick = () => { if (!$('message').value) return setStatus('closeStatus', 'Generate the closing report first.', 'bad'); navigator.clipboard?.writeText($('message').value).then(() => setStatus('closeStatus', 'WhatsApp report copied to clipboard.', 'good')); };
$('reset').onclick = () => { if (confirm("Reset today's route and visits?")) { state = { ...defaults, rate: Number($('rate').value || 12) }; save(); refresh(); $('message').value = ''; setStatus('startStatus', 'Day reset. Ready to start again.', 'good'); } };
$('rate').oninput = () => { state.rate = Number($('rate').value || 0); save(); refresh(); }; refresh();
