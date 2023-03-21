import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/cards', async (req, res) => {
  const cards = await prisma.ankiCard.findMany();
  res.json(cards);
});

app.post('/cards/:id/upvote', async (req, res) => {
  const { id } = req.params;
  await prisma.ankiCard.update({ where: {
    id: parseInt(id, 10) }, data: { upvotes: { increment: 1 } } });
    res.sendStatus(200);
  });
  
  app.post('/cards/:id/downvote', async (req, res) => {
    const { id } = req.params;
    await prisma.ankiCard.update({ where: { id: parseInt(id, 10) }, data: { downvotes: { increment: 1 } } });
    res.sendStatus(200);
  });
  
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });