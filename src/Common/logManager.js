export default class logManager{
    constructor(className){
        this.className = className;
    }
    async log(text) {
        const today = new Date();
        const hours = today.getHours();
        const minutes = today.getMinutes();
        const seconds = today.getSeconds();
        console.log(`[ ${this.className} ] [ ${hours}:${minutes}:${seconds} ] ${text}`)
    }
    async error(text) {
        const today = new Date();
        const hours = today.getHours();
        const minutes = today.getMinutes();
        const seconds = today.getSeconds();
        console.log(`[ ${this.className} ] [ ${hours}:${minutes}:${seconds} ] ${text}`)
    }
}