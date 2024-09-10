const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const path = require("path");
const markdownit = require("markdown-it");
const anchor = require("markdown-it-anchor");
const tocPlugin = require("eleventy-plugin-toc");
const { shuffle } = require("lodash");
const footnotes = require("./src/plugins/footnotes");

module.exports = function (eleventyConfig) {
  // const footnotes = new Function("return " + footnotesPlugin.toString())();

  // console.log(
  //   footnotes().toString(),
  //   "====================",
  //   footnotesPlugin.toString(),
  // );

  const md = markdownit({ html: true, breaks: false, linkify: true })
    .use(anchor, {
      permalink: anchor.permalink.linkInsideHeader({
        space: false,
        symbol: `
          <span aria-hidden="true">#</span>
        `,
        placement: "before",
      }),
    })
    .use(footnotes);

  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPlugin(tocPlugin, {
    tags: ["h2", "h3", "h4"],
    wrapperClass: "toc no-print",
  });

  eleventyConfig.addPassthroughCopy(
    "src/**/*.{min\\.css,txt,xsl,svg,webmanifest,png,ico}",
  );

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

  eleventyConfig.addFilter("toUrl", (obj) => {
    const [_, locale, subdomain, ...rest] = obj.url.split("/");
    const url = `https://${subdomain || "www"}.${process.env.APP_DOMAIN}/${locale}/${rest.join("/")}`;
    return url.replaceAll(/\/$/g, "");
  });

  eleventyConfig.addFilter("toThumb", (obj) => {
    const [_, locale, subdomain, ...rest] = obj.url.split("/");
    const url = `https://${subdomain || "www"}.${process.env.APP_DOMAIN}/img/illustrations/${obj.fileSlug}/thumb@256x256.webp`;
    return url.replaceAll(/\/$/g, "");
  });

  eleventyConfig.addFilter("shuffle", (arr) => {
    if (arr) {
      return shuffle(arr);
    }
  });

  eleventyConfig.addFilter("alphabetic", (arr) => {
    if (arr) {
      return arr.sort((a, b) => {
        return a.data.title.localeCompare(b.data.title);
      });
    }
  });

  return {
    dir: {
      includes: "../includes",
      layouts: "../layouts",
    },
  };
};
