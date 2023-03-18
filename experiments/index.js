const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const sqlite3 = require('sqlite3').verbose();

function extractApkg(apkgPath, outputPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(apkgPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) throw err;
      for (i = 0; i < zipfile.entryCount; i++) {
        zipfile.readEntry();
      }
      zipfile.on('entry', (entry) => {
        const entryPath = path.join(outputPath, entry.fileName);
        if (/\/$/.test(entry.fileName)) {
          fs.mkdirSync(entryPath, { recursive: true });
          zipfile.readEntry();
        } else {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;
            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
            readStream.pipe(fs.createWriteStream(entryPath));
            readStream.on('end', () => {
              zipfile.readEntry();
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

async function grabColInformation(db)
{
  db.serialize(() => {
    db.get('SELECT decks, models FROM col', (err, row) => {
      if (err) {
        console.error(err);
        return;
      }
  

      const models = JSON.parse(row.models);
      Object.keys(models).forEach((key) => {
        const model = models[key];
        for (const flds of model.flds) {
          var stringifiedFlds = JSON.stringify(flds);
          
          //If stringifiedFlds is an array of objects parse it

          console.log(`flds: ${stringifiedFlds}`);
          // console.log(`flds: ${flds}`);
        }
        console.log("-----");
      });

    });
  });
}

async function grabCardInformationv1(db)
{
  db.serialize(() => {
    db.all('SELECT * FROM cards', (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
  
      for (const row of rows) {
        console.log(row);
        // const cardId = row.id;
        // const noteId = row.nid;
        // const deckId = row.did;
  
        // console.log(`Card ID: ${cardId}, Note ID: ${noteId}, Deck ID: ${deckId}`);
      }
  
    });
  });
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

async function grabCardInformation(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM cards', async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        for (const row of rows) {
          const noteId = row.nid;
          const note = await grabNoteInformation(db, noteId);
          console.log(`Card ID: ${row.id}, Note ID: ${noteId}, Deck ID: ${row.did}`);
          console.log(`Card Front: ${note.sfld}, Card Content: ${note.flds}`);
        }
        resolve();
      }
    });
  });
}


async function parseApkg(apkgPath) {
  const outputPath = path.join(__dirname, 'tmp');
  await extractApkg(apkgPath, outputPath);
  
  const dbPath = path.join(outputPath, 'collection.anki2');
  const db = new sqlite3.Database(dbPath);

 // grabColInformation(db);
  await grabCardInformation(db);


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
