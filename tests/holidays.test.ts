import { holidayService } from '../src/modules/order/services/holiday.service';
import { utc } from './helpers';

const { getDiscount: getHolidayDiscount } = holidayService;

describe('getHolidayDiscount', () => {
  it('returns 15% for eligible categories on holiday', () => {
    expect(getHolidayDiscount(utc(2026, 1, 1), 'electronics')).toBe(0.15);
    expect(getHolidayDiscount(utc(2026, 1, 1), 'clothing')).toBe(0.15);
  });

  it('returns 25% on Black Friday for all categories', () => {
    expect(getHolidayDiscount(utc(2026, 11, 27), 'electronics')).toBe(0.25);
    expect(getHolidayDiscount(utc(2026, 11, 27), 'food')).toBe(0.25);
    expect(getHolidayDiscount(utc(2026, 11, 27), 'clothing')).toBe(0.25);
  });

  it('returns 0 for ineligible category or non-holiday', () => {
    expect(getHolidayDiscount(utc(2026, 1, 1), 'food')).toBe(0);
    expect(getHolidayDiscount(utc(2026, 3, 12), 'electronics')).toBe(0);
  });
});
