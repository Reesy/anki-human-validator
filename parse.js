const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const dataPath = process.env.DATA_PATH;

fs.readFile(dataPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading data file: ${err}`);
    return;
  }

  const lines = data.split('\n');
  const flashcards = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }

    const parts = line.split('\t');
    if (parts.length < 2) {
      console.warn(`Skipping line with insufficient columns: ${line}`);
      continue;
    }

    const [japanese, english] = parts;

    const htmlRegex = /<div class=jp>[\s\S]*?<\/div>/g;
    const soundRegex = /\[sound:(.*?)\]/g;
    const imageRegex = /\[image:(.*?)\]/g;

    const japaneseMedia = japanese.match(htmlRegex) || [];
    const englishMedia = english.match(htmlRegex) || [];

    const japaneseSound = japanese.match(soundRegex) || [];
    const englishSound = english.match(soundRegex) || [];

    const japaneseImage = japanese.match(imageRegex) || [];
    const englishImage = english.match(imageRegex) || [];

    flashcards.push({
      japanese: japanese.replace(htmlRegex, '').replace(soundRegex, '').replace(imageRegex, '').trim(),
      english: english.replace(htmlRegex, '').replace(soundRegex, '').replace(imageRegex, '').trim(),
      japaneseMedia,
      englishMedia,
      japaneseSound,
      englishSound,
      japaneseImage,
      englishImage,
    });
  }

  fs.writeFile('output.json', JSON.stringify(flashcards, null, 2), (writeErr) => {
    if (writeErr) {
      console.error(`Error writing output file: ${writeErr}`);
    } else {
      console.log('Output written to output.json');
    }
  });
});
