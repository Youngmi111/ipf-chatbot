const DateHelper = require('./date_helper');
const OfficeEvent = require('./office_event');
const Payday = require('./payday');

class CashDisbursement extends OfficeEvent {
    static get(timeAsMilliSeconds: number): number {
        const nextPayday = Payday.get(new Date(timeAsMilliSeconds));

        return DateHelper.findDateTimeAsMilliSecondsForTheWorkingDay(nextPayday, 5);
    }

    static isTheDay(): boolean {
        const timeAsMilliSecondsForDeadline = CashDisbursement.get(Date.now());
        return DateHelper.isTheDay(new Date(), new Date(timeAsMilliSecondsForDeadline));
    }

    get messageForThe1stBusinessDayOfMonth(): string {
        const deadline = new Date(CashDisbursement.get(Date.now()));

        const lastMonth = new Date(deadline.getFullYear(), deadline.getMonth(), 0);

        const readableDeadline = DateHelper.getHumanReadableDateFromDatetime(deadline);

        return `*${lastMonth.getFullYear()}년 ${(lastMonth.getMonth() + 1)}월분 지출결의서 제출하실 분들은 ${ readableDeadline }까지 ymcho에게 제출해 주시기 바랍니다.*

* 제출일정 : ${readableDeadline}  
* 그룹리더 서명 받고 제출하기
1) 기존 지출결의서 양식이 아닌 변경된 양식(링크)을 작성/출력하여
2) 본인 서명
3) 소속 그룹 리더의 확인 및 서명을 받고 제출 바랍니다.

${process.env.CASH_DISBURSEMENT_URL}`;
    }

    get messageForTheDay(): string {
        const lastMonth = new Date(this.now.getFullYear(), this.now.getMonth(), 0);

        return `오늘은 *${lastMonth.getFullYear()}년 ${(lastMonth.getMonth() + 1)}월분 지출결의서 제출 마감*일입니다.`;
    }

    answer() {
        const theDay = CashDisbursement.get(this.now.getTime());

        const deadline = new Date(theDay + DateHelper.microSecondsForOneDay - 1000);

        let message = DateHelper.isTheDay(this.now, deadline) ? this.getAnswerMessageInTheDay() : this.getAnswerMessageForFuture(deadline);

        return `${message}
${ process.env.CASH_DISBURSEMENT_URL }`;
    }

    private getAnswerMessageForFuture(deadline: Date): string {
        return `다음 지출 결의 마감일은 ${ DateHelper.getHumanReadableDateFromDatetime(deadline) }입니다.`;
    }

    private getAnswerMessageInTheDay(): string {
        const surprise = String.fromCodePoint(0x1F62E);
        return `바로 오늘!!! ${surprise} 제출을 서둘러주세요.`;
    }
}

module.exports = CashDisbursement;
