const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { bufferToSticker } = require('../lib/sticker');
const { generateBratImage } = require('../lib/brat');

/** Membangun ulang key pesan yang di-reply, dibutuhkan untuk download media-nya */
function getQuotedKey(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.stanzaId) return null;
  return {
    remoteJid: msg.key.remoteJid,
    id: ctx.stanzaId,
    participant: ctx.participant,
    fromMe: false,
  };
}

/** Mencari pesan media: dari reply (quoted) atau dari pesan itu sendiri */
function getMediaMessage(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;

  if (quoted?.imageMessage || quoted?.videoMessage || quoted?.stickerMessage) {
    return { key: getQuotedKey(msg), message: quoted };
  }
  if (msg.message?.imageMessage || msg.message?.videoMessage) {
    return msg;
  }
  return null;
}

async function handleSticker(sock, msg, chatId) {
  const target = getMediaMessage(msg);
  if (!target) {
    await sock.sendMessage(
      chatId,
      { text: 'Kirim foto/video dengan caption .sticker, atau reply foto/video lalu ketik .sticker' },
      { quoted: msg }
    );
    return;
  }

  try {
    const buffer = await downloadMediaMessage(target, 'buffer', {});
    const stickerBuffer = await bufferToSticker(buffer);
    await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
  } catch (err) {
    console.error('Gagal membuat stiker:', err);
    await sock.sendMessage(
      chatId,
      { text: 'Gagal membuat stiker. Untuk stiker dari video, pastikan ffmpeg sudah terinstall di server.' },
      { quoted: msg }
    );
  }
}

async function handleToImg(sock, msg, chatId) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;

  if (!quoted?.stickerMessage) {
    await sock.sendMessage(chatId, { text: 'Reply stiker yang mau diubah jadi gambar, lalu ketik .toimg' }, { quoted: msg });
    return;
  }

  try {
    const target = { key: getQuotedKey(msg), message: quoted };
    const buffer = await downloadMediaMessage(target, 'buffer', {});
    await sock.sendMessage(chatId, { image: buffer }, { quoted: msg });
  } catch (err) {
    console.error('Gagal mengubah stiker jadi gambar:', err);
    await sock.sendMessage(chatId, { text: 'Gagal memproses stiker ini.' }, { quoted: msg });
  }
}

async function handleBrat(sock, msg, chatId, text) {
  if (!text) {
    await sock.sendMessage(
      chatId,
      { text: 'Contoh: .brat teks lo di sini\nAtau dengan warna kustom: .brat #ff77aa|teks lo di sini' },
      { quoted: msg }
    );
    return;
  }

  let bgColor = '#8ace00';
  let content = text;

  if (text.includes('|')) {
    const [colorPart, ...rest] = text.split('|');
    const trimmedColor = colorPart.trim();
    if (/^#?[0-9a-fA-F]{3,6}$/.test(trimmedColor)) {
      bgColor = trimmedColor.startsWith('#') ? trimmedColor : `#${trimmedColor}`;
      content = rest.join('|').trim();
    }
  }

  if (!content) {
    await sock.sendMessage(chatId, { text: 'Teksnya jangan kosong ya.' }, { quoted: msg });
    return;
  }

  try {
    const imageBuffer = generateBratImage(content, bgColor);
    const stickerBuffer = await bufferToSticker(imageBuffer);
    await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
  } catch (err) {
    console.error('Gagal membuat brat sticker:', err);
    await sock.sendMessage(chatId, { text: 'Gagal membuat stiker brat.' }, { quoted: msg });
  }
}

module.exports = { handleSticker, handleToImg, handleBrat };
