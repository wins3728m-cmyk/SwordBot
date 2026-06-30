const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'scores.json');

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveScores(scores) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(scores, null, 2));
}

/** Menambah skor untuk satu user (JID), mengembalikan total skor terbaru */
function addScore(jid, points = 1) {
  const scores = loadScores();
  scores[jid] = (scores[jid] || 0) + points;
  saveScores(scores);
  return scores[jid];
}

/** Mengambil N user dengan skor tertinggi, urutan menurun */
function getTop(n = 10) {
  const scores = loadScores();
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

module.exports = { addScore, getTop };
