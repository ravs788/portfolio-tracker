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
    maxAge: "1d",
    etag: true,
  })
);

 // SPA fallback: send index.html for all non-file routes (Express 5 requires '/*' not '*')
app.get("/*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
