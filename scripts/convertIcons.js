const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const screenshotsDir = path.join(publicDir, 'screenshots');

const svgs = {
  src192: path.join(publicDir, 'pwa-192x192.svg'),
  src512: path.join(publicDir, 'pwa-512x512.svg'),
};

const outputs = [
  { src: svgs.src192, size: 192, out: path.join(publicDir, 'pwa-192x192.png') },
  { src: svgs.src512, size: 512, out: path.join(publicDir, 'pwa-512x512.png') },
  { src: svgs.src192, size: 192, out: path.join(publicDir, 'pwa-maskable-192x192.png') },
  { src: svgs.src512, size: 512, out: path.join(publicDir, 'pwa-maskable-512x512.png') },
  { src: svgs.src512, resize: { w: 540, h: 720 }, out: path.join(screenshotsDir, 'narrow.png') },
  { src: svgs.src512, resize: { w: 1280, h: 720 }, out: path.join(screenshotsDir, 'wide.png') },
];

(async () => {
  try {
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

    for (const item of outputs) {
      if (!fs.existsSync(item.src)) {
        console.warn('Source SVG not found:', item.src);
        continue;
      }

      const transformer = sharp(item.src).png();
      if (item.size) transformer.resize(item.size, item.size, { fit: 'cover' });
      if (item.resize) transformer.resize(item.resize.w, item.resize.h, { fit: 'cover' });

      await transformer.toFile(item.out);
      console.log('Created', item.out);
    }

    console.log('\nAll done. You can now run `npm run build` to include icons in the manifest.');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
})();
