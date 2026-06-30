# GameBot — Bot WhatsApp untuk Grup Game

Bot WhatsApp berbasis Node.js + [Baileys](https://github.com/WhiskeySockets/Baileys) dengan fitur sticker maker, brat sticker, minigame, dan admin command grup.

## Struktur Project

```
whatsapp-game-bot/
├── index.js              # koneksi WhatsApp + routing command
├── config.js             # pengaturan (prefix, nama bot, owner)
├── commands/
│   ├── general.js        # .menu, .ping, .owner
│   ├── sticker.js         # .sticker, .toimg, .brat
│   ├── games.js          # .suit, .tebakangka, .math, .nyerah, .leaderboard
│   └── admin.js           # .tagall, .kick, .promote, dst
├── lib/
│   ├── sticker.js          # helper konversi ke stiker
│   ├── brat.js              # helper generate gambar brat
│   └── scoreboard.js        # helper papan skor (disimpan di data/scores.json)
└── data/scores.json         # otomatis terbuat, jangan dihapus manual
```

## Instalasi

1. Install **Node.js 18+** dari nodejs.org.
2. Install **ffmpeg** di sistem kamu (dibutuhkan untuk membuat stiker dari video):
   - Windows: download dari ffmpeg.org, lalu tambahkan ke PATH.
   - macOS: `brew install ffmpeg`
   - Linux/Ubuntu: `sudo apt install ffmpeg`
3. Buka terminal di folder project ini, jalankan:
   ```
   npm install
   ```
   > Catatan: package `canvas` butuh build tools native. Kalau muncul error saat install di Windows, install dulu "windows-build-tools" atau ikuti panduan di https://github.com/Automattic/node-canvas/wiki/Installation:-Windows. Di Linux biasanya langsung jalan tanpa setup tambahan.
4. Edit `config.js` — ganti `ownerNumber` dengan nomor WhatsApp owner.
5. Jalankan bot:
   ```
   npm start
   ```
6. Scan QR code yang muncul di terminal dengan WhatsApp di HP (Perangkat Tertaut > Tautkan Perangkat).
7. Tambahkan bot ke grup game kamu, jadikan **admin grup** supaya command admin (kick, promote, dll) bisa berfungsi.

## Daftar Command

Ketik `.menu` di grup untuk melihat daftar lengkap langsung dari bot. Ringkasannya:

**Sticker**: `.sticker`/`.s`, `.toimg`, `.brat <teks>`

**Minigame**: `.suit <batu/gunting/kertas>`, `.tebakangka`, `.math`, `.nyerah`, `.leaderboard`

**Admin grup**: `.tagall`, `.hidetag <teks>`, `.kick @user`, `.promote @user`, `.demote @user`, `.close`, `.open`, `.link`, `.antilink on/off`

**Umum**: `.menu`, `.ping`, `.owner`

## Catatan Penting

Ini menggunakan metode **tidak resmi** (Baileys menyamar sebagai WhatsApp Web), bukan WhatsApp Business API resmi. Pakai nomor testing/bukan nomor utama selama eksperimen, dan jangan dipakai untuk spam massal — risikonya nomor bisa kena restricted oleh WhatsApp.

Sesi login tersimpan otomatis di folder `auth_info`, jadi tidak perlu scan ulang QR setiap kali restart bot (kecuali kamu logout manual dari HP).

## Mengembangkan Lebih Lanjut

Untuk menambah command baru: buat fungsi handler di file `commands/` yang sesuai, lalu tambahkan satu `case` baru di `switch` pada `index.js`. Struktur ini sengaja dipisah per kategori biar mudah dirawat saat fiturnya makin banyak.
