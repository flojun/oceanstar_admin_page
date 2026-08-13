import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Pacific/Honolulu';
const now = new Date();
const hawaiiTime = toZonedTime(now, TIMEZONE);

console.log('now:', now.toISOString(), 'now local hour:', now.getHours());
console.log('hawaiiTime:', hawaiiTime.toISOString(), 'hawaii hour:', hawaiiTime.getHours());
console.log('formatted:', format(hawaiiTime, 'yyyy-MM-dd HH:mm:ss'));
