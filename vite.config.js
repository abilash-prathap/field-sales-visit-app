const STORAGE_KEY = 'field-sales-visit-app-v1';

const defaultState = {
  employeeName: '',
  beatName: '',
  ratePerKm: 12,
  routeStarted: false,
  startTime: '',
  startCoords: null,
  lastCoords: null,
  closingTime: '',
  closingCoords: null,
  closingPhoto: '',
  totalDistanceKm: 0,
  validVisitCount: 0,
  invalidVisitCount: 0,
  totalClaim: 0,
  outlets: [],
  closingMessage: '',
  activeOutlet: null,
};

const state = loadState();

export function createApp() {
  const root = document.querySelector('#app');

  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <div class="logo">FS</div>
          <h1>Field Sales Visit Tracker</h1>
        </div>
        <div class="badge">Assigned Beat Dashboard</div>
      </header>

      <main class="grid">
        <section class="card">
          <h2>1. Daily Start / Self Check-in</h2>
          <div class="form-grid">
            <div class="field">
              <label>Employee Name</label>
              <input id="employeeName" type="text" placeholder="Enter sales rep name" value="${state.employeeName}" />
            </div>
            <div class="field">
              <label>Assigned Beat Name</label>
              <input id="beatName" type="text" placeholder="e.g. North Market Circle" value="${state.beatName}" />
            </div>
            <div class="field">
              <label>Travel Rate / KM</label>
              <input id="ratePerKm" type="number" min="0" step="0.1" value="${state.ratePerKm}" />
            </div>
            <div class="field">
              <label>Start Time</label>
              <input id="startTime" type="text" value="${state.startTime || 'Not started yet'}" readonly />
            </div>
          </div>

          <div class="btn-row">
            <button id="startDayBtn" class="success">Start Beat & Check-in</button>
            <button id="resetDayBtn" class="ghost secondary">Reset Day</button>
          </div>

          <div class="summary-box">
            <div class="metric">
              <strong>Distance Travelled</strong>
              <span id="distanceMetric">${formatKm(state.totalDistanceKm)}</span>
            </div>
            <div class="metric">
              <strong>Travel Claim</strong>
              <span id="claimMetric">₹${formatCurrency(state.totalClaim)}</span>
            </div>
            <div class="metric">
              <strong>Valid Visits</strong>
              <span id="validMetric">${state.validVisitCount}/20</span>
            </div>
            <div class="metric">
              <strong>Invalid Visits</strong>
              <span id="invalidMetric">${state.invalidVisitCount}</span>
            </div>
          </div>

          <div id="startStatus" class="status">${state.routeStarted ? 'Route started and GPS captured.' : 'Ready to start the beat.'}</div>
        </section>

        <section class="card">
          <h2>2. Outlet Visit</h2>
          <div class="form-grid">
            <div class="field full">
              <label>Outlet Name</label>
              <input id="outletName" type="text" placeholder="Outlet / Shop Name" />
            </div>
            <div class="field">
              <label>Outlet Type</label>
              <select id="outletType">
                <option value="General Trade">General Trade</option>
                <option value="Modern Trade">Modern Trade</option>
                <option value="Distributor">Distributor</option>
                <option value="Key Account">Key Account</option>
              </select>
            </div>
            <div class="field">
              <label>Visit Time</label>
              <input id="visitTime" type="text" readonly value="Not checked in yet" />
            </div>
          </div>

          <div class="item-section">
            <div class="item-section-header">
              <h3>Stock Check - SKU wise</h3>
              <button id="addStockRowBtn" class="ghost secondary" type="button">+ Add SKU</button>
            </div>
            <div id="stockRows" class="item-list">
              <div class="item-row">
                <input class="stock-sku" type="text" placeholder="SKU" />
                <input class="stock-qty" type="number" min="0" placeholder="Qty" />
                <input class="stock-note" type="text" placeholder="Stock note" />
              </div>
            </div>
          </div>

          <div class="item-section">
            <div class="item-section-header">
              <h3>Order Booking - SKU wise</h3>
              <button id="addOrderRowBtn" class="ghost secondary" type="button">+ Add SKU</button>
            </div>
            <div id="orderRows" class="item-list">
              <div class="item-row">
                <input class="order-sku" type="text" placeholder="SKU" />
                <input class="order-qty" type="number" min="0" placeholder="Qty" />
                <input class="order-value" type="text" placeholder="Order value / note" />
              </div>
            </div>
          </div>

          <div class="photo-grid">
            <div class="photo-box">
              <label>Display Photo with competition product</label>
              <input id="displayPhotoInput" type="file" accept="image/*" capture="environment" />
              <img id="displayPhotoPreview" class="preview" alt="Display photo preview" />
            </div>
            <div class="photo-box">
              <label>Competition / Product Photo</label>
              <input id="competitionPhotoInput" type="file" accept="image/*" capture="environment" />
              <img id="competitionPhotoPreview" class="preview" alt="Competition product preview" />
            </div>
          </div>

          <div class="field full" style="margin-top: 18px;">
            <label>No Order Reason</label>
            <textarea id="noOrderReason" placeholder="If no order, enter reason caption"></textarea>
          </div>

          <div class="btn-row">
            <button id="checkinBtn" class="secondary">Outlet Check-in</button>
            <button id="checkoutBtn" class="warning">Outlet Check-out</button>
          </div>

          <div id="outletStatus" class="status">No outlet visit started.</div>
        </section>

        <section class="card">
          <h2>3. Daily Closing</h2>
          <div class="photo-grid">
            <div class="photo-box full-width">
              <label>Closing GPS Photo</label>
              <input id="closingPhotoInput" type="file" accept="image/*" capture="environment" />
              <img id="closingPhotoPreview" class="preview" alt="Closing photo preview" />
            </div>
          </div>

          <div class="btn-row">
            <button id="closingCheckOutBtn" class="danger">Closing Check-out</button>
          </div>

          <div id="closingStatus" class="status">Day is still in progress.</div>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2>4. Visit Log</h2>
          <table class="visits-table">
            <thead>
              <tr>
                <th>Outlet</th>
                <th>Duration</th>
                <th>GPS</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody id="visitTableBody">
              <tr>
                <td colspan="4">No outlets visited yet.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2>5. Closing Report / WA Message</h2>
          <div class="report-box">
            <textarea id="closingMessageOutput" readonly>${state.closingMessage}</textarea>
          </div>
          <div class="btn-row">
            <button id="copyReportBtn" class="ghost secondary">Copy WA Message</button>
          </div>
        </section>
      </main>
    </div>
  `;

  bindEventHandlers();
  syncInputs();
  renderVisitTable();
}

function bindEventHandlers() {
  document.getElementById('startDayBtn').addEventListener('click', startDay);
  document.getElementById('resetDayBtn').addEventListener('click', resetDay);
  document.getElementById('checkinBtn').addEventListener('click', outletCheckIn);
  document.getElementById('checkoutBtn').addEventListener('click', outletCheckOut);
  document.getElementById('closingCheckOutBtn').addEventListener('click', closingCheckOut);
  document.getElementById('copyReportBtn').addEventListener('click', copyReport);
  document.getElementById('addStockRowBtn').addEventListener('click', addStockRow);
  document.getElementById('addOrderRowBtn').addEventListener('click', addOrderRow);

  document.getElementById('displayPhotoInput').addEventListener('change', (event) => {
    handleImageUpload(event, 'displayPhotoPreview');
  });
  document.getElementById('competitionPhotoInput').addEventListener('change', (event) => {
    handleImageUpload(event, 'competitionPhotoPreview');
  });
  document.getElementById('closingPhotoInput').addEventListener('change', (event) => {
    handleImageUpload(event, 'closingPhotoPreview');
  });

  document.getElementById('employeeName').addEventListener('input', (event) => {
    state.employeeName = event.target.value.trim();
    saveState();
  });
  document.getElementById('beatName').addEventListener('input', (event) => {
    state.beatName = event.target.value.trim();
    saveState();
  });
  document.getElementById('ratePerKm').addEventListener('input', (event) => {
    const value = Number(event.target.value || 0);
    state.ratePerKm = Number.isFinite(value) ? value : 0;
    state.totalClaim = state.totalDistanceKm * state.ratePerKm;
    saveState();
    updateSummary();
  });
}

function syncInputs() {
  document.getElementById('employeeName').value = state.employeeName;
  document.getElementById('beatName').value = state.beatName;
  document.getElementById('ratePerKm').value = state.ratePerKm;
  document.getElementById('startTime').value = state.startTime || 'Not started yet';
  renderStartStatus();
  renderTriggerImage('displayPhotoPreview', state.activeOutlet?.displayPhoto || '');
  renderTriggerImage('competitionPhotoPreview', state.activeOutlet?.competitionPhoto || '');
  renderTriggerImage('closingPhotoPreview', state.closingPhoto || '');
  updateSummary();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (error) {
    return { ...defaultState };
  }
}

function formatKm(value) {
  return `${Number(value || 0).toFixed(2)} km`;
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function setStatus(id, message, type = '') {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function getCurrentLocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError('This browser does not support GPS location capture.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      onSuccess(coords);
    },
    () => onError('GPS permission denied. Please allow access to use check-in and check-out tracking.'),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function handleImageUpload(event, previewId) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const result = loadEvent.target?.result;
    const preview = document.getElementById(previewId);
    preview.src = result;
    preview.classList.add('visible');

    if (previewId === 'displayPhotoPreview') {
      state.activeOutlet = state.activeOutlet || {};
      state.activeOutlet.displayPhoto = result;
    }
    if (previewId === 'competitionPhotoPreview') {
      state.activeOutlet = state.activeOutlet || {};
      state.activeOutlet.competitionPhoto = result;
    }
    if (previewId === 'closingPhotoPreview') {
      state.closingPhoto = result;
    }
    saveState();
  };
  reader.readAsDataURL(file);
}

function renderTriggerImage(id, value) {
  const preview = document.getElementById(id);
  if (!preview) return;
  if (value) {
    preview.src = value;
    preview.classList.add('visible');
  } else {
    preview.classList.remove('visible');
    preview.removeAttribute('src');
  }
}

function startDay() {
  const employeeName = document.getElementById('employeeName').value.trim();
  const beatName = document.getElementById('beatName').value.trim();
  const ratePerKm = Number(document.getElementById('ratePerKm').value || 0);

  if (!employeeName || !beatName) {
    setStatus('startStatus', 'Please enter employee name and assigned beat before starting the day.', 'error');
    return;
  }

  state.employeeName = employeeName;
  state.beatName = beatName;
  state.ratePerKm = Number.isFinite(ratePerKm) ? ratePerKm : 0;

  getCurrentLocation(
    (coords) => {
      state.routeStarted = true;
      state.startCoords = coords;
      state.lastCoords = coords;
      state.startTime = new Date().toLocaleString();
      state.totalDistanceKm = 0;
      state.totalClaim = 0;
      document.getElementById('startTime').value = state.startTime;
      document.getElementById('employeeName').value = state.employeeName;
      document.getElementById('beatName').value = state.beatName;
      document.getElementById('ratePerKm').value = state.ratePerKm;
      setStatus('startStatus', `Route started for ${state.beatName}. GPS captured successfully.`, 'success');
      saveState();
      updateSummary();
    },
    (error) => setStatus('startStatus', error, 'error')
  );
}

function resetDay() {
  const resetConfirm = window.confirm('Reset the daily route and clear visit data?');
  if (!resetConfirm) return;

  Object.assign(state, { ...defaultState, ratePerKm: state.ratePerKm || 12 });
  saveState();
  syncInputs();
  renderVisitTable();
  setStatus('startStatus', 'Day reset. Ready to start again.', 'success');
  setStatus('outletStatus', 'No outlet visit started.', '');
  setStatus('closingStatus', 'Day is still in progress.', '');
  document.getElementById('closingMessageOutput').value = '';
}

function outletCheckIn() {
  if (!state.routeStarted || !state.startCoords) {
    setStatus('outletStatus', 'Start the day and capture GPS before checking into an outlet.', 'error');
    return;
  }

  const outletName = document.getElementById('outletName').value.trim();
  if (!outletName) {
    setStatus('outletStatus', 'Please enter the outlet name to check in.', 'error');
    return;
  }

  getCurrentLocation(
    (coords) => {
      state.activeOutlet = {
        outletName,
        outletType: document.getElementById('outletType').value,
        checkinTime: new Date().toLocaleString(),
        checkinCoords: coords,
        displayPhoto: state.activeOutlet?.displayPhoto || '',
        competitionPhoto: state.activeOutlet?.competitionPhoto || '',
        noOrderReason: document.getElementById('noOrderReason').value.trim(),
        stockItems: readRows('stockRows', 'stock-sku', 'stock-qty', 'stock-note'),
        orderItems: readRows('orderRows', 'order-sku', 'order-qty', 'order-value'),
        validVisit: false,
        durationMinutes: 0,
      };

      document.getElementById('visitTime').value = state.activeOutlet.checkinTime;
      setStatus('outletStatus', `Outlet check-in captured for ${outletName}.`, 'success');
      saveState();
      updateSummary();
    },
    (error) => setStatus('outletStatus', error, 'error')
  );
}

function outletCheckOut() {
  if (!state.activeOutlet) {
    setStatus('outletStatus', 'Please check in to an outlet first.', 'error');
    return;
  }

  getCurrentLocation(
    (coords) => {
      const checkinTime = new Date(state.activeOutlet.checkinTime);
      const checkoutTime = new Date();
      const durationMinutes = (checkoutTime - checkinTime) / 60000;

      state.activeOutlet.checkoutTime = checkoutTime.toLocaleString();
      state.activeOutlet.checkoutCoords = coords;
      state.activeOutlet.displayPhoto = state.activeOutlet.displayPhoto || document.getElementById('displayPhotoPreview').src || '';
      state.activeOutlet.competitionPhoto = state.activeOutlet.competitionPhoto || document.getElementById('competitionPhotoPreview').src || '';
      state.activeOutlet.noOrderReason = document.getElementById('noOrderReason').value.trim();
      state.activeOutlet.stockItems = readRows('stockRows', 'stock-sku', 'stock-qty', 'stock-note');
      state.activeOutlet.orderItems = readRows('orderRows', 'order-sku', 'order-qty', 'order-value');
      state.activeOutlet.durationMinutes = durationMinutes;
      const durationValid = durationMinutes >= 10 && durationMinutes <= 30;
      const hasOutlet = !!state.activeOutlet.outletName && !!state.activeOutlet.checkinCoords;
      state.activeOutlet.validVisit = durationValid && hasOutlet;

      const distanceFromLast = calculateDistance(
        state.lastCoords?.latitude,
        state.lastCoords?.longitude,
        coords.latitude,
        coords.longitude
      );

      if (Number.isFinite(distanceFromLast)) {
        state.totalDistanceKm += distanceFromLast;
        state.lastCoords = coords;
      }

      state.totalClaim = state.totalDistanceKm * state.ratePerKm;

      if (state.activeOutlet.validVisit) {
        state.validVisitCount += 1;
      } else {
        state.invalidVisitCount += 1;
      }

      state.outlets.push({ ...state.activeOutlet });
      state.activeOutlet = null;

      saveState();
      updateSummary();
      renderVisitTable();

      const outletStatusText = state.activeOutlet?.validVisit
        ? `Valid visit recorded. Duration: ${durationMinutes.toFixed(1)} mins.`
        : `Visit recorded but it is invalid. Duration must be 10-30 minutes and a valid outlet must be checked in.`;
      setStatus('outletStatus', outletStatusText, state.activeOutlet?.validVisit ? 'success' : 'error');

      resetOutletForm();
    },
    (error) => setStatus('outletStatus', error, 'error')
  );
}

function closingCheckOut() {
  if (!state.routeStarted) {
    setStatus('closingStatus', 'Start the route before closing the day.', 'error');
    return;
  }

  getCurrentLocation(
    (coords) => {
      state.closingTime = new Date().toLocaleString();
      state.closingCoords = coords;
      state.closingPhoto = document.getElementById('closingPhotoPreview').src || '';

      const report = buildClosingReport();
      state.closingMessage = report;
      document.getElementById('closingMessageOutput').value = report;

      setStatus('closingStatus', 'Closing check-out completed and report generated.', 'success');
      saveState();
      updateSummary();
    },
    (error) => setStatus('closingStatus', error, 'error')
  );
}

function buildClosingReport() {
  const validTarget = 20;
  const claim = state.totalClaim;
  const totalDistance = state.totalDistanceKm;
  const validVisits = state.validVisitCount;
  const invalidVisits = state.invalidVisitCount;

  return [
    '*Daily Closing Report*',
    `Employee: ${state.employeeName || 'N/A'}`,
    `Beat: ${state.beatName || 'N/A'}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Total Distance Travelled: ${formatKm(totalDistance)}`,
    `Travel Claim: ₹${formatCurrency(claim)}`,
    `Valid Visits: ${validVisits}/${validTarget}`,
    `Invalid Visits: ${invalidVisits}`,
    `Outlets Checked: ${state.outlets.length}`,
    `Ending GPS: ${state.closingCoords ? `${state.closingCoords.latitude.toFixed(5)}, ${state.closingCoords.longitude.toFixed(5)}` : 'N/A'}`,
    '',
    'Thanks and closing the day. Please review the daily performance report.'
  ].join('\n');
}

function copyReport() {
  const report = document.getElementById('closingMessageOutput').value;
  if (!report) {
    setStatus('closingStatus', 'No closing message is available yet.', 'error');
    return;
  }

  navigator.clipboard.writeText(report).then(() => {
    setStatus('closingStatus', 'WhatsApp closing message copied to clipboard.', 'success');
  }).catch(() => {
    setStatus('closingStatus', 'Unable to copy automatically. Please select and copy the closing message manually.', 'error');
  });
}

function renderVisitTable() {
  const body = document.getElementById('visitTableBody');
  if (!state.outlets.length) {
    body.innerHTML = '<tr><td colspan="4">No outlets visited yet.</td></tr>';
    return;
  }

  body.innerHTML = state.outlets.map((outlet) => `
    <tr>
      <td>${outlet.outletName}</td>
      <td>${Number(outlet.durationMinutes || 0).toFixed(1)} mins</td>
      <td>${outlet.checkinCoords ? `${outlet.checkinCoords.latitude.toFixed(5)}, ${outlet.checkinCoords.longitude.toFixed(5)}` : 'N/A'}</td>
      <td class="status-tag ${outlet.validVisit ? 'valid' : 'invalid'}">${outlet.validVisit ? 'Valid Visit' : 'Invalid Visit'}</td>
    </tr>
  `).join('');
}

function updateSummary() {
  document.getElementById('distanceMetric').textContent = formatKm(state.totalDistanceKm);
  document.getElementById('claimMetric').textContent = `₹${formatCurrency(state.totalClaim)}`;
  document.getElementById('validMetric').textContent = `${state.validVisitCount}/20`;
  document.getElementById('invalidMetric').textContent = `${state.invalidVisitCount}`;
}

function renderStartStatus() {
  if (state.routeStarted) {
    setStatus('startStatus', `Route started for ${state.beatName}. GPS captured successfully.`, 'success');
  }
}

function readRows(containerId, skuClass, qtyClass, noteClass) {
  const rows = Array.from(document.getElementById(containerId).querySelectorAll('.item-row'));
  return rows
    .map((row) => {
      const sku = row.querySelector(`.${skuClass}`)?.value?.trim() || '';
      const qty = Number(row.querySelector(`.${qtyClass}`)?.value || 0);
      const note = row.querySelector(`.${noteClass}`)?.value?.trim() || '';
      return { sku, qty, note };
    })
    .filter((item) => item.sku || item.qty || item.note);
}

function addStockRow() {
  const container = document.getElementById('stockRows');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input class="stock-sku" type="text" placeholder="SKU" />
    <input class="stock-qty" type="number" min="0" placeholder="Qty" />
    <input class="stock-note" type="text" placeholder="Stock note" />
  `;
  container.appendChild(row);
}

function addOrderRow() {
  const container = document.getElementById('orderRows');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input class="order-sku" type="text" placeholder="SKU" />
    <input class="order-qty" type="number" min="0" placeholder="Qty" />
    <input class="order-value" type="text" placeholder="Order value / note" />
  `;
  container.appendChild(row);
}

function resetOutletForm() {
  document.getElementById('outletName').value = '';
  document.getElementById('outletType').value = 'General Trade';
  document.getElementById('visitTime').value = 'Not checked in yet';
  document.getElementById('noOrderReason').value = '';
  document.getElementById('displayPhotoPreview').src = '';
  document.getElementById('displayPhotoPreview').classList.remove('visible');
  document.getElementById('competitionPhotoPreview').src = '';
  document.getElementById('competitionPhotoPreview').classList.remove('visible');

  document.getElementById('stockRows').innerHTML = `
    <div class="item-row">
      <input class="stock-sku" type="text" placeholder="SKU" />
      <input class="stock-qty" type="number" min="0" placeholder="Qty" />
      <input class="stock-note" type="text" placeholder="Stock note" />
    </div>
  `;

  document.getElementById('orderRows').innerHTML = `
    <div class="item-row">
      <input class="order-sku" type="text" placeholder="SKU" />
      <input class="order-qty" type="number" min="0" placeholder="Qty" />
      <input class="order-value" type="text" placeholder="Order value / note" />
    </div>
  `;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;

  const earthRadiusKm = 6371;
  const diffLat = toRad(lat2 - lat1);
  const diffLon = toRad(lon2 - lon1);
  const a =
    Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(diffLon / 2) * Math.sin(diffLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

window.addEventListener('beforeunload', saveState);
