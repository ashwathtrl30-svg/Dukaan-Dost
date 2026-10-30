import type { ShopType } from '../types';
import { shopUsesMeasuredQuantity } from '../quantity';

export type VoiceTransactionType = 'sale' | 'expense' | 'udhaar';

export interface VoiceTransaction {
  type: VoiceTransactionType;
  /** Total rupee value for a sale/expense/credit entry. */
  amount: number;
  /** Product or service name, required for a voice sale. */
  itemName?: string;
  /** Separate count of items or services sold. */
  numberOfItemsSold?: number;
  /** Measured amount such as kg, g, ml or litre. */
  quantity?: number;
  /** Measurement unit spoken by the shopkeeper. */
  quantityUnit?: string;
  /** Optional separate package count when both count and total measure are spoken. */
  packageCount?: number;
  packageUnit?: string;
  /** Customer name for udhaar, required for a multi-entry voice credit. */
  customerName?: string;
  expenseCategory?: string;
  /** Short expense description, such as electricity bill or delivery. */
  note?: string;
}

export type VoiceParseError =
  | 'not_command'
  | 'no_type'
  | 'missing_amount'
  | 'ambiguous_amount'
  | 'missing_item'
  | 'missing_quantity'
  | 'missing_customer'
  | 'too_many_entries'
  | 'amount_out_of_range'
  | 'unclear';

export interface VoiceParseResult {
  transactions: VoiceTransaction[];
  error?: VoiceParseError;
}

interface Span {
  start: number;
  end: number;
  type: VoiceTransactionType;
}

interface AmountSpan {
  start: number;
  end: number;
  amount: number;
}

const NUMBER_WORDS: R¶»§q«^