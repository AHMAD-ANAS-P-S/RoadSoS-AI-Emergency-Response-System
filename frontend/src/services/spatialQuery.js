/**
 * spatialQuery.js
 * Unified emergency services spatial query engine.
 * Offline: sql.js + SpatiaLite-compatible SQLite DB
 * Online:  OpenStreetMap Overpass API (free, global, no key)
 */

// sql.js loaded dynamically to avoid Vite default export issues
let db = null;
let sqlJsReady = false;

// OSM Overpass tag mapping — uses nwr (node+way+relation) for maximum coverage
const OSM_TAGS = {
  hospital:  `nwr["amenity"="hospital"]`,
  ambulance: `nwr["emergency"="ambulance_station"]`,
  police:    `nwr["amenity"="police"]`,
  towing:    `nwr["shop"="car_repair"]`,
  puncture:  `nwr["shop"="tyres"]`,
  showroom:  `nwr["shop"="car"]`,
};

// ─── OFFLINE DB INIT ──────────────────────────────────────────
export async function initOfflineDB() {
  if (db) return db;
  try {
    const sqlJsModule = await import('sql.js');
    const initSqlJs = sqlJsModule.default || sqlJsModule;
    const SQL = await initSqlJs({
      locateFile: file => `/${file}` // sql-wasm.wasm must be in /public
    });
    // Load pre-packaged SQLite DB from public/data/
    const response = await fetch('/data/india_tn.sqlite');
    if (!response.ok) throw new Error('DB not found');
    const buf = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buf));
    sqlJsReady = true;
    console.log('🗄️ Offline DB loaded');
    return db;
  } catch (err) {
    console.warn('Offline DB unavailable:', err.message);
    return null;
  }
}

// ─── OFFLINE QUERY ────────────────────────────────────────────
export async function queryNearest(category, lat, lon, limit = 5) {
  if (!db) await initOfflineDB();
  if (!db) return [];

  try {
    const R = 0.09; // ~10km in degrees
    const stmt = db.prepare(`
      SELECT name, phone, address, latitude AS lat, longitude AS lon,
             is_24x7, trauma_ready, confidence_score,
             (ABS(latitude - $lat) + ABS(longitude - $lon)) * 111195 AS approx_dist_m
      FROM services
      WHERE category = $cat
        AND ABS(latitude - $lat) < $R
        AND ABS(longitude - $lon) < $R
      ORDER BY approx_dist_m ASC
      LIMIT $limit
    `);
    stmt.bind({ $cat: category, $lat: lat, $lon: lon, $R: R, $limit: limit });
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  } catch (err) {
    console.error('Offline query error:', err);
    return [];
  }
}

// ─── ONLINE QUERY (OVERPASS API) ─────────────────────────────
export async function queryNearestOnline(category, lat, lon, radius = 8000, limit = 5) {
  const tag = OSM_TAGS[category];
  if (!tag) return [];

  // Use 10km radius for police/towing since these can be sparse
  const searchRadius = ['police', 'towing', 'ambulance'].includes(category) ? 15000 : radius;

  const query = `[out:json][timeout:10];
    (${tag}(around:${searchRadius},${lat},${lon}););
    out ${limit} center tags;`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    return data.elements.slice(0, limit).map(el => {
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      const distM = elLat && elLon ? haversine(lat, lon, elLat, elLon) : null;
      return {
        name:      el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ta'] || categoryLabel(category),
        phone:     el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['contact:mobile'] || el.tags?.['phone:IN'] || null,
        address:   el.tags?.['addr:full'] || el.tags?.['addr:street'] || null,
        lat:       elLat,
        lon:       elLon,
        is_24x7:   el.tags?.opening_hours === '24/7' ? 1 : 0,
        trauma_ready: category === 'hospital' ? (el.tags?.emergency === 'yes' ? 1 : 0) : 0,
        confidence_score: 0.85,
        approx_dist_m: distM,
        source: 'overpass',
      };
    }).sort((a, b) => (a.approx_dist_m || 99999) - (b.approx_dist_m || 99999));
  } catch (err) {
    clearTimeout(timer);
    console.warn(`Overpass failed (${category}):`, err.message);
    return queryNearest(category, lat, lon, limit);
  }
}


// ─── HELPERS ─────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // metres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function categoryLabel(cat) {
  const labels = { hospital:'Hospital', ambulance:'Ambulance', police:'Police Station', towing:'Towing Service', puncture:'Puncture Shop', showroom:'Vehicle Showroom' };
  return labels[cat] || cat;
}
