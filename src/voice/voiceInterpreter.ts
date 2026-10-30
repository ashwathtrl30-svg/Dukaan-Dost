import type { ShopType, Language } from '../types';
import type { VoiceParseError, VoiceTransaction } from './voiceCommands';

export interface VoiceInterpretation {
  transactions: VoiceTransaction[];
  selectedTranscript?: string;
  error?: VoiceParseError;
  clarification?: string;
}

export interface InterpretVoiceOptions {
  transcript: string;
  candidates?: string[];
  shopType: ShopType | null;
  language: Language;
  signal?: AbortSignal;
}

const PARSE_ERRORS = new Set<VoiceParseError>([
  'not_command',
  'no_type',
  'missing_amount',
  'ambiguous_amount',
  'missing_item',
  'missing_quantity',
  'missing_customer',
  'too_many_entries',
  'amount_out_of_range',
  'unclear',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseError(value: unknown): VoiceParseError {
  return typeof value === 'string' && PARSE_ERRORS.has(value as VoiceParseError)
    ? value as VoiceParseError
    : 'unclear';
}

function parseTransaction(value: unknown): VoiceTransaction | null {
  const item = asRecord(value);
  if (!item) return null;

  const type = item.type;
  const amount = Number(item.amount);
  if (!['sale', 'expense', 'udhaar'].includes(String(type))) return null;
  if (!Number.isInteger(amount) || amount <= 0 || amount > 10_000_000) return null;

  if (type === 'sale') {
    const itemName = typeof item.itemName === 'string' ? item.itemName.trim().slice(0, 80) : '';
    const numberOfItemsSold = Number(item.numberOfItemsSold);
    const quantity = item.quantity === undefined ? undefined : Number(item.quantity);
    const quantityUnit = typeof item.quantityUnit === 'string' ? item.quantityUnit.trim() : undefined;
    const packageCount = item.packageCount === undefined ? undefined : Number(item.packageCount);
    const packageUnit = typeof item.packageUnit === 'string' ? item.packageUnit.trim() : undefined;

    if (!itemName || !Number.isFinite(numberOfItemsSold) || numberOfItemsSold <= 0) return null;
    if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0 || !quantityUnit)) return null;
    if (packageCount !== undefined && (!Number.isFinite(packageCount) || packageCount <= 0 || !packageUnit)) return null;

    return {
      type: 'sale',
      amount,
      itemName,
      numberOfItemsSold,
      ...(quantity !== undefined && quantityUnit ? { quantity, quantityUnit } : {}),
      ...(packageCount !== undefined && packageUnit ? { packageCount, packageUnit } : {}),
    };
  }

  if (type === 'udhaar') {
    const customerName = typeof item.customerName === 'string' ? item.customerName.trim().slice(0, 80) : '';
    if (!customerName) return null;
    return { type: 'udhaar', amount, customerName };
  }

  const allowedCategories = new Set([
    'rent', 'electricity', 'salary', 'transport', 'packaging',
    'maintenance', 'stock', 'other',
  ]);
  const expenseCategory = typeof item.expenseCategory === 'string' && allowedCategories.has(item.expenseCategory)
    ? item.expenseCategory
    : 'other';
  const note = typeof item.note === 'string' ? item.note.trim().slice(0, 100) : '';
  return { type: 'expense', amount, expenseCategory, ...(note ? { note } : {}) };
}

export async function interpretVoiceTransactions(
  options: InterpretVoiceOptions,
): Promise<VoiceInterpretation> {
  const transcript = options.transcript.trim();
  if (!transcript || transcript.length > 1600) {
    return {
      transactions: [],
      error: 'unclear',
      clarification: 'Enter a voice transcript of up to 1,600 characters.',
    };
  }

  const candidates = Array.isArray(options.candidates)
    ? [...new Set(options.candidates.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim().slice(0, 1600)))].slice(0, 5)
    : [];

  const response = await fetch('/api/parse-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      candidates,
      shopType: options.shopType || 'other',
      language: options.language,
    }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  const payload = asRecord(await response.json().catch(() => null));
  if (!payload) {
    throw new Error('The voice interpretation service returned an unreadable response.');
  }

  const rawError = parseError(payload.error);
  const clarification = typeof payload.clarification === 'string'
    ? payload.clarification.trim().slice(0, 300)
    : '';
  const selectedTranscript = typeof payload.selectedTranscript === 'string' && payload.selectedTranscript.trim()
    ? payload.selectedTranscript.trim().slice(0, 1600)
    : transcript;

  if (!response.ok) {
    if (PARSE_ERRORS.has(payload.error as VoiceParseError)) {
      return { transactions: [], error: rawError, clarification: clarification || 'Please repeat the entry more clearly.' };
    }
    const message = typeof payload.error === 'string' ? payload.error : 'The AI voice service is temporarily unavailable.';
    throw new Error(message);
  }

  if (!Array.isArray(payload.transactions) || payload.transactions.length === 0) {
    return {
      transactions: [],
      error: rawError,
      selectedTranscript,
      clarification: clarification || 'Please repeat the item or customer, amount, and transaction type.',
    };
  }

  if (payload.transactions.length > 5) {
    return {
      transactions: [],
      error: 'too_many_entries',
      selectedTranscript,
      clarification: 'Please split this into batches of five or fewer entries.',
    };
  }

  const transactions = payload.transactions.map(parseTransaction);
  if (transactions.some((transaction) => transaction === null)) {
    return {
      transactions: [],
      error: 'unclear',
      selectedTranscript,
      clarification: 'I could not safely verify every field. Nothing was saved; please say the entry again.',
    };
  }

  return {
    transactions: transactions as VoiceTransaction[],
    selectedTranscript,
    clarification: clarification || undefined,
  };
}
