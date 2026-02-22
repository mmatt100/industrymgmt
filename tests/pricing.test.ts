import { pricingService } from '../src/modules/order/services/pricing.service';

const { calculateOrderTotal } = pricingService;

describe('calculateOrderTotal', () => {
  const regularDay = new Date(Date.UTC(2026, 2, 15)); // March 15 — regular day
  const blackFriday = new Date(Date.UTC(2026, 10, 27));
  const polishNewYear = new Date(Date.UTC(2026, 0, 1));

  const singleItem = (overrides: {
    unitPrice?: number;
    quantity?: number;
    category?: string;
    location?: string;
    date?: Date;
  } = {}) =>
    calculateOrderTotal({
      items: [{
        productId: 1,
        unitPrice: overrides.unitPrice ?? 1000,
        quantity: overrides.quantity ?? 1,
        category: overrides.category ?? 'electronics',
      }],
      location: overrides.location ?? 'US',
      date: overrides.date ?? regularDay,
    });

  it('applies volume discount tiers based on line item quantity', () => {
    // below 5 → 0%
    expect(singleItem({ quantity: 4 }).lineItems[0].discountApplied).toBe(0);
    expect(singleItem({ quantity: 4 }).lineItems[0].lineTotal).toBe(4000);

    // 5 → 10%
    expect(singleItem({ quantity: 5 }).lineItems[0].discountApplied).toBe(0.1);
    expect(singleItem({ quantity: 5 }).lineItems[0].lineTotal).toBe(4500);

    // 10 → 20%
    expect(singleItem({ quantity: 10 }).lineItems[0].discountApplied).toBe(0.2);
    expect(singleItem({ quantity: 10 }).lineItems[0].lineTotal).toBe(8000);

    // 50 → 30%
    expect(singleItem({ quantity: 50 }).lineItems[0].discountApplied).toBe(0.3);
    expect(singleItem({ quantity: 50 }).lineItems[0].lineTotal).toBe(35000);
  });

  it('picks the highest discount when multiple apply', () => {
    // BF 25% beats volume 10% (qty=5)
    const bf5 = singleItem({ date: blackFriday, quantity: 5 });
    expect(bf5.lineItems[0].discountApplied).toBe(0.25);
    expect(bf5.lineItems[0].lineTotal).toBe(3750);

    // volume 30% (qty=50) beats BF 25%
    const bf50 = singleItem({ date: blackFriday, quantity: 50 });
    expect(bf50.lineItems[0].discountApplied).toBe(0.3);
    expect(bf50.lineItems[0].lineTotal).toBe(35000);
  });

  it('applies holiday discount by category and location multipliers', () => {
    // electronics on Polish holiday → 15%
    const elec = singleItem({ date: polishNewYear, category: 'electronics' });
    expect(elec.lineItems[0].discountApplied).toBe(0.15);
    expect(elec.lineItems[0].lineTotal).toBe(850);

    // food on Polish holiday → 0% (ineligible)
    const food = singleItem({ date: polishNewYear, category: 'food' });
    expect(food.lineItems[0].discountApplied).toBe(0);
    expect(food.lineItems[0].lineTotal).toBe(1000);

    // Europe 1.15x
    expect(singleItem({ location: 'Europe' }).lineItems[0].lineTotal).toBe(1150);

    // Asia 0.95x
    expect(singleItem({ location: 'Asia' }).lineItems[0].lineTotal).toBe(950);
  });

  it('does not aggregate quantities across items for volume discount', () => {
    // 3 and 3 do not trigger volume discount per line
    const result1 = calculateOrderTotal({
      items: [
        { productId: 1, unitPrice: 1000, quantity: 3, category: 'electronics' },
        { productId: 2, unitPrice: 500, quantity: 3, category: 'food' },
      ],
      location: 'US',
      date: regularDay,
    });
    expect(result1.lineItems[0].discountApplied).toBe(0);
    expect(result1.lineItems[0].lineTotal).toBe(3000);
    expect(result1.lineItems[1].discountApplied).toBe(0);
    expect(result1.lineItems[1].lineTotal).toBe(1500);
    expect(result1.totalPrice).toBe(4500);

    // 5 triggers 10% on that line only
    const result2 = calculateOrderTotal({
      items: [
        { productId: 1, unitPrice: 1000, quantity: 5, category: 'electronics' },
        { productId: 2, unitPrice: 500, quantity: 2, category: 'food' },
      ],
      location: 'US',
      date: regularDay,
    });
    expect(result2.lineItems[0].discountApplied).toBe(0.1);
    expect(result2.lineItems[0].lineTotal).toBe(4500);
    expect(result2.lineItems[1].discountApplied).toBe(0);
    expect(result2.lineItems[1].lineTotal).toBe(1000);
    expect(result2.totalPrice).toBe(5500);
  });

  it('handles edge cases', () => {
    // empty order → 0
    const empty = calculateOrderTotal({ items: [], location: 'US', date: regularDay });
    expect(empty.lineItems).toHaveLength(0);
    expect(empty.totalPrice).toBe(0);

    // rounding: 333 * 0.9 * 1.15 * 5 = 1723.275 → 1723
    const rounded = singleItem({ unitPrice: 333, quantity: 5, location: 'Europe' });
    expect(rounded.lineItems[0].lineTotal).toBe(1723);
  });
});
