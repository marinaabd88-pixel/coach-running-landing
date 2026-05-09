# Coach running landing (static)

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **New Project** → import the repo.
3. Framework: **Other** (static).
4. Build command: uses `vercel.json` → `npm run gallery:manifest`.
5. Output directory: `.` (project root).

After deploy, test:
- Gallery loads (it reads `assets/data/gallery-manifest.json`).
- WhatsApp link opens and works.

## Update gallery media

Put images/videos into:

`images/gallery/Gallery/`

Then run locally:

```bash
npm run gallery:manifest
```

Commit the updated `assets/data/gallery-manifest.json`.

