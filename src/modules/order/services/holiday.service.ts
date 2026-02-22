import { getDb } from '../../../lib/db';

export const holidayService = {
  getDiscount(date: Date, category: string): number {
    const isoDate = date.toISOString().slice(0, 10);
    const row = getDb()
      .prepare(
        'SELECT discount_percent, categories FROM holidays WHERE date = ?',
      )
      .get(isoDate) as
      | { discount_percent: number; categories: string }
      | undefined;
    if (!row) return 0;
    if (row.categories !== '*') {
      const eligible: string[] = JSON.parse(row.categories);
      if (!eligible.includes(category)) return 0;
    }
    return row.discount_percent / 100;
  },
};
