import ICAL from 'ical.js';
import logManager from './logManager.js';
export default class ScheduleManager {
    constructor(){
        this.logger = new logManager('ScheduleManager');
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
     }

    async loadSchedule(document) {
        const icaldata = await ICAL.parse(String(document));
        const comp = new ICAL.Component(icaldata);
        const jsonSchedule = await this.getAllClasses(comp);
        return jsonSchedule;
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

    async getAllClasses(IcalData){
        const Dates = ['MO','TU','WE','TH','FR'];
        let AllClasses = {
            "MO":[],
            "TU":[],
            "WE":[],
            "TH":[],
            "FR":[],
        }
        var allClasses = IcalData.getAllSubcomponents("vevent");
        Dates.forEach(Date => {
            allClasses.forEach(async (period) =>{
                const classDate = period.getFirstPropertyValue('rrule');
                if(classDate.parts.BYDAY[0] === Date) {
                    const subArray = {
                        "Class":await this.formatClass(period.getFirstPropertyValue('summary')),
                    }
                    AllClasses[Date].push(subArray)
                };
            });
        })
        return AllClasses;
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

