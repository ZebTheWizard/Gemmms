// Serves the static site from ./dist and canonicalizes the host to www.gemmms.com.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "gemmms.com") {
      url.hostname = "www.gemmms.com";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
