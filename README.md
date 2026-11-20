# Gemmms

Source for [www.gemmms.com](https://www.gemmms.com), a crystal and gemstone encyclopedia covering crystal meanings, traditional healing properties, chakras, zodiac signs and birthstones.

The site is plain static HTML made by a small Node script, with no framework or runtime dependencies. It is served by a Cloudflare Worker with static assets.

## Layout

| Path | What |
| --- | --- |
| `content/crystals/*.json` | One file per crystal. `content/AGENT_BRIEF.md` documents the schema and writing rules |
| `content/master-list.txt` | Every crystal slug and name |
| `content/guides/*.json` | Long-form guide articles (HTML body) |
| `content/taxonomy.json` | Intro text for chakra, zodiac, color, intention, family and element hub pages |
| `content/images.json` | Photo attribution (author, license, source) for every crystal image |
| `content/image-skip.json` | Stones with no suitable photo (they show "No image available") and photo files that must never be used. `npm run images` skips these stones unless you name one explicitly, e.g. `npm run images -- super-seven` |
| `public/` | Static files copied as-is (CSS, icons, crystal photos in `public/img/crystals/`) |
| `scripts/build.mjs` | Generates `dist/` |
| `scripts/fetch-images.mjs` | Downloads freely licensed photos from Wikimedia Commons and converts them to WebP |
| `src/worker.js` | Redirects `gemmms.com` to `www.gemmms.com`, then serves `dist/` |
| `site.config.json` | Site URL, Google Tag Manager container ID, AdSense client ID |

## Commands

```sh
npm install
npm run validate          # check every crystal JSON against the schema and health-claim rules
npm run images            # fetch photos for crystals that don't have one yet
npm run build             # write dist/
npm run deploy            # build and deploy to Cloudflare
```

## Adding a crystal

1. Add `slug|Name` to `content/master-list.txt`.
2. Write `content/crystals/<slug>.json` following `content/AGENT_BRIEF.md`.
3. Run `npm run validate`, then `npm run images -- <slug>`, then `npm run deploy`.

## AdSense

Put your publisher ID (for example `ca-pub-1234567890123456`) in `site.config.json` under `adsenseClient`, then deploy. The build adds the Auto ads script to every page and writes `ads.txt`.

## Content rules

Healing properties are written as tradition and belief, never as medical claims. Do not write that a stone cures or treats any disease. This keeps the site within AdSense's policy on unreliable health claims. `npm run validate` flags the most common problem words.
