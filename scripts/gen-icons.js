const sharp = require("sharp");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

// Full mark on purple background (matches app.json primaryColor #700CEB) — main app icon.
const fullPurple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
<rect width="1080" height="1080" fill="#700CEB"/>
<path fill="#fff" d="M288.75,441.16V638.84H436.49Z"/>
<path fill="#fff" d="M462.45,444.78l-73.71,88L463.16,635l70.77-.8L456.2,531.15l72.28-86.46Z"/>
<path fill="#fff" d="M543.81,444.83l.22,194H597.1l-.19-80H639V635h49.49V444.69H638.18s-.52,72.33,0,72.33H593.3v-71.8S543.81,445.22,543.81,444.83Z"/>
<path fill="#fff" d="M703.69,444.69V635h87.56V593.15H753.18V444.69Z"/>
</svg>`;

// Mark only, transparent background — for adaptive icon foreground, splash, and notification icon.
const markWhiteTransparent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
<path fill="#fff" d="M288.75,441.16V638.84H436.49Z"/>
<path fill="#fff" d="M462.45,444.78l-73.71,88L463.16,635l70.77-.8L456.2,531.15l72.28-86.46Z"/>
<path fill="#fff" d="M543.81,444.83l.22,194H597.1l-.19-80H639V635h49.49V444.69H638.18s-.52,72.33,0,72.33H593.3v-71.8S543.81,445.22,543.81,444.83Z"/>
<path fill="#fff" d="M703.69,444.69V635h87.56V593.15H753.18V444.69Z"/>
</svg>`;

// Mark only, purple on transparent — for favicon (reads on both light/dark browser chrome).
const markPurpleTransparent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
<path fill="#700CEB" d="M288.75,441.16V638.84H436.49Z"/>
<path fill="#700CEB" d="M462.45,444.78l-73.71,88L463.16,635l70.77-.8L456.2,531.15l72.28-86.46Z"/>
<path fill="#700CEB" d="M543.81,444.83l.22,194H597.1l-.19-80H639V635h49.49V444.69H638.18s-.52,72.33,0,72.33H593.3v-71.8S543.81,445.22,543.81,444.83Z"/>
<path fill="#700CEB" d="M703.69,444.69V635h87.56V593.15H753.18V444.69Z"/>
</svg>`;

async function run() {
  await sharp(Buffer.from(fullPurple)).resize(1024, 1024).png().toFile(path.join(assetsDir, "icon.png"));
  await sharp(Buffer.from(markWhiteTransparent)).resize(1024, 1024).png().toFile(path.join(assetsDir, "adaptive-icon.png"));
  await sharp(Buffer.from(markWhiteTransparent)).resize(1024, 1024).png().toFile(path.join(assetsDir, "splash.png"));
  await sharp(Buffer.from(markPurpleTransparent)).resize(48, 48).png().toFile(path.join(assetsDir, "favicon.png"));
  await sharp(Buffer.from(markWhiteTransparent)).resize(96, 96).png().toFile(path.join(assetsDir, "notification-icon.png"));
  console.log("done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
