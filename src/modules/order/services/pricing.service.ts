import { holidayService } from './holiday.service';

type PricingInput = {
  unitPrice: number;
  quantity: number;
  category: string;
  location: string;
  date: Date;
};

type PricingResult = {
  lineTotal: number;
  discountApplied: number;
};

type DiscountContext = {
  quantity: number;
  category: string;
  date: Date;
};

type DiscountStrategy = {
  name: string;
  calculate: (ctx: DiscountContext) => number;
};

const locationMultipliers: Record<string, number> = {
  US: 1.0,
  Europe: 1.15,
  Asia: 0.95,
};

const volumeDiscount: DiscountStrategy = {
  name: 'volume',
  calculate: (ctx) => {
    if (ctx.quantity >= 50) return 0.3;
    if (ctx.quantity >= 10) return 0.2;
    if (ctx.quantity >= 5) return 0.1;
    return 0;
  },
};

const holidayDiscount: DiscountStrategy = {
  name: 'holiday',
  calculate: (ctx) => holidayService.getDiscount(ctx.date, ctx.category),
};

const discountStrategies: DiscountStrategy[] = [
  volumeDiscount,
  holidayDiscount,
];

type OrderItem = {
  productId: number;
  unitPrice: number;
  quantity: number;
  category: string;
};

type OrderCalculationInput = {
  items: OrderItem[];
  location: string;
  date: Date;
};

type OrderCalculationResult = {
  lineItems: {
    productId: number;
    quantity: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
  }[];
  totalPrice: number;
};

export const pricingService = {
  calculateOrderTotal(input: OrderCalculationInput): OrderCalculationResult {
    const lineItems = input.items.map((item) => {
      const result = calculateLineTotal({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        category: item.category,
        location: input.location,
        date: input.date,
      });
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountApplied: result.discountApplied,
        lineTotal: result.lineTotal,
      };
    });

    const totalPrice = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    return { lineItems, totalPrice };
  },
};

const calculateLineTotal = (input: PricingInput): PricingResult => {
  const { unitPrice, quantity, category, location, date } = input;

  const ctx: DiscountContext = { quantity, category, date };
  const bestDiscount = Math.max(
    ...discountStrategies.map((s) => s.calculate(ctx)),
  );

  const multiplier = locationMultipliers[location] ?? 1.0;

  const lineTotal = Math.round(
    unitPrice * (1 - bestDiscount) * multiplier * quantity,
  );

  return { lineTotal, discountApplied: bestDiscount };
};
