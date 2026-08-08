import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "../public/learn/world-map-land.svg");
const raw = fs.readFileSync(srcPath, "utf8");
const body = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

const styled = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 360" role="img" aria-hidden="true">
  <defs>
    <filter id="map-paper-texture" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.88  0 0 0 0.04 0" in="noise" result="tint"/>
      <feBlend in="SourceGraphic" in2="tint" mode="multiply"/>
    </filter>
  </defs>
  <rect width="720" height="360" fill="#ebe3d9"/>
  <g fill="#d7ccc8" stroke="#bcaaa4" stroke-width="0.35" stroke-linejoin="round" filter="url(#map-paper-texture)">
${body}
  </g>
</svg>
`;

fs.writeFileSync(srcPath, styled);
console.log(`Styled world map: ${(styled.length / 1024).toFixed(1)} KB`);
