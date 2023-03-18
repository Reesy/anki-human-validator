const http = require('http');
const fs = require('fs');

const flashCards = JSON.parse(fs.readFileSync('output.json', 'utf-8'));

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flashcards</title>
    </head>
    <body>
      <h1>Flashcards</h1>
      <ul>
  `;

  flashCards.forEach(card => {
    html += `
      <li>
        <span>${card.jpText}</span> - <span>${card.enText}</span>
        <button>👍</button>
        <button>👎</button>
      </li>
    `;
  });

  html += `
      </ul>
    </body>
    </html>
  `;

  res.end(html);
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});