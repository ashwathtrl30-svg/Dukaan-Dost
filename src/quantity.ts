import type { ShopType } from './types';

export const INVALID_SALE_QUANTITY_MESSAGE = 'Enter a valid weight or liquid amount, e.g. 500g, 1kg, 750ml, 1 pair, 1 piece or etc.';

export interface ParsedSaleQuantity {
  /** Main measured or counted quantity, e.g. 500 ml, 2 kg, 3 packets or 1 pair. */
  quantity: number;
  quantityUnit: string;
  /** Optional pack/count when a package count and a separate measure are supplied. */
  packageCount?: number;
  packageUnit?: string;
}

export type SaleQuantityUnitKind = 'measure' | 'count' | 'package' | 'service' | 'technical';
type NormalizedUnit = { unit: string; kind: SaleQuantityUnitKind };

interface UnitDefinition {
  unit: string;
  kind: SaleQuantityUnitKind;
  aliases: string[];
}

/**
 * Unit vocabulary for Indian local businesses. Matching is case-insensitive:
 * KG, kg, Kg and kG all resolve to the same canonical unit.
 */
const UNIT_DEFINITIONS: UnitDefinition[] = [
  { unit: 'mg', kind: 'measure', aliases: ['mg', 'milligram', 'milligrams'] },
  { unit: 'g', kind: 'measure', aliases: ['g', 'gm', 'gms', 'gram', 'grams'] },
  { unit: 'kg', kind: 'measure', aliases: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'किलो', 'किलोग्राम'] },
  { unit: 'quintal', kind: 'measure', aliases: ['quintal', 'quintals', 'qtl', 'qtls', 'क्विंटल'] },
  { unit: 'tonne', kind: 'measure', aliases: ['tonne', 'tonnes', 'ton', 'tons', 'metric ton', 'metric tons'] },

  { unit: 'µL', kind: 'measure', aliases: ['µL', 'μL', 'uL', 'ul', 'microlitre', 'microlitres', 'microliter', 'microliters'] },
  { unit: 'ml', kind: 'measure', aliases: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'मिली', 'मिलीलीटर', 'एमएल', 'एम एल'] },
  { unit: 'litre', kind: 'measure', aliases: ['l', 'lt', 'ltr', 'litre', 'litres', 'liter', 'liters', 'लीटर', 'लिटर'] },
  { unit: 'kL', kind: 'measure', aliases: ['kl', 'kilolitre', 'kilolitres', 'kiloliter', 'kiloliters'] },

  { unit: 'mm', kind: 'measure', aliases: ['mm', 'millimetre', 'millimetres', 'millimeter', 'millimeters'] },
  { unit: 'cm', kind: 'measure', aliases: ['cm', 'centimetre', 'centimetres', 'centimeter', 'centimeters'] },
  { unit: 'metre', kind: 'measure', aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
  { unit: 'km', kind: 'measure', aliases: ['km', 'kilometre', 'kilometres', 'kilometer', 'kilometers'] },
  { unit: 'inch', kind: 'measure', aliases: ['inch', 'inches', 'in'] },
  { unit: 'ft', kind: 'measure', aliases: ['ft', 'foot', 'feet'] },
  { unit: 'yard', kind: 'measure', aliases: ['yard', 'yards', 'yd', 'yds'] },

  { unit: 'm²', kind: 'measure', aliases: ['m²', 'm2', 'sq m', 'sqm', 'square metre', 'square metres', 'square meter', 'square meters'] },
  { unit: 'sq ft', kind: 'measure', aliases: ['sq ft', 'sq. ft.', 'sq.ft.', 'sqft', 'square foot', 'square feet'] },
  { unit: 'acre', kind: 'measure', aliases: ['acre', 'acres'] },
  { unit: 'hectare', kind: 'measure', aliases: ['hectare', 'hectares', 'ha'] },
  { unit: 'm³', kind: 'measure', aliases: ['m³', 'm3', 'cu m', 'cubic metre', 'cubic metres', 'cubic meter', 'cubic meters'] },
  { unit: 'CFT', kind: 'measure', aliases: ['cft', 'cu ft', 'cubic foot', 'cubic feet', 'cubic ft'] },

  { unit: 'piece', kind: 'count', aliases: ['piece', 'pieces', 'pc', 'pcs', 'no', 'nos', 'नग', 'पीस'] },
  { unit: 'unit', kind: 'count', aliases: ['unit', 'units'] },
  { unit: 'pair', kind: 'count', aliases: ['pair', 'pairs'] },
  { unit: 'set', kind: 'count', aliases: ['set', 'sets'] },
  { unit: 'dozen', kind: 'count', aliases: ['dozen', 'dozens', 'dz', 'दर्जन'] },
  { unit: 'bunch', kind: 'count', aliases: ['bunch', 'bunches'] },

  { unit: 'packet', kind: 'package', aliases: ['packet', 'packets', 'pack', 'packs', 'pkt', 'pkts', 'पैकेट'] },
  { unit: 'box', kind: 'package', aliases: ['box', 'boxes', 'डिब्बा', 'डिब्बे'] },
  { unit: 'carton', kind: 'package', aliases: ['carton', 'cartons', 'ctn'] },
  { unit: 'case', kind: 'package', aliases: ['case', 'cases'] },
  { unit: 'bag', kind: 'package', aliases: ['bag', 'bags'] },
  { unit: 'sack', kind: 'package', aliases: ['sack', 'sacks'] },
  { unit: 'tray', kind: 'package', aliases: ['tray', 'trays'] },
  { unit: 'bottle', kind: 'package', aliases: ['bottle', 'bottles', 'बोतल'] },
  { unit: 'roll', kind: 'package', aliases: ['roll', 'rolls'] },

  { unit: 'job', kind: 'service', aliases: ['job', 'jobs'] },
  { unit: 'session', kind: 'service', aliases: ['session', 'sessions'] },
  { unit: 'appointment', kind: 'service', aliases: ['appointment', 'appointments', 'appt', 'appts'] },
  { unit: 'visit', kind: 'service', aliases: ['visit', 'visits'] },
  { unit: 'booking', kind: 'service', aliases: ['booking', 'bookings'] },
  { unit: 'hour', kind: 'measure', aliases: ['hour', 'hours', 'hr', 'hrs'] },
  { unit: 'day', kind: 'measure', aliases: ['day', 'days'] },

  { unit: 'V', kind: 'technical', aliases: ['v', 'volt', 'volts'] },
  { unit: 'A', kind: 'technical', aliases: ['a', 'amp', 'amps', 'ampere', 'amperes'] },
  { unit: 'W', kind: 'technical', aliases: ['w', 'watt', 'watts'] },
  { unit: 'kWh', kind: 'technical', aliases: ['kwh', 'kilowatt hour', 'kilowatt hours', 'kilowatt-hour', 'kilowatt-hours'] },
  { unit: 'GB', kind: 'technical', aliases: ['gb', 'gigabyte', 'gigabytes'] },
  { unit: 'TB', kind: 'technical', aliases: ['tb', 'terabyte', 'terabytes'] },
  { unit: 'PSI', kind: 'technical', aliases: ['psi', 'pounds per square inch'] },
  { unit: 'CC', kind: 'technical', aliases: ['cc', 'cubic centimetre', 'cubic centimetres', 'cubic centimeter', 'cubic centimeters'] },
  { unit: 'GSM', kind: 'technical', aliases: ['gsm', 'grams per square metre', 'grams per square meter'] },

  // Retain previously supported units so older products and voice phrases keep working.
  { unit: 'pav', kind: 'measure', aliases: ['pav', 'पाव'] },
  { unit: 'item', kind: 'count', aliases: ['item', 'items'] },
  { unit: 'pouch', kind: 'package', aliases: ['pouch', 'pouches'] },
  { unit: 'bundle', kind: 'package', aliases: ['bundle', 'bundles'] },
  { unit: 'strip', kind: 'package', aliases: ['strip', 'strips'] },
  { unit: 'jar', kind: 'package', aliases: ['jar', 'jars'] },
  { unit: 'can', kind: 'package', aliases: ['can', 'cans'] },
  { unit: 'plate', kind: 'count', aliases: ['plate', 'plates'] },
  { unit: 'cup', kind: 'count', aliases: ['cup', 'cups'] },
  { unit: 'glass', kind: 'count', aliases: ['glass', 'glasses'] },
  { unit: 'service', kind: 'service', aliases: ['service', 'services'] },
];

function normalizeUnitKey(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[µμ]/gu, 'u')
    .replace(/\./gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

const UNIT_ALIASES: Record<string, NormalizedUnit> = {};
const PREFIX_ALIASES: Array<{ alias: string; normalized: NormalizedUnit }> = [];
UNIT_DEFINITIONS.forEach(definition => {
  definition.aliases.forEach(alias => {
    UNIT_ALIASES[normalizeUnitKey(alias)] = { unit: definition.unit, kind: definition.kind };
    PREFIX_ALIASES.push({ alias, normalized: { unit: definition.unit, kind: definition.kind } });
  });
});
PREFIX_ALIASES.sort((a, b) => b.alias.length - a.alias.length);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&').replace(/ /gu, '\\s+');
}

function getLegacyPackSizeUnit(value: string): string | null {
  const match = /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgs|kilo|kilos|ml|l|litre|litres|liter|liters)\s*(?:packet|pack|pkt)$/iu.exec(value.trim());
  if (!match) return null;
  const measure = UNIT_ALIASES[normalizeUnitKey(match[2])];
  return measure ? match[1] + ' ' + measure.unit + ' packet' : null;
}

/** Normalise a supported unit or common short form to the app's stored unit. */
export function normalizeSaleQuantityUnit(value: string): string | null {
  const legacyPackSize = getLegacyPackSizeUnit(value);
  if (legacyPackSize) return legacyPackSize;
  return UNIT_ALIASES[normalizeUnitKey(value)]?.unit || null;
}

export function getSaleQuantityUnitKind(value: string): SaleQuantityUnitKind | null {
  if (/^\d+(?:\.\d+)?\s+.+\s+packet$/iu.test(value.trim())) return 'package';
  return UNIT_ALIASES[normalizeUnitKey(value)]?.kind || null;
}

export function isCountableSaleQuantityUnit(value: string): boolean {
  const kind = getSaleQuantityUnitKind(value);
  return kind === 'count' || kind === 'package' || kind === 'service';
}

/** Find a recognised unit at the start of a voice-parser suffix, case-insensitively. */
export function findSaleQuantityUnitPrefix(value: string): { unit: string; kind: SaleQuantityUnitKind; length: number } | null {
  for (const candidate of PREFIX_ALIASES) {
    const escaped = escapeRegExp(candidate.alias);
    const match = new RegExp('^\\s*(' + escaped + ')(?=\\s|$|[,;])', 'iu').exec(value);
    if (match) {
      return {
        unit: candidate.normalized.unit,
        kind: candidate.normalized.kind,
        length: match[0].length,
      };
    }
  }
  return null;
}

/** Backward-compatible helper; the current quantity field supports every unit family. */
export function shopUsesMeasuredQuantity(shopType: ShopType | null | undefined): boolean {
  if (!shopType) return true;
  return ['kirana', 'vegetable', 'bakery', 'sweet', 'other'].includes(shopType);
}

/** Validate any supported weight, size, count, package, service or technical quantity. */
export function isValidSaleQuantity(value: ParsedSaleQuantity | null): value is ParsedSaleQuantity {
  if (!value || !Number.isFinite(value.quantity) || value.quantity <= 0) return false;
  if (!getSaleQuantityUnitKind(value.quantityUnit)) return false;
  if (value.packageCount !== undefined) {
    if (!Number.isFinite(value.packageCount) || value.packageCount <= 0 || !value.packageUnit) return false;
    const packageKind = getSaleQuantityUnitKind(value.packageUnit);
    if (!packageKind || !(packageKind === 'count' || packageKind === 'package' || packageKind === 'service')) return false;
  }
  return true;
}

/** Legacy name retained for existing imports; it now validates all supported units. */
export const isMeasuredSaleQuantity = isValidSaleQuantity;

/** For discrete sale units, quantity is also the number of products/packs/services sold. */
export function getSaleItemCountFromQuantity(value: ParsedSaleQuantity | null): number | null {
  if (!isValidSaleQuantity(value)) return null;
  if (Number.isFinite(value.packageCount) && Number(value.packageCount) > 0) return Number(value.packageCount);
  return isCountableSaleQuantityUnit(value.quantityUnit) ? value.quantity : null;
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

function parseOneQuantity(value: string): (ParsedSaleQuantity & { kind: SaleQuantityUnitKind }) | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(.+?)\s*$/u.exec(value);
  if (!match) return null;

  const quantity = Number(match[1]);
  const rawUnit = match[2].toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const legacyPackSize = getLegacyPackSizeUnit(rawUnit);
  if (legacyPackSize) return { quantity, quantityUnit: legacyPackSize, kind: 'package' };

  const normalized = UNIT_ALIASES[normalizeUnitKey(rawUnit)];
  if (!normalized) return null;
  return { quantity, quantityUnit: normalized.unit, kind: normalized.kind };
}

/**
 * Accepts a quantity such as "500 ml", "2 kg", "3 packets", "1 pair",
 * "128 GB", or "2 packets, 2 kg". A combined package + measure keeps both.
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
  const quantities = parsed as Array<ParsedSaleQuantity & { kind: SaleQuantityUnitKind }>;

  if (quantities.length === 1) {
    const { quantity, quantityUnit } = quantities[0];
    return { quantity, quantityUnit };
  }

  const measured = quantities.find(part => part.kind === 'measure' || part.kind === 'technical');
  const packaged = quantities.find(part => part.kind === 'count' || part.kind === 'package' || part.kind === 'service');
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
