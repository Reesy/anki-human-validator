import fs from "fs";
import { ParseOne } from "unzipper";
import Database from "better-sqlite3";

interface AnkiCardData {
  front: string;
  back: string;
  media: string | null;
  scheduling: string;
}

async function parseAnkiFile(filename: string): Promise<AnkiCardData[]> {
  return new Promise((resolve, reject) => {
    const fileExtension = filename.split('.').pop();
    
    if (fileExtension !== 'apkg' && fileExtension !== 'colpkg') {
      reject(new Error('Invalid file type. Supported file types are .apkg and .colpkg'));
    }

    let db: Database.Database | undefined;
    const ankiCards: AnkiCardData[] = [];

    fs.createReadStream(filename)
      .pipe(ParseOne(/(collection\.anki2|media\/\d+$)/))
      .on("entry", (entry) => {
        const fileName = entry.path;

        if (fileName === "collection.anki21") {
          const chunks: Buffer[] = [];

          entry
            // .on("data", (chunk: Buffer) => {
            //   chunks.push(chunk);
            // })
            .on("readable", () => {
                let chunk;
                while ((chunk = entry.read()) !== null) {
                  chunks.push(chunk);
                }
              })
            .on("end", () => {
              const buffer = Buffer.concat(chunks);
              db = new Database(buffer);

              const cards = db.prepare("SELECT * FROM cards").all();
              const notes = db.prepare("SELECT * FROM notes").all();
              const noteIdToFieldsMap = new Map<number, string[]>();

            //   for (const note of notes) {
            //     noteIdToFieldsMap.set(note.id, note.fields.split("\x1f"));
            //   }

              for (const note of notes) {
                noteIdToFieldsMap.set(note.id, note.flds.split("\x1f"));
              }
              for (const card of cards) {
                const fields = noteIdToFieldsMap.get(card.nid);

                if (fields) {
                  ankiCards.push({
                    front: fields[0],
                    back: fields[1],
                    media: null,
                    scheduling: card.due.toString(),
                  });
                }
              }
            });
        } else {
          entry.autodrain();
        }
      })
      .on("finish", () => {
        if (db) {
          db.close();
        }
        resolve(ankiCards);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

(async () => {
  const ankiFileName = process.argv[2];
  try {
    const ankiCards = await parseAnkiFile(ankiFileName);
    console.log(JSON.stringify(ankiCards, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
