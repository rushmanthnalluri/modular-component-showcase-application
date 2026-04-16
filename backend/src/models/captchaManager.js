const CAPTCHA_CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateText(length) {
  const safeLength = Number.isFinite(Number(length)) ? Number(length) : 6;
  const finalLength = Math.min(Math.max(Math.trunc(safeLength), 4), 8);

  let captchaText = "";
  for (let index = 0; index < finalLength; index += 1) {
    captchaText += CAPTCHA_CHARSET.charAt(Math.floor(Math.random() * CAPTCHA_CHARSET.length));
  }

  return captchaText;
}

function drawCaptchaImage(text) {
  const width = 180;
  const height = 60;

  const noiseLines = Array.from({ length: 8 }, () => {
    const x1 = Math.round(Math.random() * width);
    const y1 = Math.round(Math.random() * height);
    const x2 = Math.round(Math.random() * width);
    const y2 = Math.round(Math.random() * height);
    const opacity = (Math.random() * 0.35 + 0.15).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(100,116,139,${opacity})" stroke-width="1" />`;
  }).join("");

  const noiseDots = Array.from({ length: 100 }, () => {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * height);
    const opacity = (Math.random() * 0.45 + 0.1).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="1" fill="rgba(148,163,184,${opacity})" />`;
  }).join("");

  const gap = width / (text.length + 1);
  const letters = text
    .split("")
    .map((char, index) => {
      const x = Math.round(gap * (index + 1));
      const y = Math.round(height / 2 + (Math.random() * 10 - 5));
      const rotate = (Math.random() * 26 - 13).toFixed(2);
      return `<text x="${x}" y="${y}" font-size="34" font-weight="700" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate}, ${x}, ${y})">${char}</text>`;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc" />
  ${noiseLines}
  ${noiseDots}
  ${letters}
</svg>`;

  return Buffer.from(svg, "utf8").toString("base64");
}

export function getCaptcha(length) {
  const text = generateText(length);
  const image = drawCaptchaImage(text);

  return {
    text,
    image,
  };
}
