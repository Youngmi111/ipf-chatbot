const Helper = require('./helper');

const OfficeEvent = {
    getPayday(now) {
        const datetime = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        return Helper.Date.getAvailableDate(datetime);
    },

    getDeadlineForCashDisbursement(datetime = Date.now()) {
        const payday = this.getPayday(new Date(datetime));
        return Helper.Date.getWorkingDay(payday, 5);
    },

    isDeadlineForTheCashDisbursement() {
        const now = new Date();
        return now.getDate() === new Date(this.getDeadlineForCashDisbursement()).getDate();
    },

    generateMessageForCashDisbursement() {
        const deadline_date = new Date(this.getDeadlineForCashDisbursement());
        const last_month = new Date(deadline_date.getFullYear(), deadline_date.getMonth(), 0);

        const readable_deadline = `${ (deadline_date.getMonth() + 1) }/${ deadline_date.getDate() }(${ Helper.Date.DAY[deadline_date.getDay()] })`;

        return `*${ last_month.getFullYear() }년 ${ (last_month.getMonth() + 1) }월분 지출결의서 제출하실 분들은 ${ readable_deadline }까지 ymcho에게 제출해 주시기 바랍니다.*

* 제출일정 : ${ readable_deadline }  
* 그룹리더 서명 받고 제출하기
1) 기존 지출결의서 양식이 아닌 변경된 양식(링크)을 작성/출력하여
2) 본인 서명
3) 소속 그룹 리더의 확인 및 서명을 받고 제출 바랍니다.

${ process.env.CASH_DISBURSEMENT_URL }`;
    },

    generateMessageForCashDisbursementDeadline(now = new Date()) {
        const last_month = new Date(now.getFullYear(), now.getMonth(), 0);

        return `오늘은 *${ last_month.getFullYear() }년 ${ (last_month.getMonth() + 1) }월분 지출결의서 제출 마감*일입니다.`;
    },

    getEventDateTime(currentDateTime, callback) {
        let eventDateTime = callback(currentDateTime);

        if (new Date(eventDateTime).getDate() < currentDateTime.getDate()) {
            const nextMonth = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth() + 1, 1);
            eventDateTime = callback(nextMonth);
        }

        return eventDateTime;
    },

    generateMessageForPayday(now = new Date()) {
        const paydayTime = this.getEventDateTime(now, this.getPayday.bind(this));

        const payday = new Date(paydayTime + Helper.Date.microSecondsForOneDay - 1000);

        let message = '';

        if (Helper.Date.isDDay(now, payday)) {
            const party = String.fromCodePoint(0x1F973);
            message = `바로 오늘!!! 소리질뤄!!!!!!!!! ${ party }`;

        } else {
            message = `다음 월급날은 ${ Helper.Date.getHumanReadableDateFromDatetime(payday) }입니다.
월급날까지 ${ Helper.Date.getRemainingDays(now, payday) }일 남았습니다! 힘을 내세여!!!!`;
        }

        return message;
    },

    generateMessageForCashDisbursementAnswer(now = new Date()) {
        const cashDisbursementDatetime = this.getEventDateTime(now, this.getDeadlineForCashDisbursement.bind(this));

        const cashDisbursement = new Date(cashDisbursementDatetime + Helper.Date.microSecondsForOneDay - 1000);

        let message = '';

        if (Helper.Date.isDDay(now, cashDisbursement)) {
            const surprise = String.fromCodePoint(0x1F62E);
            message = `바로 오늘!!! ${ surprise } 제출을 서둘러주세요.`;

        } else {
            message = `다음 지출 결의 마감일은 ${ Helper.Date.getHumanReadableDateFromDatetime(cashDisbursement) }입니다.`;
        }

        return `${ message }
${ process.env.CASH_DISBURSEMENT_URL }`;
    },
};

module.exports = OfficeEvent;
