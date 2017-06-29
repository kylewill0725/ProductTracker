import * as fs from "fs";
/**
 * Created by kylewill0725 on 6/26/2017.
 */
const LOG_LOC = './log.txt';
const ERROR_LOC = './error.txt';
var eol = require('os').EOL;

export function err(error: string) {
    error = '------'+ getDateTimeString() +'-----------------' +
        eol + error + eol +
        '----------------------------------------------' + eol;
    fs.appendFileSync(ERROR_LOC, error);
}

export function log(log: string) {
    fs.appendFileSync(LOG_LOC, getDateTimeString() + ' ' +log+eol);
}

function getDateTimeString() {
    let date = new Date();
    return date.getUTCFullYear()+'/'+date.getUTCMonth()+'/'+date.getUTCDate()+' '+date.getUTCHours()+':'+date.getUTCMinutes()+':'+date.getSeconds();
}