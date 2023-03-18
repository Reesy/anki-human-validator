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
      <div id="flashcard-container">
        <p id="japanese"></p>
        <p id="english"></p>
        <div id="media-container"></div>
        <button onclick="thumbsUp()">👍 <span id="thumbs-up-count">0</span></button>
        <button onclick="thumbsDown()">👎 <span id="thumbs-down-count">0</span></button>
        <button onclick="previousCard()">Go Back</button>
        <button onclick="nextCard()">Next</button>
      </div>
      <script>
        let currentCard = 0;
        let thumbsUpCount = 0;
        let thumbsDownCount = 0;

        function showCard(index) {
          const cards = ${JSON.stringify(flashCards)};
          const card = cards[index];

          if (!card) return;

          document.getElementById('japanese').textContent = card.japanese;
          document.getElementById('english').textContent = card.english;

          const mediaContainer = document.getElementById('media-container');
          mediaContainer.innerHTML = '';

          // Add media elements here if necessary
        }

        function nextCard() {
          currentCard++;
          showCard(currentCard);
        }

        function previousCard() {
          if (currentCard > 0) {
            currentCard--;
            showCard(currentCard);
          }
        }

        function thumbsUp() {
          thumbsUpCount++;
          document.getElementById('thumbs-up-count').textContent = thumbsUpCount;
        }

        function thumbsDown() {
          thumbsDownCount++;
          document.getElementById('thumbs-down-count').textContent = thumbsDownCount;
        }

        document.addEventListener('DOMContentLoaded', () => {
          showCard(currentCard);
        });
      </script>
    </body>
    </html>
  `;

  res.end(html);
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
