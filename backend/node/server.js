/**
 * RoadSoS Node.js Backend
 * Handles: SOS SMS/Telegram dispatch, Overpass API proxy, offline queue processing
 */
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const axios        = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'] }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Rate limiting — prevent SOS spam
const sosLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: 'Too many SOS requests' } });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use('/api/', apiLimiter);

// ─── SOS SEND ────────────────────────────────────────────────
app.post('/api/sos/send', sosLimiter, async (req, res) => {
  const { contacts, message, location, hospital, triage, timestamp } = req.body;

  if (!contacts?.length) {
    return res.status(400).json({ error: 'No contacts provided' });
  }

  console.log(`🚨 SOS triggered at ${timestamp} — ${contacts.length} contacts, severity: ${triage?.severity}`);

  const results = [];

  // Send SMS via Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    for (const contact of contacts) {
      try {
        const msg = await twilio.messages.create({
          body: message,
          from: process.env.TWILIO_FROM_NUMBER,
          to: contact.phone
        });
        results.push({ contact: contact.name, channel: 'sms', status: 'sent', sid: msg.sid });
      } catch (err) {
        results.push({ contact: contact.name, channel: 'sms', status: 'failed', error: err.message });
        console.error(`SMS failed for ${contact.name}:`, err.message);
      }
    }
  } else {
    console.log('[Demo] Twilio not configured — SOS would be sent to:', contacts.map(c => c.name));
    results.push({ status: 'demo_mode', message: 'Configure TWILIO_* env vars for real SMS' });
  }

  // Send Telegram alert
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const telegramMsg = `${message}\n\n_Sent via RoadSoS Emergency App_`;
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: 'Markdown' }
      );
      results.push({ channel: 'telegram', status: 'sent' });
    } catch (err) {
      results.push({ channel: 'telegram', status: 'failed', error: err.message });
    }
  }

  res.json({ success: true, dispatched: results.length, results, timestamp: new Date().toISOString() });
});

// ─── OVERPASS PROXY (avoids CORS + caches results) ──────────
const overpassCache = new Map();

app.get('/api/services/nearby', async (req, res) => {
  const { category, lat, lon, radius = 5000, limit = 5 } = req.query;
  if (!category || !lat || !lon) return res.status(400).json({ error: 'Missing params' });

  const cacheKey = `${category}-${parseFloat(lat).toFixed(3)}-${parseFloat(lon).toFixed(3)}-${radius}`;
  if (overpassCache.has(cacheKey)) {
    return res.json({ source: 'cache', ...overpassCache.get(cacheKey) });
  }

  const OSM_TAGS = {
    hospital: 'node["amenity"="hospital"]',
    ambulance: 'node["emergency"="ambulance_station"]',
    police: 'node["amenity"="police"]',
    towing: 'node["shop"="car_repair"]',
    puncture: 'node["shop"="tyres"]',
    showroom: 'node["shop"="car"]',
  };
  const tag = OSM_TAGS[category];
  if (!tag) return res.status(400).json({ error: 'Invalid category' });

  const query = `[out:json][timeout:10];(${tag}(around:${radius},${lat},${lon}););out ${limit} center;`;

  try {
    const resp = await axios.get('https://overpass-api.de/api/interpreter', {
      params: { data: query }, timeout: 9000
    });
    const result = { data: resp.data.elements, fetched_at: new Date().toISOString() };
    overpassCache.set(cacheKey, result);
    setTimeout(() => overpassCache.delete(cacheKey), 300_000); // 5 min cache
    res.json({ source: 'overpass', ...result });
  } catch (err) {
    res.status(503).json({ error: 'Overpass unavailable', message: err.message });
  }
});

// ─── TRIAGE PROXY ────────────────────────────────────────────
app.post('/api/triage', async (req, res) => {
  const { user_input } = req.body;
  if (!user_input) return res.status(400).json({ error: 'user_input required' });

  try {
    // Forward to Python FastAPI if available
    const pyResp = await axios.post('http://localhost:8000/api/sos/triage', req.body, { timeout: 8000 });
    return res.json(pyResp.data);
  } catch {
    // Keyword fallback inline
    const lower = user_input.toLowerCase();
    const severity = lower.includes('unconscious') || lower.includes('bleeding') ? 'CRITICAL'
                   : lower.includes('ok') || lower.includes('minor') ? 'MINOR' : 'MODERATE';
    res.json({ severity, intent: 'accident', confidence: 0.75, method: 'node_fallback' });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'RoadSoS Node Backend' }));
app.get('/', (_, res) => res.json({ name: 'RoadSoS API', version: '1.0.0' }));

// ─── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚑 RoadSoS Node Backend running on http://localhost:${PORT}`);
  console.log(`   SMS: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '⚠️ Not configured (demo mode)'}`);
  console.log(`   Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '⚠️ Not configured'}`);
});

module.exports = app;
