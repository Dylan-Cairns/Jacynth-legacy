import express from 'express';
import ep from 'express-validator';
const { body, validationResult } = ep;
import * as Queries from '../db_model/queries.js';
import * as Utils from '../db_model/utils.js';
import eoc from 'express-openid-connect';
const { requiresAuth } = eoc;
export const rest = express();

rest.post(
  '/storeUserNick',
  requiresAuth(),
  body('nickname')
    .trim()
    .exists()
    .escape()
    .matches(/^[a-zA-Z0-9]{5,20}$/, 'i')
    .withMessage(
      'Nickname must be between 5-20 characters and contain only letters and numbers.'
    )
    .custom(Utils.isValidNickname),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    req.body['userID'] = req.oidc.user?.sub;

    Queries.storeUserNick(req, res);
  }
);

rest.post('/storeSPGameResult', (req, res) => {
  let user1ID = 'guest';
  if (res.locals.isAuthenticated && req.oidc.user) {
    user1ID = req.oidc.user.sub;
  }
  req.body['user1ID'] = user1ID;

  Queries.storeSPGameResult(req, res);
});

rest.get('/getSPGameRecords', requiresAuth(), (req, res) => {
  req.body['userID'] = req.oidc.user?.sub;

  Queries.getSPGameRecords(req, res);
});

rest.get('/getMPGameRecords', requiresAuth(), (req, res) => {
  req.body['userID'] = req.oidc.user?.sub;

  Queries.getMPGameRecords(req, res);
});

rest.get('/getSPHighScores', Queries.getSPHighScore);

rest.get('/getMPHighScores', Queries.getMPHighScore);

rest.get('/getUserNick', requiresAuth(), (req, res) => {
  req.body['userID'] = req.oidc.user?.sub;

  Queries.getUserNickname(req, res);
});
