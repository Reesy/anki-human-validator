const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const sqlite3 = require('sqlite3').verbose();

async function extractApkg(apkgPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = fs.createReadStream(apkgPath).pipe(unzipper.Extract({ path: outputPath }));
      stream.on('close', resolve);
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function grabCardInformation(db) {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM cards', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });

  const result = {};
  for (const row of rows) {

    const noteId = row.nid;
    const note = await grabNoteInformation(db, noteId);

    const cardInfo = {
      cardId: row.id,
      noteId: noteId,
      deckId: row.did,
      cardFront: note.sfld,
      cardContent: note.flds,
    };

    result[row.id] = cardInfo;
  }

  return result;
}

async function grabNoteInformation(db, noteId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM notes WHERE id = ?', [noteId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

async function parseApkg(apkgPath) {
  const outputPath = path.join(__dirname, 'tmp');
  await extractApkg(apkgPath, outputPath);

  const dbPath = path.join(outputPath, 'collection.anki2');
  const db = new sqlite3.Database(dbPath);

  const cardInformation = await grabCardInformation(db);
  console.log(cardInformation);

  // Close the database and clean up the temporary folder
  db.close();
  fs.rmSync(outputPath, { recursive: true, force: true });
}

const apkgPath = process.argv[2];
if (!apkgPath) {
  console.error('Please provide a path to the .apkg file');
  process.exit(1);
}

parseApkg(apkgPath).catch((err) => {
  console.error('Error:', err);
});