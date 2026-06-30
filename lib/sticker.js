const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');

/**
 * Mengubah buffer gambar/video menjadi buffer stiker (.webp) lengkap dengan
 * metadata pack name & author.
 *
 * Catatan: untuk stiker dari video/gif, library ini butuh ffmpeg terinstall
 * di sistem (lihat README untuk cara install).
 */
async function bufferToSticker(buffer) {
  const sticker = new Sticker(buffer, {
    pack: config.stickerPackName,
    author: config.stickerAuthorName,
    type: StickerTypes.FULL,
    quality: 70,
  });

  return sticker.toBuffer();
}

module.exports = { bufferToSticker };
