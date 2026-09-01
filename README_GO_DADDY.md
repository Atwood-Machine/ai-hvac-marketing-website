# AI HVAC Marketing Website

This package is a complete static website. It does not need Node, React, a database, or a server process. It can be uploaded directly to GoDaddy cPanel hosting.

## Files

- `index.html` — all website content and sections
- `styles.css` — responsive visual design
- `script.js` — mobile navigation, animations, demo modal, and contact-email behavior
- `assets/logo.svg` — light-background logo
- `assets/logo-white.svg` — dark-background logo

## Before publishing

### 1. Add Richard's professional photo

In `index.html`, locate the section containing:

```html
<div class="about-photo__placeholder">
```

Replace that placeholder with:

```html
<img src="assets/richard-laird.jpg" alt="Richard Laird, Founder of AI HVAC Marketing">
```

Then place the image at `assets/richard-laird.jpg`.

### 2. Add the demo video

The current Demo section contains a polished placeholder. You can replace the entire element with class `video-placeholder` with a YouTube or Vimeo iframe.

Example:

```html
<div class="video-embed">
  <iframe
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
    title="AI HVAC Marketing product demo"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>
```

Then add this to `styles.css`:

```css
.video-embed {
  aspect-ratio: 16 / 9;
  border-radius: 22px;
  overflow: hidden;
}
.video-embed iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
```

### 3. Contact form behavior

The contact form currently opens a prepared email addressed to:

`your-private-inbox@example.com`

This works without a backend, but it relies on the visitor having an email application configured. Later, you can replace it with GoDaddy's form service, Formspree, HubSpot, or another lead-form endpoint.

## Upload to GoDaddy cPanel hosting

1. Download and unzip the package.
2. Sign in to GoDaddy.
3. Open **My Products**.
4. Under **Web Hosting**, click **Manage**.
5. Open **cPanel Admin**.
6. Open **File Manager**.
7. Open the `public_html` folder.
8. Back up or remove the current placeholder `index.html` file.
9. Upload these items directly into `public_html`:
   - `index.html`
   - `styles.css`
   - `script.js`
   - the complete `assets` folder
10. Confirm that the file path is exactly:

```text
public_html/index.html
public_html/styles.css
public_html/script.js
public_html/assets/logo.svg
public_html/assets/logo-white.svg
```

11. Visit `https://www.aihvacmarketing.com` and hard-refresh the page.

## If the domain currently points to Render

Do not change the domain's DNS until you confirm where Richard wants the public website hosted.

- If the main domain should use GoDaddy hosting, set the root `@` A record to the IP address shown in the GoDaddy hosting dashboard.
- Set `www` as a CNAME to `@` or to the host value GoDaddy provides.
- Keep the admin application on a separate subdomain such as `admin.aihvacmarketing.com` or another private Render URL.

DNS changes may take a few minutes to 48 hours to propagate.

## Local preview on Mac

Open Terminal, move into the website folder, and run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Stop the server with `Control + C`.
