import scheduleRoutes from './api/schedule.routes.js';
import accountRouter from './api/account.routes.js';
import webpageRouter from './main/webpage.routes.js'

export default async function Routes(app, db) {
    app.use('/api/account', accountRouter(db));
    app.use('/api/schedule', scheduleRoutes(db));
    app.use('/main', webpageRouter(db));
};