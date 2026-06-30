const config = require('../config');

function buildMenu() {
  const p = config.prefix;
  return `🎮 *${config.botName} - MENU*

*🖼️ Sticker*
${p}sticker / ${p}s — ubah foto/video jadi stiker (kirim atau reply media, video max ~10 detik)
${p}toimg — ubah stiker jadi gambar
${p}brat <teks> — bikin stiker teks ala Brat
${p}brat <warna_hex>|<teks> — brat dengan warna kustom, contoh: ${p}brat #ff77aa|halo dunia

*🕹️ Minigame*
${p}suit <batu/gunting/kertas> — main suit lawan bot
${p}tebakangka — mulai tebak angka 1-100 (60 detik)
${p}math — mulai kuis hitung cepat (30 detik)
${p}nyerah — menyerah dari game yang sedang berjalan
${p}leaderboard / ${p}top — lihat papan skor grup

*🛠️ Admin Grup* (khusus admin)
${p}tagall — mention semua member
${p}hidetag <teks> — kirim teks dengan mention tersembunyi ke semua member
${p}kick @user — keluarkan member (atau reply pesannya)
${p}promote @user — jadikan admin
${p}demote @user — turunkan dari admin
${p}close — kunci grup, hanya admin yang bisa chat
${p}open — buka grup untuk semua member
${p}link — lihat link invite grup
${p}antilink on/off — aktif/matikan penghapus otomatis link invite grup

*ℹ️ Umum*
${p}menu — tampilkan menu ini
${p}ping — cek kecepatan respon bot
${p}owner — kontak owner bot`;
}

module.exports = { buildMenu };
