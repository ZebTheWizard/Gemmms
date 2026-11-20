// Gemmms static site generator. No dependencies: reads content/ and writes dist/.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const DIST = path.join(ROOT, "dist");
const CONTENT = path.join(ROOT, "content");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const SITE = config.url;
const TODAY = new Date().toISOString().slice(0, 10);
const readJSON = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback);

// ---------- data ----------
const crystals = fs
  .readdirSync(path.join(CONTENT, "crystals"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJSON(path.join(CONTENT, "crystals", f)))
  .sort((a, b) => a.name.localeCompare(b.name));
const bySlug = Object.fromEntries(crystals.map((c) => [c.slug, c]));
const images = readJSON(path.join(CONTENT, "images.json"), {});
const tax = readJSON(path.join(CONTENT, "taxonomy.json"), {});
const guidesDir = path.join(CONTENT, "guides");
const guides = fs.existsSync(guidesDir)
  ? fs.readdirSync(guidesDir).filter((f) => f.endsWith(".json")).map((f) => readJSON(path.join(guidesDir, f)))
  : [];
const GUIDE_ORDER = ["crystals-for-beginners", "how-to-cleanse-crystals", "crystal-water-safety", "chakra-stones-guide", "birthstones-by-month", "zodiac-crystals", "how-to-set-intentions", "crystal-grids", "how-to-spot-fake-crystals", "mohs-hardness-scale"];
guides.sort((a, b) => (GUIDE_ORDER.indexOf(a.slug) + 99) % 99 - (GUIDE_ORDER.indexOf(b.slug) + 99) % 99);
// Pages that existed on the original site get their original publish date.
const ORIGINAL = new Set(["amethyst", "aquamarine", "bismuth", "blue-quartz", "citrine", "emerald", "fire-agate", "gold", "halite", "howlite", "iolite", "jasper", "kunzite", "labradorite", "moonstone", "moqui-marbles"]);

const CHAKRAS = ["Earth Star", "Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown", "Soul Star", "All Chakras"];
const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ZODIAC_GLYPH = { Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓" };
const ZODIAC_DATES = { Aries: "Mar 21 - Apr 19", Taurus: "Apr 20 - May 20", Gemini: "May 21 - Jun 20", Cancer: "Jun 21 - Jul 22", Leo: "Jul 23 - Aug 22", Virgo: "Aug 23 - Sep 22", Libra: "Sep 23 - Oct 22", Scorpio: "Oct 23 - Nov 21", Sagittarius: "Nov 22 - Dec 21", Capricorn: "Dec 22 - Jan 19", Aquarius: "Jan 20 - Feb 18", Pisces: "Feb 19 - Mar 20" };
const COLORS = { Clear: "#f4f6f8", White: "#ffffff", Black: "#1b1b1b", Grey: "#8a8a8a", Brown: "#7a4e2d", Red: "#c0272d", Orange: "#e8792b", Yellow: "#f2d23c", Gold: "#d4a83a", Green: "#3f9a4f", Blue: "#2f62c4", Teal: "#1f9a97", Purple: "#7b3fa0", Violet: "#9b6fd0", Pink: "#ef93b6", Peach: "#f6b98f", Silver: "#c0c4c8", Multicolor: "linear-gradient(90deg,#c0272d,#f2d23c,#3f9a4f,#2f62c4,#7b3fa0)", Iridescent: "linear-gradient(135deg,#7fd3e6,#b98be6,#f3c1d9,#a4e3b4)" };
const CHAKRA_COLORS = { "Earth Star": "#3b2a20", Root: "#c0272d", Sacral: "#e8792b", "Solar Plexus": "#f2d23c", Heart: "#3f9a4f", Throat: "#2f8fd0", "Third Eye": "#3b3fa0", Crown: "#9b6fd0", "Soul Star": "#f0e6ff", "All Chakras": "linear-gradient(90deg,#c0272d,#e8792b,#f2d23c,#3f9a4f,#2f8fd0,#3b3fa0,#9b6fd0)" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ---------- helpers ----------
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => String(s).toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plainName = (c) => c.name.replace(/\s*\(.*\)/, "");
const list = (arr, sep = ", ") => (arr || []).join(sep);
const links = (arr, base) => (arr || []).map((v) => `<a href="/${base}/${slugify(v)}/">${esc(v)}</a>`).join(", ");
const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
const crystalUrl = (c) => `/crystals/${c.slug}/`;
const hasImg = (c) => !!images[c.slug] && fs.existsSync(path.join(ROOT, "public", "img", "crystals", `${c.slug}-sm.webp`));
const thumb = (c) => (hasImg(c) ? `/img/crystals/${c.slug}-sm.webp` : "/img/placeholder.svg");
const large = (c) => (hasImg(c) ? `/img/crystals/${c.slug}.webp` : "/img/placeholder.svg");
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function write(urlPath, html) {
  const file = urlPath.endsWith("/") ? path.join(DIST, urlPath, "index.html") : path.join(DIST, urlPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
const sitemap = [];
function page(urlPath, opts) {
  write(urlPath, layout({ ...opts, path: urlPath }));
  if (!opts.noindex) sitemap.push({ loc: SITE + urlPath, lastmod: opts.modified || TODAY, priority: opts.priority || 0.6 });
}

function card(c, sub) {
  return `<a class="card" href="${crystalUrl(c)}"><img src="${thumb(c)}" alt="${esc(plainName(c))}" width="160" height="160" loading="lazy" decoding="async"><span class="card-name">${esc(c.name)}</span>${sub !== false ? `<span class="card-sub">${esc(sub || (c.keywords || []).slice(0, 2).join(" · "))}</span>` : ""}</a>`;
}
const cards = (arr, sub) => `<div class="cards">${arr.map((c) => card(c, sub)).join("")}</div>`;

const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="16,6 48,6 60,22 32,60 4,22" fill="#b98be6"/><polygon points="16,6 48,6 40,22 24,22" fill="#e4d2fa"/><polygon points="4,22 24,22 32,60" fill="#8e5cc7"/><polygon points="60,22 40,22 32,60" fill="#6c3aa6"/><polygon points="24,22 40,22 32,60" fill="#a875e0"/><polygon points="16,6 24,22 4,22" fill="#cfb2f2"/><polygon points="48,6 60,22 40,22" fill="#9a6ad6"/></svg>`;

const NAV = [
  ["/", "Home"],
  ["/crystals/", "Crystals A-Z"],
  ["/healing/", "Healing Properties"],
  ["/chakras/", "Chakras"],
  ["/zodiac/", "Zodiac"],
  ["/birthstones/", "Birthstones"],
  ["/colors/", "By Color"],
  ["/guides/", "Guides"],
  ["/about/", "About"],
];
const POPULAR = ["amethyst", "rose-quartz", "clear-quartz", "citrine", "black-tourmaline", "labradorite", "moonstone", "tigers-eye", "selenite", "lapis-lazuli", "carnelian", "malachite", "green-aventurine", "obsidian", "fluorite", "turquoise"].filter((s) => bySlug[s]);

function sidebar() {
  const withImg = crystals.filter(hasImg);
  const pick = withImg.length ? withImg[hash(TODAY) % withImg.length] : null;
  const intentions = Object.keys(tax.intentions || {}).slice(0, 14);
  return `<aside>
<div class="box"><h3>Featured Crystal</h3>${pick ? `<a class="feature" href="${crystalUrl(pick)}" style="display:block"><img src="${thumb(pick)}" alt="${esc(plainName(pick))}" width="240" height="240" loading="lazy"><b>${esc(pick.name)}</b><span>${esc((pick.keywords || []).slice(0, 3).join(" · "))}</span></a>` : ""}</div>
<div class="box"><h3>Popular Crystals</h3><ul>${POPULAR.map((s) => `<li><a href="/crystals/${s}/">${esc(bySlug[s].name)}</a></li>`).join("")}</ul></div>
<div class="box"><h3>Browse by Chakra</h3><ul>${CHAKRAS.slice(1, 8).map((c) => `<li>${swatch(CHAKRA_COLORS[c])}<a href="/chakras/${slugify(c)}/">${c} Chakra</a></li>`).join("")}</ul></div>
${intentions.length ? `<div class="box"><h3>Crystals For...</h3><ul>${intentions.map((i) => `<li><a href="/healing/${slugify(i)}/">${esc(i)}</a></li>`).join("")}<li><a href="/healing/"><b>All healing intentions &raquo;</b></a></li></ul></div>` : ""}
${guides.length ? `<div class="box"><h3>Crystal Guides</h3><ul>${guides.slice(0, 8).map((g) => `<li><a href="/guides/${g.slug}/">${esc(g.title)}</a></li>`).join("")}</ul></div>` : ""}
</aside>`;
}

function layout({ title, description, path: p, body, crumbs = [], jsonld = [], image, full = false, type = "website", head = "", noindex = false }) {
  const canonical = SITE + p;
  const fullTitle = p === "/" ? title : `${title} | Gemmms`;
  const og = image ? SITE + image : `${SITE}/img/og-default.png`;
  const crumbList = [["/", "Home"], ...crumbs];
  const ld = [...jsonld];
  if (crumbs.length) {
    ld.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbList.map(([u, n], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + u })) });
  }
  const navOn = (u) => (u === "/" ? p === "/" : p.startsWith(u) || (u === "/healing/" && p.startsWith("/families/")));
  const ads = config.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.adsenseClient)}" crossorigin="anonymous"></script>` : "";
  const ga = config.gtmId ? `<script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});</script><script async src="https://www.googletagmanager.com/gtm.js?id=${esc(config.gtmId)}"></script>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:site_name" content="Gemmms">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#4a2868">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/css/site.css?v=${BUILD_ID}">
<script src="/js/search.js?v=${BUILD_ID}" defer></script>
${head}${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${ga}${ads}
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<div id="wrap">
<header class="masthead">
<a class="brand" href="/">${LOGO}<span><span class="brand-name">Gemmms</span><span class="brand-tag">The Crystal &amp; Gemstone Encyclopedia</span></span></a>
<form action="/search/" method="get" role="search"><input type="search" name="q" placeholder="Search ${crystals.length} crystals..." aria-label="Search crystals"><button type="submit">Search</button></form>
</header>
<nav class="top" aria-label="Main"><ul>${NAV.map(([u, n]) => `<li><a href="${u}"${navOn(u) ? ' class="on"' : ""}>${n}</a></li>`).join("")}</ul></nav>
${crumbs.length ? `<div class="crumbs">${crumbList.map(([u, n], i) => (i === crumbList.length - 1 ? esc(n) : `<a href="${u}">${esc(n)}</a>`)).join(" &rsaquo; ")}</div>` : ""}
<div class="cols${full ? " full" : ""}">
<main id="content">
${body}
</main>
${full ? "" : sidebar()}
</div>
<footer>
<div class="fcols">
<div><h4>Encyclopedia</h4><ul><li><a href="/crystals/">Crystals A-Z</a></li><li><a href="/families/">Mineral Families</a></li><li><a href="/colors/">Crystals by Color</a></li><li><a href="/elements/">Crystals by Element</a></li><li><a href="/search/">Search</a></li></ul></div>
<div><h4>Healing</h4><ul><li><a href="/healing/">Crystals by Intention</a></li><li><a href="/chakras/">Chakra Stones</a></li><li><a href="/zodiac/">Zodiac Crystals</a></li><li><a href="/birthstones/">Birthstones</a></li></ul></div>
<div><h4>Learn</h4><ul>${guides.slice(0, 5).map((g) => `<li><a href="/guides/${g.slug}/">${esc(g.title)}</a></li>`).join("")}</ul></div>
<div><h4>Gemmms</h4><ul><li><a href="/about/">About Us</a></li><li><a href="/privacy-policy/">Privacy Policy</a></li><li><a href="/terms/">Terms of Use</a></li><li><a href="/disclaimer/">Disclaimer</a></li><li><a href="/image-credits/">Image Credits</a></li></ul></div>
</div>
<div class="legal">The information on Gemmms is shared for educational and spiritual interest. Crystal healing is a complementary practice and is not a substitute for professional medical advice, diagnosis or treatment. Always consult a qualified health professional about medical concerns.<br>&copy; 2024&ndash;${new Date().getFullYear()} Gemmms.com &middot; Crystal photographs courtesy of Wikimedia Commons contributors (see <a href="/image-credits/">image credits</a>).</div>
</footer>
</div>
</body>
</html>`;
}
const BUILD_ID = Date.now().toString(36);

// ---------- crystal pages ----------
function crystalPage(c, i) {
  const name = plainName(c);
  const img = images[c.slug];
  const prev = crystals[(i - 1 + crystals.length) % crystals.length];
  const next = crystals[(i + 1) % crystals.length];
  const pairs = (c.pairsWith || []).map((s) => bySlug[s]).filter(Boolean);
  const family = crystals.filter((o) => o.family === c.family && o.slug !== c.slug);
  const related = family.length >= 4 ? family : [...family, ...crystals.filter((o) => o.slug !== c.slug && o.family !== c.family && (o.chakras || []).some((k) => (c.chakras || []).includes(k)))];
  const relatedPick = related.sort((a, b) => hash(a.slug + c.slug) - hash(b.slug + c.slug)).slice(0, 8);
  const published = ORIGINAL.has(c.slug) ? "2024-09-06" : "2026-11-20";
  const row = (k, v) => (v ? `<tr><th>${k}</th><td>${v}</td></tr>` : "");
  const secs = [
    ["what", `What Is ${name}?`],
    ["history", "History &amp; Lore"],
    ["meaning", `${name} Meaning`],
    ["properties", "Healing Properties"],
    ["use", `How to Use ${name}`],
    ["care", "Cleansing &amp; Care"],
    ["identify", "Identifying Genuine " + name],
    ["pairs", "Crystal Pairings"],
    ["faq", "Frequently Asked Questions"],
  ];
  const credit = img ? `Photo: ${esc(img.artist)}, <a href="${esc(img.source)}" rel="nofollow noopener">${esc(img.license)}</a>, via Wikimedia Commons` : "";
  const body = `<article>
<h1>${esc(c.name)}<small>Meaning, Healing Properties &amp; Uses</small></h1>
<div class="meta">${esc(c.family)} &middot; ${esc(c.rarity)} &middot; Last updated ${TODAY}</div>
<div class="infobox">
<div class="ib-title">${esc(c.name)}</div>
<figure><img src="${large(c)}" alt="${img ? esc(name) + " specimen" : "No image available"}" width="${img?.width || 300}" height="${img?.height || 300}" fetchpriority="high">${img ? `<figcaption>${credit}</figcaption>` : ""}</figure>
<table>
<tr><td colspan="2" class="sec">Metaphysical</td></tr>
${row("Keywords", esc(list(c.keywords)))}
${row("Chakra", links(c.chakras, "chakras"))}
${row("Zodiac", links(c.zodiac, "zodiac"))}
${row("Element", links(c.elements, "elements"))}
${row("Planet", esc(c.planet))}
${row("Numerology", esc(c.numerology ?? ""))}
${row("Birthstone", c.birthstone ? `<a href="/birthstones/#${c.birthstone.toLowerCase()}">${esc(c.birthstone)}</a>` : "")}
${row("Anniversary", esc(c.anniversary))}
<tr><td colspan="2" class="sec">Mineralogy</td></tr>
${row("Also known as", esc(list(c.aka)))}
${row("Family", `<a href="/families/${slugify(c.family)}/">${esc(c.family)}</a>`)}
${row("Color", (c.colors || []).map((k) => `<a href="/colors/${slugify(k)}/">${esc(k)}</a>`).join(", "))}
${row("Class", esc(c.mineralClass))}
${row("Formula", esc(c.formula).replace(/(\d+)/g, "<sub>$1</sub>"))}
${row("Crystal system", esc(c.crystalSystem))}
${row("Hardness", c.hardness ? `${esc(c.hardness)} (Mohs)` : "")}
${row("Luster", esc(c.luster))}
${row("Transparency", esc(c.transparency))}
${row("Origin", esc(list(c.locations)))}
${row("Rarity", esc(c.rarity))}
${row("Natural?", esc(c.natural))}
</table>
</div>
<p class="lede">${esc(c.summary)}</p>
<div class="toc"><b>Contents</b><ol>${secs.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join("")}</ol></div>
<h2 id="what">What Is ${esc(name)}?</h2>
<p>${esc(c.intro)}</p>
<h2 id="history">History &amp; Lore</h2>
<p>${esc(c.history)}</p>
<h2 id="meaning">${esc(name)} Meaning &amp; Metaphysical Properties</h2>
<p>${(c.keywords || []).map((k) => `<span class="pill">${esc(k)}</span>`).join("")}</p>
<p>${esc(c.meaning)}</p>
${(c.intentions || []).length ? `<p>Many people reach for ${esc(name)} for: ${c.intentions.map((t) => `<a href="/healing/${slugify(t)}/">${esc(t)}</a>`).join(", ")}.</p>` : ""}
<h2 id="properties">${esc(name)} Healing Properties</h2>
<div class="props">
<div><h3>Emotional</h3><ul>${(c.emotional || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<div><h3>Spiritual</h3><ul>${(c.spiritual || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
<div><h3>Physical (traditional)</h3><ul>${(c.physical || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
</div>
<p class="note">These properties come from crystal-healing tradition and the experience of practitioners. They are not medical claims. Crystals can complement, but never replace, care from a qualified health professional.</p>
<h2 id="use">How to Use ${esc(name)}</h2>
<p>${esc(c.howToUse)}</p>
<h2 id="care">Cleansing &amp; Care</h2>
<div class="safety"><span class="${c.waterSafe ? "yes" : "no"}">${c.waterSafe ? "Water safe (briefly)" : "Not water safe"}</span><span class="${c.sunSafe ? "yes" : "no"}">${c.sunSafe ? "Sunlight safe" : "May fade in sunlight"}</span><span>Hardness ${esc(c.hardness)}</span></div>
<p>${esc(c.care)}</p>
${c.toxicityNote ? `<p class="warn"><b>Safety:</b> ${esc(c.toxicityNote)}</p>` : ""}
<p>New to cleansing? Read our guides on <a href="/guides/how-to-cleanse-crystals/">how to cleanse crystals</a> and <a href="/guides/crystal-water-safety/">which crystals are water safe</a>.</p>
<h2 id="identify">How to Identify Genuine ${esc(name)}</h2>
<p>${esc(c.identify)}</p>
<h2 id="pairs">Crystals That Pair Well With ${esc(name)}</h2>
${pairs.length ? cards(pairs) : "<p>Clear quartz pairs well with almost any stone and amplifies its energy.</p>"}
<h2 id="faq">Frequently Asked Questions</h2>
<dl class="faq">${(c.faq || []).map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join("")}</dl>
${relatedPick.length ? `<h2>Related Crystals</h2>${cards(relatedPick)}` : ""}
<div class="pager"><a href="${crystalUrl(prev)}">&laquo; ${esc(prev.name)}</a><a href="/crystals/">All crystals</a><a href="${crystalUrl(next)}">${esc(next.name)} &raquo;</a></div>
</article>`;
  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "Article", headline: `${c.name}: Meaning, Healing Properties & Uses`, description: c.summary,
      ...(img ? { image: SITE + large(c) } : {}), datePublished: published, dateModified: TODAY, mainEntityOfPage: SITE + crystalUrl(c),
      author: { "@type": "Organization", name: "Gemmms", url: SITE + "/about/" },
      publisher: { "@type": "Organization", name: "Gemmms", logo: { "@type": "ImageObject", url: SITE + "/android-chrome-512x512.png" } },
      about: { "@type": "Thing", name: c.name, alternateName: c.aka || [] },
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: (c.faq || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  if (img) jsonld.push({ "@context": "https://schema.org", "@type": "ImageObject", contentUrl: SITE + large(c), creditText: img.artist, license: img.licenseUrl || img.source, acquireLicensePage: img.source, creator: { "@type": "Person", name: img.artist } });
  page(crystalUrl(c), {
    title: `${c.name} Meaning, Healing Properties & Uses`,
    description: c.summary,
    body,
    crumbs: [["/crystals/", "Crystals"], [crystalUrl(c), c.name]],
    jsonld, image: img ? large(c) : undefined, type: "article", modified: TODAY, priority: 0.8,
  });
}

// ---------- hub pages ----------
function hub({ urlPath, title, h1, description, intro, items, crumbs, extra = "", sub }) {
  const body = `<h1>${h1 || esc(title)}</h1>
${intro ? `<p class="lede">${esc(intro)}</p>` : ""}
${extra}
<h2>${count(items.length, "crystal")}</h2>
${items.length ? cards(items, sub) : "<p>No crystals are listed here yet.</p>"}`;
  page(urlPath, { title, description, body, crumbs, jsonld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: SITE + urlPath }] });
}

function buildTaxonomy({ key, base, label, values, titleFn, h1Fn, metaFn, extraFn, swatchFn }) {
  const groups = values.map((v) => ({ v, items: crystals.filter((c) => (Array.isArray(c[key]) ? c[key] : [c[key]]).includes(v)) })).filter((g) => g.items.length);
  for (const { v, items } of groups) {
    const t = (tax[base] || {})[v] || {};
    hub({
      urlPath: `/${base}/${slugify(v)}/`,
      title: titleFn(v, t),
      h1: h1Fn ? h1Fn(v, t) : esc(titleFn(v, t)),
      description: t.description || metaFn(v, items),
      intro: t.intro,
      items,
      crumbs: [[`/${base}/`, label], [`/${base}/${slugify(v)}/`, v]],
      extra: extraFn ? extraFn(v, t) : "",
    });
  }
  return groups;
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });

crystals.forEach(crystalPage);

// A-Z
{
  const letters = [...new Set(crystals.map((c) => c.name[0].toUpperCase()))];
  const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const body = `<h1>Crystals A&ndash;Z</h1>
<p class="lede">Our encyclopedia lists ${crystals.length} crystals, gemstones, minerals and stones of power, each with its meaning, traditional healing properties, mineral data and care instructions. Choose a letter or scroll the full list below.</p>
<div class="letters">${all.map((l) => (letters.includes(l) ? `<a href="#${l}">${l}</a>` : `<span>${l}</span>`)).join("")}</div>
<div class="az">${letters.map((l) => `<h2 id="${l}">${l}</h2>${cards(crystals.filter((c) => c.name[0].toUpperCase() === l), false)}`).join("")}</div>`;
  page("/crystals/", { title: "Crystals A-Z: Meanings & Healing Properties", description: `Browse ${crystals.length} crystals and gemstones from A to Z. Discover the meaning, healing properties, chakras and zodiac signs of every stone.`, body, crumbs: [["/crystals/", "Crystals"]], priority: 0.9 });
}

// Chakras
const chakraGroups = buildTaxonomy({
  key: "chakras", base: "chakras", label: "Chakras", values: CHAKRAS,
  titleFn: (v) => (v === "All Chakras" ? "Crystals for All Chakras" : `${v} Chakra Crystals & Stones`),
  metaFn: (v, items) => `${items.length} crystals for the ${v} chakra, with their meanings and how to use them for balancing and healing.`,
  extraFn: (v, t) => (t.location ? `<table class="data"><tr><th>Sanskrit</th><td>${esc(t.sanskrit || "-")}</td><th>Location</th><td>${esc(t.location)}</td></tr><tr><th>Color</th><td>${swatch(CHAKRA_COLORS[v])}${esc(t.color)}</td><th>Theme</th><td>${esc(t.theme)}</td></tr></table>` : ""),
});
page("/chakras/", {
  title: "Chakra Stones: Crystals for Each Chakra",
  description: "Find the right crystals for each of the seven chakras, plus the Earth Star and Soul Star, with colors, locations and stone lists.",
  crumbs: [["/chakras/", "Chakras"]],
  body: `<h1>Chakra Stones</h1><p class="lede">In the chakra tradition, the body holds seven main energy centers running from the base of the spine to the crown of the head, with two more (Earth Star and Soul Star) above and below. Each is linked to a color and a set of stones. Pick a chakra to see the crystals traditionally used to balance it, or read our <a href="/guides/chakra-stones-guide/">complete chakra guide</a>.</p>
<ul class="hub-grid">${chakraGroups.map(({ v, items }) => `<li><a href="/chakras/${slugify(v)}/">${swatch(CHAKRA_COLORS[v])}<b>${esc(v === "All Chakras" ? v : v + " Chakra")}</b><small>${esc((tax.chakras?.[v]?.theme) || "")} &middot; ${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>`,
  priority: 0.8,
});

// Zodiac
const zodiacGroups = buildTaxonomy({
  key: "zodiac", base: "zodiac", label: "Zodiac", values: ZODIAC,
  titleFn: (v) => `${v} Crystals & Birthstones`,
  h1Fn: (v) => `${ZODIAC_GLYPH[v]} ${v} Crystals`,
  metaFn: (v, items) => `The best crystals for ${v} (${ZODIAC_DATES[v]}): ${items.length} stones that support ${v}'s strengths and balance its challenges.`,
  extraFn: (v, t) => `<table class="data"><tr><th>Dates</th><td>${esc(t.dates || ZODIAC_DATES[v])}</td><th>Element</th><td>${esc(t.element || "")}</td></tr><tr><th>Ruling planet</th><td>${esc(t.ruler || "")}</td><th>Symbol</th><td>${ZODIAC_GLYPH[v]} ${esc(t.symbol || "")}</td></tr></table>`,
});
page("/zodiac/", {
  title: "Zodiac Crystals: Stones for Every Star Sign",
  description: "Discover the crystals and gemstones associated with each zodiac sign, from Aries to Pisces, and how to use them with your astrology.",
  crumbs: [["/zodiac/", "Zodiac"]],
  body: `<h1>Zodiac Crystals</h1><p class="lede">Astrologers and crystal workers have long matched stones to the twelve signs of the zodiac. Choose your sun sign (or your moon and rising signs) to see the crystals said to support you. For a deeper read, see <a href="/guides/zodiac-crystals/">Crystals for Every Zodiac Sign</a>.</p>
<ul class="hub-grid">${zodiacGroups.map(({ v, items }) => `<li><a href="/zodiac/${slugify(v)}/"><b>${ZODIAC_GLYPH[v]} ${v}</b><small>${ZODIAC_DATES[v]} &middot; ${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>`,
  priority: 0.8,
});

// Colors
const colorGroups = buildTaxonomy({
  key: "colors", base: "colors", label: "Colors", values: Object.keys(COLORS),
  titleFn: (v) => `${v} Crystals & Gemstones`,
  h1Fn: (v) => `${swatch(COLORS[v])}${v} Crystals`,
  metaFn: (v, items) => `Browse ${items.length} ${v.toLowerCase()} crystals and gemstones with names, pictures, meanings and healing properties.`,
});
page("/colors/", {
  title: "Crystals by Color: Identify Stones by Their Color",
  description: "Browse crystals and gemstones by color. Find purple, pink, green, blue, black and more stones with pictures, names and meanings.",
  crumbs: [["/colors/", "Colors"]],
  body: `<h1>Crystals by Color</h1><p class="lede">Color is the first thing most people notice about a stone, and in crystal healing it often hints at the stone's chakra and character. Browse by color to identify a stone you have found or to choose one for its color energy.</p>
<ul class="hub-grid">${colorGroups.map(({ v, items }) => `<li><a href="/colors/${slugify(v)}/">${swatch(COLORS[v])}<b>${v}</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>`,
  priority: 0.7,
});

// Elements
const elementGroups = buildTaxonomy({
  key: "elements", base: "elements", label: "Elements", values: ["Earth", "Water", "Fire", "Air", "Spirit"],
  titleFn: (v) => `${v} Element Crystals`,
  metaFn: (v, items) => `${items.length} crystals associated with the ${v} element and how to work with them in ritual and everyday life.`,
});
page("/elements/", {
  title: "Crystals by Element: Earth, Water, Fire, Air & Spirit",
  description: "Crystals grouped by the classical elements of Earth, Water, Fire, Air and Spirit, with the meaning of each element in crystal work.",
  crumbs: [["/elements/", "Elements"]],
  body: `<h1>Crystals by Element</h1><p class="lede">Many traditions assign stones to the classical elements. Element pairings are useful for altars, ritual and balancing your astrological chart.</p><ul class="hub-grid">${elementGroups.map(({ v, items }) => `<li><a href="/elements/${slugify(v)}/"><b>${v}</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>`,
});

// Families
const families = [...new Set(crystals.map((c) => c.family))].sort();
const familyGroups = buildTaxonomy({
  key: "family", base: "families", label: "Families", values: families,
  titleFn: (v) => `${v} Family: Varieties & Meanings`,
  metaFn: (v, items) => `Explore ${items.length} members of the ${v} family of crystals, with mineral facts, meanings and healing properties.`,
});
page("/families/", {
  title: "Mineral Families: Crystals Grouped by Type",
  description: "Crystals and gemstones grouped by mineral family, from quartz and agate to garnet, beryl, feldspar, tourmaline and organic gems.",
  crumbs: [["/families/", "Families"]],
  body: `<h1>Mineral Families</h1><p class="lede">Many stones sold under different names are varieties of the same mineral. Browsing by family shows how amethyst, citrine and smoky quartz are siblings, or how ruby and sapphire are both corundum.</p><ul class="hub-grid">${familyGroups.map(({ v, items }) => `<li><a href="/families/${slugify(v)}/"><b>${esc(v)}</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>`,
});

// Healing intentions
const intentionValues = [...new Set([...Object.keys(tax.intentions || {}), ...crystals.flatMap((c) => c.intentions || [])])].sort();
const intentionGroups = intentionValues.map((v) => ({ v, items: crystals.filter((c) => (c.intentions || []).includes(v)) })).filter((g) => g.items.length);
for (const { v, items } of intentionGroups) {
  const t = tax.intentions?.[v] || {};
  const title = t.title || `Crystals for ${v}`;
  hub({
    urlPath: `/healing/${slugify(v)}/`, title, description: t.description || `The best crystals for ${v.toLowerCase()}: ${items.length} stones with their meanings and how to use them.`,
    intro: t.intro, items, crumbs: [["/healing/", "Healing"], [`/healing/${slugify(v)}/`, v]],
    extra: t.tips?.length ? `<div class="note"><b>Tips:</b><ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "",
  });
}
page("/healing/", {
  title: "Healing Crystals by Intention",
  description: "Find the right healing crystal for what you need: calm, sleep, love, protection, abundance, confidence, grief, focus and more.",
  crumbs: [["/healing/", "Healing"]],
  body: `<h1>Healing Crystals by Intention</h1><p class="lede">Start with what you need, and we will show you the stones crystal healers turn to most. Each list is drawn from the traditional properties recorded in our encyclopedia.</p>
<ul class="hub-grid">${intentionGroups.map(({ v, items }) => `<li><a href="/healing/${slugify(v)}/"><b>${esc(v)}</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>
<p class="note">Crystal healing is a complementary practice rooted in tradition and personal experience. It is not a substitute for professional medical or psychological care.</p>`,
  priority: 0.8,
});

// Birthstones
{
  const rows = MONTHS.map((m) => ({ m, items: crystals.filter((c) => (c.birthstone || "").toLowerCase().includes(m.toLowerCase())) }));
  const body = `<h1>Birthstones by Month</h1>
<p class="lede">Birthstones link each month of the year to one or more gems. Modern lists come from the jewelers' standards first published in 1912, while traditional lists reach back to older European and biblical sources. Below are the birthstones for every month, as recorded in our encyclopedia. For the full story, read <a href="/guides/birthstones-by-month/">our birthstone guide</a>.</p>
<table class="data"><thead><tr><th>Month</th><th>Birthstones</th></tr></thead><tbody>${rows.map(({ m, items }) => `<tr><td><b>${m}</b></td><td>${items.map((c) => `<a href="${crystalUrl(c)}">${esc(c.name)}</a>`).join(", ")}</td></tr>`).join("")}</tbody></table>
${rows.filter((r) => r.items.length).map(({ m, items }) => `<h2 id="${m.toLowerCase()}">${m} Birthstones</h2>${cards(items)}`).join("")}`;
  page("/birthstones/", { title: "Birthstones by Month: Meanings & Colors", description: "Birthstones for every month of the year, January to December, with modern and traditional stones, their colors, meanings and pictures.", body, crumbs: [["/birthstones/", "Birthstones"]], priority: 0.8 });
}

// Guides
for (const g of guides) {
  page(`/guides/${g.slug}/`, {
    title: g.title, description: g.description, type: "article",
    crumbs: [["/guides/", "Guides"], [`/guides/${g.slug}/`, g.title]],
    body: `<article class="article"><h1>${esc(g.title)}</h1><div class="meta">Gemmms Guides &middot; Updated ${TODAY}</div>${g.html}</article>`,
    jsonld: [{ "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.description, dateModified: TODAY, datePublished: "2026-11-20", author: { "@type": "Organization", name: "Gemmms" }, publisher: { "@type": "Organization", name: "Gemmms", logo: { "@type": "ImageObject", url: SITE + "/android-chrome-512x512.png" } } }],
    priority: 0.7,
  });
}
page("/guides/", {
  title: "Crystal Guides & How-Tos",
  description: "Practical crystal guides: cleansing and charging, water safety, chakra stones, birthstones, crystal grids, spotting fakes and more.",
  crumbs: [["/guides/", "Guides"]],
  body: `<h1>Crystal Guides</h1><p class="lede">Practical, plain-spoken guides for beginners and seasoned collectors alike.</p><ul class="hub-grid">${guides.map((g) => `<li><a href="/guides/${g.slug}/"><b>${esc(g.title)}</b><small>${esc(g.description.slice(0, 90))}...</small></a></li>`).join("")}</ul>`,
});

// Home
{
  const featured = POPULAR.map((s) => bySlug[s]).slice(0, 12);
  const rare = crystals.filter((c) => /Very Rare|Extremely Rare/.test(c.rarity)).sort((a, b) => hash(a.slug + TODAY) - hash(b.slug + TODAY)).slice(0, 6);
  const body = `<div class="welcome"><h1>Welcome to Gemmms</h1>
<p>Gemmms is an encyclopedia of crystals, gemstones and minerals for people who work with their energy. Inside you will find <b>${crystals.length} stones</b>, each with its meaning, traditional healing properties, chakra and zodiac correspondences, mineral data, care instructions and real photographs.</p>
<p>Not sure where to start? Try <a href="/guides/crystals-for-beginners/">Crystal Healing for Beginners</a>, or browse by <a href="/healing/">what you need</a>.</p></div>
<h2>Most Popular Crystals</h2>${cards(featured)}
<h2>Find Crystals For...</h2>
<ul class="hub-grid">${intentionGroups.slice(0, 12).map(({ v, items }) => `<li><a href="/healing/${slugify(v)}/"><b>${esc(v)}</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>
<p><a href="/healing/">See all healing intentions &raquo;</a></p>
<h2>Browse by Chakra</h2>
<ul class="hub-grid">${chakraGroups.filter((g) => !["Earth Star", "Soul Star", "All Chakras"].includes(g.v)).map(({ v, items }) => `<li><a href="/chakras/${slugify(v)}/">${swatch(CHAKRA_COLORS[v])}<b>${v} Chakra</b><small>${count(items.length, "crystal")}</small></a></li>`).join("")}</ul>
<h2>Browse by Zodiac Sign</h2>
<ul class="hub-grid">${zodiacGroups.map(({ v }) => `<li><a href="/zodiac/${slugify(v)}/"><b>${ZODIAC_GLYPH[v]} ${v}</b><small>${ZODIAC_DATES[v]}</small></a></li>`).join("")}</ul>
${rare.length ? `<h2>Rare &amp; Collector Stones</h2>${cards(rare, false)}` : ""}
<h2>Crystal Guides</h2><ul>${guides.map((g) => `<li><a href="/guides/${g.slug}/">${esc(g.title)}</a></li>`).join("")}</ul>
<h2>Browse by Color</h2><p>${colorGroups.map(({ v }) => `<a class="pill" href="/colors/${slugify(v)}/">${swatch(COLORS[v])}${v}</a>`).join(" ")}</p>`;
  page("/", {
    title: "Gemmms - Crystal Meanings, Healing Properties & Gemstone Encyclopedia",
    description: `Gemmms is a crystal encyclopedia with ${crystals.length} stones: meanings, healing properties, chakras, zodiac signs, birthstones and care, with photos of every crystal.`,
    body, priority: 1.0,
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebSite", name: "Gemmms", url: SITE + "/", potentialAction: { "@type": "SearchAction", target: SITE + "/search/?q={search_term_string}", "query-input": "required name=search_term_string" } },
      { "@context": "https://schema.org", "@type": "Organization", name: "Gemmms", url: SITE + "/", logo: SITE + "/android-chrome-512x512.png" },
    ],
  });
}

// Search
fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(crystals.map((c) => [c.slug, c.name, (c.aka || []).join(" "), (c.keywords || []).join(" "), (c.colors || []).join(" "), (c.intentions || []).join(" "), hasImg(c) ? 1 : 0])));
page("/search/", {
  title: "Search the Crystal Encyclopedia", description: "Search Gemmms for crystals and gemstones by name, color, keyword or healing intention.", noindex: true,
  crumbs: [["/search/", "Search"]],
  body: `<h1>Search</h1><form class="search-row" action="/search/" method="get" role="search"><input type="search" id="q" name="q" placeholder="Try: amethyst, sleep, green, protection" aria-label="Search"><button class="btn" type="submit">Search</button></form><p id="status" class="meta"></p><div id="results" class="cards"></div>
<script>
(function(){var q=new URLSearchParams(location.search).get("q")||"";var input=document.getElementById("q");input.value=q;var st=document.getElementById("status"),out=document.getElementById("results");
function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
fetch("/search-index.json").then(function(r){return r.json()}).then(function(idx){function run(){var t=input.value.trim().toLowerCase();if(!t){st.textContent="Type a crystal name, color or intention.";out.innerHTML="";return}var words=t.split(/\\s+/);var res=idx.map(function(e){var name=e[1].toLowerCase(),hay=(e[1]+" "+e[2]+" "+e[3]+" "+e[4]+" "+e[5]).toLowerCase();var s=0;for(var i=0;i<words.length;i++){var w=words[i];if(hay.indexOf(w)<0)return null;if(name.indexOf(w)===0)s+=10;else if(name.indexOf(w)>=0)s+=6;else s+=1}return{e:e,s:s}}).filter(Boolean).sort(function(a,b){return b.s-a.s||a.e[1].localeCompare(b.e[1])});st.textContent=res.length+" result"+(res.length===1?"":"s")+' for "'+t+'"';out.innerHTML=res.slice(0,120).map(function(r){var e=r.e;return '<a class="card" href="/crystals/'+e[0]+'/"><img loading="lazy" width="160" height="160" alt="" src="'+(e[6]?"/img/crystals/"+e[0]+"-sm.webp":"/img/placeholder.svg")+'"><span class="card-name">'+esc(e[1])+'</span><span class="card-sub">'+esc(e[3].split(" ").slice(0,2).join(" · "))+"</span></a>"}).join("")}input.addEventListener("input",run);run()})})();
</script>`,
});

// Static pages
const staticPages = [
  ["about", "About Gemmms", "About Gemmms, the crystal and gemstone encyclopedia: who we are, how our entries are researched, and how we choose our photographs.", `<h1>About Gemmms</h1>
<p class="lede">Gemmms began in 2024 as a small notebook of crystal meanings and has grown into an encyclopedia of ${crystals.length} stones.</p>
<p>We love crystals for two reasons at once: their beauty and their meaning. Rocks shops and crystal circles are full of wisdom passed hand to hand, but it is often scattered, contradictory or buried under sales copy. Gemmms collects that lore in one calm, ad-light place and pairs it with the plain mineral facts collectors want: hardness, crystal system, chemistry and where a stone really comes from.</p>
<h2>How our entries are written</h2>
<p>Every entry follows the same structure, so you can compare stones easily: what the stone is, its history and folklore, its metaphysical meaning, its traditional healing associations, how to use it, how to care for it, and how to tell genuine material from imitations. Metaphysical properties are drawn from long-standing crystal-healing tradition and practitioner experience. Mineral data follows standard mineralogical references.</p>
<h2>Our approach to healing claims</h2>
<p>We respect crystal healing as a spiritual and complementary practice. We do not claim that any stone cures or treats illness, and nothing on this site is medical advice. Please read our <a href="/disclaimer/">disclaimer</a>.</p>
<h2>Photographs</h2>
<p>Wherever possible we show real, unretouched specimens photographed by mineral collectors, museums and photographers who share their work under free licenses on Wikimedia Commons. Each photo is credited on its page and on our <a href="/image-credits/">image credits</a> page.</p>`],
  ["privacy-policy", "Privacy Policy", "How Gemmms collects, uses and protects information, including cookies, Google Tag Manager, Google Analytics and Google AdSense advertising.", `<h1>Privacy Policy</h1>
<p class="meta">Last updated: ${TODAY}</p>
<p>This Privacy Policy explains how Gemmms.com ("Gemmms", "we", "us") handles information when you visit our website.</p>
<h2>Information we collect</h2>
<p>We do not ask you to create an account and we do not sell personal information. When you visit, our hosting provider and analytics tools automatically receive standard technical information such as your IP address, browser type, device, referring page, pages viewed and the date and time of your visit.</p>
<h2>Cookies and analytics</h2>
<p>We use Google Tag Manager to load Google Analytics, which helps us understand which pages are useful and how visitors find us. Google Analytics uses cookies and similar technologies to collect usage information. You can learn more at <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener">How Google uses information from sites that use its services</a> and opt out with the <a href="https://tools.google.com/dlpage/gaoptout" rel="nofollow noopener">Google Analytics opt-out browser add-on</a>.</p>
<h2>Advertising</h2>
<p>Gemmms is supported by advertising. We use Google AdSense to display ads. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this and/or other sites on the Internet.</p>
<p>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" rel="nofollow noopener">www.aboutads.info</a>. Visitors in the European Economic Area, the United Kingdom and Switzerland are shown a consent message, managed through a Google-certified consent management platform, before personalized ads are served.</p>
<h2>Your rights</h2>
<p>Depending on where you live (for example under the GDPR or the California Consumer Privacy Act), you may have the right to access, correct or delete personal information we hold about you, or to object to certain processing. Gemmms itself does not collect or store personal information about visitors; data collected by Google Analytics and Google AdSense can be managed through the Google links above.</p>
<h2>Children</h2>
<p>Gemmms is a general-audience site and is not directed at children under 13. We do not knowingly collect personal information from children.</p>
<h2>Third-party links</h2>
<p>Our pages link to other websites, such as Wikimedia Commons. We are not responsible for the privacy practices of those sites.</p>
<h2>Changes</h2>
<p>We may update this policy from time to time. The date at the top of this page shows when it was last revised.</p>`],
  ["terms", "Terms of Use", "The terms that govern your use of the Gemmms.com crystal encyclopedia, including content, copyright and limitation of liability.", `<h1>Terms of Use</h1>
<p class="meta">Last updated: ${TODAY}</p>
<p>By using Gemmms.com you agree to these terms. If you do not agree, please do not use the site.</p>
<h2>Use of content</h2>
<p>Text on Gemmms is copyright Gemmms.com. You may quote short passages with a link back to the source page. Photographs belong to their respective authors and are used under the licenses listed on our <a href="/image-credits/">image credits</a> page; reuse must follow those licenses.</p>
<h2>No professional advice</h2>
<p>All content is provided for general educational, cultural and spiritual interest. It is not medical, psychological, legal or financial advice. See our <a href="/disclaimer/">disclaimer</a>.</p>
<h2>Accuracy</h2>
<p>We work hard to keep information accurate, but we make no warranties about its completeness or reliability. Mineral data and folklore vary between sources.</p>
<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, Gemmms is not liable for any loss or damage arising from your use of the site or reliance on its content.</p>
<h2>Changes</h2>
<p>We may revise these terms at any time by updating this page.</p>`],
  ["disclaimer", "Disclaimer", "Gemmms shares crystal lore for educational and spiritual interest only. Crystal healing is not a substitute for professional medical care.", `<h1>Disclaimer</h1>
<p class="lede">Crystals are beautiful companions for reflection, meditation and intention. They are not medicine.</p>
<p>The metaphysical and healing properties described on Gemmms come from crystal-healing traditions, folklore and the personal experience of practitioners. They have not been evaluated by the U.S. Food and Drug Administration or any other medical authority, and they are not intended to diagnose, treat, cure or prevent any disease.</p>
<p>Never use crystals in place of professional medical, psychiatric or psychological care, and never delay seeking care because of something you have read here. If you have a medical emergency, contact your local emergency services.</p>
<h2>Physical safety</h2>
<p>Some minerals are toxic, soluble in water, brittle, or contain lead, mercury, arsenic, copper or asbestos-like fibers. Never ingest crystals or crystal dust, wash your hands after handling raw specimens, keep small stones away from young children and pets, and only prepare gem elixirs by the indirect method. Each crystal page lists water and sun safety and any toxicity notes.</p>
<h2>Affiliate and advertising disclosure</h2>
<p>Gemmms is supported by advertising. Ads are served by third parties and do not imply our endorsement of any product.</p>`],
];
for (const [slug, title, description, body] of staticPages) page(`/${slug}/`, { title, description, body, crumbs: [[`/${slug}/`, title]], priority: 0.3 });

// Image credits
{
  const rows = crystals.filter((c) => images[c.slug]).map((c) => { const im = images[c.slug]; return `<tr><td><a href="${crystalUrl(c)}">${esc(c.name)}</a></td><td>${esc(im.artist)}</td><td>${im.licenseUrl ? `<a href="${esc(im.licenseUrl)}" rel="nofollow noopener">${esc(im.license)}</a>` : esc(im.license)}</td><td><a href="${esc(im.source)}" rel="nofollow noopener">${esc(im.file.replace(/^File:/, ""))}</a></td></tr>`; });
  page("/image-credits/", {
    title: "Image Credits", description: "Credits and licenses for the crystal and mineral photographs used on Gemmms, sourced from Wikimedia Commons contributors.", full: true,
    crumbs: [["/image-credits/", "Image Credits"]],
    body: `<h1>Image Credits</h1><p>Crystal photographs on Gemmms are sourced from <a href="https://commons.wikimedia.org/" rel="nofollow noopener">Wikimedia Commons</a> and used under the free licenses shown below. Images were resized and converted to WebP; no other changes were made unless noted. Our thanks to every photographer and institution who shares their work.</p>
<table class="data"><thead><tr><th>Crystal</th><th>Author</th><th>License</th><th>Source file</th></tr></thead><tbody>${rows.join("")}</tbody></table>`,
    priority: 0.2,
  });
}

// 404
write("/404.html", layout({ title: "Page Not Found", description: "The page you were looking for could not be found.", path: "/404.html", noindex: true, crumbs: [], body: `<h1>Page Not Found</h1><p class="lede">That stone seems to have rolled under the sofa. The page you asked for does not exist or has moved.</p><form class="search-row" action="/search/" method="get"><input type="search" name="q" placeholder="Search crystals..." aria-label="Search"><button class="btn" type="submit">Search</button></form><h2>Popular crystals</h2>${cards(POPULAR.map((s) => bySlug[s]).slice(0, 8))}` }));

// sitemap / robots / redirects / headers / ads.txt
fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority.toFixed(1)}</priority></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: ${SITE}/sitemap.xml\n`);
if (config.adsenseClient) fs.writeFileSync(path.join(DIST, "ads.txt"), `google.com, ${config.adsenseClient.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
// Legacy /en/... redirects are handled in src/worker.js.
fs.writeFileSync(path.join(DIST, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n\n/img/*\n  Cache-Control: public, max-age=2592000\n\n/css/*\n  Cache-Control: public, max-age=31536000, immutable\n`);

console.log(`Built ${sitemap.length} indexable pages, ${crystals.length} crystals (${crystals.filter(hasImg).length} with photos), ${guides.length} guides -> dist/`);
