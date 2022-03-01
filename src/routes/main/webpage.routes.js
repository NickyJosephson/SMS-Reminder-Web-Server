import express from 'express';
import scheduleManager from '../../Common/scheduleParser.js'
import pkg from 'express-openid-connect';

export default function webpageRouter(mongoClient){
    const { requiresAuth } = pkg;
    const router = express.Router();
    const scheduleParser = new scheduleManager();

    router.get("/home", requiresAuth(), (request, response, next) =>{
        response.render('pages/home')

    });

    router.get("/schedule", requiresAuth(), async (request, response, next) =>{
        const userCollection = await mongoClient.returnUserSchedule(request.oidc.user.sub);
        if(userCollection == null){
            response.render('pages/schedule', {
                schedule : null
             });
        } else {
            const userSchedule = await scheduleParser.loadSchedule(userCollection.data);
            response.render('pages/schedule', {
                schedule : userSchedule
            });
        }
    });

    router.get("/account", requiresAuth(),async (request, response, next) =>{
        console.log(request.oidc.user)
        response.render('pages/account', {
            profile : request.oidc.user
        });
    });

    router.get("/login", async (request, response, next) =>{
        console.log(request.oidc.user)
        response.render('pages/login');
    });

    return router;
};


