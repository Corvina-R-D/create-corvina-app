import { addPeriod, calculatePercentage, subPeriod } from './calculatePeriod';

const dayInMillis = 1000 * 60 * 60 * 24;

describe('calculatePeriod', () => {
  it('Check the accepted periods', () => {
    const date = new Date('2025-01-01T01:01:01.111Z');
    const period1 = 'P1Y10D';
    const newPeriod1 = addPeriod(date, period1);
    const diff1 = Math.abs(newPeriod1.getTime() - date.getTime());
    expect(diff1).toBe(dayInMillis * (365 + 10));

    const period2 = '1W';
    const newPeriod2 = addPeriod(date, period2);
    const diff2 = Math.abs(newPeriod2.getTime() - date.getTime());
    expect(diff2).toBe(dayInMillis * 7);

    const otherDate = new Date('2027-07-07T07:07:07.777+07:00');
    const period3 = '24M';
    const newPeriod3 = addPeriod(otherDate, period3);
    const diff3 = Math.abs(newPeriod3.getTime() - otherDate.getTime());
    expect(diff3).toBe(dayInMillis * (365 + 366)); // 2028 is a leap year

    const period4 = '1W';
    const newPeriod4 = addPeriod(otherDate, period4);
    const diff4 = Math.abs(newPeriod4.getTime() - otherDate.getTime());
    expect(diff4).toBe(dayInMillis * 7);
  });

  it('Calculate add periods on specific date', () => {
    const date = new Date('2027-01-31T01:01:01.111Z');
    const period = 'P1Y1M';
    const newPeriod = addPeriod(date, period);
    expect(newPeriod).toStrictEqual(new Date('2028-02-29T01:01:01.111Z'));

    const date1 = new Date('2025-01-31T01:01:01.111Z');
    const period1 = 'P1M';
    const newPeriod1 = addPeriod(date1, period1);
    expect(newPeriod1).toStrictEqual(new Date('2025-02-28T01:01:01.111Z'));

    const date2 = new Date('2027-10-31T01:01:01.111Z');
    const period2 = 'P4M';
    const newPeriod2 = addPeriod(date2, period2);
    expect(newPeriod2).toStrictEqual(new Date('2028-02-29T01:01:01.111Z'));

    const date3 = new Date('2027-10-31T01:01:01.111Z');
    const period3 = 'P4M10D';
    const newPeriod3 = addPeriod(date3, period3);
    expect(newPeriod3).toStrictEqual(new Date('2028-03-10T01:01:01.111Z'));

    const date4 = new Date('2028-02-29T01:01:01.111Z');
    const period4 = 'P1Y';
    const newPeriod4 = addPeriod(date4, period4);
    expect(newPeriod4).toStrictEqual(new Date('2029-02-28T01:01:01.111Z'));

    const date5 = new Date('2028-02-19T01:01:01.111Z');
    const period5 = 'P1Y10D';
    const newPeriod5 = addPeriod(date5, period5);
    expect(newPeriod5).toStrictEqual(new Date('2029-03-01T01:01:01.111Z'));

    const date6 = new Date('2028-02-16T01:01:01.111Z');
    const period6 = 'P2W';
    const newPeriod6 = addPeriod(date6, period6);
    expect(newPeriod6).toStrictEqual(new Date('2028-03-01T01:01:01.111Z'));

    const date7 = new Date('2029-02-15T01:01:01.111Z');
    const period7 = 'P2W';
    const newPeriod7 = addPeriod(date7, period7);
    expect(newPeriod7).toStrictEqual(new Date('2029-03-01T01:01:01.111Z'));
  });

  it('Calculate sub periods on specific date', () => {
    const date = new Date('2027-01-31T01:01:01.111Z');
    const period = 'P1Y1M';
    const newPeriod = subPeriod(date, period);
    expect(newPeriod).toStrictEqual(new Date('2025-12-31T01:01:01.111Z'));

    const date1 = new Date('2025-01-31T01:01:01.111Z');
    const period1 = 'P1M';
    const newPeriod1 = subPeriod(date1, period1);
    expect(newPeriod1).toStrictEqual(new Date('2024-12-31T01:01:01.111Z'));

    const date2 = new Date('2027-10-31T00:01:01.111Z');
    const period2 = 'P4M';
    const newPeriod2 = subPeriod(date2, period2);
    expect(newPeriod2).toStrictEqual(new Date('2027-06-30T00:01:01.111Z'));

    const date3 = new Date('2027-10-31T00:01:01.111Z');
    const period3 = 'P4M10D';
    const newPeriod3 = subPeriod(date3, period3);
    expect(newPeriod3).toStrictEqual(new Date('2027-06-20T00:01:01.111Z'));

    const date4 = new Date('2028-02-29T01:01:01.111Z');
    const period4 = 'P1Y';
    const newPeriod4 = subPeriod(date4, period4);
    expect(newPeriod4).toStrictEqual(new Date('2027-02-28T01:01:01.111Z'));

    const date5 = new Date('2028-02-19T01:01:01.111Z');
    const period5 = 'P1Y10D';
    const newPeriod5 = subPeriod(date5, period5);
    expect(newPeriod5).toStrictEqual(new Date('2027-02-09T01:01:01.111Z'));

    const date6 = new Date('2028-03-03T01:01:01.111Z');
    const period6 = 'P2W';
    const newPeriod6 = subPeriod(date6, period6);
    expect(newPeriod6).toStrictEqual(new Date('2028-02-18T01:01:01.111Z'));

    const date7 = new Date('2029-03-05T01:01:01.111Z');
    const period7 = 'P2W';
    const newPeriod7 = subPeriod(date7, period7);
    expect(newPeriod7).toStrictEqual(new Date('2029-02-19T01:01:01.111Z'));
  });

  it('Calculate Percentage', () => {
    const endDate = addPeriod(new Date(), '6W');
    const period = '8W';
    const percentage = calculatePercentage(endDate, period);
    expect(percentage).toBe(0.75);

    const endDate2 = addPeriod(new Date(), '60D');
    const period2 = '12W';
    const percentage2 = calculatePercentage(endDate2, period2);
    expect(percentage2).toBe(0.72);

    const endDate3 = addPeriod(new Date('2024-01-01T00:00:00Z'), '1Y');
    const period3 = '1Y';
    const percentage3 = calculatePercentage(endDate3, period3, new Date('2024-01-01T00:00:00Z'));
    expect(percentage3).toBe(1);
  });
});
