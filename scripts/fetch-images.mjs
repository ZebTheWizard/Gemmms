// Fetches a freely licensed photo for each crystal from Wikimedia Commons / Wikipedia,
// converts it to WebP, and records attribution in content/images.json.
// Usage: node scripts/fetch-images.mjs [--force] [slug ...]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const CRYSTALS = path.join(ROOT, "content", "crystals");
const OUT = path.join(ROOT, "public", "img", "crystals");
const CREDITS = path.join(ROOT, "content", "images.json");
const UA = "GemmmsImageFetcher/1.0 (https://www.gemmms.com/contact/)";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const OVERRIDES = fs.existsSync(path.join(ROOT, "content", "image-overrides.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "content", "image-overrides.json"), "utf8")) : {};
const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : {};
const used = new Set(Object.values(credits).map((c) => c.file));
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  for (let i = 0; i < 7; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.json();
    await sleep(3000 * 2 ** i);
  }
  throw new Error("API failed " + url);
}

const BAD = /\b(map|logo|diagram|chart|stamp|coat of arms|flag|svg|structure|graph|locator|mine entrance|portrait|signature|museum building|ring|earring|necklace|pendant|bracelet|jewel|brooch|tiara)\b/i;
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function imageInfo(file) {
  const d = await api("commons.wikimedia.org", {
    action: "query", titles: file, prop: "imageinfo", iiprop: "url|mime|size|extmetadata", iiurlwidth: "900",
  });
  const p = d.query?.pages?.[0];
  const ii = p?.imageinfo?.[0];
  if (!ii || !/jpeg|png|webp/.test(ii.mime) || ii.width < 300) return null;
  const m = ii.extmetadata || {};
  const license = strip(m.LicenseShortName?.value);
  if (!license || /fair use|non-free/i.test(license)) return null;
  return {
    file: p.title,
    thumb: ii.thumburl || ii.url,
    source: ii.descriptionurl,
    artist: strip(m.Artist?.value).slice(0, 120) || "Unknown",
    license,
    licenseUrl: m.LicenseUrl?.value || "",
  };
}

async function fromWiki(title) {
  if (!title) return null;
  const d = await api("en.wikipedia.org", { action: "query", titles: title, prop: "pageimages", piprop: "name", redirects: "1" });
  const name = d.query?.pages?.[0]?.pageimage;
  if (!name) return null;
  return imageInfo("File:" + name);
}

async function fromCommons(query, keyword) {
  const d = await api("commons.wikimedia.org", {
    action: "query", list: "search", srnamespace: "6", srlimit: "20", srsearch: `${query} filetype:bitmap`,
  });
  const GENERIC = new Set(["stone", "stones", "crystal", "quartz", "jasper", "agate", "calcite", "garnet", "opal", "jade", "fluorite", "tourmaline", "sapphire", "topaz", "aventurine", "obsidian", "moonstone", "amethyst", "apatite", "spinel", "kyanite", "citrine"]);
  const norm = (s) => s.toLowerCase().replace(/['’]/g, "").replace(/[_()]/g, " ");
  const words = norm(keyword).split(/[\s-]+/).filter((w) => w.length > 2 && !["the", "and"].includes(w));
  const specific = words.filter((w) => !GENERIC.has(w));
  const kw = specific.length ? specific : words;
  for (const hit of d.query?.search || []) {
    const t = hit.title;
    if (BAD.test(t) || used.has(t)) continue;
    const tl = norm(t);
    if (kw.length && !kw.every((w) => tl.includes(w))) continue;
    const info = await imageInfo(t);
    if (info) return info;
  }
  return null;
}

async function process1(c) {
  const exact = c.wiki && c.wiki.toLowerCase().replace(/\s*\(.*\)/, "") === c.name.toLowerCase().replace(/\s*\(.*\)/, "");
  const keyword = c.name.replace(/\(.*\)/, "").replace(/'s\b/g, "");
  let info = null;
  const o = OVERRIDES[c.slug];
  if (o) info = await fromCommons(o.query, o.keyword);
  if (!info && exact) info = await fromWiki(c.wiki);
  if (!info || used.has(info.file)) info = await fromCommons(c.imageQuery || c.name, keyword);
  if (!info) info = await fromCommons(c.name.replace(/\(.*\)/, ""), keyword);
  if (!info) { const w = await fromWiki(c.wiki); if (w && !used.has(w.file)) info = w; }
  if (!info) return console.log(`  ! no image for ${c.slug}`);

  let res;
  for (let i = 0; i < 6; i++) {
    res = await fetch(info.thumb, { headers: { "User-Agent": UA } });
    if (res.status !== 429 && res.status < 500) break;
    await sleep(4000 * 2 ** i);
  }
  if (!res.ok) return console.log(`  ! download failed ${c.slug} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf).rotate();
  const large = await img.clone().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(OUT, `${c.slug}.webp`), large.data);
  await img.clone().resize(320, 320, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(path.join(OUT, `${c.slug}-sm.webp`));
  used.add(info.file);
  const { thumb, ...rest } = info;
  credits[c.slug] = { ...rest, width: large.info.width, height: large.info.height };
  console.log(`  ✓ ${c.slug} <- ${info.file}`);
}

const files = fs.readdirSync(CRYSTALS).filter((f) => f.endsWith(".json"));
const todo = files
  .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(CRYSTALS, f), "utf8")); } catch { console.log(`  ! skipping unparseable ${f}`); return null; } })
  .filter(Boolean)
  .filter((c) => (only.length ? only.includes(c.slug) : true))
  .filter((c) => force || !credits[c.slug] || !fs.existsSync(path.join(OUT, `${c.slug}.webp`)));

console.log(`Fetching ${todo.length} image(s)...`);
let i = 0;
async function worker() {
  while (i < todo.length) {
    const c = todo[i++];
    try { await process1(c); } catch (e) { console.log(`  ! ${c.slug}: ${e.message}`); }
    fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2));
  }
}
await Promise.all([worker(), worker()]);
const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(CREDITS, JSON.stringify(sorted, null, 2));
console.log("Done.");
