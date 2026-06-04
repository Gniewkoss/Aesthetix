# Legal pages (aesthetix.online)

Privacy Policy and Terms of Service for **Aesthetix**, served as static HTML from `docs/`.

## Live URLs (after deploy)

- https://aesthetix.online/privacy.html
- https://aesthetix.online/terms.html

These match `src/constants/legal.ts`.

## Deploy (Cloudflare Pages)

1. Buy **aesthetix.online** and add the zone to Cloudflare.
2. **Pages** → Create project → Connect this repo (or upload `docs/`).
3. Build: none — **output directory:** `docs`
4. **Custom domain:** `aesthetix.online` (and optionally `www` → redirect to apex).
5. Verify both URLs in a browser before App Store / Play submission.

## Email

On the same domain (Zoho Mail, Google Workspace, Migadu, or Cloudflare Email Routing):

- `support@aesthetix.online`
- `privacy@aesthetix.online` (alias to the same inbox is fine)

## Editing

1. Edit `docs/privacy.html` and/or `docs/terms.html`.
2. Bump `POLICY_VERSION` in `src/constants/legal.ts` and the version line in both HTML files.
3. Have counsel review material changes before release.
