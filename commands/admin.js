const { jidNormalizedUser } = require('@whiskeysockets/baileys');

// Set berisi groupId yang fitur antilink-nya sedang aktif
const antilinkGroups = new Set();
const LINK_REGEX = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/i;

function getGroupAdmins(participants) {
  return participants.filter((p) => p.admin).map((p) => p.id);
}

function getTargetJid(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
  if (ctx?.participant) return ctx.participant;
  return null;
}

/**
 * Memastikan command dijalankan di grup, oleh admin, dan bot sendiri juga
 * admin (dibutuhkan untuk kick/promote/demote/kunci grup).
 * Mengembalikan group metadata jika semua syarat terpenuhi, atau null.
 */
async function requireGroupAdmin(sock, msg, chatId, senderId) {
  if (!chatId.endsWith('@g.us')) {
    await sock.sendMessage(chatId, { text: 'Command ini cuma bisa dipakai di dalam grup.' }, { quoted: msg });
    return null;
  }

  const metadata = await sock.groupMetadata(chatId);
  const admins = getGroupAdmins(metadata.participants);

  if (!admins.includes(senderId)) {
    await sock.sendMessage(chatId, { text: 'Command ini cuma untuk admin grup.' }, { quoted: msg });
    return null;
  }

  const botId = jidNormalizedUser(sock.user.id);
  if (!admins.includes(botId)) {
    await sock.sendMessage(chatId, { text: 'Jadikan bot sebagai admin grup dulu ya biar command ini bisa jalan.' }, { quoted: msg });
    return null;
  }

  return metadata;
}

async function handleTagAll(sock, msg, chatId) {
  const metadata = await sock.groupMetadata(chatId);
  const mentions = metadata.participants.map((p) => p.id);

  let text = '📢 *Tag semua member*\n\n';
  mentions.forEach((jid) => {
    text += `@${jid.split('@')[0]}\n`;
  });

  await sock.sendMessage(chatId, { text, mentions }, { quoted: msg });
}

async function handleHideTag(sock, msg, chatId, text) {
  const metadata = await sock.groupMetadata(chatId);
  const mentions = metadata.participants.map((p) => p.id);
  await sock.sendMessage(chatId, { text: text || '\u200b', mentions }, { quoted: msg });
}

async function handleKick(sock, msg, chatId, senderId) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  const target = getTargetJid(msg);
  if (!target) {
    await sock.sendMessage(chatId, { text: 'Tag atau reply orang yang mau dikeluarkan.\nContoh: .kick @user' }, { quoted: msg });
    return;
  }

  await sock.groupParticipantsUpdate(chatId, [target], 'remove');
}

async function handlePromote(sock, msg, chatId, senderId) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  const target = getTargetJid(msg);
  if (!target) {
    await sock.sendMessage(chatId, { text: 'Tag atau reply orang yang mau dijadikan admin.' }, { quoted: msg });
    return;
  }

  await sock.groupParticipantsUpdate(chatId, [target], 'promote');
}

async function handleDemote(sock, msg, chatId, senderId) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  const target = getTargetJid(msg);
  if (!target) {
    await sock.sendMessage(chatId, { text: 'Tag atau reply admin yang mau diturunkan.' }, { quoted: msg });
    return;
  }

  await sock.groupParticipantsUpdate(chatId, [target], 'demote');
}

async function handleGroupLock(sock, msg, chatId, senderId, lock) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  await sock.groupSettingUpdate(chatId, lock ? 'announcement' : 'not_announcement');
  await sock.sendMessage(
    chatId,
    { text: lock ? '🔒 Grup dikunci, cuma admin yang bisa chat.' : '🔓 Grup dibuka, semua member bisa chat.' },
    { quoted: msg }
  );
}

async function handleGroupLink(sock, msg, chatId, senderId) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  const code = await sock.groupInviteCode(chatId);
  await sock.sendMessage(chatId, { text: `https://chat.whatsapp.com/${code}` }, { quoted: msg });
}

async function handleAntilink(sock, msg, chatId, senderId, arg) {
  const metadata = await requireGroupAdmin(sock, msg, chatId, senderId);
  if (!metadata) return;

  const setting = (arg || '').toLowerCase().trim();

  if (setting === 'on') {
    antilinkGroups.add(chatId);
    await sock.sendMessage(chatId, { text: '✅ Anti-link diaktifkan di grup ini.' }, { quoted: msg });
  } else if (setting === 'off') {
    antilinkGroups.delete(chatId);
    await sock.sendMessage(chatId, { text: '❌ Anti-link dimatikan di grup ini.' }, { quoted: msg });
  } else {
    await sock.sendMessage(chatId, { text: 'Gunakan: .antilink on atau .antilink off' }, { quoted: msg });
  }
}

/**
 * Dipanggil untuk setiap pesan teks di grup. Kalau anti-link aktif dan
 * pesan dari non-admin mengandung link invite grup, pesan dihapus.
 * Mengembalikan true kalau pesan sudah ditangani (dihapus).
 */
async function checkAntilink(sock, msg, chatId, senderId, text) {
  if (!antilinkGroups.has(chatId)) return false;
  if (!LINK_REGEX.test(text)) return false;

  const metadata = await sock.groupMetadata(chatId);
  const admins = getGroupAdmins(metadata.participants);
  if (admins.includes(senderId)) return false; // admin boleh kirim link

  try {
    await sock.sendMessage(chatId, { delete: msg.key });
    await sock.sendMessage(chatId, {
      text: `⚠️ @${senderId.split('@')[0]} dilarang kirim link invite grup di sini.`,
      mentions: [senderId],
    });
  } catch (err) {
    console.error('Gagal menghapus pesan antilink:', err);
  }

  return true;
}

module.exports = {
  handleTagAll,
  handleHideTag,
  handleKick,
  handlePromote,
  handleDemote,
  handleGroupLock,
  handleGroupLink,
  handleAntilink,
  checkAntilink,
};
