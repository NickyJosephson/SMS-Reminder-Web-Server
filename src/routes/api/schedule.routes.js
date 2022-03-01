import express from 'express';
export default function scheduleRoutes(mongoClient){
    const router = express.Router();

    router.post("/delete", (request, response, next) =>{
        mongoClient.deleteSchedule(request.oidc.user.sub);
        response.redirect('/main/schedule'); 
    });

    router.post("/upload", (request, response, next) =>{
        if (!request.files) {
            return response.status(400).send("No files were uploaded.");
        }
        const buffer = request.files.filename.data;
        const data = buffer.toString();
        mongoClient.addSchedule({
            "_id": request.oidc.user.sub,
            "user": request.body.userName,
            "phone": request.body.phonenumber,
            "data": data
        });
        response.redirect('/main/schedule')
    })

    router.post("/update", (request, response, next) =>{
        if (!request.files) {
            return response.status(400).send("No files were uploaded.");
        }
        const buffer = request.files.filename.data;
        const data = buffer.toString();
        mongoClient.updateSchedule(request.oidc.user.sub, data)
        response.redirect('/main/schedule')
    })

    return router;
};


