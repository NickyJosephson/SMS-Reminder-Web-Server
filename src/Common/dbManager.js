import {MongoClient} from 'mongodb';
import 'dotenv/config'
import events from 'events';
import logManager from './logManager.js'
process.send = process.send || function () {};


export default class dbManager{
    constructor(){
        this.client;
        this.parsedSchedules = [];
        this.eventEmitter = new events.EventEmitter();
        this.logger = new logManager('dbManager');
    }

    async start(){
        this.client = new MongoClient(process.env.MONGO_URL);
        await this.client.connect();
        this.monitorCollection('Schedules');
    }

    async closeConnection(){
        this.client.close();
    }

    async returnSchedules(){
        return this.client.db('ScheduleAPI').collection('Schedules').find({}).toArray();
    };

    async returnUserSchedule(user){
        return await this.client.db('ScheduleAPI').collection('Schedules').findOne({
            _id: user
        });
    };

    async addSchedule(data){
        this.client.db('ScheduleAPI').collection('Schedules').insertOne(data);
    }

    async updateSchedule(id, data){
        this.client.db('ScheduleAPI').collection('Schedules').updateOne(
            { _id:id },
            { $set:{ data:data } }
        );
    }

    async deleteSchedule(id){
        this.client.db('ScheduleAPI').collection('Schedules').deleteOne(
            {_id: id}
        );
    }

    async monitorCollection(collection){
        const changeStream = this.client.db('ScheduleAPI').collection('Schedules').watch();
        changeStream.on("change", (change) =>{
            switch (change.operationType) {
                case "insert": {
                    process.send({
                        "type":"newSchedule",
                        "docKey":change.documentKey._id.toString()
                    });
                    this.logger.log(`new document with _id: ${change.documentKey._id.toString()}`);
                    break;
                }
                case "update": {
                    process.send({
                        "type":"scheduleUpdated",
                        "docKey":change.documentKey._id.toString()
                    });                    
                    this.logger.log(`updated document: ${change.documentKey._id.toString()}`);
                    break;
                }
                case "replace": {
                    this.logger.log(`replaced document: ${change.toString()}`);
                    break;
                }
                case "delete": {
                    process.send({
                        "type":"scheduleDeleted",
                        "docKey":change.documentKey._id.toString()
                    });
                    this.logger.log(`deleted document: ${change.documentKey._id.toString()}`);
                    break;
                }
            }         
        })
    }
}