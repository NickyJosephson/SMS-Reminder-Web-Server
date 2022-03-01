import express from 'express';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import Routes from './routes/index.js'
import {auth} from 'express-openid-connect';
import dbMananger from './Common/dbManager.js';
dotenv.config();


export default async function Start() {
	const config = {
		authRequired: false,
		auth0Logout: true,
		// idpLogout: true,
		secret: process.env.AUTH0_SECRET,
		clientSecret: process.env.CLIENT_SECRET,
		baseURL: 'http://localhost:3030',
		clientID: process.env.AUTH0_CLIENTID,
		issuerBaseURL: process.env.AUTH0_BASEURL,
		routes: {
			login: false,	
			postLogoutRedirect: '/main/login',
		},
		authorizationParams: {
			response_type: 'code id_token',
			scope: 'openid profile',
			prompt: 'consent'
		  },
    };
	const app = express();
	const db = new dbMananger();
	await db.start();
	app.set('view engine', 'ejs');
	app.set('views', './src/views');
	app.use(auth(config))
	app.use(fileUpload());
	app.use(bodyParser.urlencoded({extended: false}));
	Routes(app,db);

	app.listen(process.env.SERVER_PORT, () => {
		console.log(`Server Started at http://localhost:${process.env.SERVER_PORT}`)
	});
}


