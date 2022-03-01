import {MongoClient, ObjectId} from 'mongodb';
import 'dotenv/config'
import events from 'events';
import logManager from './logManager.js'
process.send = process.send || function () {};

const parsedSchedules = [];
//this.eventEmitter = new events.EventEmitter();
const logger = new logManager('dbManager');
const client = new MongoClient(process.env.MONGO_URL);

await client.connect();
logger.log('Database Manager Started')

const changeStream = client.db('ScheduleAPI').collection('Schedules').watch();
changeStream.on("change", (change) =>{
    switch (change.operationType) {
        case "insert": {
            process.send({
                "type":"newSchedule",
                "docKey":change.documentKey._id.toString()
            });
            logger.log(`new document with _id: ${change.documentKey._id.toString()}`);
            break;
        }
        case "update": {
            process.send({
                "type":"scheduleUpdated",
                "docKey":change.documentKey._id.toString()
            });                    
            logger.log(`updated document: ${change.documentKey._id.toString()}`);
            break;
        }
        case "replace": {
            logger.log(`replaced document: ${change.toString()}`);
            break;
        }
        case "delete": {
            process.send({
                "type":"scheduleDeleted",
                "docKey":change.documentKey._id.toString()
            });
            logger.log(`deleted document: ${change.documentKey._id.toString()}`);
            break;
        }
    }         
})

async function closeConnection(){
    client.close();
}

export async function returnSchedules(){
    return client.db('ScheduleAPI').collection('Schedules').find({}).toArray();
};

async function returnUserSchedule(user){
    return await client.db('ScheduleAPI').collection('Schedules').findOne({
        user: user
    });
};

export async function returnIdSchedule(docKey){
    return await client.db('ScheduleAPI').collection('Schedules').findOne({
        "_id": new ObjectId(docKey)
    });
}

