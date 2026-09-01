# Private Demo Request Email Setup

The website now sends demo requests through its own backend endpoint:

`POST /api/demo-request`

It does not use Formspree, does not open the visitor's mail app, and does not expose the destination inbox in the browser code.

## Important hosting change

This project must be deployed on Render as a **Web Service**, not a Static Site, because secure email credentials can only live on a server.

## Render settings

- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`

Add these environment variables in Render:

- `INTAKE_EMAIL` — placeholder: `your-private-inbox@example.com`
- `FROM_EMAIL` — mailbox used as the sender
- `SMTP_HOST` — provided by the mailbox provider
- `SMTP_PORT` — usually `587` or `465`
- `SMTP_USER` — mailbox username
- `SMTP_PASS` — app password or SMTP password

The destination address is changed only through `INTAKE_EMAIL`; no code edit is required.
