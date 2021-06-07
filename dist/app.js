import express from 'express';
import { Controller } from './controller/controller';
const controller = new Controller('vsAI', 'razeway');
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
