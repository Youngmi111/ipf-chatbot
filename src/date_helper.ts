const Holidays = require('date-holidays');

module.exports = {
    DAY: ['일', '월', '화', '수', '목', '금', '토', '일'],

    microSecondsForOneDay: 60 * 60 * 24 * 1000,

    isHoliday(date: Date): boolean {
        return new Holidays('KR').isHoliday(date);
    },

    isWeekday(date: Date): boolean {
        const day = date.getDay();

        return day > 0 && day < 6;
    },

    isWorkingDay(now: number = Date.now()): boolean {
        const date = new Date(now);

        if (!this.isWeekday(date)) return false;

        return !this.isHoliday(date);
    },

    getHumanReadableDateFromDatetime(date: Date): string {
        return `${ date.getFullYear() }년 ${ (date.getMonth() + 1) }월 ${ date.getDate() }일 ${ this.DAY[date.getDay()] }요일`;
    },

    getRemainingDays(since: Date, until: Date): number {
        return Math.floor((until.getTime() - since.getTime()) / this.microSecondsForOneDay);
    },

    isTheDay(date: Date, targetDate: Date): boolean {
        if (targetDate.getTime() - date.getTime() > this.microSecondsForOneDay) return false;

        return date.getDate() === targetDate.getDate();
    },

    getAvailableTimeAsMilliSeconds(timeAsMilliSeconds: number, findInPast = true): number {
        while (!this.isWorkingDay(timeAsMilliSeconds)) {
            timeAsMilliSeconds += findInPast ? this.microSecondsForOneDay * -1 : this.microSecondsForOneDay;
        }

        return timeAsMilliSeconds;
    },

    findDateTimeAsMilliSecondsForTheWorkingDay(since: number, daysBefore: number): number {
        while (daysBefore > 0) {
            since -= this.microSecondsForOneDay;

            if (since === this.getAvailableTimeAsMilliSeconds(since)) daysBefore--;
        }

        return since;
    },

    getTimeAsMilliSecondsForTheFirstWorkingDayOfMonth(timeAsMilliSeconds: number = Date.now()): number {
        const now = new Date(timeAsMilliSeconds);

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return this.getAvailableTimeAsMilliSeconds(firstDayOfMonth, false);
    },

    isTheFirstWorkingDayOfMonth(date: Date = new Date()): boolean {
        const firstWorkingDay = new Date(this.getTimeAsMilliSecondsForTheFirstWorkingDayOfMonth(date.getTime()));

        return this.isTheDay(date, firstWorkingDay);
    },
};
