import express from 'express';
import {auth} from 'express-openid-connect';

export default function accountRouter(client){
    const router = express.Router();
    router.get('/login', (req, res) => res.oidc.login({ returnTo: '/main/home' }));
    router.post('/logout', (req, res) => res.oidc.logout({ returnTo: '/main/login' }));
    return router;
};


