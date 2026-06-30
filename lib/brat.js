const { createCanvas } = require('canvas');

const CANVAS_SIZE = 512;

/**
 * Memecah teks jadi beberapa baris supaya tidak melebihi lebar maksimum,
 * berdasarkan ukuran font yang sedang dipakai di context canvas.
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = `${currentLine} ${words[i]}`;
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Membuat gambar PNG bergaya "brat" (background warna polos + teks besar
 * lowercase di tengah) dan mengembalikannya sebagai Buffer.
 *
 * @param {string} text - teks yang mau ditampilkan
 * @param {string} bgColor - warna background, format hex (#rrggbb)
 */
function generateBratImage(text, bgColor = '#8ace00') {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Setup teks
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cleanText = text.toLowerCase().trim();
  const maxWidth = CANVAS_SIZE * 0.82;
  const maxHeight = CANVAS_SIZE * 0.82;

  let fontSize = 96;
  let lines = [cleanText];

  // Kecilkan font sampai semua baris muat di kanvas
  while (fontSize > 18) {
    ctx.font = `${fontSize}px "Arial Narrow", Arial, sans-serif`;
    lines = wrapText(ctx, cleanText, maxWidth);
    const totalHeight = lines.length * fontSize * 1.15;
    const widestLine = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (totalHeight <= maxHeight && widestLine <= maxWidth) break;
    fontSize -= 4;
  }

  const lineHeight = fontSize * 1.15;
  const startY = CANVAS_SIZE / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_SIZE / 2, startY + i * lineHeight);
  });

  return canvas.toBuffer('image/png');
}

module.exports = { generateBratImage };
