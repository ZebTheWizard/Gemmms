# Gemmms crystal encyclopedia: writer brief

You are writing entries for Gemmms.com, a long-running reference site about crystals, gemstones and their
traditional healing / metaphysical properties. The audience believes in crystal healing, so write warmly and
respectfully from inside that tradition, but the site runs Google AdSense, so health wording must follow the rules below.

## Output

For every line `slug|Name` in your batch file, write one JSON file:
`C:\code\Gemmms\content\crystals\<slug>.json` (UTF-8, valid JSON, 2-space indent). Use the slug exactly as given.
Write files one at a time (or a few per tool call) so a failure never loses much work. When finished, run
`node C:\code\Gemmms\content\validate.mjs <your batch file>` and fix every error it reports.

## Schema (all fields required unless marked optional)

```json
{
  "slug": "amethyst",
  "name": "Amethyst",
  "aka": ["Bishop's Stone"],                 // other names, [] if none
  "wiki": "Amethyst",                         // exact English Wikipedia article title that best shows THIS stone, or "" if none fits
  "imageQuery": "amethyst crystal cluster",   // 2-4 word Wikimedia Commons search that would find a photo of this exact stone
  "family": "Quartz",                         // one of the FAMILIES list below
  "colors": ["Purple", "Violet"],             // from COLORS
  "chakras": ["Third Eye", "Crown"],          // from CHAKRAS, 1-3
  "zodiac": ["Pisces", "Aquarius"],           // from ZODIAC, 1-4
  "elements": ["Air", "Water"],               // from ELEMENTS, 1-2
  "planet": "Jupiter",                        // traditional ruling planet, or "" if none is commonly given
  "numerology": 3,                            // integer 1-9, or 11/22/33, or null
  "birthstone": "February",                   // month name if it is a traditional/modern birthstone, else ""
  "anniversary": "6th",                       // wedding anniversary gem if any, else ""
  "mineralClass": "Silicate (tectosilicate)",
  "formula": "SiO2",                          // use plain digits; "" for rocks/organics/glass with no single formula
  "crystalSystem": "Trigonal",                // or "Amorphous", "Mixture (rock)", "Organic"
  "hardness": "7",                            // Mohs, string, ranges like "5.5-6"
  "luster": "Vitreous",
  "transparency": "Transparent to translucent",
  "locations": ["Brazil", "Uruguay", "Zambia"],   // 3-8 real, notable sources
  "rarity": "Common",                         // Common | Uncommon | Rare | Very Rare | Extremely Rare
  "natural": "Natural",                       // Natural | Natural, often treated | Man-made | Natural, often dyed
  "waterSafe": true,                          // safe to briefly rinse/soak in water? be conservative (soft, porous, soluble, metallic/sulfide, toxic -> false)
  "sunSafe": true,                            // false if it fades in sunlight (amethyst, rose quartz, kunzite, celestite, fluorite...)
  "toxicityNote": "",                         // e.g. "Contains copper; do not make elixirs or ingest dust." or ""
  "keywords": ["Calm", "Intuition", "Sobriety", "Protection", "Sleep"],   // 4-7 Title Case words
  "intentions": ["Calm & Anxiety", "Sleep & Dreams", "Intuition", "Protection"],   // 2-5 from INTENTIONS
  "emotional": ["Soothes worry", "Eases grief"],        // 4-8 short phrases
  "spiritual": ["Deepens meditation", "Opens intuition"],// 4-8 short phrases
  "physical": ["Traditionally linked to restful sleep", "Associated with easing tension headaches"], // 3-6 phrases, see HEALTH RULES
  "summary": "...",       // 140-158 characters, ends with a period, used as the meta description. Must contain the stone name.
  "intro": "...",         // 90-130 words. What it is, how it looks, why people love it. Natural, specific.
  "history": "...",       // 90-140 words. Etymology, folklore, cultural use, discovery. Real facts only; no invented dates or people.
  "meaning": "...",       // 120-170 words. Metaphysical meaning and healing properties in the crystal tradition.
  "howToUse": "...",      // 80-120 words. Practical: meditation, carrying, placement, grids, jewelry, sleep, feng shui, specific to this stone.
  "care": "...",          // 60-100 words. Cleansing and charging methods suited to its hardness / water & sun safety, storage.
  "identify": "...",      // 50-90 words. How to tell genuine from fakes/dyes/glass/look-alikes; common treatments.
  "pairsWith": ["clear-quartz", "rose-quartz", "black-tourmaline"],  // 3-5 slugs that EXIST in master-list.txt
  "faq": [                // exactly 3, each answer 30-60 words
    {"q": "What is amethyst good for?", "a": "..."},
    {"q": "Can amethyst go in water?", "a": "..."},
    {"q": "...", "a": "..."}
  ]
}
```

Fields are plain text (no markdown, no HTML, no links). Use straight ASCII apostrophes and quotes inside strings (escape `"` properly).
Write `“` style smart quotes nowhere.

## Controlled vocabularies (use these exact strings)

FAMILIES: Quartz, Chalcedony & Agate, Jasper, Feldspar, Beryl, Corundum, Garnet, Tourmaline, Topaz, Jade, Opal, Spinel,
Chrysoberyl, Spodumene, Garnet, Zeolite, Calcite & Carbonates, Fluorite, Sulfates, Phosphates, Copper Minerals, Mica,
Serpentine, Silicates (Other), Oxides, Sulfides, Native Elements, Iron Minerals, Volcanic Glass & Tektites, Organic Gems,
Rocks & Formations, Man-made

COLORS: Clear, White, Black, Grey, Brown, Red, Orange, Yellow, Gold, Green, Blue, Teal, Purple, Violet, Pink, Peach,
Silver, Multicolor, Iridescent

CHAKRAS: Earth Star, Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown, Soul Star, All Chakras

ZODIAC: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces

ELEMENTS: Earth, Water, Fire, Air, Spirit (Storm/Akasha go under Spirit)

INTENTIONS: Calm & Anxiety, Sleep & Dreams, Love & Relationships, Self-Love, Protection, Grounding, Abundance & Prosperity,
Luck, Confidence & Courage, Creativity, Focus & Study, Communication, Intuition, Spiritual Growth, Meditation,
Emotional Healing, Grief & Loss, Energy & Vitality, Motivation, Transformation, Manifestation, Cleansing & Purification,
Balance & Harmony, Joy & Happiness, Fertility & Pregnancy, Travel, Career & Success, Wisdom & Truth, Psychic Protection

## HEALTH RULES (critical: AdSense "unreliable health claims" policy)

- Never claim a stone cures, treats, heals, prevents or replaces treatment for any disease or medical condition.
- Never mention cancer, tumors, diabetes, HIV, heart disease, infections, viruses, paralysis, addiction recovery as a medical outcome, pregnancy complications, mental illness diagnoses, or any named serious illness.
- Frame bodily associations as tradition/belief: "traditionally associated with", "crystal healers link it to", "folklore says", "many people keep it nearby for".
- Keep physical associations gentle and general: restful sleep, relaxation, vitality, circulation of energy, comfort during stressful times, headaches/tension (as "associated with easing"), skin, digestion, etc.
- Toxic or fragile stones (malachite, cinnabar, stibnite, galena, chalcanthite, crocoite, vanadinite, wulfenite, realgar-like, any lead/mercury/arsenic/copper sulfate) must say so in toxicityNote and in care: no elixirs, wash hands, keep from kids/pets.
- No direct-method gem elixirs for anything not water-safe; recommend the indirect method at most.

## Style

- Sound like a seasoned crystal-shop owner who also knows mineralogy. Specific beats generic: real localities, real
  lore, the actual look of the stone. Vary sentence openings. Every entry must read as its own piece, not a template:
  do not reuse stock phrases like "In this ultimate guide", "captivating", "mesmerizing", "journey", "delve", "unlock", "realm", "tapestry".
- Be honest about man-made or treated material (goldstone, opalite, aura quartz, dyed howlite, heated citrine, mystic topaz):
  explain what it is, then the meaning practitioners give it.
- Varieties (e.g. "Star Ruby", "Pink Calcite") should focus on what is distinctive about the variety, not repeat the parent stone.
- Facts (formula, hardness, crystal system, localities) must be accurate. If unsure, use the parent mineral's values.
