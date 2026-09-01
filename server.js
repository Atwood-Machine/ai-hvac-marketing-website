'use strict';

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const SITE_DIR = __dirname;
const ASSET_DIR = path.join(SITE_DIR, 'assets');

// Render and most production hosts sit behind one trusted reverse proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers. Kept dependency-free so the site remains simple to deploy.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; ')
  );

  const forwardedProto = req.get('x-forwarded-proto');
  if (req.secure || forwardedProto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

// Do not accept large bodies. The public form only needs a few short fields.
app.use(express.json({ limit: '12kb', type: 'application/json' }));

const clean = (value, maxLength = 500) =>
  String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (value) =>
  value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Small, bounded, in-memory rate limiter for the only public API endpoint.
// This protects the SMTP account from simple automated abuse without storing user data.
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 6;
const rateBuckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  if (rateBuckets.size > 20000) rateBuckets.clear();
}, 10 * 60 * 1000).unref();

function rateLimitDemoRequests(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, RATE_MAX - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - bucket.startedAt)) / 1000));

  res.setHeader('RateLimit-Limit', String(RATE_MAX));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(resetSeconds));

  if (bucket.count > RATE_MAX) {
    res.setHeader('Retry-After', String(resetSeconds));
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  next();
}

function allowedOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return false;

  const allowed = new Set([
    'https://aihvacmarketing.com',
    'https://www.aihvacmarketing.com',
    'http://localhost:10000',
    'http://127.0.0.1:10000',
  ]);

  for (const value of [process.env.PUBLIC_ORIGIN, process.env.RENDER_EXTERNAL_URL]) {
    if (value) allowed.add(String(value).replace(/\/$/, ''));
  }

  return allowed.has(origin.replace(/\/$/, ''));
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

app.post('/api/demo-request', rateLimitDemoRequests, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!req.is('application/json')) {
    return res.status(415).json({ ok: false, error: 'Unsupported request format.' });
  }

  if (!allowedOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'Request not allowed.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const honeypot = clean(body.website || body._gotcha, 100);
  if (honeypot) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const company = clean(body.company, 150);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 50);
  const serviceArea = clean(body.serviceArea, 150);
  const message = clean(body.message, 2000);

  if (!name || !company || !email || !serviceArea || !isEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
  }

  const transporter = createTransporter();
  const destination = process.env.INTAKE_EMAIL;
  const sender = process.env.FROM_EMAIL || process.env.SMTP_USER;

  if (!transporter || !destination || !sender) {
    console.error('Demo request email service is not configured.');
    return res.status(503).json({ ok: false, error: 'Demo requests are temporarily unavailable.' });
  }

  const text = [
    'New AI HVAC Marketing demo request',
    '',
    `Name: ${name}`,
    `Company: ${company}`,
    `Email: ${email}`,
    `Phone: ${phone || 'Not provided'}`,
    `City / Service Area: ${serviceArea}`,
    '',
    'What they would like help with:',
    message || 'Not provided',
  ].join('\n');

  const safe = {
    name: escapeHtml(name),
    company: escapeHtml(company),
    email: escapeHtml(email),
    phone: escapeHtml(phone || 'Not provided'),
    serviceArea: escapeHtml(serviceArea),
    message: escapeHtml(message || 'Not provided'),
  };

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#17233a;max-width:640px">
      <h2 style="color:#1B3A6B">New AI HVAC Marketing Demo Request</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Company</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.company}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.email}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.phone}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Service Area</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safe.serviceArea}</td></tr>
      </table>
      <h3 style="margin-top:24px;color:#1B3A6B">What they would like help with</h3>
      <p style="white-space:pre-wrap">${safe.message}</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `AI HVAC Marketing Website <${sender}>`,
      to: destination,
      replyTo: email,
      subject: `Demo request — ${company.replace(/[\r\n]/g, ' ')}`,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    // Do not print request content, credentials, or full SMTP errors to production logs.
    console.error('Demo request email failed.', error && error.code ? `Code: ${error.code}` : '');
    return res.status(500).json({ ok: false, error: 'Your request could not be sent.' });
  }
});

// Only explicitly public files are web-accessible. Server code, package metadata,
// environment files, setup docs, and other repository files cannot be downloaded.
app.use('/assets', express.static(ASSET_DIR, {
  dotfiles: 'deny',
  fallthrough: false,
  maxAge: '7d',
  immutable: true,
}));

app.get('/styles.css', (req, res) => res.sendFile(path.join(SITE_DIR, 'styles.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(SITE_DIR, 'script.js')));
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(SITE_DIR, 'index.html')));

// Hide implementation/configuration files instead of advertising that they exist.
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'Not found.' });
  }
  return res.status(404).send('Not found.');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI HVAC Marketing website running on port ${PORT}`);
});

server.requestTimeout = 20000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
