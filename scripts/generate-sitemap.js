import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_FRONTEND_URL || "https://cal.saabq.com";
const API_URL = process.env.VITE_API_BASE_URL || "https://admin.cal.saabq.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/workspaces", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/features", priority: "0.8", changefreq: "monthly" },
  { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

async function fetchJson(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function generateSitemap() {
  console.log("🗺️  Generating Sitemap for", BASE_URL, "...");

  const today = new Date().toISOString().split("T")[0];
  const urls = [];

  // 1. Add static public routes
  for (const route of STATIC_ROUTES) {
    urls.push({
      loc: `${BASE_URL}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  // 2. Try fetching dynamic blog posts
  try {
    const postsRes = await fetchJson(`${API_URL}/api/v1/posts?per_page=100`);
    const posts = postsRes?.data;
    if (Array.isArray(posts)) {
      for (const post of posts) {
        if (post?.slug) {
          const postDate = post.updated_at || post.published_at || today;
          urls.push({
            loc: `${BASE_URL}/blog/${post.slug}`,
            lastmod: postDate.split("T")[0],
            changefreq: "weekly",
            priority: "0.7",
          });
        }
      }
      console.log(`✅ Added ${posts.length} dynamic blog post URLs`);
    }
  } catch {
    console.warn("⚠️  Could not fetch dynamic blog posts; skipping.");
  }

  // 3. Try fetching dynamic public workspaces
  try {
    const wsRes = await fetchJson(`${API_URL}/api/v1/workspaces?per_page=100`);
    const workspaces = wsRes?.data;
    if (Array.isArray(workspaces)) {
      for (const ws of workspaces) {
        if (ws?.slug) {
          const wsDate = ws.updated_at || today;
          urls.push({
            loc: `${BASE_URL}/${ws.slug}`,
            lastmod: wsDate.split("T")[0],
            changefreq: "daily",
            priority: "0.8",
          });
        }
      }
      console.log(`✅ Added ${workspaces.length} dynamic workspace URLs`);
    }
  } catch {
    console.warn("⚠️  Could not fetch dynamic workspaces; skipping.");
  }

  // 4. Construct XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  // Write to public/sitemap.xml
  const publicDir = path.resolve(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const sitemapPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml.trim(), "utf-8");
  console.log(`🎉 Sitemap successfully generated at: ${sitemapPath} (${urls.length} total URLs)`);

  // If dist exists, also copy to dist/sitemap.xml
  const distDir = path.resolve(__dirname, "../dist");
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, "sitemap.xml"), xml.trim(), "utf-8");
  }
}

generateSitemap();
