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
function makeGeoapifyIcon(color, iconName = 'map-pin', { type = 'awesome', size = 48 } = {}) {
  const url = `https://api.geoapify.com/v2/icon/?type=${type}&color=${encodeURIComponent(color)}&size=${size}&icon=${iconName}&iconType=lucide&contentSize=${Math.round(size * 0.42)}&noWhiteCircle&scaleFactor=2&apiKey=${GEOAPIFY_API_KEY}`;

  if (type === 'plain') {
    return L.icon({
      iconUrl: url,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  return L.icon({
    iconUrl: url,
    iconSize: [20, 33],
    iconAnchor: [18, 48],
    popupAnchor: [0, -55]
  })
}
function rainIcon() {
  return makeGeoapifyIcon('#09486f', 'umbrella');
}
function shelterIcon(color = '#1884cc') {
  return makeGeoapifyIcon(color, 'house', { type: 'plain', size: 34});
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

// ---------- 4. AWS markers ----------
RAINFALL_POINTS.forEach(r => {
  const marker = L.marker([r.lat, r.lng], { icon: rainIcon() }).addTo(map);
  marker.on('click', () => openRainfallDetails(r));

  const li = document.createElement('li');
  li.innerHTML = `<i class="fa-solid fa-cloud-rain" style="color:#1a6ea3"></i> ${r.name}`;
  li.onclick = () => { map.setView([r.lat, r.lng], 15); openRainfallDetails(r); };
  document.getElementById('rainfall-list').appendChild(li);
});

//------------ 5. Shelter Markers ---------
const shelterLayer = L.layerGroup();
SHELTERS.forEach(s=> {
  const marker = L.marker([s.lat, s.lng], { icon: shelterIcon() });
  marker.addTo(shelterLayer);
  marker.on('click', () => openShelterDetails(s));

  const li = document.createElement('li');
  li.innerHTML = `<i class="fa-solid fa-house" style="color:#0f3d5c"></i> ${s.name}`;
  li.onclick = () => { map.setView([s.lat, s.lng], 15); openShelterDetails(s); };
  document.getElementById('shelter-list').appendChild(li);
});
shelterLayer.addTo(map);

// ---------- 6. Sidebar ----------
const STATUS_LABELS = { green: 'Safe', yellow: 'Watch', orange: 'Alert', red: 'Critical' };

const STATUS_ACTIONS = {
  green: 'No action needed. Continue normal monitoring of this site.',
  yellow: 'Monitor conditions closely. Review your emergency plan and check your supplies.',
  orange: 'Prepare to move. Relocate vehicles and valuables to higher ground and stay alert for updates.',
  red: 'Evacuate immediately. Move to higher ground and follow guidance from local emergency authorities.'
};

function renderBoreholeSidebar(b) {
  document.getElementById('sidebar-title').textContent = b.name;
   const diverBlock = b.type === 'borehole' ? `
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
  ` : '';

  document.getElementById('sidebar-content').innerHTML = `
    <div class="detail-status-row">
      <span class="status-badge-large status-${b.status}">${STATUS_LABELS[b.status]}</span>
    </div>

    <div class="recommended-action action-${b.status}">
      <h4>Recommended Action</h4>
      <p>${STATUS_ACTIONS[b.status]}</p>
    </div>

    <p class="detail-notes">${b.notes}</p>

    ${diverBlock}

    <div class="detail-block-header">
      <h4>Weather Sensors</h4>
    </div>
    <div id="meteo-block-${b.id}"><em>Loading live weather data from Open-Meteo…</em></div>
  `;
  document.getElementById('flood-sidebar').classList.remove('sidebar-hidden');
  fetchOpenMeteoWeather(b);
}

function openBoreholeDetails(b) {
  renderBoreholeSidebar(b);
}


// ---------- 6b. Edit mode (placeholder for real diver integration) ----------
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
    <div class="detail-block-header">
     <h4>Weather Sensors</h4>
    </div>
    <div id="meteo-block-${r.id}"><em>Loading live weather data from Open-Meteo...</em></div>
  `;
  document.getElementById('flood-sidebar').classList.remove('sidebar-hidden');
  fetchOpenMeteoWeather(r);
}

function openShelterDetails(s) {
  document.getElementById('sidebar-title').textContent = s.name;
  document.getElementById('sidebar-content').innerHTML = `
    <p class="detail-notes">Shelter location.</p>
  `;
  document.getElementById('flood-sidebar').classList.remove('sidebar-hidden');
}

function closeFloodSidebar() {
  document.getElementById('flood-sidebar').classList.add('sidebar-hidden');
}

// ---------- 6. Open-Meteo: live rainfall check per borehole ----------
async function fetchOpenMeteoWeather(b) {
  const block = document.getElementById(`meteo-block-${b.id}`);
  if (!block) return;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lng}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=America/Jamaica`;
    const res = await fetch(url);
    const json = await res.json();
    const c = json.current;
    const u = json.current_units;

    block.innerHTML = `
      <div class="weather-grid">
        <div class="weather-stat">
          <i class="fa-solid fa-temperature-half"></i>
          <span class="weather-label">Temperature</span>
          <span class="weather-value">${c.temperature_2m}${u.temperature_2m}</span>
        </div>
        <div class="weather-stat">
          <i class="fa-solid fa-droplet"></i>
          <span class="weather-label">Humidity</span>
          <span class="weather-value">${c.relative_humidity_2m}${u.relative_humidity_2m}</span>
        </div>
        <div class="weather-stat">
          <i class="fa-solid fa-wind"></i>
          <span class="weather-label">Wind Speed</span>
          <span class="weather-value">${c.wind_speed_10m} ${u.wind_speed_10m}</span>
        </div>
        <div class="weather-stat">
          <i class="fa-solid fa-compass"></i>
          <span class="weather-label">Wind Direction</span>
          <span class="weather-value">${c.wind_direction_10m}${u.wind_direction_10m}</span>
        </div>
        <div class="weather-stat">
          <i class="fa-solid fa-gauge"></i>
          <span class="weather-label">Pressure</span>
          <span class="weather-value">${c.surface_pressure} ${u.surface_pressure}</span>
        </div>
        <div class="weather-stat">
          <i class="fa-solid fa-cloud-rain"></i>
          <span class="weather-label">Precipitation</span>
          <span class="weather-value">${c.precipitation} ${u.precipitation}</span>
        </div>
      </div>
      <p class="meteo-caveat">
        Live model estimate from Open-Meteo, last updated ${c.time.replace('T', ' ')}.
        Not a physical sensor reading at this site.
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
function toggleShelterLayer(show) {
  if (show) { shelterLayer.addTo(map); }
  else { map.removeLayer(shelterLayer); }
}

// ---------- 8. Menu toggle ----------
function toggleMenu() {
  document.getElementById('left-menu').classList.toggle('menu-hidden');
}
function toggleList(listId) {
  const list = document.getElementById(listId);
  list.style.display = (list.style.display === 'none') ? '' : 'none';
}

// ---------- 9. Simple search (matches borehole/rainfall point names) ----------
function searchLocation() {
  const q = document.getElementById('map-search-input').value.trim().toLowerCase();
  if (!q) return;
  const all = [...BOREHOLES, ...RAINFALL_POINTS, ...SHELTERS];
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
