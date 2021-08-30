import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_user,
  host: process.env.DB_host,
  database: 'jacynth',
  password: process.env.DB_password,
  port: process.env.DB_port ? parseInt(process.env.DB_port) : 5432
});

export const getUsers = (request: Request, response: Response) => {
  pool.query(
    'SELECT * FROM users ORDER BY id ASC',
    (error: Error, results: { rows: any }) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};

export const storeGameResult = (request: Request, response: Response) => {
  const { user1ID, user1Score, user2ID, user2Score, layout } = request.body;

  console.log(user1ID, user1Score, user2ID, user2Score, layout);

  pool.query(
    'SELECT add_game_record($1, $2, $3, $4, $5)',
    [user1ID, user1Score, user2ID, user2Score, layout],
    (error: Error, results) => {
      if (error) {
        throw error;
      }
      response.status(201).send(`game record added`);
    }
  );
};
