import twilio from 'twilio';
import events from 'events';
import logManager from './logManager.js'

export default class smsManager{
    constructor(){
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.sender = process.env.TWILIO_PHONE_NUMBER;
        this.eventEmitter = new events.EventEmitter();
        this.logger = new logManager('smsManager');
        this.client = new twilio(this.accountSid, this.authToken);
    }

    emitMessage(message){
        switch(message.type){
            case 'scheduleUpdated':
                this.eventEmitter.emit('scheduleUpdated',message.docKey)
                break;
            case 'scheduleDeleted':
                this.eventEmitter.emit('scheduleDeleted',message.docKey)
                break;
            default:
                break;
        }
    }

    sendMessage = async (recipient, className) =>{
        this.client.messages.create({
            body: `You have ${className} in 5 minutes. ${await this.generateMessage()}`,
            from: `+${this.sender}`,
            to: `+${recipient}`
        })
        .then(message =>{
            this.logger.log(`Message with SID ${message.sid} sent`)
        }).catch(error =>{
            console.log(error);
        });
    };

    generateMessage = async () =>{
        const messageArray = [
            "Good Luck!",
            "Sounds fun! (no it doesn't)",
            "Make sure your not late!",
        ]
        return messageArray[Math.floor(Math.random()*messageArray.length)];
    }

    scheduleMessage = async (data) =>{
        return new Promise((resolve, reject) =>{
            this.eventEmitter.on('scheduleUpdated', (documentKey) =>{
                if(documentKey === data.docKey){
                    this.logger.log('Schedule Promise Terminated (DB Update)');
                    resolve();
                }
            });
            this.eventEmitter.on('scheduleDeleted', (documentKey) => {
                if (documentKey === data.docKey){
                    this.logger.log('Schedule Promise Terminated (Schedule Deleted)');
                    resolve();
                };
            });
            data.schedule.forEach((task) =>{
                new Promise((resolve, reject) => {
                    const today = new Date();
                    const currentTime = (today.getHours() * 60) + today.getMinutes();
                    const timeDifference = task.Time - currentTime;
                    resolve()
                    setTimeout( () => {
                        //this.sendMessage(data.phone,task.Class);
                        resolve();
                    },timeDifference * 60000);  
                });
            });
        }).catch(error =>{
            console.log(error);
        });
    };
}