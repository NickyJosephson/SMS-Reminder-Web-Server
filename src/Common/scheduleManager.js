import ICAL from 'ical.js';
import smsManager from './smsManager.js';
import events from 'events';
import logManager from './logManager.js';
import { fork } from "child_process";
import {returnSchedules,returnIdSchedule} from './db.js'
export class ScheduleManager {
    constructor(){
        this.eventEmitter = new events.EventEmitter();
        this.logger = new logManager('ScheduleManager');
        this.smsManager = new smsManager();
        //this.dbListener = new dbListener(this.dbManager);
        this.dbChild;
    }

    async start() {
        this.logger.log('Schedule Manager Started')
        this.dbChild = fork(`./src/Common/db.js`);
        const Schedules = await returnSchedules();
        this.logger.log('Loading Schedules')
        Schedules.forEach(async (object) =>{
            this.loadSchedule(object);
        });
    }

    listen() {
        this.dbChild.on('message', async(message) => {
            console.log(message)
            switch(message.type){
                case 'newSchedule':
                    this.loadSchedule(message.document, message.documentKey); 
                    break;   
                case 'scheduleUpdated':
                    this.smsManager.emitMessage(message);
                    await this.sleep(5000)
                    this.loadSchedule(await returnIdSchedule(message.docKey));   
                    break;
                case 'scheduleDeleted':
                    this.smsManager.emitMessage(message);   
                    await this.sleep(5000)
                    this.loadSchedule(message.document, message.documentKey);
                    break;
                default:
                    break;
            }
        })
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
     }

    async loadSchedule(document) {
        const icaldata = await ICAL.parse(String(document.data));
        const comp = new ICAL.Component(icaldata);
        await this.startSMSScheduler(comp,document);
    }

    async startSMSScheduler(data, document){
        return new Promise(async (resolve, reject) => {
            const todaysClasses = {
                "user":document.user,
                "phone":document.phone,
                "docKey":document._id.toString(),
                "schedule":await this.getTodaysClasses(data)
            };
            if(todaysClasses.schedule === []) resolve();
            this.smsManager.scheduleMessage(todaysClasses);
            this.logger.log(`Schedule with doc ID ${document._id.toString()} scheduled`)
            await this.sleepUntilNextDay();
            this.startSMSScheduler(data,document);
            resolve();
        }).catch(error => {
            console.log(error);
        })
    }

    async sleepUntilNextDay(docKey){
        return new Promise(async (reject, resolve) =>{
            this.eventEmitter.on('scheduleUpdate', (documentKey) =>{
                if(documentKey == docKey) resolve()
            });
            const today = new Date();
            const currentTime = (today.getHours() * 60) + today.getMinutes();
            const timeUntilTomorrow = (1440 - currentTime) + 480;
            await this.sleep(timeUntilTomorrow * 60000);
            resolve();
        }).catch(error =>{
            console.log(error);
        });
    }
    async getTodaysClasses(IcalData){
        const todayDate = await this.getDayOfWeek();
        let todaysClasses = [];
        var allClasses = IcalData.getAllSubcomponents("vevent");
        allClasses.forEach(async (period) =>{
            const classDate = period.getFirstPropertyValue('rrule');
            if(classDate.parts.BYDAY[0] === todayDate) {
                const classTime = new Date(Date.parse(String(period.getFirstPropertyValue('exdate'))));
                const subArray = {
                    "Class":await this.formatClass(period.getFirstPropertyValue('summary')),
                    "Time":(classTime.getHours() * 60) + classTime.getMinutes()
                }
                todaysClasses.push(subArray)
            };
        });
        return todaysClasses;
    }

    async formatClass(name) {
        let returnName = name;
        if(returnName.includes('-')){
            returnName = returnName.split('-')[1]
        }
        if(returnName.includes('(')){
            returnName = returnName.split('(')[0]
        }
        return returnName.trim();
    }

    async getDayOfWeek() {
        const date = new Date();
        const day = date.getDay();
        const dateMatchArray = {
            1:'MO',
            2:'TU',
            3:'WE',
            4:'TH',
            5:'FR'
        };
        return dateMatchArray[day];
    }

}

