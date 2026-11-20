// Serves the static site from ./dist, canonicalizes the host to www.gemmms.com,
// and permanently redirects URLs from the original site (/en/...).
const LEGACY = [
  [/^\/en\/gems\/([a-z0-9-]+)\/?$/, (m) => `/crystals/${m[1]}/`],
  [/^\/en\/gems\/?$/, () => "/crystals/"],
  [/^\/en\/astrology\/([a-z]+)\/?$/, (m) => `/zodiac/${m[1]}/`],
  [/^\/en\/astrology\/?$/, () => "/zodiac/"],
  [/^\/gems\/([a-z0-9-]+)\/?$/, (m) => `/crystals/${m[1]}/`],
  [/^\/en(\/.*)?$/, () => "/"],
  [/^\/index\.html$/, () => "/"],
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let moved = false;
    if (url.hostname === "gemmms.com") {
      url.hostname = "www.gemmms.com";
      moved = true;
    }
    const path = url.pathname.toLowerCase();
    for (const [re, to] of LEGACY) {
      const m = path.match(re);
      if (m) {
        url.pathname = to(m);
        moved = true;
        break;
      }
    }
    if (moved) return Response.redirect(url.toString(), 301);
    return env.ASSETS.fetch(request);
  },
};
