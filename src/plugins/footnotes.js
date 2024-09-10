const footnotesPlugin = require("markdown-it-footnote");

module.exports = (md) => {
  md.use(footnotesPlugin);
  const footnote_tail =
    md.core.ruler.__rules__[md.core.ruler.__find__("footnote_tail")]?.fn;

  const rendered = {};

  md.core.ruler.disable("footnote_tail");
  md.core.ruler.after("inline", "footnote_tail", (state) => {
    const env = state.env;
    if (env.hasFootnotes && !rendered[env.page.fileSlug]) {
      footnote_tail(state);
      rendered[env.page.fileSlug] = true;
    }
  });
};
