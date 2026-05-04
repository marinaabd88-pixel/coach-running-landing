/**
 * סורק את images/gallery/Gallery וכותב assets/data/gallery-manifest.json
 * (תמונות: jpg, jpeg, png, gif, webp, avif, svg — וידאו: mp4, webm, ogg, mov)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const galleryDir = path.join(root, "images", "gallery", "Gallery");
const outFile = path.join(root, "assets", "data", "gallery-manifest.json");

const EXT = /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|ogg|mov)$/i;

let files = [];
if (fs.existsSync(galleryDir)) {
  files = fs
    .readdirSync(galleryDir)
    .filter((f) => EXT.test(f) && !f.startsWith("."));
}

files.sort((a, b) => a.localeCompare(b, "he", { numeric: true }));

const items = files.map((f) => ({
  src: "images/gallery/Gallery/" + f.replace(/\\/g, "/"),
}));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(items, null, 2) + "\n", "utf8");

console.log(
  "gallery-manifest:",
  items.length,
  "קבצים →",
  path.relative(root, outFile)
);
