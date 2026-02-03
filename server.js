import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve the Vite build output
const distPath = path.join(__dirname, "dist");
app.use(
  express.static(distPath, {
    etag: true,
    // Cache policy:
    // - Hashed static assets: cache for 1 year + immutable
    // - HTML (index.html): no-cache to avoid stale HTML pointing to mismatched chunks
    setHeaders(res, servedPath) {
      if (servedPath.endsWith("index.html") || servedPath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.(js|css|svg|ico|png|jpg|jpeg|webp|woff2?|ttf|eot|map)$/.test(servedPath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

 // SPA fallback: send index.html for all non-file GET routes using middleware (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  // Ensure SPA shell is never cached so it always references current chunk hashes
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
