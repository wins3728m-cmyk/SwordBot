const { addScore, getTop } = require('../lib/scoreboard');

// Menyimpan game yang sedang berjalan per chat: chatId -> { type, answer, attempts, timeout }
const activeGames = new Map();

const CHOICES = ['batu', 'gunting', 'kertas'];
const BEATS = { batu: 'gunting', gunting: 'kertas', kertas: 'batu' };

function clearGame(chatId) {
  const game = activeGames.get(chatId);
  if (game?.timeout) clearTimeout(game.timeout);
  activeGames.delete(chatId);
}

async function handleSuit(sock, msg, chatId, senderId, arg) {
  const choice = (arg || '').toLowerCase().trim();
  if (!CHOICES.includes(choice)) {
    await sock.sendMessage(chatId, { text: `Pilih salah satu: ${CHOICES.join('/')}\nContoh: .suit batu` }, { quoted: msg });
    return;
  }

  const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
  let resultText = `Kamu: ${choice}\nBot: ${botChoice}\n\n`;

  if (choice === botChoice) {
    resultText += 'Hasilnya seri! 🤝';
  } else if (BEATS[choice] === botChoice) {
    resultText += 'Kamu menang! 🎉';
    addScore(senderId, 1);
  } else {
    resultText += 'Kamu kalah! 😅';
  }

  await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
}

async function handleTebakAngka(sock, msg, chatId) {
  if (activeGames.has(chatId)) {
    await sock.sendMessage(chatId, { text: 'Masih ada game yang berjalan di chat ini. Ketik .nyerah dulu kalau mau mulai ulang.' }, { quoted: msg });
    return;
  }

  const answer = Math.floor(Math.random() * 100) + 1;
  const timeout = setTimeout(() => {
    if (activeGames.get(chatId)?.answer === answer) {
      sock.sendMessage(chatId, { text: `⏰ Waktu habis! Jawabannya adalah ${answer}.` });
      clearGame(chatId);
    }
  }, 60000);

  activeGames.set(chatId, { type: 'tebakangka', answer, attempts: 0, timeout });
  await sock.sendMessage(
    chatId,
    { text: 'Aku sudah pilih angka antara 1-100. Tebak ya! (60 detik)\nKetik angkanya langsung di chat, tanpa perlu prefix.' },
    { quoted: msg }
  );
}

async function handleMath(sock, msg, chatId) {
  if (activeGames.has(chatId)) {
    await sock.sendMessage(chatId, { text: 'Masih ada game yang berjalan di chat ini. Ketik .nyerah dulu kalau mau mulai ulang.' }, { quoted: msg });
    return;
  }

  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 50) + 1;
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let answer;
  if (op === '+') answer = a + b;
  else if (op === '-') answer = a - b;
  else answer = a * b;

  const timeout = setTimeout(() => {
    if (activeGames.get(chatId)?.answer === answer) {
      sock.sendMessage(chatId, { text: `⏰ Waktu habis! Jawabannya adalah ${answer}.` });
      clearGame(chatId);
    }
  }, 30000);

  activeGames.set(chatId, { type: 'math', answer, timeout });
  await sock.sendMessage(chatId, { text: `Hitung cepat! Berapa hasil dari:\n*${a} ${op} ${b}*\n(30 detik, jawab langsung tanpa prefix)` }, { quoted: msg });
}

async function handleNyerah(sock, msg, chatId) {
  const game = activeGames.get(chatId);
  if (!game) {
    await sock.sendMessage(chatId, { text: 'Tidak ada game yang sedang berjalan di chat ini.' }, { quoted: msg });
    return;
  }
  await sock.sendMessage(chatId, { text: `Oke, kamu menyerah. Jawabannya adalah ${game.answer}.` }, { quoted: msg });
  clearGame(chatId);
}

async function handleLeaderboard(sock, msg, chatId) {
  const top = getTop(10);
  if (top.length === 0) {
    await sock.sendMessage(chatId, { text: 'Belum ada skor sama sekali. Main dulu yuk!' }, { quoted: msg });
    return;
  }

  let text = '🏆 *PAPAN SKOR*\n\n';
  top.forEach(([jid, score], i) => {
    text += `${i + 1}. wa.me/${jid.split('@')[0]} — ${score} poin\n`;
  });

  await sock.sendMessage(chatId, { text }, { quoted: msg });
}

/**
 * Dipanggil untuk setiap pesan teks BIASA (bukan command) untuk mengecek
 * apakah pesan itu adalah jawaban dari game yang sedang berjalan di chat ini.
 * Mengembalikan true kalau pesan sudah "ditangani" sebagai jawaban game.
 */
async function checkGameAnswer(sock, msg, chatId, senderId, text) {
  const game = activeGames.get(chatId);
  if (!game) return false;

  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) return false;

  const guess = parseInt(trimmed, 10);

  if (guess === game.answer) {
    addScore(senderId, game.type === 'math' ? 2 : 1);
    await sock.sendMessage(chatId, { text: `🎉 Benar! Jawabannya ${game.answer}. Poin nambah!` }, { quoted: msg });
    clearGame(chatId);
    return true;
  }

  if (game.type === 'tebakangka') {
    game.attempts += 1;
    const hint = guess < game.answer ? 'Lebih besar lagi! 📈' : 'Lebih kecil lagi! 📉';
    await sock.sendMessage(chatId, { text: hint }, { quoted: msg });
    return true;
  }

  // Untuk math quiz, jawaban salah dibiarkan saja supaya chat tidak terlalu ramai
  return false;
}

module.exports = {
  handleSuit,
  handleTebakAngka,
  handleMath,
  handleNyerah,
  handleLeaderboard,
  checkGameAnswer,
};
