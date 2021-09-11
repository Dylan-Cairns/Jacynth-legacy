import express from 'express';
export const authServ = express();
authServ.get('/sign-up/:page', (req, res) => {
    res.oidc.login({
        authorizationParams: {
            screen_hint: 'signup'
        }
    });
});
authServ.get('/login/:page', (req, res) => {
    const { page } = req.params;
    res.oidc.login({
        returnTo: page
    });
});
authServ.get('/logout/:page', (req, res) => {
    const { page } = req.params;
    res.oidc.logout({
        returnTo: page
    });
});
