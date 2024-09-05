const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const path = require("path");
const markdownit = require("markdown-it");
const anchor = require("markdown-it-anchor");
const tocPlugin = require("eleventy-plugin-toc");

module.exports = function (eleventyConfig) {
  eleventyConfig.setLibrary(
    "md",
    markdownit().use(anchor, {
      permalink: anchor.permalink.linkInsideHeader({
        space: false,
        symbol: `
            <span aria-hidden="true">#</span>
          `,
        placement: "before",
      }),
    }),
  );
  eleventyConfig.addPlugin(tocPlugin, {
    tags: ["h2", "h3", "h4"],
    wrapperClass: "toc no-print",
  });

  eleventyConfig.addPassthroughCopy("src/**/*.{min\\.css,txt,xsl}");

  eleventyConfig.setLiquidOptions({
    root: [
      path.join(__dirname, "src/includes"),
      path.join(__dirname, "src/layouts"),
    ],
  });

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addFilter("htmlDateString", (date) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed, so add 1
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  return {
    dir: {
      includes: "../includes",
      layouts: "../layouts",
    },
  };
};
