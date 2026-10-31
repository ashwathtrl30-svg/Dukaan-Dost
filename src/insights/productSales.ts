import type { SaleEntry } from '../types';

export interface ProductSizeBreakdown {
  label: string;
  unitsSold: number;
}

export interface ProductSalesSummary {
  /** Exact product identity after case and whitespace normalisation. */
  key: string;
  /** Original display name from the first matching sale entry. */
  name: string;
  /** Count of sold items/packs, never the sum of grams, kilograms or litres. */
  unitsSold: number;
  /** Different recorded sizes remain visible under the same product. */
  sizes: ProductSizeBreakdown[];
  revenue: number;
}

/**
 * Product identity is deliberately conservative:
 * - "Fortune Soya" and "fortune   soya" match.
 * - "Fortune Soya" and "Soya" do not match.
 * No brand or product words are inferred, removed, or fuzzy-matched.
 */
export function normalizeProductIdentity(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

function positiveNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normaliseMeasurementUnit(unit: string): string {
  const value = unit.trim().toLocaleLowerCase();
  const aliases: Record<string, string> = {
    gram: 'g', grams: 'g', gm: 'g', gms: 'g',
    kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg', kgs: 'kg',
    millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
    litre: 'l', litres: 'l', liter: 'l', liters: 'l', ltr: 'l',
  };
  return aliases[value] || value;
}

const PACKAGE_UNITS = new Set([
  'packet', 'pack', 'pkt', 'piece', 'pc', 'unit', 'item', 'bottle', 'box',
  'dozen', 'bag', 'sack', 'pouch', 'bundle', 'strip', 'jar', 'can', 'pair',
  'tray', 'roll', 'set', 'plate', 'cup', 'glass', 'service',
]);

/** Returns the count of sold items/packs without ever adding measured weights. */
function getSoldUnitCount(sale: SaleEntry): number {
  const itemCount = positiveNumber(sale.numberOfItemsSold);
  if (itemCount !== null) return itemCount;

  const packageCount = positiveNumber(sale.packageCount);
  if (packageCount !== null) return packageCount;

  // Older voice entries can store a pack size in the unit itself, e.g.
  // quantity=2, quantityUnit="500 g packet". In that format quantity is packs.
  const rawUnit = String(sale.quantityUnit || '').trim().toLocaleLowerCase();
  const isPackSizeUnit = /^\d+(?:\.\d+)?\s*(?:g|gm|gms|gram|grams|kg|kgs|kilo|kilos|ml|l|litre|litres|liter|liters)\s*(?:packet|pack|pkt)$/u.test(rawUnit);
  if (isPackSizeUnit || PACKAGE_UNITS.has(rawUnit)) {
    return positiveNumber(sale.quantity) || 0;
  }

  // A measured amount alone (e.g. 500 g) is not enough to infer how many
  // packets/items were sold. Do not rank grams as item counts.
  return 0;
}

function getRecordedSizeLabel(sale: SaleEntry): string | null {
  const rawUnit = String(sale.quantityUnit || '').trim();
  if (!rawUnit) return null;

  const packSizeMatch = /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgs|kilo|kilos|ml|l|litre|litres|liter|liters)\s*(?:packet|pack|pkt)$/iu.exec(rawUnit);
  if (packSizeMatch) {
    const unit = normaliseMeasurementUnit(packSizeMatch[2]);
    return packSizeMatch[1] + ' ' + unit;
  }

  const quantity = positiveNumber(sale.quantity);
  const unit = normaliseMeasurementUnit(rawUnit);
  if (quantity !== null && ['g', 'kg', 'mg', 'ml', 'l', 'quintal', 'tonne', 'metre', 'cm', 'mm'].includes(unit)) {
    return quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' ' + unit;
  }

  if (PACKAGE_UNITS.has(unit)) return unit;
  return null;
}

/**
 * Aggregate itemised sales by product name only. Pack sizes and measured units
 * are kept as a breakdown, while bestseller ranking uses item/pack counts.
 */
export function aggregateProductSales(
  sales: SaleEntry[],
  dateRange?: { start: string; end: string },
): ProductSalesSummary[] {
  const products = new Map<string, ProductSalesSummary>();
  const sizeMaps = new Map<string, Map<string, ProductSizeBreakdown>>();

  sales.forEach(sale => {
    if (typeof sale.itemName !== 'string' || !sale.itemName.trim()) return;
    if (dateRange && (sale.date < dateRange.start || sale.date > dateRange.end)) return;

    const key = normalizeProductIdentity(sale.itemName);
    if (!key) return;

    const unitsSold = getSoldUnitCount(sale);
    if (unitsSold <= 0) return;

    const product = products.get(key) || {
      key,
      name: sale.itemName.trim().replace(/\s+/gu, ' '),
      unitsSold: 0,
      sizes: [],
      revenue: 0,
    };
    product.unitsSold += unitsSold;

    const amount = Number(sale.amount);
    if (Number.isFinite(amount) && amount > 0) product.revenue += amount;

    const sizeLabel = getRecordedSizeLabel(sale);
    if (sizeLabel) {
      const sizeKey = sizeLabel.toLocaleLowerCase();
      let productSizes = sizeMaps.get(key);
      if (!productSizes) {
        productSizes = new Map<string, ProductSizeBreakdown>();
        sizeMaps.set(key, productSizes);
      }
      const size = productSizes.get(sizeKey) || { label: sizeLabel, unitsSold: 0 };
      size.unitsSold += unitsSold;
      productSizes.set(sizeKey, size);
      product.sizes = [...productSizes.values()];
    }

    products.set(key, product);
  });

  return [...products.values()];
}
