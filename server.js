import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
app.use(express.static(path.join(__dirname, 'public')));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
