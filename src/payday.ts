export {};

const DateHelper = require('./date_helper');
const OfficeEvent = require('./office_event');

class Payday extends OfficeEvent {
    static get(date: Date): number {
        let timeAsMilliSecondsForTheDay = new Date(date.getFullYear(), date.getMonth(), 10).getTime();

        if (timeAsMilliSecondsForTheDay < date.getTime() && !DateHelper.isTheDay(date, new Date(timeAsMilliSecondsForTheDay))) {
            timeAsMilliSecondsForTheDay = new Date(date.getFullYear(), date.getMonth() + 1, 10).getTime();
        }

        if (DateHelper.isWorkingDay(timeAsMilliSecondsForTheDay)) return timeAsMilliSecondsForTheDay;

        return DateHelper.getAvailableTimeAsMilliSeconds(timeAsMilliSecondsForTheDay, true);
    }

    answer() {
        const paydayTime = Payday.get(this.now);

        const payday = new Date(paydayTime + DateHelper.microSecondsForOneDay - 1000);

        return DateHelper.isTheDay(this.now, payday) ? this.getMessageForCelebration() : this.geMessageForTheDay(payday);
    }

    private geMessageForTheDay(payday: Date) {
        return `다음 월급날은 ${ DateHelper.getHumanReadableDateFromDatetime(payday) }입니다.
월급날까지 ${ DateHelper.getRemainingDays(this.now, payday) }일 남았습니다! 힘을 내세여!!!!`;
    }

    private getMessageForCelebration() {
        const party = String.fromCodePoint(0x1F973);

        return `바로 오늘!!! 소리질뤄!!!!!!!!! ${party}`;
    }
}

module.exports = Payday;
