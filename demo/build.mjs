// Builds the standalone demo into demo/dist: one index.html (inline JS + CSS) plus media and fonts.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "src");
const demo = path.join(root, "demo");
const dist = path.join(demo, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const alias = {
  "next/link": path.join(demo, "shims/next-link.tsx"),
  "next/image": path.join(demo, "shims/next-image.tsx"),
  "next/navigation": path.join(demo, "shims/next-navigation.ts"),
  "next/cache": path.join(demo, "shims/next-cache.ts"),
  "@/lib/data": path.join(demo, "data.ts"),
  "@/components/event/VenueMap": path.join(demo, "shims/VenueMap.tsx"),
};

// Server components that become synchronous client components in the demo.
const syncify = (f) => /src\/app\/\(site\)\/.*(page|layout)\.tsx$/.test(f) || f.endsWith("src/components/site/Footer.tsx") || f.endsWith("src/app/not-found.tsx");

const plugin = {
  name: "sofit-demo",
  setup(b) {
    b.onResolve({ filter: /^(next\/(link|image|navigation|cache)|@\/lib\/data|@\/components\/event\/VenueMap)$/ }, (a) => ({ path: alias[a.path] }));
    b.onResolve({ filter: /^@\// }, async (a) => {
      const base = path.join(src, a.path.slice(2));
      for (const ext of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return { path: base + ext };
      return { errors: [{ text: `cannot resolve ${a.path}` }] };
    });
    b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "empty" }));
    b.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "", loader: "js" }));
    b.onLoad({ filter: /src\/.*\.tsx?$/ }, (a) => {
      let code = fs.readFileSync(a.path, "utf8");
      code = code.replace(/"\/media\//g, '"media/');
      if (syncify(a.path)) {
        code = code.replace(/\basync function\b/g, "function").replace(/await Promise\.all\(/g, "(").replace(/\bawait\s+/g, "");
      }
      if (a.path.endsWith("components/admin/client.ts")) code = code.replace(/window\.location\.href = `[^`]*`;/, 'window.__navigate("/admin/login");');
      if (a.path.endsWith("components/home/LightField.tsx")) code = code.replace('await import("three")', "await window.__loadThree()");
      if (a.path.endsWith("components/admin/Media.tsx")) code = code.replace("new XMLHttpRequest()", "new window.__DemoXHR()");
      code = code.replace(/if \(!confirm\(/g, "if (!await window.__confirm(");
      if (a.path.endsWith("components/admin/Orders.tsx")) {
        // The hosted demo cannot download files: copy the CSV to the clipboard instead.
        code = code
          .replace(/const a = document\.createElement\("a"\);[\s\S]*?a\.click\(\);/, 'navigator.clipboard.writeText(csv).then(() => toast("CSV скопирован в буфер обмена")).catch(() => toast("Не удалось скопировать CSV", "error"));')
          .replace("Выгрузить в CSV", "Скопировать CSV");
      }
      return { contents: code, loader: a.path.endsWith(".tsx") ? "tsx" : "ts" };
    });
  },
};

const res = await build({
  entryPoints: [path.join(demo, "main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2022",
  jsx: "automatic",
  write: false,
  plugins: [plugin],
  loader: { ".json": "json", ".css": "empty" },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_SITE_URL": '"https://sofit.live"',
  },
  banner: { js: "window.process=window.process||{env:{}};" },
  logLevel: "warning",
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

execSync(`npx @tailwindcss/cli -i demo/demo.css -o demo/dist/app.css --minify`, { cwd: root, stdio: "inherit" });
const css = fs.readFileSync(path.join(dist, "app.css"), "utf8");
fs.rmSync(path.join(dist, "app.css"));

const html = `<title>SOFIT</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="SOFIT — концертное агентство полного цикла: афиша, билеты, организация концертов и фестивалей.">
<meta name="theme-color" content="#000000">
<link rel="preload" href="fonts/unbounded-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/golos-text-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.writeFileSync(path.join(dist, "index.html"), html);

for (const d of ["fonts", "media"]) {
  fs.mkdirSync(path.join(dist, d));
  for (const f of fs.readdirSync(path.join(root, "public", d))) {
    if (f === "og.jpg") continue;
    fs.copyFileSync(path.join(root, "public", d, f), path.join(dist, d, f));
  }
}
for (const f of fs.readdirSync(path.join(demo, "variants"))) fs.copyFileSync(path.join(demo, "variants", f), path.join(dist, "media", f));
console.log("index.html", (html.length / 1024).toFixed(0), "KB");
