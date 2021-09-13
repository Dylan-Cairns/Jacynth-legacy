import express from 'express';
import * as Utils from '../model/utils.js';
import eoc from 'express-openid-connect';
const { requiresAuth } = eoc;

export const viewRouter = express();

viewRouter.get('/', (req, res) => {
  res.render('../dist/views/home');
});

viewRouter.get('/singleplayer', async (req, res) => {
  // if user is logged in, check if they have chosen a nickname yet.
  let hasNick = true;
  if (res.locals.isAuthenticated && req.oidc.user) {
    const result = await Utils.hasNickname(req.oidc.user.sub);
    if (result !== undefined) hasNick = result;
  }

  res.render('../dist/views/game', {
    gameType: 'singleplayer',
    userID: 'guest',
    hasNick: hasNick
  });
});

viewRouter.get('/multiplayer', async (req, res) => {
  // if user is logged in, check if they have chosen a nickname yet.
  let userID = 'guest';
  let hasNick = true;
  if (res.locals.isAuthenticated && req.oidc.user) {
    userID = req.oidc.user.sub;
    const result = await Utils.hasNickname(req.oidc.user.sub);
    if (result !== undefined) hasNick = result;
  }

  res.render('../dist/views/game', {
    gameType: 'multiplayer',
    userID: userID,
    hasNick: hasNick
  });
});

viewRouter.get('/profile', requiresAuth(), (req, res) => {
  res.render('../dist/views/profile');
});

viewRouter.get('/highscores', (req, res) => {
  res.render('../dist/views/highscores');
});
