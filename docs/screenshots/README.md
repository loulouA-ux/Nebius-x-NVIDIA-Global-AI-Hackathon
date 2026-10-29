# Repository screenshot gallery

Captured from the local production build on28 October2026. All report content is the **public recorded synthetic demo**. No private repository names, session cookies, credentials or live HeySalad findings are included. These images show a development-branch UI, not proof that it has shipped to production.

| Surface | Light | Dark |
| --- | --- | --- |
| Product landing | [PNG](landing-light.png) | [PNG](landing-dark.png) |
| Developer guide | [PNG](developers-light.png) | [PNG](developers-dark.png) |
| Recorded report | [PNG](report-light.png) | [PNG](report-dark.png) |

Mobile: [Landing](landing-mobile.png) · [Developer guide](developers-mobile.png).

## Reproduce

```sh
npm ci
npm run build
npx playwright install chromium
npx next start --hostname 127.0.0.1 --port 3151
# In another terminal:
node scripts/capture-repository-screenshots.mjs
```

Desktop captures are1440×1000; mobile is390px wide. The script uses fresh browser contexts, explicit light/dark preferences, reduced motion, loaded fonts and public demo routes. It rejects non-loopback origins and checks for horizontal overflow. Screenshots are not edited to invent data or hide coverage warnings.
