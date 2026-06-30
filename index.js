const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  jidNormalizedUser,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const general = require('./commands/general');
const stickerCmd = require('./commands/sticker');
const games = require('./commands/games');
const admin = require('./commands/admin');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }), // ubah ke 'info' kalau mau lihat log detail
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nScan QR code ini dengan WhatsApp di HP kamu:');
      console.log('(WhatsApp > Perangkat Tertaut > Tautkan Perangkat)\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output?.statusCode : undefined;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi tertutup.', shouldReconnect ? 'Mencoba reconnect...' : 'Logout, jalankan ulang untuk login lagi.');
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`✅ ${config.botName} berhasil terhubung!\n`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const senderId = isGroup ? jidNormalizedUser(msg.key.participant) : jidNormalizedUser(chatId);

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      '';

    try {
      // 1. Anti-link dicek lebih dulu untuk semua pesan teks di grup
      if (isGroup) {
        const blocked = await admin.checkAntilink(sock, msg, chatId, senderId, text);
        if (blocked) return;
      }

      // 2. Kalau bukan command, cek apakah ini jawaban dari minigame yang aktif
      if (!text.startsWith(config.prefix)) {
        await games.checkGameAnswer(sock, msg, chatId, senderId, text);
        return;
      }

      // 3. Parse command & argumennya
      const withoutPrefix = text.slice(config.prefix.length).trim();
      const [rawCommand, ...rest] = withoutPrefix.split(' ');
      const command = rawCommand.toLowerCase();
      const args = rest.join(' ');

      switch (command) {
        case 'menu':
        case 'help':
          await sock.sendMessage(chatId, { text: general.buildMenu() }, { quoted: msg });
          break;

        case 'ping': {
          const start = Date.now();
          await sock.sendMessage(chatId, { text: 'Pong! 🏓' }, { quoted: msg });
          await sock.sendMessage(chatId, { text: `Latensi: ${Date.now() - start}ms` });
          break;
        }

        case 'owner':
          await sock.sendMessage(chatId, { text: `Hubungi owner bot di: wa.me/${config.ownerNumber}` }, { quoted: msg });
          break;

        // --- Sticker ---
        case 'sticker':
        case 's':
          await stickerCmd.handleSticker(sock, msg, chatId);
          break;

        case 'toimg':
          await stickerCmd.handleToImg(sock, msg, chatId);
          break;

        case 'brat':
          await stickerCmd.handleBrat(sock, msg, chatId, args);
          break;

        // --- Minigame ---
        case 'suit':
          await games.handleSuit(sock, msg, chatId, senderId, args);
          break;

        case 'tebakangka':
          await games.handleTebakAngka(sock, msg, chatId);
          break;

        case 'math':
          await games.handleMath(sock, msg, chatId);
          break;

        case 'nyerah':
          await games.handleNyerah(sock, msg, chatId);
          break;

        case 'leaderboard':
        case 'top':
          await games.handleLeaderboard(sock, msg, chatId);
          break;

        // --- Admin grup ---
        case 'tagall':
          await admin.handleTagAll(sock, msg, chatId);
          break;

        case 'hidetag':
          await admin.handleHideTag(sock, msg, chatId, args);
          break;

        case 'kick':
          await admin.handleKick(sock, msg, chatId, senderId);
          break;

        case 'promote':
          await admin.handlePromote(sock, msg, chatId, senderId);
          break;

        case 'demote':
          await admin.handleDemote(sock, msg, chatId, senderId);
          break;

        case 'close':
          await admin.handleGroupLock(sock, msg, chatId, senderId, true);
          break;

        case 'open':
          await admin.handleGroupLock(sock, msg, chatId, senderId, false);
          break;

        case 'link':
          await admin.handleGroupLink(sock, msg, chatId, senderId);
          break;

        case 'antilink':
          await admin.handleAntilink(sock, msg, chatId, senderId, args);
          break;

        default:
          // Command tidak dikenali — sengaja dibiarkan diam agar bot tidak spam balasan error
          break;
      }
    } catch (err) {
      console.error('Error saat memproses pesan:', err);
    }
  });
}

startBot();
