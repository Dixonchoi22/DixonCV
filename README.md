# Dixon Choi — CV and profile site

Static site, no build step. Live at **https://dixonchoi22.github.io** once the
repository is renamed and Pages is switched on.

One frosted A4 sheet over an animated WebGL terrain. The sheet holds the whole
CV; printing it (or the `Download CV` button, which serves a PDF printed from
this same page) produces a three-page A4 document with the background and the
navigation stripped out.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole page. Content lives here, not in a template. |
| `assets/site.css` | One stylesheet: screen, narrow, and the print rules that turn the page into the CV. |
| `assets/hills.js` | The terrain. A rewrite of a React/three.js component into a plain module that cancels its own loop, pauses on a hidden tab, and does not run under `prefers-reduced-motion`. |
| `assets/beams.js` | The connector wires in the stack diagram. SVG plus SMIL, replacing a framer-motion component. |
| `assets/vendor/` | three.js, vendored. `three.module.min.js` imports `three.core.min.js`, so both must stay. |
| `assets/tally/` | The Tally demo video, poster and captions, copied from the DDX site. |
| `assets/Dixon-Choi-CV.pdf` | Generated, not hand-made. Regenerate with the command below. |
| `.nojekyll` | Stops GitHub Pages running the files through Jekyll. |

## Running it locally

ES modules need a real origin, so opening `index.html` from the filesystem will
not load the background:

```bash
python -m http.server 8931
# http://127.0.0.1:8931/index.html
```

## Regenerating the PDF

The PDF is the page's own print stylesheet, so editing the page is what updates
the CV. With the local server running:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="assets\Dixon-Choi-CV.pdf" \
  --virtual-time-budget=8000 \
  "http://127.0.0.1:8931/index.html"
```

## Things worth knowing before editing

**No phone number, anywhere.** The page, the PDF and the repository are public.
Contact is email, LinkedIn and GitHub only. The number is on the CV file Dixon
sends privately, and it should stay there.

**Gategroup is described one layer shallower than the private CV.** The company
is named, the seven countries and the agent, MCP and SRM work are all there.
Individual ERP product names and the stakeholder headcount are not.

**Client work names no one.** The DDX site states that it names no client and
quotes no real figure. If a client-work section is added later it has to follow
that: anonymised by sector, e.g. "a UK logistics firm", never a company name.

**The repositories behind the work are private.** Only three of Dixon's GitHub
repositories are public, which is why nothing here links to source.
