const fs = require('fs');

const text = fs.readFileSync('', 'utf-8');
const lines = text.split('\n');

const flashCards = lines.map(line => {
  const [jpText, enText] = line.split('\t');
  return { jpText, enText };
});

fs.writeFileSync('output.json', JSON.stringify(flashCards, null, 2));