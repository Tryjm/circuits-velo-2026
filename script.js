let allRoutes = [];
let selectedFile = null;

const el = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('fr-FR');
const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

async function init(){
  const res = await fetch('parcours.json');
  allRoutes = await res.json();
  populateMonths();
  populateQuickDates();
  renderStats();
  bindFilters();
  renderList(true);
  if(allRoutes.length) selectRoute(allRoutes[0].file, {scrollToDetail:false});
}

function populateMonths(){
  const months = [...new Set(allRoutes.map(r => r.date ? Number(r.date.slice(5,7)) : null).filter(Boolean))].sort((a,b)=>a-b);
  el('month').insertAdjacentHTML('beforeend', months.map(m => `<option value="${String(m).padStart(2,'0')}">${monthNames[m-1]}</option>`).join(''));
}

function populateQuickDates(){
  const options = [...allRoutes].sort((a,b)=>a.date.localeCompare(b.date)).map(r =>
    `<option value="${escapeHtml(r.file)}">${r.date_fr} — ${r.distance_km.toFixed(1).replace('.', ',')} km / ${fmt.format(r.elevation_m)} m D+</option>`
  ).join('');
  el('quickDate').insertAdjacentHTML('beforeend', options);
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
  ['search','month','minKm','minElev','sort'].forEach(id => el(id).addEventListener('input', () => renderList(true)));
  el('quickDate').addEventListener('change', e => {
    if(!e.target.value) return;
    clearTextFilters();
    renderList(false);
    selectRoute(e.target.value, {scrollToDetail:true});
  });
}

function clearTextFilters(){
  el('search').value = '';
  el('month').value = '';
  el('minKm').value = '';
  el('minElev').value = '';
  el('sort').value = 'date';
}

function normalize(str){
  return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function filteredRoutes(){
  const q = normalize(el('search').value);
  const month = el('month').value;
  const minKm = Number(el('minKm').value || 0);
  const minElev = Number(el('minElev').value || 0);
  let routes = allRoutes.filter(r => {
    const hay = normalize(`${r.date_fr} ${r.date} ${r.title} ${r.source_filename}`);
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

function renderList(autoSelectFirst=false){
  const routes = filteredRoutes();
  el('count').textContent = `${routes.length} résultat${routes.length>1?'s':''}`;
  el('routes').innerHTML = routes.map(r => `
    <button class="route-card${r.file === selectedFile ? ' active' : ''}" data-file="${escapeHtml(r.file)}">
      <div class="route-title">${escapeHtml(r.title)}</div>
      <div class="route-meta">
        <span class="badge">${r.date_fr}</span>
        <span class="badge">${r.distance_km.toFixed(1).replace('.', ',')} km</span>
        <span class="badge">${fmt.format(r.elevation_m)} m D+</span>
      </div>
    </button>`).join('') || '<p>Aucun parcours ne correspond aux filtres.</p>';

  document.querySelectorAll('.route-card').forEach(btn => btn.addEventListener('click', () => selectRoute(btn.dataset.file, {scrollToDetail: window.matchMedia('(max-width: 820px)').matches})));

  if(autoSelectFirst && routes.length && !routes.some(r => r.file === selectedFile)) {
    selectRoute(routes[0].file, {scrollToDetail:false});
  }
}

function selectRoute(file, options={scrollToDetail:false}){
  const route = allRoutes.find(r => r.file === file);
  if(!route) return;
  selectedFile = file;
  el('quickDate').value = file;
  document.querySelectorAll('.route-card').forEach(b => b.classList.toggle('active', b.dataset.file === file));

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
    </div>
    ${routePreviewHtml(route)}
    ${profileHtml(route)}
    <p class="note">Aperçu simplifié : la page n'affiche plus les tuiles OpenStreetMap pour rester rapide sur téléphone. Le GPX complet reste disponible au téléchargement.</p>`;

  if(options.scrollToDetail){
    document.querySelector('.detail').scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function routePreviewHtml(route){
  const pts = route.preview && route.preview.points ? route.preview.points : [];
  if(!pts.length) return '';
  const poly = pointsToString(pts);
  const start = pts[0];
  const end = pts[pts.length-1];
  return `
    <div class="visual-card" aria-label="Aperçu simplifié du circuit">
      <div class="visual-head"><h3>Aperçu du circuit</h3><span>tracé simplifié, sans fond de carte</span></div>
      <svg class="preview-svg" viewBox="0 0 1000 1000" role="img" aria-label="Aperçu du tracé ${escapeHtml(route.title)}" preserveAspectRatio="xMidYMid meet">
        <polyline class="route-shadow" points="${poly}" vector-effect="non-scaling-stroke"></polyline>
        <polyline class="route-line" points="${poly}" vector-effect="non-scaling-stroke"></polyline>
        <circle class="start-dot" cx="${start[0]}" cy="${start[1]}" r="28" vector-effect="non-scaling-stroke"><title>Départ</title></circle>
        <circle class="end-dot" cx="${end[0]}" cy="${end[1]}" r="28" vector-effect="non-scaling-stroke"><title>Arrivée</title></circle>
      </svg>
    </div>`;
}

function profileHtml(route){
  const profile = route.profile;
  const pts = profile && profile.points ? profile.points : [];
  if(!pts.length) return '';
  const line = pointsToString(pts);
  const area = `0,1000 ${line} 1000,1000`;
  const min = profile.min_m ?? 0;
  const max = profile.max_m ?? 0;
  return `
    <div class="visual-card" aria-label="Profil altimétrique du circuit">
      <div class="visual-head"><h3>Profil du circuit</h3><span>altitude approximative</span></div>
      <svg class="profile-svg" viewBox="0 0 1000 1000" role="img" aria-label="Profil altimétrique ${escapeHtml(route.title)}" preserveAspectRatio="none">
        <line class="profile-grid" x1="0" y1="250" x2="1000" y2="250"></line>
        <line class="profile-grid" x1="0" y1="500" x2="1000" y2="500"></line>
        <line class="profile-grid" x1="0" y1="750" x2="1000" y2="750"></line>
        <polygon class="profile-area" points="${area}"></polygon>
        <polyline class="profile-line" points="${line}" vector-effect="non-scaling-stroke"></polyline>
      </svg>
      <div class="profile-labels"><span>${fmt.format(min)} m</span><span>${fmt.format(max)} m</span></div>
    </div>`;
}

function pointsToString(points){
  return points.map(p => `${p[0]},${p[1]}`).join(' ');
}

function escapeHtml(str){
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

init();
