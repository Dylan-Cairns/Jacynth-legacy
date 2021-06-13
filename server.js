import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// middleware
app.use(express.static(path.join(__dirname, 'public')));

// routes

app.get('/game', (req, res) => {
  res.sendFile('/public/game.html', { root: __dirname });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
