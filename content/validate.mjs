// Validates crystal JSON files. Usage: node validate.mjs [batch-file]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const master = fs.readFileSync(path.join(here, "master-list.txt"), "utf8").trim().split(/\r?\n/).map((l) => l.split("|")[0]);
const slugs = new Set(master);
const list = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8").trim().split(/\r?\n/).map((l) => l.split("|")[0])
  : master;

const V = {
  family: ["Quartz", "Chalcedony & Agate", "Jasper", "Feldspar", "Beryl", "Corundum", "Garnet", "Tourmaline", "Topaz", "Jade", "Opal", "Spinel", "Chrysoberyl", "Spodumene", "Zeolite", "Calcite & Carbonates", "Fluorite", "Sulfates", "Phosphates", "Copper Minerals", "Mica", "Serpentine", "Silicates (Other)", "Oxides", "Sulfides", "Native Elements", "Iron Minerals", "Volcanic Glass & Tektites", "Organic Gems", "Rocks & Formations", "Man-made"],
  colors: ["Clear", "White", "Black", "Grey", "Brown", "Red", "Orange", "Yellow", "Gold", "Green", "Blue", "Teal", "Purple", "Violet", "Pink", "Peach", "Silver", "Multicolor", "Iridescent"],
  chakras: ["Earth Star", "Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown", "Soul Star", "All Chakras"],
  zodiac: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  elements: ["Earth", "Water", "Fire", "Air", "Spirit"],
  intentions: ["Calm & Anxiety", "Sleep & Dreams", "Love & Relationships", "Self-Love", "Protection", "Grounding", "Abundance & Prosperity", "Luck", "Confidence & Courage", "Creativity", "Focus & Study", "Communication", "Intuition", "Spiritual Growth", "Meditation", "Emotional Healing", "Grief & Loss", "Energy & Vitality", "Motivation", "Transformation", "Manifestation", "Cleansing & Purification", "Balance & Harmony", "Joy & Happiness", "Fertility & Pregnancy", "Travel", "Career & Success", "Wisdom & Truth", "Psychic Protection"],
  rarity: ["Common", "Uncommon", "Rare", "Very Rare", "Extremely Rare"],
};
const banned = /\b(cures?|cancers?|tumou?rs?|diabetes|HIV|virus(es)?|paralysis|Cures?|Diabetes|Tumou?rs?)\b/;  // case-sensitive: "Cancer" (zodiac) is allowed
const words = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

let errors = 0;
const err = (slug, msg) => { errors++; console.log(`${slug}: ${msg}`); };

for (const slug of list) {
  const file = path.join(here, "crystals", `${slug}.json`);
  if (!fs.existsSync(file)) { err(slug, "missing file"); continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { err(slug, "invalid JSON: " + e.message); continue; }
  if (d.slug !== slug) err(slug, "slug mismatch");
  if (!V.family.includes(d.family)) err(slug, `bad family ${d.family}`);
  for (const k of ["colors", "chakras", "zodiac", "elements", "intentions"]) {
    if (!Array.isArray(d[k]) || !d[k].length) err(slug, `${k} empty`);
    else for (const v of d[k]) if (!V[k].includes(v)) err(slug, `bad ${k} value "${v}"`);
  }
  if (!V.rarity.includes(d.rarity)) err(slug, `bad rarity ${d.rarity}`);
  for (const k of ["name", "summary", "intro", "history", "meaning", "howToUse", "care", "identify", "hardness", "crystalSystem", "mineralClass"]) if (!d[k]) err(slug, `${k} missing`);
  if (d.summary && (d.summary.length < 110 || d.summary.length > 165)) err(slug, `summary length ${d.summary.length} (want 140-158)`);
  if (words(d.intro) < 70) err(slug, `intro too short (${words(d.intro)} words)`);
  if (words(d.meaning) < 90) err(slug, `meaning too short (${words(d.meaning)} words)`);
  if (words(d.history) < 60) err(slug, `history too short (${words(d.history)} words)`);
  if (!Array.isArray(d.faq) || d.faq.length !== 3) err(slug, "faq must have 3 items");
  for (const p of d.pairsWith || []) if (!slugs.has(p)) err(slug, `pairsWith unknown slug "${p}"`);
  if (typeof d.waterSafe !== "boolean" || typeof d.sunSafe !== "boolean") err(slug, "waterSafe/sunSafe must be boolean");
  const all = JSON.stringify(d);
  const m = all.match(banned);
  if (m) err(slug, `banned health word "${m[0]}"`);
}
console.log(errors ? `\n${errors} error(s)` : `OK: ${list.length} entries valid`);
process.exit(errors ? 1 : 0);
