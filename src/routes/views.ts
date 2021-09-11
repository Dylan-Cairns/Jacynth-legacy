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
    hasNick: hasNick
  });
});

viewRouter.get('/multiplayer', async (req, res) => {
  // if user is logged in, check if they have chosen a nickname yet.
  if (req.oidc.user && req.oidc.user.sub) console.log(req.oidc.user.sub);
  let hasNick = true;
  if (res.locals.isAuthenticated && req.oidc.user) {
    const result = await Utils.hasNickname(req.oidc.user.sub);
    if (result !== undefined) hasNick = result;
  }

  res.render('../dist/views/game', {
    gameType: 'multiplayer',
    hasNick: hasNick
  });
});

viewRouter.get('/profile', requiresAuth(), (req, res) => {
  res.render('../dist/views/profile');
});

viewRouter.get('/highscores', (req, res) => {
  res.render('../dist/views/highscores');
});
