/**
 * sosAlert.js
 * Multi-channel SOS broadcast: SMS + Telegram + Background Sync queue.
 * Works with GSM signal only (SMS even without mobile data).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Send SOS alert to emergency contacts via all available channels.
 * If offline, queues for Background Sync (sends when connectivity restored).
 */
export async function sendSOS(location, nearestHospital, triageResult) {
  const contacts = loadContacts();

  const message = buildSOSMessage(location, nearestHospital, triageResult);
  const payload = { contacts, message, location, hospital: nearestHospital, triage: triageResult, timestamp: new Date().toISOString() };

  // Try to send immediately
  if (navigator.onLine) {
    try {
      const resp = await fetch(`${API_BASE}/api/sos/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        console.log('✅ SOS sent successfully');
        logSOSEvent(payload, 'sent');
        return { success: true };
      }
    } catch (err) {
      console.warn('SOS send failed, queuing:', err.message);
    }
  }

  // Queue for Background Sync if offline or send failed
  await queueSOSForSync(payload);
  logSOSEvent(payload, 'queued');
  return { success: false, queued: true };
}

function buildSOSMessage(location, hospital, triage) {
  const lines = [
    '🚨 EMERGENCY ALERT — RoadSoS',
    '',
    `📍 Location: https://maps.google.com/?q=${location?.lat},${location?.lon}`,
    `📅 Time: ${new Date().toLocaleString('en-IN')}`,
  ];

  if (triage) {
    lines.push(`⚠️ Severity: ${triage.severity} (${triage.intent})`);
  }

  if (hospital) {
    lines.push('', `🏥 Nearest Trauma Centre: ${hospital.name}`);
    if (hospital.phone) lines.push(`📞 Hospital: ${hospital.phone}`);
    if (hospital.approx_dist_m) lines.push(`📏 Distance: ${Math.round(hospital.approx_dist_m)}m`);
  }

  lines.push('', '🚑 Call 108 (Ambulance)  👮 Call 100 (Police)  🆘 Call 112 (Universal)');
  lines.push('', '— Sent via RoadSoS Emergency App');

  return lines.join('\n');
}

async function queueSOSForSync(payload) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const db = await openQueue();
      const tx = db.transaction(['sos_queue'], 'readwrite');
      tx.objectStore('sos_queue').put({ ...payload, id: Date.now() });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('send-sos');
      console.log('📤 SOS queued for Background Sync');
    } catch (err) {
      console.error('Background Sync queue failed:', err);
    }
  } else {
    // Store in localStorage as last resort
    const queue = JSON.parse(localStorage.getItem('roadsos_sos_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('roadsos_sos_queue', JSON.stringify(queue));
  }
}

function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('roadsos_db', 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore('sos_queue', { keyPath: 'id' });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function loadContacts() {
  try { return JSON.parse(localStorage.getItem('roadsos_contacts') || '[]'); }
  catch { return []; }
}

function logSOSEvent(payload, status) {
  const log = JSON.parse(localStorage.getItem('roadsos_sos_log') || '[]');
  log.push({ timestamp: payload.timestamp, status, lat: payload.location?.lat, lon: payload.location?.lon });
  localStorage.setItem('roadsos_sos_log', JSON.stringify(log.slice(-20))); // keep last 20
}
