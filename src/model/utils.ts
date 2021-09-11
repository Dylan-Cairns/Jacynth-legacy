// custom express-validator to check for duplicate existing username

import { CustomValidator } from 'express-validator';
import { findExistingNick, findNickforUser } from './queries.js';

export const isValidNickname: CustomValidator = (nickname) => {
  return findExistingNick(nickname).then((result) => {
    if (result.rowCount > 0) {
      return Promise.reject('Nickname already in use');
    }
  });
};

// method user to check if user has chosen a nickname

export const hasNickname = async (userID: string) => {
  let results;
  try {
    results = await findNickforUser(userID);
  } catch (error) {
    console.log(error);
  }
  return results && results.rowCount > 0;
};
