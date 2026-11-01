export type ProductQuantityFamily = 'volume' | 'weight' | 'length';

export interface VoiceSaleQuantityInput {
  itemName: string;
  quantity?: number;
  quantityUnit?: string;
  numberOfItemsSold?: number;
  packageCount?: number;
  packageUnit?: string;
}

export interface VoiceSaleQuantityResolution {
  quantity?: number;
  quantityUnit?: string;
  numberOfItemsSold?: number;
  packageCount?: number;
  packageUnit?: string;
  requiresQuantityConfirmation: boolean;
  expectedFamily?: ProductQuantityFamily;
}

const PACKAGE_UNITS = new Set([
  'packet', 'pack', 'pouch', 'box', 'carton', 'case', 'bag', 'sack',
  'tray', 'bottle', 'roll', 'bundle', 'strip', 'jar', 'can',
]);

const DISCRETE_UNITS = new Set([
  'piece', 'unit', 'pair', 'set', 'dozen', 'bunch', 'item',
  'plate', 'cup', 'glass', 'job', 'session', 'appointment',
  'visit', 'booking', 'service',
]);

function positiveNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function cleanItemName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function hasWord(value: string, words: string[]): boolean {
  const escaped = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('|');
  return new RegExp('(?:^|\\s)(?:' + escaped + ')(?=$|\\s)', 'u').test(value);
}

/**
 * A product profile is a reminder about the kind of amount normally needed,
 * not a restriction on what the shopkeeper is allowed to record.
 */
export function getProductQuantityFamily(itemName: string): ProductQuantityFamily | undefined {
  const name = cleanItemName(itemName);

  if (hasWord(name, [
    'oil', 'tel', 'edible oil', 'cooking oil', 'mustard oil', 'refined oil',
    'milk', 'doodh', 'dudh', 'water', 'pani', 'juice', 'ghee', 'shampoo',
    'conditioner', 'petrol', 'diesel', 'phenyl', 'sanitizer', 'handwash',
    'liquid detergent', 'detergent liquid', 'paint', 'varnish', 'syrup',
    'vinegar', 'perfume', 'ink', 'coolant', 'lubricant', 'soft drink',
    'cold drink', 'soda', 'lassi', 'buttermilk',
  ])) return 'volume';

  if (hasWord(name, [
    'sugar', 'shakkar', 'chini', 'rice', 'chawal', 'wheat', 'gehun',
    'flour', 'atta', 'maida', 'besan', 'gram flour', 'dal', 'dhal',
    'pulses', 'lentils', 'salt', 'namak', 'spice', 'spices', 'masala',
    'turmeric', 'haldi', 'chilli powder', 'chili powder', 'mirchi powder',
    'coriander powder', 'dhania powder', 'tea leaves', 'tea powder',
    'coffee powder', 'dry fruit', 'dry fruits', 'almond', 'almonds',
    'cashew', 'cashews', 'raisins', 'peanut', 'peanuts', 'groundnut',
    'jaggery', 'gud', 'poha', 'rava', 'sooji', 'semolina',
  ])) return 'weight';

  if (hasWord(name, [
    'fabric', 'cloth', 'kapda', 'kapde', 'wire', 'cable', 'rope',
    'pipe', 'hose', 'ribbon', 'chain', 'lace', 'elastic',
  ])) return 'length';

  return undefined;
}

function isPackageUnit(unit: string): boolean {
  return PACKAGE_UNITS.has(unit.normalize('NFKC').toLocaleLowerCase().trim());
}

function isDiscreteUnit(unit: string): boolean {
  return DISCRETE_UNITS.has(unit.normalize('NFKC').toLocaleLowerCase().trim());
}

/**
 * Keeps measured quantity, package count and discrete item count separate.
 * The quantity-family profile only prompts for an omitted measurement; it
 * never rejects an explicitly spoken alternative unit.
 */
export function resolveVoiceSaleQuantity(input: VoiceSaleQuantityInput): VoiceSaleQuantityResolution {
  let quantity = positiveNumber(input.quantity);
  let quantityUnit = typeof input.quantityUnit === 'string' ? input.quantityUnit.trim() : '';
  let numberOfItemsSold = positiveNumber(input.numberOfItemsSold);
  let packageCount = positiveNumber(input.packageCount);
  let packageUnit = typeof input.packageUnit === 'string' ? input.packageUnit.trim() : '';

  const expectedFamily = getProductQuantityFamily(input.itemName);

  // If the model placed a packet/bottle count in the main quantity fields for
  // a product normally sold by measure (for example, "one packet of oil"),
  // move it to the package fields. Never invent the content size.
  if (
    expectedFamily &&
    quantity !== undefined &&
    isPackageUnit(quantityUnit) &&
    packageCount === undefined
  ) {
    packageCount = quantity;
    packageUnit = quantityUnit;
    quantity = undefined;
    quantityUnit = '';
  }

  const hasMeasuredValue = quantity !== undefined && !!quantityUnit && !isPackageUnit(quantityUnit);
  const hasExplicitDiscreteValue = quantity !== undefined && isDiscreteUnit(quantityUnit);
  const hasPackageValue = packageCount !== undefined && !!packageUnit;
  const hasAnyQuantity = hasMeasuredValue || hasExplicitDiscreteValue || hasPackageValue;

  const requiresQuantityConfirmation =
    (expectedFamily !== undefined && !hasMeasuredValue && !hasExplicitDiscreteValue) ||
    !hasAnyQuantity;

  // A measured amount such as 500 ml is not 500 products. For measured sales,
  // default to one sale unit unless a separate count/package count was stated.
  if (packageCount !== undefined) {
    numberOfItemsSold = numberOfItemsSold ?? packageCount;
  } else if (quantity !== undefined && isDiscreteUnit(quantityUnit)) {
    numberOfItemsSold = numberOfItemsSold ?? quantity;
  } else if (quantity !== undefined && !isPackageUnit(quantityUnit)) {
    numberOfItemsSold = numberOfItemsSold && numberOfItemsSold !== quantity
      ? numberOfItemsSold
      : 1;
  }

  return {
    ...(quantity !== undefined && quantityUnit ? { quantity, quantityUnit } : {}),
    ...(numberOfItemsSold !== undefined ? { numberOfItemsSold } : {}),
    ...(packageCount !== undefined && packageUnit ? { packageCount, packageUnit } : {}),
    requiresQuantityConfirmation,
    ...(expectedFamily ? { expectedFamily } : {}),
  };
}
