import { parse } from 'iso8601-duration';

const isLeapYear = (year): boolean => {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
};

const getDaysInMonth = (year, month): number => {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

export function addPeriod(start: Date, period: string, ordinal?: number): Date {
  const newDate = new Date(start);
  const duration = parse(period.startsWith('P') ? period : `P${period}`);

  const multiplier = ordinal || 1;

  if (duration.years) {
    const n = newDate.getDate();
    newDate.setDate(1);
    newDate.setFullYear(newDate.getFullYear() + duration.years * multiplier);
    const daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth());
    newDate.setDate(Math.min(n, daysInMonth));
  }

  if (duration.months) {
    const n = newDate.getDate();
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + duration.months * multiplier);
    const daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth());
    newDate.setDate(Math.min(n, daysInMonth));
  }

  if (duration.weeks) {
    newDate.setDate(newDate.getDate() + duration.weeks * 7 * multiplier);
  }

  if (duration.days) {
    newDate.setDate(newDate.getDate() + duration.days * multiplier);
  }

  return newDate;
}

export function subPeriod(start: Date, period: string): Date {
  const newDate = new Date(start);
  const duration = parse(period.startsWith('P') ? period : `P${period}`);

  if (duration.years) {
    const n = newDate.getDate();
    newDate.setDate(1);
    newDate.setFullYear(newDate.getFullYear() - duration.years);
    const daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth());
    newDate.setDate(Math.min(n, daysInMonth));
  }

  if (duration.months) {
    const n = newDate.getDate();
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() - duration.months);
    const daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth());
    newDate.setDate(Math.min(n, daysInMonth));
  }

  if (duration.weeks) {
    newDate.setDate(newDate.getDate() - duration.weeks * 7);
  }

  if (duration.days) {
    newDate.setDate(newDate.getDate() - duration.days);
  }

  return newDate;
}
