import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_user,
  host: 'localhost',
  database: 'jacynth',
  password: process.env.DB_password,
  port: 5432
});

export const getUsers = (request: Request, response: Response) => {
  console.log(process.env.DB_user, process.env.DB_password);
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
