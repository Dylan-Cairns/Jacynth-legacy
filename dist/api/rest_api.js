import express from 'express';
import ep from 'express-validator';
const { body, validationResult } = ep;
import * as Queries from './queries.js';
import * as Utils from '../utils/utils.js';
import eoc from 'express-openid-connect';
const { requiresAuth } = eoc;
export const rest = express();
rest.post('/storeUserNick', requiresAuth(), body('nickname')
    .trim()
    .exists()
    .escape()
    .matches(/^[a-zA-Z0-9]{5,20}$/, 'i')
    .withMessage('Nickname must be between 5-20 characters and contain only letters and numbers.')
    .custom(Utils.isValidNickname), (req, res) => {
    var _a;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    req.body['userID'] = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.sub;
    Queries.storeUserNick(req, res);
});
rest.post('/storeSPGameResult', (req, res) => {
    let user1ID = 'guest';
    if (res.locals.isAuthenticated && req.oidc.user) {
        user1ID = req.oidc.user.sub;
    }
    req.body['user1ID'] = user1ID;
    Queries.storeGameResult(req, res);
});
rest.get('/getSPGameRecords', requiresAuth(), (req, res) => {
    var _a;
    req.body['userID'] = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.sub;
    Queries.getSPGameRecords(req, res);
});
rest.get('/getMPGameRecords', requiresAuth(), (req, res) => {
    var _a;
    req.body['userID'] = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.sub;
    Queries.getMPGameRecords(req, res);
});
rest.get('/getSPHighScores', Queries.getSPHighScore);
rest.get('/getMPHighScores', Queries.getMPHighScore);
