import fs from "fs";
import Database from "better-sqlite3";
import unzipper from "unzipper";

interface AnkiCardData {
  front: string;
  back: string;
  media: string | null;
  scheduling: string;
}

async function parseAnkiFile(filename: string): Promise<AnkiCardData[]> {
  const fileExtension = filename.split('.').pop();

  if (fileExtension !== 'apkg' && fileExtension !== 'colpkg') {
    throw new Error('Invalid file type. Supported file types are .apkg and .colpkg');
  }

  const ankiCards: AnkiCardData[] = [];

  const zip = fs.createReadStream(filename).pipe(unzipper.Parse({ forceStream: true }));

  for await (const entry of zip) {
    const fileName = entry.path;

    if (fileName === "collection.anki21") {
      const chunks: Buffer[] = [];

      for await (const chunk of entry) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const db = new Database(buffer);

      const cards = db.prepare("SELECT * FROM cards").all();
      const notes = db.prepare("SELECT * FROM notes").all();
      const noteIdToFieldsMap = new Map<number, string[]>();

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

      db.close();
    } else {
      entry.autodrain();
    }
  }

  return ankiCards;
}

(async () => {
  const ankiFileName = process.argv[2];
  try {
    const ankiCards = await parseAnkiFile(ankiFileName);
    fs.writeFileSync('generated_files/ankiCards.json', JSON.stringify(ankiCards, null, 2));
    console.log(JSON.stringify(ankiCards, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
