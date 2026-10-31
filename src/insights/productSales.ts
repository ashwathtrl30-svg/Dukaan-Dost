import type { SaleEntry } from '../types';
import { getSaleQuantityUnitKind, isCountableSaleQuantityUnit, normalizeSaleQuantityUnit } from '../quantity';

export interface ProductSizeBreakdown {
  label: string;
  unitsSold: number;
}

export interface ProductSalesSummary {
  /** Exact product identity after case and whitespace normalisation. */
  key: string;
  /** Original display name from the first matching sale entry. */
  name: string;
  /** Count of separate items, packs or discrete services; never the sum of measured quantities. */
  unitsSold: number;
  /** Different recorded sizes and sale units remain visible under the same product. */
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

/** Returns the count of sold items/packs without ever adding grams, litres, metres or specifications. */
function getSoldUnitCount(sale: SaleEntry): number {
  const itemCount = positiveNumber(sale.numberOfItemsSold);
  if (itemCount !== null) return itemCount;

  const packageCount = positiveNumber(sale.packageCount);
  if (packageCount !== null) return packageCount;

  const rawUnit = String(sale.quantityUnit || '').trim();
  const normalizedUnit = normalizeSaleQuantityUnit(rawUnit) || rawUnit.toLocaleLowerCase();
  if (isCountableSaleQuantityUnit(normalizedUnit)) {
    return positiveNumber(sale.quantity) || 0;
  }

  // A measured amount or technical specification alone is not an item count.
  return 0;
}

function getRecordedSizeLabel(sale: SaleEntry): string | null {
  const rawUnit = String(sale.quantityUnit || '').trim();
  if (!rawUnit) return null;

  // Legacy records may store the pack size inside quantityUnit, e.g. "500 g packet".
  const legacyPackSize = /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgs|kilo|kilos|ml|l|litre|litres|liter|liters)\s*(?:packet|pack|pkt)$/iu.exec(rawUnit);
  if (legacyPackSize) {
    const unit = normalizeSaleQuantityUnit(legacyPackSize[2]) || legacyPackSize[2].toLocaleLowerCase();
    return legacyPackSize[1] + ' ' + unit;
  }

  const quantity = positiveNumber(sale.quantity);
  const unit = normalizeSaleQuantityUnit(rawUnit);
  if (!unit || quantity === null) return null;

  const kind = getSaleQuantityUnitKind(unit);
  if (kind === 'measure' || kind === 'technical') {
    return quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' ' + unit;
  }
  if (isCountableSaleQuantityUnit(unit)) return unit;
  return null;
}

/**
 * Aggregate itemised sales by product name only. Different measures and pack
 * units stay in the size breakdown; bestseller ranking uses discrete counts.
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
