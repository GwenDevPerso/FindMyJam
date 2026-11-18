const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split('-').map(Number);

  return { year: year ?? 0, monthIndex: (monthNumber ?? 1) - 1 };
}

/** `YYYY-MM` of a date, in local time. */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month);

  return toMonthKey(new Date(year, monthIndex + delta, 1));
}

export function formatMonthLabel(month: string): string {
  const { year, monthIndex } = parseMonth(month);

  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/** Name of the month of a `YYYY-MM-DD` date ("November"). */
export function getMonthName(date: string): string {
  return MONTH_NAMES[parseMonth(date).monthIndex] ?? '';
}

/** From local midnight on the 1st (inclusive) to local midnight on the 1st of the next month (exclusive), as ISO. */
export function getMonthRange(month: string): { from: string; to: string } {
  const { year, monthIndex } = parseMonth(month);

  return {
    from: new Date(year, monthIndex, 1).toISOString(),
    to: new Date(year, monthIndex + 1, 1).toISOString(),
  };
}

/** Weeks of a month, Monday first; each cell is a `YYYY-MM-DD` date, or null for a day of another month. */
export function buildMonthGrid(month: string): (string | null)[][] {
  const { year, monthIndex } = parseMonth(month);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // getDay is 0 for Sunday; Monday-first columns put Sunday last.
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const cells: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}
