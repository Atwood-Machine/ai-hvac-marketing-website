# Website security notes

- Keep `.env` files, SMTP passwords, API keys, and app passwords out of GitHub. Store them only as Render environment variables.
- The public server exposes only `/`, `/index.html`, `/styles.css`, `/script.js`, `/assets/*`, and `/api/demo-request`.
- Demo requests are limited to 6 attempts per IP per hour, are JSON-only, and are restricted to approved website origins.
- The API does not intentionally persist form submissions on disk or in a database. Submissions are sent to the configured email provider; that provider's retention rules still apply.
- Security headers include CSP, clickjacking protection, MIME sniffing protection, referrer minimization, permission restrictions, and HSTS on HTTPS.
- For stronger distributed-bot/DDoS protection, place the domain behind Cloudflare (or an equivalent edge WAF) and optionally add Turnstile to the demo form.
- Rotate SMTP/app passwords immediately if one is ever committed, pasted publicly, or exposed in logs.
