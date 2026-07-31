'use strict';

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const SITE_DIR = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '25kb' }));
app.use(express.urlencoded({ extended: false, limit: '25kb' }));

const clean = (value, maxLength = 500) =>
  String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
  });
}

app.post('/api/demo-request', async (req, res) => {
  const honeypot = clean(req.body.website || req.body._gotcha, 100);
  if (honeypot) return res.status(200).json({ ok: true });

  const name = clean(req.body.name, 100);
  const company = clean(req.body.company, 150);
  const email = clean(req.body.email, 200);
  const phone = clean(req.body.phone, 50);
  const serviceArea = clean(req.body.serviceArea, 150);
  const message = clean(req.body.message, 2000);

  if (!name || !company || !email || !serviceArea || !isEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email environment variables are not configured.');
    return res.status(503).json({ ok: false, error: 'Demo requests are temporarily unavailable.' });
  }

  const destination = process.env.INTAKE_EMAIL || 'intake@aihvacmarketing.com';
  const sender = process.env.FROM_EMAIL || process.env.SMTP_USER;

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

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#17233a;max-width:640px">
      <h2 style="color:#1B3A6B">New AI HVAC Marketing Demo Request</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Company</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${company}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${email}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${phone || 'Not provided'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Service Area</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${serviceArea}</td></tr>
      </table>
      <h3 style="margin-top:24px;color:#1B3A6B">What they would like help with</h3>
      <p style="white-space:pre-wrap">${message || 'Not provided'}</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `AI HVAC Marketing Website <${sender}>`,
      to: destination,
      replyTo: email,
      subject: `Demo request — ${company}`,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Demo request email failed:', error);
    return res.status(500).json({ ok: false, error: 'Your request could not be sent.' });
  }
});

app.use(express.static(SITE_DIR, {
  extensions: ['html'],
  index: 'index.html',
  maxAge: '1h',
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(SITE_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI HVAC Marketing website running on port ${PORT}`);
});
