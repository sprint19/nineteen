# Sprint Nineteen — The Archive

`sprintnineteen.com` — a text-only sci-fi lore page for people who spelled the
number out. Star Wars-style opening crawl that reveals itself as a cursed
developer archive. A deliberately over-long brand relic, not a sales page.

> "We made a decision, and no one stopped us."

## What it is

A single static page (no build step). Three phases:

1. **Boot** — fake terminal warning + `Begin the Scroll` / `Escape to sprint19.com`.
2. **Crawl** — Star Wars-style perspective crawl, with controls: AUTO/MANUAL
   toggle (mouse wheel + ↑/↓/PageUp/PageDown/space), auto-scroll speed slider,
   zoom −/+ and **FIT** (fit-to-width: scales the crawl so the column fills the
   screen width, keeps auto-scrolling), and `esc` to skip. A little 8-bit hard-hat worker
   (plus a second one) marches a crate toward a "probably fine" flag at the
   top — ambient flavor.
   The crawl is reusable: from the archive, the **⤒ crawl** button in the
   status bar replays the chapter you're currently reading as a crawl, and
   returns you to the start of that same chapter when you exit.
3. **Archive** — the full ~6,000-word lore document with chapter nav, scroll
   progress, rotating nonsense status, and the exit door back to sprint19.com.

## Files

```
index.html        the page (boot + crawl + archive, full lore inline)
styles.css        CRT / terminal / sci-fi styling
script.js         phase transitions, music, scroll tracking, GA4 events
assets/
  nineteen-opens.mp3   "forbidden MIDI" (plays only on user click — no autoplay)
  favicon.png
  og-image.png         1200x630 social preview
og.html           generator template for og-image.png (not linked from the site)
CNAME             sprintnineteen.com
.nojekyll         serve files as-is on GitHub Pages
```

## Deploy (GitHub Pages → sprintnineteen.com)

```bash
cd nineteen
git init -b main
git add .
git commit -m "Sprint Nineteen: The Archive"
git remote add origin git@github.com:sprint19/nineteen.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Build and deployment → Deploy from a
branch → `main` / root**. The `CNAME` file points it at `sprintnineteen.com`;
add the matching DNS records (CNAME `www` + A/ALIAS apex) at the registrar and
tick **Enforce HTTPS**.

## Analytics

GA4 only — no ad pixels, no recordings, no popups, no lead forms. The measurement
ID `G-WDVYMV64YF` is wired in the GA4 block in `<head>` of `index.html`. (The
loader only activates a valid, non-placeholder ID, so the page degrades safely if
it's ever cleared.)

Events fired: `page_view`, `begin_scroll`, `play_forbidden_midi`,
`pause_forbidden_midi`, `escape_to_sprint19_click`, `archive_opened`,
`scroll_25/50/75/100`, `chapter_reached` (with chapter), `archive_completed`.
The metric that matters is "how many people stayed long enough to get the joke."

## Search / indexing (intentional)

| Setting              | Choice                                            |
|----------------------|---------------------------------------------------|
| Indexing             | `noindex,follow` (visit + share, but not ranked)  |
| robots.txt block     | no (Google must crawl to see the `noindex` tag)   |
| Sitemap              | no                                                 |
| Canonical            | self (`sprintnineteen.com`), **not** sprint19.com |
| Google Search Console| add + verify the domain                           |
| Bing Webmaster Tools | add + verify (skip the sitemap)                   |

## Regenerating the OG image

`og.html` is the template. Rasterize at 1200x630 with headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --window-size=1200,630 \
  --screenshot="assets/og-image.png" "file://$PWD/og.html"
```

## Local preview

```bash
python3 -m http.server 8019 --directory nineteen
# → http://localhost:8019
```
