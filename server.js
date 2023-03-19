const http = require('http');
const fs = require('fs');
const url = require('url');

const flashCards = JSON.parse(fs.readFileSync('output.json', 'utf-8'));

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/api/update_ratings') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { cardIndex, thumbsUp, thumbsDown } = JSON.parse(body);
      flashCards[cardIndex].thumbsUp = thumbsUp;
      flashCards[cardIndex].thumbsDown = thumbsDown;

      fs.writeFileSync('output.json', JSON.stringify(flashCards, null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success' }));
    });

    return;
  }

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

        function showCard(index) {
          const cards = ${JSON.stringify(flashCards)};
          const card = cards[index];

          if (!card) return;

          document.getElementById('japanese').textContent = card.japanese;
          document.getElementById('english').textContent = card.english;
          document.getElementById('thumbs-up-count').textContent = card.thumbsUp || 0;
          document.getElementById('thumbs-down-count').textContent = card.thumbsDown || 0;

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

        async function updateRatings() {
          const thumbsUp = parseInt(document.getElementById('thumbs-up-count').textContent, 10);
          const thumbsDown = parseInt(document.getElementById('thumbs-down-count').textContent, 10);

          const response = await fetch('/api/update_ratings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardIndex: currentCard, thumbsUp, thumbsDown })
          });

          if (response.ok) {
            const data = await response.json();
           
            if (data.status === 'success') {
                console.log('Ratings updated successfully');
              } else {
                console.error('Error updating ratings');
              }
            } else {
              console.error('Error updating ratings');
            }
          }
      
          function thumbsUp() {
            const countElement = document.getElementById('thumbs-up-count');
            const count = parseInt(countElement.textContent, 10) + 1;
            countElement.textContent = count;
            updateRatings();
          }
      
          function thumbsDown() {
            const countElement = document.getElementById('thumbs-down-count');
            const count = parseInt(countElement.textContent, 10) + 1;
            countElement.textContent = count;
            updateRatings();
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