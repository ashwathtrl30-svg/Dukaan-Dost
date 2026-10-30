import type { ShopType } from './types';

export interface ParsedSaleQuantity {
  /** Main measured or counted quantity, e.g. 500 ml, 2 kg or 3 packets. */
  quantity: number;
  quantityUnit: string;
  /** Optional package count when both a pack count and a total measure are supplied. */
  packageCount?: number;
  packageUnit?: string;
}

type QuantityUnitKind = 'measure' | 'package';
type NormalizedUnit = { unit: string; kind: QuantityUnitKind };

const MEASUREMENT_UNITS = new Set([
  'kg', 'g', 'mg', 'ml', 'litre', 'quintal', 'tonne', 'metre', 'cm', 'mm',
]);

/** Weight/volume is useful for grocery and produce-style shops, not most service or piece-based shops. */
export function shopUsesMeasuredQuantity(shopType: ShopType | null | undefined): boolean {
  if (!shopType) return true;
  return ['kirana', 'vegetable', 'bakery', 'sweet', 'other'].includes(shopType);
}

/** The measured-quantity input accepts weight/volume/length units only. */
export function isMeasuredSaleQuantity(value: ParsedSaleQuantity | null): value is ParsedSaleQuantity {
  return Boolean(value && MEASUREMENT_UNITS.has(value.quantityUnit) && !value.packageCount);
}

export function getSaleNameLabel(shopType: ShopType | null | undefined, language: 'en' | 'hi'): string {
  if (shopType === 'salon') {
    return language === 'hi' ? 'सेवा का नाम' : 'Service name';
  }
  if (shopType === 'tailor') {
    return language === 'hi' ? 'कपड़े / अल्टरेशन का प्रकार' : 'Garment / alteration type';
  }
  return language === 'hi' ? 'सामान या सेवा का नाम' : 'Item or service name';
}

export interface SaleCountCopy {
  inputLabel: string;
  summaryLabel: string;
  displayLabel: string;
}

/** Business-specific wording for the count of goods, services, or jobs recorded in a sale. */
export function getSaleCountCopy(shopType: ShopType | null | undefined, language: 'en' | 'hi'): SaleCountCopy {
  const hindi = language === 'hi';
  if (shopType === 'tailor') {
    return hindi
      ? { inputLabel: 'अल्टर किए गए कपड़ों की संख्या *', summaryLabel: 'अल्टर किए कपड़े', displayLabel: 'अल्टर किए कपड़े' }
      : { inputLabel: 'Number of dresses altered *', summaryLabel: 'dresses altered', displayLabel: 'Dresses altered' };
  }
  if (shopType === 'salon') {
    return hindi
      ? { inputLabel: 'पूरी की गई सेवाओं की संख्या *', summaryLabel: 'सेवाएँ पूरी', displayLabel: 'पूरी की गई सेवाएँ' }
      : { inputLabel: 'Number of services completed *', summaryLabel: 'services completed', displayLabel: 'Services completed' };
  }
  if (shopType === 'restaurant') {
    return hindi
      ? { inputLabel: 'बेची गई सर्विंग की संख्या *', summaryLabel: 'सर्विंग बेची', displayLabel: 'बेची गई सर्विंग' }
      : { inputLabel: 'Number of servings sold *', summaryLabel: 'servings sold', displayLabel: 'Servings sold' };
  }
  if (shopType === 'tea') {
    return hindi
      ? { inputLabel: 'बेचे गए कप / गिलास की संख्या *', summaryLabel: 'कप / गिलास बेचे', displayLabel: 'कप / गिलास' }
      : { inputLabel: 'Number of cups / glasses sold *', summaryLabel: 'cups / glasses sold', displayLabel: 'Cups / glasses sold' };
  }
  if (shopType === 'other') {
    return hindi
      ? { inputLabel: 'बेची गई इकाइयों की संख्या *', summaryLabel: 'इकाइयाँ बेची', displayLabel: 'बेची गई इकाइयाँ' }
      : { inputLabel: 'Number of units sold *', summaryLabel: 'units sold', displayLabel: 'Units sold' };
  }
  return hindi
    ? { inputLabel: 'बेची गई चीज़ों की संख्या *', summaryLabel: 'आइटम बेचे', displayLabel: 'बेचे गए आइटम' }
    : { inputLabel: 'Number of items sold *', summaryLabel: 'items sold', displayLabel: 'Items sold' };
}

const UNIT_ALIASES: Record<string, NormalizedUnit> = {
  kg: { unit: 'kg', kind: 'measure' }, kgs: { unit: 'kg', kind: 'measure' },
  kilo: { unit: 'kg', kind: 'measure' }, kilos: { unit: 'kg', kind: 'measure' },
  kilogram: { unit: 'kg', kind: 'measure' }, kilograms: { unit: 'kg', kind: 'measure' },
  g: { unit: 'g', kind: 'measure' }, gm: { unit: 'g', kind: 'measure' },
  gms: { unit: 'g', kind: 'measure' }, gram: { unit: 'g', kind: 'measure' },
  grams: { unit: 'g', kind: 'measure' },
  mg: { unit: 'mg', kind: 'measure' }, milligram: { unit: 'mg', kind: 'measure' },
  milligrams: { unit: 'mg', kind: 'measure' },
  ml: { unit: 'ml', kind: 'measure' }, milliliter: { unit: 'ml', kind: 'measure' },
  milliliters: { unit: 'ml', kind: 'measure' }, millilitre: { unit: 'ml', kind: 'measure' },
  millilitres: { unit: 'ml', kind: 'measure' },
  l: { unit: 'litre', kind: 'measure' }, lt: { unit: 'litre', kind: 'measure' },
  ltr: { unit: 'litre', kind: 'measure' }, litre: { unit: 'litre', kind: 'measure' },
  litres: { unit: 'litre', kind: 'measure' }, liter: { unit: 'litre', kind: 'measure' },
  liters: { unit: 'litre', kind: 'measure' },
  quintal: { unit: 'quintal', kind: 'measure' }, quintals: { unit: 'quintal', kind: 'measure' },
  ton: { unit: 'tonne', kind: 'measure' }, tons: { unit: 'tonne', kind: 'measure' },
  tonne: { unit: 'tonne', kind: 'measure' }, tonnes: { unit: 'tonne', kind: 'measure' },
  m: { unit: 'metre', kind: 'measure' }, meter: { unit: 'metre', kind: 'measure' },
  meters: { unit: 'metre', kind: 'measure' }, metre: { unit: 'metre', kind: 'measure' },
  metres: { unit: 'metre', kind: 'measure' }, cm: { unit: 'cm', kind: 'measure' },
  mm: { unit: 'mm', kind: 'measure' },
  packet: { unit: 'packet', kind: 'package' }, packets: { unit: 'packet', kind: 'package' },
  pack: { unit: 'packet', kind: 'package' }, packs: { unit: 'packet', kind: 'package' },
  pkt: { unit: 'packet', kind: 'package' }, pkts: { unit: 'packet', kind: 'package' },
  piece: { unit: 'piece', kind: 'package' }, pieces: { unit: 'piece', kind: 'package' },
  pc: { unit: 'piece', kind: 'package' }, pcs: { unit: 'piece', kind: 'package' },
  unit: { unit: 'unit', kind: 'package' }, units: { unit: 'unit', kind: 'package' },
  item: { unit: 'item', kind: 'package' }, items: { unit: 'item', kind: 'package' },
  bottle: { unit: 'bottle', kind: 'package' }, bottles: { unit: 'bottle', kind: 'package' },
  box: { unit: 'box', kind: 'package' }, boxes: { unit: 'box', kind: 'package' },
  dozen: { unit: 'dozen', kind: 'package' }, dz: { unit: 'dozen', kind: 'package' },
  bag: { unit: 'bag', kind: 'package' }, bags: { unit: 'bag', kind: 'package' },
  sack: { unit: 'sack', kind: 'package' }, sacks: { unit: 'sack', kind: 'package' },
  pouch: { unit: 'pouch', kind: 'package' }, pouches: { unit: 'pouch', kind: 'package' },
  bundle: { unit: 'bundle', kind: 'package' }, bundles: { unit: 'bundle', kind: 'package' },
  strip: { unit: 'strip', kind: 'package' }, strips: { unit: 'strip', kind: 'package' },
  jar: { unit: 'jar', kind: 'package' }, jars: { unit: 'jar', kind: 'package' },
  can: { unit: 'can', kind: 'package' }, cans: { unit: 'can', kind: 'package' },
  pair: { unit: 'pair', kind: 'package' }, pairs: { unit: 'pair', kind: 'package' },
  tray: { unit: 'tray', kind: 'package' }, trays: { unit: 'tray', kind: 'package' },
  roll: { unit: 'roll', kind: 'package' }, rolls: { unit: 'roll', kind: 'package' },
  set: { unit: 'set', kind: 'package' }, sets: { unit: 'set', kind: 'package' },
  plate: { unit: 'plate', kind: 'package' }, plates: { unit: 'plate', kind: 'package' },
  cup: { unit: 'cup', kind: 'package' }, cups: { unit: 'cup', kind: 'package' },
  glass: { unit: 'glass', kind: 'package' }, glasses: { unit: 'glass', kind: 'package' },
  service: { unit: 'service', kind: 'package' }, services: { unit: 'service', kind: 'package' },
  किलो: { unit: 'kg', kind: 'measure' }, किलोग्राम: { unit: 'kg', kind: 'measure' },
  ग्राम: { unit: 'g', kind: 'measure' }, मिली: { unit: 'ml', kind: 'measure' },
  मिलीलीटर: { unit: 'ml', kind: 'measure' }, एमएल: { unit: 'ml', kind: 'measure' }, 'एम एल': { unit: 'ml', kind: 'measure' },
  लीटर: { unit: 'litre', kind: 'measure' }, लिटर: { unit: 'litre', kind: 'measure' },
  पैकेट: { unit: 'packet', kind: 'package' }, पीस: { unit: 'piece', kind: 'package' },
  नग: { unit: 'piece', kind: 'package' }, बोतल: { unit: 'bottle', kind: 'package' },
  डिब्बा: { unit: 'box', kind: 'package' }, डिब्बे: { unit: 'box', kind: 'package' },
  दर्जन: { unit: 'dozen', kind: 'package' },
};

function parseOneQuantity(value: string): (ParsedSaleQuantity & { kind: QuantityUnitKind }) | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(.+?)\s*$/u.exec(value);
  if (!match) return null;

  const quantity = Number(match[1]);
  const rawUnit = match[2].toLowerCase().replace(/\s+/g, ' ').trim();
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  if (/^500\s*g\s*packet$/iu.test(rawUnit)) {
    return { quantity, quantityUnit: '500 g packet', kind: 'package' };
  }
  const normalized = UNIT_ALIASES[rawUnit];
  if (!normalized) return null;
  return { quantity, quantityUnit: normalized.unit, kind: normalized.kind };
}

/**
 * Accepts a quantity such as "500 ml", "2 kg", "3 packets", or
 * "2 packets, 2 kg". When both a package count and a measured total are
 * supplied, the measured total is the main quantity and the package count
 * is retained separately.
 */
export function parseSaleQuantityInput(value: string): ParsedSaleQuantity | null {
  const parts = value
    .trim()
    .replace(/\s+(?:and|plus|और)\s+/giu, ',')
    .split(/[,;]+/)
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length < 1 || parts.length > 2) return null;
  const parsed = parts.map(parseOneQuantity);
  if (parsed.some(part => !part)) return null;
  const quantities = parsed as Array<ParsedSaleQuantity & { kind: QuantityUnitKind }>;

  if (quantities.length === 1) {
    const { quantity, quantityUnit } = quantities[0];
    return { quantity, quantityUnit };
  }

  const measured = quantities.find(part => part.kind === 'measure');
  const packaged = quantities.find(part => part.kind === 'package');
  if (!measured || !packaged) return null;
  return {
    quantity: measured.quantity,
    quantityUnit: measured.quantityUnit,
    packageCount: packaged.quantity,
    packageUnit: packaged.quantityUnit,
  };
}

/** Format a saved sale quantity back into the editable field format. */
export function formatSaleQuantityInput(entry: {
  quantity?: number;
  quantityUnit?: string;
  packageCount?: number;
  packageUnit?: string;
}): string {
  if (!Number.isFinite(Number(entry.quantity)) || Number(entry.quantity) <= 0 || !entry.quantityUnit) {
    return '';
  }
  const main = String(entry.quantity) + ' ' + entry.quantityUnit;
  if (Number.isFinite(Number(entry.packageCount)) && Number(entry.packageCount) > 0 && entry.packageUnit) {
    return String(entry.packageCount) + ' ' + entry.packageUnit + ', ' + main;
  }
  return main;
}
