/**
 * Model-independent contract for Dukaan Dost Camera V1.
 *
 * This module deliberately does not import the app store or alter SaleEntry.
 * It validates untrusted model output before a later review-and-save workflow.
 */

export type CameraAmountSource =
  | 'printed_line_total'
  | 'explicit_unit_rate_calculation'
  | 'uncertain';

export type CameraConfidence = 'high' | 'medium' | 'low';

/**
 * Ephemeral evidence used only to independently verify a calculated line amount.
 * It is not shown as a separate price field and is never mapped to SaleEntry.
 */
export interface CameraAmountCalculation {
  unitRate: number;
  rateUnit: string;
}

/** Canonical V1 response requested from the vision model. */
export interface CameraExtractedItem {
  productName: string;
  quantity: number | null;
  quantityUnit: string | null;
  /** Final amount for this line in INR, never a unit price. */
  finalAmount: number | null;
  amountSource: CameraAmountSource;
  /** Required as null or evidence metadata; not a user-facing Sales field. */
  amountCalculation: CameraAmountCalculation | null;
  confidence: CameraConfidence;
  needsReview: boolean;
  reviewReasons: string[];
}

export interface CameraExtractionResponse {
  schemaVersion: 1;
  items: CameraExtractedItem[];
}

/** A safe, normalised row for a future review screen. */
export interface ValidatedCameraItem extends CameraExtractedItem {
  /** Index from the original response, useful for stable review-row keys. */
  sourceIndex: number;
  /** Integer paise avoids binary floating-point arithmetic in comparisons. */
  finalAmountPaise: number | null;
}

export type CameraExtractionValidation =
  | {
      ok: true;
      items: ValidatedCameraItem[];
      reviewCount: number;
    }
  | {
      ok: false;
      code: 'invalid_json' | 'invalid_response' | 'missing_items' | 'empty_items';
      message: string;
    };

const MAX_PRODUCT_NAME_LENGTH = 120;
const MAX_UNIT_LENGTH = 40;
const MAX_REVIEW_REASON_LENGTH = 200;

/**
 * Convert a positive INR amount to integer paise.
 * Values with more than two meaningful decimal places are rejected.
 */
export function rupeesToPaise(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;

  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise) || paise <= 0) return null;

  const roundTrip = paise / 100;
  if (Math.abs(value - roundTrip) > 1e-7) return null;

  return paise;
}

/** Convert integer paise back to the rupee number expected by SaleEntry.amount. */
export function paiseToRupees(paise: number): number | null {
  if (!Number.isSafeInteger(paise) || paise <= 0) return null;
  return paise / 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function uniqueReasons(reasons: string[]): string[] {
  return [...new Set(reasons.map(reason => reason.trim()).filter(Boolean))];
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function confidenceOf(value: unknown): CameraConfidence {
  return value === 'high' || value === 'medium' || value === 'low'
    ? value
    : 'low';
}

function comparableUnit(value: string): string {
  const token = value.trim().toLowerCase().replace(/[\\s._-]+/g, '');
  const aliases: Record<string, string> = {
    kg: 'kg', kilogram: 'kg', kilograms: 'kg',
    g: 'g', gram: 'g', grams: 'g',
    l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
    ml: 'ml', millilitre: 'ml', millilitres: 'ml',
    milliliter: 'ml', milliliters: 'ml',
    piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
    unit: 'piece', units: 'piece', each: 'piece',
    packet: 'packet', packets: 'packet', pack: 'packet', packs: 'packet',
  };
  return aliases[token] ?? token;
}

function amountSourceOf(value: unknown): CameraAmountSource {
  return value === 'printed_line_total' ||
    value === 'explicit_unit_rate_calculation' ||
    value === 'uncertain'
    ? value
    : 'uncertain';
}

function parseJsonIfNeeded(input: unknown): CameraExtractionValidation | unknown {
  if (typeof input !== 'string') return input;

  try {
    return JSON.parse(input) as unknown;
  } catch {
    return {
      ok: false,
      code: 'invalid_json',
      message: 'The camera model returned invalid JSON. Please retry the photo.',
    } satisfies CameraExtractionValidation;
  }
}

/**
 * Validate untrusted model output without dropping individual rows.
 *
 * Incomplete rows remain visible as editable review rows. Only an invalid
 * top-level response prevents review from opening.
 */
export function validateCameraExtraction(
  input: unknown,
): CameraExtractionValidation {
  const parsed = parseJsonIfNeeded(input);
  if (
    isRecord(parsed) &&
    parsed.ok === false &&
    parsed.code === 'invalid_json'
  ) {
    return parsed as CameraExtractionValidation;
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      code: 'invalid_response',
      message: 'The camera model returned an unexpected response.',
    };
  }

  if (parsed.schemaVersion !== 1) {
    return {
      ok: false,
      code: 'invalid_response',
      message: 'The camera response version is not supported.',
    };
  }

  if (!Array.isArray(parsed.items)) {
    return {
      ok: false,
      code: 'missing_items',
      message: 'The camera response did not contain an item list.',
    };
  }

  if (parsed.items.length === 0) {
    return {
      ok: false,
      code: 'empty_items',
      message: 'No sale items were identified. Try a clearer or closer photo.',
    };
  }

  const items = parsed.items.map((rawItem, sourceIndex): ValidatedCameraItem => {
    const row = isRecord(rawItem) ? rawItem : {};
    const reasons: string[] = Array.isArray(row.reviewReasons)
      ? row.reviewReasons
          .filter((reason): reason is string => typeof reason === 'string')
          .map(reason => reason.trim().slice(0, MAX_REVIEW_REASON_LENGTH))
          .filter(Boolean)
      : [];

    const productNameValue = boundedText(row.productName, MAX_PRODUCT_NAME_LENGTH);
    const productName = productNameValue ?? '';
    if (!productName) reasons.push('Product name could not be identified.');
    if (
      typeof row.productName === 'string' &&
      row.productName.trim().length > MAX_PRODUCT_NAME_LENGTH
    ) {
      reasons.push('Product name is unusually long; check the extracted text.');
    }

    let quantity: number | null = null;
    if (row.quantity === null || row.quantity === undefined) {
      reasons.push('Quantity was not identified; enter or confirm it.');
    } else if (
      typeof row.quantity === 'number' &&
      Number.isFinite(row.quantity) &&
      row.quantity > 0
    ) {
      quantity = row.quantity;
    } else {
      reasons.push('Quantity is invalid or unreadable; correct it before saving.');
    }

    const quantityUnitValue = boundedText(row.quantityUnit, MAX_UNIT_LENGTH);
    const quantityUnit = quantityUnitValue;
    if (quantity !== null && !quantityUnit) {
      reasons.push('Quantity unit is missing; confirm the unit before saving.');
    }
    if (quantity === null && quantityUnit) {
      reasons.push('A unit was detected without a reliable quantity.');
    }

    const finalAmountPaise =
      typeof row.finalAmount === 'number'
        ? rupeesToPaise(row.finalAmount)
        : null;
    const finalAmount = finalAmountPaise === null
      ? null
      : paiseToRupees(finalAmountPaise);

    if (finalAmount === null) {
      reasons.push('Final item amount is missing, invalid or has more than two decimal places.');
    }

    const confidence = confidenceOf(row.confidence);
    if (confidence !== 'high') {
      reasons.push('The extracted details need a manual accuracy check.');
    }

    const amountSource = amountSourceOf(row.amountSource);
    let amountCalculation: CameraAmountCalculation | null = null;
    let amountCalculationRatePaise: number | null = null;
    if (isRecord(row.amountCalculation)) {
      const rateUnit = boundedText(row.amountCalculation.rateUnit, MAX_UNIT_LENGTH);
      const ratePaise = typeof row.amountCalculation.unitRate === 'number'
        ? rupeesToPaise(row.amountCalculation.unitRate)
        : null;
      if (rateUnit && ratePaise !== null) {
        amountCalculation = {
          unitRate: ratePaise / 100,
          rateUnit,
        };
        amountCalculationRatePaise = ratePaise;
      } else {
        reasons.push('The unit-rate evidence is invalid; verify the calculated amount.');
      }
    }

    if (amountSource === 'uncertain') {
      reasons.push('It is unclear whether the visible price is a line total or a unit rate.');
    } else if (amountSource === 'explicit_unit_rate_calculation') {
      reasons.push('The final amount was calculated from a unit rate; verify the quantity, unit and result.');
      if (!amountCalculation || amountCalculationRatePaise === null) {
        reasons.push('The unit rate and its unit were not provided, so the calculation cannot be independently checked.');
      } else if (quantity === null || !quantityUnit) {
        reasons.push('The quantity or quantity unit is missing, so the calculation cannot be independently checked.');
      } else if (comparableUnit(quantityUnit) !== comparableUnit(amountCalculation.rateUnit)) {
        reasons.push('The unit-rate basis does not match the sale quantity unit; verify the amount.');
      } else if (finalAmountPaise !== null) {
        const calculatedPaise = Math.round(quantity * amountCalculationRatePaise);
        if (!Number.isSafeInteger(calculatedPaise) || calculatedPaise <= 0) {
          reasons.push('The unit-rate calculation is outside the supported amount range.');
        } else if (calculatedPaise !== finalAmountPaise) {
          reasons.push('The extracted final amount does not match quantity multiplied by the stated unit rate.');
        }
      }
    }

    if (row.needsReview === true && reasons.length === 0) {
      reasons.push('The model marked this item for review.');
    }
    if (row.needsReview !== true && row.needsReview !== false) {
      reasons.push('The model did not provide a valid review status.');
    }

    const reviewReasons = uniqueReasons(reasons);
    const needsReview =
      reviewReasons.length > 0 ||
      confidence !== 'high' ||
      amountSource === 'uncertain';

    return {
      sourceIndex,
      productName,
      quantity,
      quantityUnit,
      finalAmount,
      finalAmountPaise,
      amountSource,
      amountCalculation,
      confidence,
      needsReview,
      reviewReasons,
    };
  });

  return {
    ok: true,
    items,
    reviewCount: items.filter(item => item.needsReview).length,
  };
}
