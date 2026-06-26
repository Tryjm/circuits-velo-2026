let allRoutes = [];
let map = L.map('map');
let currentLine = null;
const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
map.setView([47.2972, -1.4918], 10);

const el = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('fr-FR');
const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

async function init(){
  const res = await fetch('parcours.json');
  allRoutes = await res.json();
  populateMonths();
  renderStats();
  bindFilters();
  renderList();
  if(allRoutes.length) selectRoute(allRoutes[0].file);
}

function populateMonths(){
  const months = [...new Set(allRoutes.map(r => r.date ? Number(r.date.slice(5,7)) : null).filter(Boolean))].sort((a,b)=>a-b);
  el('month').insertAdjacentHTML('beforeend', months.map(m => `<option value="${String(m).padStart(2,'0')}">${monthNames[m-1]}</option>`).join(''));
}

function renderStats(){
  const totalKm = allRoutes.reduce((s,r)=>s+r.distance_km,0);
  const totalElev = allRoutes.reduce((s,r)=>s+r.elevation_m,0);
  el('stats').innerHTML = `
    <div class="stat"><strong>${allRoutes.length}</strong><span>parcours</span></div>
    <div class="stat"><strong>${fmt.format(Math.round(totalKm))}</strong><span>km cumulés</span></div>
    <div class="stat"><strong>${fmt.format(totalElev)}</strong><span>m D+ cumulés</span></div>`;
}

function bindFilters(){
  ['search','month','minKm','minElev','sort'].forEach(id => el(id).addEventListener('input', renderList));
}

function filteredRoutes(){
  const q = el('search').value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const month = el('month').value;
  const minKm = Number(el('minKm').value || 0);
  const minElev = Number(el('minElev').value || 0);
  let routes = allRoutes.filter(r => {
    const hay = `${r.date_fr} ${r.title} ${r.source_filename}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return (!q || hay.includes(q)) && (!month || r.date.slice(5,7) === month) && r.distance_km >= minKm && r.elevation_m >= minElev;
  });
  const sort = el('sort').value;
  routes.sort((a,b)=>{
    if(sort==='distance_desc') return b.distance_km-a.distance_km;
    if(sort==='elevation_desc') return b.elevation_m-a.elevation_m;
    if(sort==='title') return a.title.localeCompare(b.title,'fr');
    return a.date.localeCompare(b.date);
  });
  return routes;
}

function renderList(){
  const routes = filteredRoutes();
  el('count').textContent = `${routes.length} résultat${routes.length>1?'s':''}`;
  el('routes').innerHTML = routes.map(r => `
    <button class="route-card" data-file="${r.file}">
      <div class="route-title">${escapeHtml(r.title)}</div>
      <div class="route-meta">
        <span class="badge">${r.date_fr}</span>
        <span class="badge">${r.distance_km.toFixed(1).replace('.', ',')} km</span>
        <span class="badge">${fmt.format(r.elevation_m)} m D+</span>
      </div>
    </button>`).join('') || '<p>Aucun parcours ne correspond aux filtres.</p>';
  document.querySelectorAll('.route-card').forEach(btn => btn.addEventListener('click', () => selectRoute(btn.dataset.file)));
}

async function selectRoute(file){
  const route = allRoutes.find(r => r.file === file);
  if(!route) return;
  document.querySelectorAll('.route-card').forEach(b => b.classList.toggle('active', b.dataset.file === file));
  const xmlText = await fetch(file).then(r => r.text());
  const pts = parseGpxPoints(xmlText);
  if(currentLine) map.removeLayer(currentLine);
  currentLine = L.polyline(pts, {weight: 5}).addTo(map);
  map.fitBounds(currentLine.getBounds(), {padding:[24,24]});
  el('details').className = 'details';
  el('details').innerHTML = `
    <h2>${escapeHtml(route.title)}</h2>
    <p>${route.date_fr} · Fichier source : ${escapeHtml(route.source_filename)}</p>
    <div class="details-grid">
      <div class="detail-stat"><span>Distance</span><strong>${route.distance_km.toFixed(1).replace('.', ',')} km</strong></div>
      <div class="detail-stat"><span>Dénivelé +</span><strong>${fmt.format(route.elevation_m)} m</strong></div>
      <div class="detail-stat"><span>Points GPS</span><strong>${fmt.format(route.points)}</strong></div>
      <div class="detail-stat"><span>Date</span><strong>${route.date_fr}</strong></div>
    </div>
    <div class="actions">
      <a class="btn" href="${route.file}" download>Télécharger le GPX</a>
      <a class="btn secondary" href="${route.file}" target="_blank" rel="noopener">Ouvrir le fichier</a>
    </div>`;
}

function parseGpxPoints(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  return [...doc.getElementsByTagName('trkpt')].map(p => [Number(p.getAttribute('lat')), Number(p.getAttribute('lon'))]);
}
function escapeHtml(str){return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
init();
