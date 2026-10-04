const STORAGE_KEY = 'field-sales-visit-app-v1';

const sampleVisits = [
  {
    id: 'visit-1',
    name: 'Aroma Food Hub',
    type: 'Retail Outlet',
    status: 'Verified',
    minutes: 24,
    distance: 1.3,
    notes: 'Stocked fresh batches and recorded weekly promo display.',
    time: '08:40 AM'
  },
  {
    id: 'visit-2',
    name: 'GreenLeaf Mart',
    type: 'Supermarket',
    status: 'In progress',
    minutes: 18,
    distance: 2.1,
    notes: 'Shelf audit pending for premium category skewers.',
    time: '09:35 AM'
  },
  {
    id: 'visit-3',
    name: 'City Corner Cafe',
    type: 'HORECA',
    status: 'Verified',
    minutes: 16,
    distance: 1.8,
    notes: 'New display board approved for breakfast bundle.',
    time: '10:25 AM'
  }
];

const defaultState = {
  employee: 'Asha K.',
  beat: 'Koramangala South',
  rate: 18,
  started: true,
  visits: sampleVisits,
  lastLocation: { lat: 12.9352, lng: 77.6245 },
  routeDistance: 14.8,
  report: '',
  selectedView: 'dashboard'
};

const state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...defaultState,
      ...saved,
      visits: Array.isArray(saved.visits) && saved.visits.length ? saved.visits : defaultState.visits,
      lastLocation: saved.lastLocation || defaultState.lastLocation,
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createDemoLocation() {
  const base = {
    lat: 12.9352 + (Math.random() - 0.5) * 0.004,
    lng: 77.6245 + (Math.random() - 0.5) * 0.004,
  };

  return {
    lat: Number(base.lat.toFixed(5)),
    lng: Number(base.lng.toFixed(5)),
    accuracy: 18 + Math.round(Math.random() * 25),
    source: 'demo'
  };
}

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(createDemoLocation());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
          accuracy: position.coords.accuracy || 25,
          source: 'live'
        });
      },
      () => {
        resolve(createDemoLocation());
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function calculateStats() {
  const valid = state.visits.filter((visit) => visit.status === 'Verified').length;
  const total = state.visits.length;
  const revenue = state.visits.reduce((sum, visit) => sum + (Number(visit.minutes || 0) * (state.rate || 12) * 4), 0);
  const distance = state.routeDistance || 0;
  const completion = Math.min(100, Math.round((valid / 20) * 100));

  return { valid, total, revenue, distance, completion };
}

function renderApp() {
  const stats = calculateStats();

  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-block">
          <div class="brand-mark">SP</div>
          <div>
            <span class="eyebrow muted">Field ops</span>
            <h3>SalesPilot</h3>
          </div>
        </div>

        <nav class="side-nav" aria-label="Main navigation">
          <button class="nav-item active" data-view="dashboard">
            <span>⌂</span>
            Overview
          </button>
          <button class="nav-item" data-view="outlets">
            <span>▣</span>
            Outlets
          </button>
          <button class="nav-item" data-view="route">
            <span>◎</span>
            Route
          </button>
          <button class="nav-item" data-view="report">
            <span>✎</span>
            Report
          </button>
        </nav>

        <div class="sidebar-card">
          <p>Today’s target</p>
          <strong>${stats.valid}/20</strong>
          <span>${stats.completion}% complete</span>
        </div>
      </aside>

      <main class="main-panel">
        <header class="topbar">
          <div>
            <span class="eyebrow muted">${getGreeting()}, ${state.employee || 'Sales Executive'}</span>
            <h1>Beat dashboard</h1>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" id="demoGpsBtn">Demo GPS</button>
            <button class="primary-btn" id="startDayBtn">${state.started ? 'Update beat' : 'Start beat'}</button>
          </div>
        </header>

        <section id="dashboard" class="view active">
          <div class="hero-card card">
            <div>
              <p class="eyebrow accent">Assigned beat</p>
              <h2>${state.beat || 'No beat assigned'}</h2>
              <p class="meta-copy">Coverage team • ${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div class="hero-actions">
              <div class="status-pill"><span class="dot green"></span>Live</div>
              <button class="primary-btn" id="generateReportBtn">Generate report</button>
            </div>
          </div>

          <div class="stats-grid">
            <article class="stat-card card">
              <span class="stat-label">Visits</span>
              <strong>${stats.total}</strong>
              <small>${stats.valid} verified</small>
            </article>
            <article class="stat-card card">
              <span class="stat-label">Distance</span>
              <strong>${stats.distance.toFixed(1)} km</strong>
              <small>Today’s route</small>
            </article>
            <article class="stat-card card">
              <span class="stat-label">Value</span>
              <strong>${formatCurrency(stats.revenue)}</strong>
              <small>Estimated output</small>
            </article>
            <article class="stat-card card">
              <span class="stat-label">Rate</span>
              <strong>${formatCurrency(state.rate)}/hour</strong>
              <small>Billing rate</small>
            </article>
          </div>

          <div class="panel-grid">
            <section class="card form-card">
              <div class="section-header">
                <div>
                  <span class="eyebrow muted">Profile</span>
                  <h3>Beat setup</h3>
                </div>
              </div>

              <div class="input-grid">
                <label>
                  <span>Field executive</span>
                  <input id="employeeInput" type="text" value="${state.employee || ''}" placeholder="Enter employee name" />
                </label>
                <label>
                  <span>Assigned beat</span>
                  <input id="beatInput" type="text" value="${state.beat || ''}" placeholder="Ex: Whitefield West" />
                </label>
                <label>
                  <span>Billing rate</span>
                  <input id="rateInput" type="number" min="0" value="${state.rate || 0}" placeholder="Enter hourly rate" />
                </label>
              </div>

              <div class="button-row">
                <button class="primary-btn" id="saveProfileBtn">Save profile</button>
                <button class="ghost-btn" id="resetDemoBtn">Reset demo</button>
              </div>
            </section>

            <section class="card list-card">
              <div class="section-header">
                <div>
                  <span class="eyebrow muted">Recent</span>
                  <h3>Visit log</h3>
                </div>
                <span class="chip">${state.visits.length} visits</span>
              </div>
              <div class="visit-list">
                ${state.visits.map((visit) => `
                  <article class="visit-item">
                    <div class="visit-dot ${visit.status === 'Verified' ? 'green' : 'amber'}"></div>
                    <div class="visit-copy">
                      <h4>${visit.name}</h4>
                      <p>${visit.type} • ${visit.time}</p>
                    </div>
                    <div class="visit-meta">
                      <strong>${visit.status}</strong>
                      <span>${visit.minutes} min</span>
                    </div>
                  </article>
                `).join('')}
              </div>
            </section>
          </div>
        </section>

        <section id="outlets" class="view">
          <div class="card form-card wide-card">
            <div class="section-header">
              <div>
                <span class="eyebrow muted">Capture</span>
                <h3>Outlet visit</h3>
              </div>
            </div>

            <div class="input-grid two-column">
              <label>
                <span>Outlet name</span>
                <input id="outletName" type="text" placeholder="Ex: Metro Mart" />
              </label>
              <label>
                <span>Channel</span>
                <select id="outletType">
                  <option value="Retail Outlet">Retail Outlet</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="HORECA">HORECA</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </label>
              <label class="full-width">
                <span>Visit notes</span>
                <textarea id="outletNotes" rows="4" placeholder="Add remarks, stock status or KPI notes..."></textarea>
              </label>
            </div>

            <div class="button-row">
              <button class="primary-btn" id="captureVisitBtn">Capture visit</button>
              <button class="ghost-btn" id="addDemoOutletBtn">Add demo outlet</button>
            </div>
          </div>
        </section>

        <section id="route" class="view">
          <div class="card map-card">
            <div class="section-header">
              <div>
                <span class="eyebrow muted">GPS tracking</span>
                <h3>Live route</h3>
              </div>
              <span class="status-pill"><span class="dot green"></span>GPS ready</span>
            </div>

            <div class="route-visual">
              <div class="route-pin pin-1"></div>
              <div class="route-pin pin-2"></div>
              <div class="route-pin pin-3"></div>
              <div class="route-pin pin-4"></div>
              <div class="location-badge">${state.lastLocation.lat}, ${state.lastLocation.lng}</div>
            </div>

            <div class="route-summary">
              <div>
                <span>Distance</span>
                <strong>${state.routeDistance.toFixed(1)} km</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>±18 m</strong>
              </div>
              <div>
                <span>Last sync</span>
                <strong>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="report" class="view">
          <div class="card report-card">
            <div class="section-header">
              <div>
                <span class="eyebrow muted">Closing</span>
                <h3>Daily report</h3>
              </div>
            </div>

            <textarea id="reportOutput" rows="12" readonly>${state.report || buildReport()}</textarea>

            <div class="button-row">
              <button class="primary-btn" id="buildReportBtn">Refresh report</button>
              <button class="secondary-btn" id="copyReportBtn">Copy summary</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  bindInteractions();
}

function buildReport() {
  const stats = calculateStats();
  const summary = `*Daily Closing Report*
Employee: ${state.employee || 'N/A'}
Beat: ${state.beat || 'N/A'}
Valid Visits: ${stats.valid}/20
Invalid Visits: ${Math.max(0, stats.total - stats.valid)}
Distance: ${state.routeDistance.toFixed(1)} km
Estimated Revenue: ${formatCurrency(stats.revenue)}
Status: ${state.started ? 'Beat active' : 'Not started'}

Outlets covered:
${state.visits.map((visit) => `- ${visit.name} (${visit.type}) • ${visit.status}`).join('\n')}`;

  state.report = summary;
  return summary;
}

function bindInteractions() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const view = button.dataset.view;
      document.querySelectorAll('.view').forEach((section) => {
        section.classList.toggle('active', section.id === view);
      });
      state.selectedView = view;
      saveState();
    });
  });

  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const employee = document.getElementById('employeeInput').value.trim();
    const beat = document.getElementById('beatInput').value.trim();
    const rate = Number(document.getElementById('rateInput').value || 0);

    state.employee = employee || state.employee;
    state.beat = beat || state.beat;
    state.rate = rate || state.rate;
    state.started = true;
    saveState();
    renderApp();
  });

  document.getElementById('resetDemoBtn').addEventListener('click', () => {
    Object.assign(state, { ...defaultState });
    saveState();
    renderApp();
  });

  document.getElementById('startDayBtn').addEventListener('click', async () => {
    const location = await getCurrentLocation();
    state.lastLocation = location;
    state.started = true;
    state.routeDistance = Number((state.routeDistance + 0.8).toFixed(1));
    saveState();
    renderApp();
  });

  document.getElementById('demoGpsBtn').addEventListener('click', async () => {
    state.lastLocation = createDemoLocation();
    state.routeDistance = Number((state.routeDistance + 1.1).toFixed(1));
    saveState();
    renderApp();
  });

  document.getElementById('captureVisitBtn').addEventListener('click', () => {
    const name = document.getElementById('outletName').value.trim();
    const type = document.getElementById('outletType').value || 'Retail Outlet';
    const notes = document.getElementById('outletNotes').value.trim();

    if (!name) {
      alert('Please enter an outlet name before capturing the visit.');
      return;
    }

    const visit = {
      id: `visit-${Date.now()}`,
      name,
      type,
      notes: notes || 'Visited during routine field check.',
      status: 'Verified',
      minutes: Math.max(10, 12 + Math.floor(Math.random() * 14)),
      distance: Number((Math.random() * 2 + 0.7).toFixed(1)),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.visits.unshift(visit);
    state.routeDistance = Number((state.routeDistance + 0.6).toFixed(1));
    saveState();
    renderApp();
  });

  document.getElementById('addDemoOutletBtn').addEventListener('click', () => {
    const demoNames = ['North Star Foods', 'Bloom Grocery', 'Harbor Market', 'Urban Staple'];
    const typeOptions = ['Retail Outlet', 'Supermarket', 'HORECA', 'Distributor'];
    const visit = {
      id: `demo-${Date.now()}`,
      name: demoNames[Math.floor(Math.random() * demoNames.length)],
      type: typeOptions[Math.floor(Math.random() * typeOptions.length)],
      notes: 'Pre-loaded demo outlet for prototype walkthrough.',
      status: 'In progress',
      minutes: 15,
      distance: 1.2,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.visits.unshift(visit);
    saveState();
    renderApp();
  });

  document.getElementById('generateReportBtn').addEventListener('click', () => {
    buildReport();
    document.getElementById('reportOutput').value = state.report;
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'report'));
    document.querySelectorAll('.view').forEach((section) => {
      section.classList.toggle('active', section.id === 'report');
    });
    saveState();
  });

  document.getElementById('buildReportBtn').addEventListener('click', () => {
    const report = buildReport();
    document.getElementById('reportOutput').value = report;
    saveState();
  });

  document.getElementById('copyReportBtn').addEventListener('click', async () => {
    const reportText = document.getElementById('reportOutput').value;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(reportText);
      document.getElementById('copyReportBtn').textContent = 'Copied';
      setTimeout(() => {
        document.getElementById('copyReportBtn').textContent = 'Copy summary';
      }, 1200);
    }
  });
}

renderApp();

window.addEventListener('DOMContentLoaded', () => {
  const selectedView = state.selectedView || 'dashboard';
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === selectedView);
  });
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === selectedView);
  });
});

if (document.getElementById('reportOutput')) {
  document.getElementById('reportOutput').value = state.report || buildReport();
}

saveState();
