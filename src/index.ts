// src/index.ts

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import fs from "fs";

interface AnkiCardData {
  front: string;
  back: string;
  media: string | null;
  scheduling: string;
  votes: number;
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const rawAnkiCards : Buffer = fs.readFileSync(path.join(__dirname, '..', 'generated_files', 'ankiCards.json'))
const ankiCards: AnkiCardData[] = JSON.parse(rawAnkiCards.toString());

app.get('/cards', (_req: Request, res: Response) => {
  res.json(ankiCards);
});

app.post('/cards', (req: Request, res: Response) => {
  const newCard: AnkiCardData = req.body;
  ankiCards.push(newCard);
  res.sendStatus(201);
});

app.post('/vote/:index/:vote', (req: Request, res: Response) => {
  const index = parseInt(req.params.index);
  const vote = req.params.vote === 'up' ? 1 : -1;

  if (index >= 0 && index < ankiCards.length) {
    ankiCards[index].votes += vote;
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
