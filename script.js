// script.js

// ---------- 1. Map setup ----------
const CONTENT_COORDS = [18.080, -77.4775];

const map = L.map('map').setView(CONTENT_COORDS, 13);

// Basemaps
// "street" now uses MapLibre GL (via the leaflet-maplibre-gl bridge plugin)
const basemaps = {
  street: L.maplibreGL({
    style: 'https://tiles.openfreemap.org/styles/liberty'
  }),
  terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors, SRTM | Map: OpenTopoMap (CC-BY-SA)'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  })
};
basemaps.street.addTo(map);
let currentBasemap = 'street';

function setBasemap(name) {
  if (!basemaps[name] || name === currentBasemap) return;
  map.removeLayer(basemaps[currentBasemap]);
  basemaps[name].addTo(map);
  currentBasemap = name;
  document.querySelectorAll('.basemap-controls button').forEach(b => b.classList.remove('active'));
  document.querySelector(`.basemap-controls button[onclick="setBasemap('${name}')"]`)?.classList.add('active');
}

// ---------- 2. Status colors ----------
const statusColor = { green: '#3fae4a', yellow: '#e0b62b', orange: '#e0812b', red: '#d13b3b' };

const GEOAPIFY_API_KEY = '2c16f063babc407e82e2b2a3944cbf0d'; // https://myprojects.geoapify.com

function makeGeoapifyIcon(color, iconName = 'map-pin') {
  const url = `https://api.geoapify.com/v2/icon/?type=awesome&color=${encodeURIComponent(color)}&size=48&icon=${iconName}&iconType=lucide&contentSize=20&noWhiteCircle&scaleFactor=2&apiKey=${GEOAPIFY_API_KEY}`;
  return L.icon({ 
    iconUrl: url,
    iconSize: [25, 40],
    iconAnchor: [18, 48],   // bottom tip of the pin sits on the coordinate
    popupAnchor: [0, -55]
  });
}

function rainIcon() {
  return makeGeoapifyIcon('#09486f', 'umbrella');
}

// ---------- 3. Borehole markers ----------
const boreholeMarkers = {}; // id -> {marker, data}

BOREHOLES.forEach(b => {
  const marker = L.marker([b.lat, b.lng], { icon: makeGeoapifyIcon(statusColor[b.status]) }).addTo(map);
  marker.on('click', () => openBoreholeDetails(b));
  boreholeMarkers[b.id] = { marker, data: b };

  const li = document.createElement('li');
  li.innerHTML = `<span class="status-dot ${b.status}"></span> ${b.name}`;
  li.onclick = () => { map.setView([b.lat, b.lng], 15); openBoreholeDetails(b); };
  document.getElementById('borehole-list').appendChild(li);
});

// ---------- 4. Rainfall reference markers (static, storm-total only) ----------
RAINFALL_POINTS.forEach(r => {
  const marker = L.marker([r.lat, r.lng], { icon: rainIcon() }).addTo(map);
  marker.on('click', () => openRainfallDetails(r));

  const li = document.createElement('li');
  li.innerHTML = `<i class="fa-solid fa-cloud-rain" style="color:#1a6ea3"></i> ${r.name} &mdash; ${r.total_in}"`;
  li.onclick = () => { map.setView([r.lat, r.lng], 15); openRainfallDetails(r); };
  document.getElementById('rainfall-list').appendChild(li);
});

// ---------- 5. Sidebar ----------
const STATUS_LABELS = { green: 'Safe', yellow: 'Watch', orange: 'Alert', red: 'Critical' };

function renderBoreholeSidebar(b) {
  document.getElementById('sidebar-title').textContent = b.name;
  document.getElementById('sidebar-content').innerHTML = `
    <div class="detail-status-row">
      <span class="status-badge status-${b.status}">${STATUS_LABELS[b.status]}</span>
    </div>

    <p class="detail-notes">${b.notes}</p>

    <div class="detail-block-header">
      <h4>Diver Data <span class="tag-placeholder">placeholder</span></h4>
      <button class="edit-btn" onclick="enterEditMode('${b.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
    </div>
    <dl id="diver-fields-${b.id}">
      <dt>Latest reading date</dt><dd>${b.latestReading.date}</dd>
      <dt>Groundwater level</dt><dd>${b.latestReading.gwl_m ?? '—'} m</dd>
      <dt>Conductivity</dt><dd>${b.latestReading.cond_mS ?? '—'} mS</dd>
      <dt>Temperature</dt><dd>${b.latestReading.temp_C ?? '—'} &deg;C</dd>
    </dl>

    <div class="detail-block-header">
      <h4>Live Rainfall (Open-Meteo)</h4>
    </div>
    <div id="meteo-block-${b.id}"><em>Loading live rainfall reference from Open-Meteo…</em></div>
  `;
  document.getElementById('flood-sidebar').classList.remove('sidebar-hidden');
  fetchOpenMeteoRainfall(b);
}

function openBoreholeDetails(b) {
  renderBoreholeSidebar(b);
}

// ---------- 5b. Edit mode (placeholder for real diver integration) ----------
// This does NOT save anywhere permanent — it just updates the in-memory
// BOREHOLES array and re-renders, so status/readings can be adjusted by
// hand while the real diver data pipeline isn't wired up yet.
function enterEditMode(id) {
  const b = BOREHOLES.find(x => x.id === id);
  if (!b) return;

  const statusOptions = Object.keys(STATUS_LABELS)
    .map(s => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${STATUS_LABELS[s]} (${s})</option>`)
    .join('');

  document.getElementById(`diver-fields-${id}`).outerHTML = `
    <form id="edit-form-${id}" class="edit-form" onsubmit="return false;">
      <label>Status
        <select id="edit-status-${id}">${statusOptions}</select>
      </label>
      <label>Reading date
        <input type="date" id="edit-date-${id}" value="${b.latestReading.date}">
      </label>
      <label>Groundwater level (m)
        <input type="number" step="0.01" id="edit-gwl-${id}" value="${b.latestReading.gwl_m ?? ''}">
      </label>
      <label>Conductivity (mS)
        <input type="number" step="0.001" id="edit-cond-${id}" value="${b.latestReading.cond_mS ?? ''}">
      </label>
      <label>Temperature (&deg;C)
        <input type="number" step="0.01" id="edit-temp-${id}" value="${b.latestReading.temp_C ?? ''}">
      </label>
      <div class="edit-form-actions">
        <button type="button" class="save-btn" onclick="saveEdit('${id}')">Save</button>
        <button type="button" class="cancel-btn" onclick="renderBoreholeSidebar(BOREHOLES.find(x => x.id === '${id}'))">Cancel</button>
      </div>
    </form>
  `;
}

function saveEdit(id) {
  const b = BOREHOLES.find(x => x.id === id);
  if (!b) return;

  b.status = document.getElementById(`edit-status-${id}`).value;
  b.latestReading.date = document.getElementById(`edit-date-${id}`).value;
  b.latestReading.gwl_m = parseFloat(document.getElementById(`edit-gwl-${id}`).value) || null;
  b.latestReading.cond_mS = parseFloat(document.getElementById(`edit-cond-${id}`).value) || null;
  b.latestReading.temp_C = parseFloat(document.getElementById(`edit-temp-${id}`).value) || null;

  // update the marker color and the list dot to reflect the new status
  boreholeMarkers[id].marker.setIcon(makeDivIcon(statusColor[b.status]));
  document.querySelectorAll('#borehole-list li').forEach(li => {
    if (li.textContent.trim().includes(b.name)) {
      li.innerHTML = `<span class="status-dot ${b.status}"></span> ${b.name}`;
    }
  });

  renderBoreholeSidebar(b);
  showToast(`${b.name} updated`);
}

function openRainfallDetails(r) {
  document.getElementById('sidebar-title').textContent = r.name;
  document.getElementById('sidebar-content').innerHTML = `
    <dl>
      <dt>Storm-total rainfall (Hurricane Melissa)</dt><dd>${r.total_in} in</dd>
      <dt>Type</dt><dd>Single cumulative total — not a time series</dd>
      ${r.note ? `<dt>Note</dt><dd>${r.note}</dd>` : ''}
    </dl>
    <p style="color:#6a747c;font-size:12px;">Source: NHC Tropical Cyclone Report, Table 3.</p>
  `;
  document.getElementById('flood-sidebar').classList.remove('sidebar-hidden');
}

function closeFloodSidebar() {
  document.getElementById('flood-sidebar').classList.add('sidebar-hidden');
}

// ---------- 6. Open-Meteo: live rainfall check per borehole ----------
async function fetchOpenMeteoRainfall(b) {
  const block = document.getElementById(`meteo-block-${b.id}`);
  if (!block) return;
  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${b.lat}&longitude=${b.lng}&start_date=2025-10-20&end_date=2025-11-05&daily=precipitation_sum&timezone=America/Jamaica`;
    const res = await fetch(url);
    const json = await res.json();
    const dates = json.daily.time;
    const rain = json.daily.precipitation_sum;
    const totalMm = rain.reduce((a, v) => a + (v || 0), 0);
    const totalIn = (totalMm / 25.4).toFixed(2);

    let rows = dates.map((d, i) => `<tr><td>${d}</td><td>${rain[i]?.toFixed(1) ?? '—'} mm</td></tr>`).join('');
    block.innerHTML = `
      <p class="meteo-total">Total Oct 20 &ndash; Nov 5: <strong>${totalMm.toFixed(1)} mm (${totalIn} in)</strong></p>
      <table class="meteo-table">
        <thead><tr><th>Date</th><th>Rainfall</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="meteo-caveat">
        This is reanalysis/model data, not a gauge reading — useful as a cross-check,
        not a replacement for a real rain gauge at this site.
      </p>
    `;
  } catch (err) {
    block.innerHTML = `<em>Could not load Open-Meteo data (${err.message}).</em>`;
  }
}

// ---------- 7. Filters ----------
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const status = btn.dataset.status;
    Object.values(boreholeMarkers).forEach(({ marker, data }) => {
      const show = status === 'all' || data.status === status;
      if (show) { if (!map.hasLayer(marker)) marker.addTo(map); }
      else { if (map.hasLayer(marker)) map.removeLayer(marker); }
    });
  });
});

// ---------- 8. Menu toggle ----------
function toggleMenu() {
  document.getElementById('left-menu').classList.toggle('menu-hidden');
}
function toggleBoreholeList() {
  const list = document.getElementById('borehole-list');
  list.style.display = (list.style.display === 'none') ? '' : 'none';
}

// ---------- 9. Simple search (matches borehole/rainfall point names) ----------
function searchLocation() {
  const q = document.getElementById('map-search-input').value.trim().toLowerCase();
  if (!q) return;
  const all = [...BOREHOLES, ...RAINFALL_POINTS];
  const hit = all.find(p => p.name.toLowerCase().includes(q));
  if (hit) {
    map.setView([hit.lat, hit.lng], 15);
    showToast(`Found: ${hit.name}`);
  } else {
    showToast(`No match for "${q}"`);
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.style.display = 'none'; }, 2500);
}
