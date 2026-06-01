# Legal pages (GitHub Pages)

Privacy Policy and Terms of Service for **Aesthetix AI**, served as static HTML.

## Live URLs (after Pages is enabled)

- https://gniewkoss.github.io/Aesthetix/privacy.html
- https://gniewkoss.github.io/Aesthetix/terms.html

These match `src/constants/legal.ts`.

## One-time setup

1. Push `docs/` and `.github/workflows/deploy-legal-pages.yml` to `main`.
2. GitHub → repo **Aesthetix** → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.
3. After the workflow runs, open the URLs above in a browser.

Optional: add a custom domain (e.g. `aesthetix.ai`) in Pages settings, then update `LEGAL_BASE_URL` in `src/constants/legal.ts` and bump `POLICY_VERSION` if URLs change.

## Editing

1. Edit `docs/privacy.html` and/or `docs/terms.html`.
2. Bump `POLICY_VERSION` in `src/constants/legal.ts` and the version line in both HTML files.
3. Have counsel review material changes before release.
