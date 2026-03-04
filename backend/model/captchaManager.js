import { createCanvas } from "canvas";

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
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i += 1) {
    context.strokeStyle = `rgba(100,116,139,${Math.random() * 0.35 + 0.15})`;
    context.beginPath();
    context.moveTo(Math.random() * width, Math.random() * height);
    context.lineTo(Math.random() * width, Math.random() * height);
    context.stroke();
  }

  for (let i = 0; i < 120; i += 1) {
    context.fillStyle = `rgba(148,163,184,${Math.random() * 0.5})`;
    context.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  context.font = "bold 34px Arial";
  context.textBaseline = "middle";

  const gap = width / (text.length + 1);
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const x = gap * (i + 1);
    const y = height / 2 + (Math.random() * 10 - 5);
    const rotation = (Math.random() * 0.5 - 0.25);

    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = "#0f172a";
    context.fillText(char, -10, 0);
    context.restore();
  }

  return canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
}

export function getCaptcha(length) {
  const text = generateText(length);
  const image = drawCaptchaImage(text);

  return {
    text,
    image,
  };
}
