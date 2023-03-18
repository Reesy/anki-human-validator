const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const sqlite3 = require('sqlite3').verbose();

function extractApkg(apkgPath, outputPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(apkgPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) reject(err);

      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        const entryPath = path.join(outputPath, entry.fileName);

        const handleNextEntry = () => {
          zipfile.readEntry();
        };

        if (/\/$/.test(entry.fileName)) {
          fs.mkdirSync(entryPath, { recursive: true });
          handleNextEntry();
        } else {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) reject(err);
            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
            readStream.pipe(fs.createWriteStream(entryPath));
            readStream.on('end', () => {
              handleNextEntry();
            });
          });
        }
      });

      zipfile.on('end', () => {
        resolve();
      });

      zipfile.on('error', (err) => {
        reject(err);
      });
    });
  });
}


async function grabColInformation(db) {
  const { decks, models } = await db.get('SELECT decks, models FROM col');
  const parsedModels = JSON.parse(models);
  for (const model of Object.values(parsedModels)) {
    for (const flds of model.flds) {
      console.log(`flds: ${JSON.stringify(flds)}`);
    }
    console.log("-----");
  }
}

async function grabCardInformation(db) {
  const cards = await db.all('SELECT * FROM cards');
  for (const card of cards) {
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [card.nid]);
    console.log(`Card ID: ${card.id}, Note ID: ${card.nid}, Deck ID: ${card.did}`);
    console.log(`Card Front: ${note.sfld}, Card Content: ${note.flds}`);
  }
}

async function parseApkg(apkgPath) {
  const outputPath = path.join(__dirname, 'tmp');
  await extractApkg(apkgPath, outputPath);

  const dbPath = path.join(outputPath, 'collection.anki2');
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

  await grabColInformation(db);
  await grabCardInformation(db);

  // Close the database and clean up the temporary folder
  db.close();
  fs.rmSync(outputPath, { recursive: true, force: true });
}

const apkgPath = process.argv[2];
if (!apkgPath) {
  console.error('Please provide a path to the .colpkg or .apkg file');
  process.exit(1);
}

parseApkg(apkgPath).catch((err) => {
  console.error('Error:', err);
});
