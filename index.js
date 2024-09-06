import { sep, join } from "path";
import cookie from "cookie";
import { Database } from "bun:sqlite";
import { startOfWeek } from "date-fns";

const tryFiles = async (url, base, files) => {
  for (let filePath of files) {
    const newPath = join(base, filePath);
    const file = Bun.file(newPath);
    if (await file.exists()) {
      url.pathname = filePath;
      return file;
    }
  }
};

const withDb = async (callback) => {
  const db = new Database("data/db.sqlite", { create: true, strict: true });
  try {
    return await callback(db);
  } finally {
    db.close(false);
  }
};

const incrementView = async (pathname) => {
  await withDb(async (db) => {
    using updateQuery = db.prepare(`
      UPDATE views
      SET
          day0 = CASE WHEN strftime('%w', 'now') = '0' THEN day0 + 1 ELSE day0 END,
          day1 = CASE WHEN strftime('%w', 'now') = '1' THEN day1 + 1 ELSE day1 END,
          day2 = CASE WHEN strftime('%w', 'now') = '2' THEN day2 + 1 ELSE day2 END,
          day3 = CASE WHEN strftime('%w', 'now') = '3' THEN day3 + 1 ELSE day3 END,
          day4 = CASE WHEN strftime('%w', 'now') = '4' THEN day4 + 1 ELSE day4 END,
          day5 = CASE WHEN strftime('%w', 'now') = '5' THEN day5 + 1 ELSE day5 END,
          day6 = CASE WHEN strftime('%w', 'now') = '6' THEN day6 + 1 ELSE day6 END
      WHERE
          pathname = $pathname AND
          start = date('now', '-' || strftime('%w', 'now') || ' days');
    `);

    using insertQuery = db.prepare(`
      INSERT INTO views (pathname, start, day0, day1, day2, day3, day4, day5, day6)
          SELECT
              $pathname,
              date('now', '-' || strftime('%w', 'now') || ' days'),
              CASE WHEN strftime('%w', 'now') = '0' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '1' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '2' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '3' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '4' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '5' THEN 1 ELSE 0 END,
              CASE WHEN strftime('%w', 'now') = '6' THEN 1 ELSE 0 END
      WHERE
          (SELECT changes() = 0);
      `);
    db.transaction(() => {
      updateQuery.run(pathname);
      insertQuery.run(pathname);
    })();
  });
};

withDb((db) => {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pathname TEXT NOT NULL,
        start DATE NOT NULL,
        day0 INTEGER DEFAULT 0,
        day1 INTEGER DEFAULT 0,
        day2 INTEGER DEFAULT 0,
        day3 INTEGER DEFAULT 0,
        day4 INTEGER DEFAULT 0,
        day5 INTEGER DEFAULT 0,
        day6 INTEGER DEFAULT 0
    );
  `);
  incrementView("::boot::");
});

function parseBasicAuth(authHeader) {
  const base64Credentials = authHeader.split(" ")[1]; // "Basic base64credentials"
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [username, password] = credentials.split(":");
  return { username, password };
}

export default {
  port: 8080,
  async fetch(req) {
    const res = new Response();

    req.cookies = cookie.parse(req.headers.get("Cookie") || "");

    res.setCookie = (name, value, options = {}) => {
      const newCookie = cookie.serialize(name, value, options);
      res.headers.append("Set-Cookie", newCookie);
    };

    const url = new URL(req.url);

    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      const { username, password } = parseBasicAuth(authHeader);
      if (
        username === (process.env.APP_USERNAME || "admin") &&
        password === (process.env.APP_PASSWORD || "password")
      ) {
        if (url.pathname === "/_views") {
          return Response.json(
            await withDb((db) =>
              db
                .prepare(
                  `
                SELECT
                    pathname, start,
                    day0, day1, day2, day3, day4, day5, day6,
                    (day0 + day1 + day2 + day3 + day4 + day5 + day6) AS total_views
                FROM
                    views
                WHERE
                    start = date('now', '-' || strftime('%w', 'now') || ' days')
                ORDER BY
                    total_views DESC;
                `,
                )
                .all(),
            ),
          );
        }
      } else {
        incrementView("::unauthorized::");
      }
    }

    const subdomain = url.hostname.split(".").slice(0, -2).join(".") || "www";
    const subdomainDirectory = subdomain.split(".").join(sep);

    const segments = url.pathname.split("/").filter((x) => x);

    const paths = [url.pathname, "404.html"];

    const locales = ["en", "fr"];
    const localePattern = new RegExp(`\/(${locales.join("|")})\/?`);
    const language = url.pathname.match(localePattern)?.[1] || "en";

    incrementView(url.toString());

    if (locales.includes(language.toLowerCase())) {
      if (!segments?.length) {
        return Response.redirect(`/${language}`, 302);
      }

      const filePath = join(
        language,
        subdomainDirectory,
        url.pathname.replace(`${language}`, ""),
      );

      const withExt = filePath.replace(/\.html$/, "") + ".html";
      const withIndex = join(filePath.replace(/\.html$/, ""), "index.html");

      if (language !== locales[0]) {
        paths.unshift(
          filePath.replace(language, locales[0]),
          withExt.replace(language, locales[0]),
          withIndex.replace(language, locales[0]),
        );
      }

      paths.unshift(filePath, withExt, withIndex);

      res.setCookie("lang", language, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      });
    }

    let file = await tryFiles(url, "docs", paths);

    if (file) {
      return new Response(file, res);
    }

    return new Response("404");
  },
};
