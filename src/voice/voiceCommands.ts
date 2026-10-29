export type VoiceTransactionType = 'sale' | 'expense' | 'udhaar';

export interface VoiceTransaction {
  type: VoiceTransactionType;
  /** Total rupee value for a sale/expense/credit entry. */
  amount: number;
  /** Product or service name, required for a voice sale. */
  itemName?: string;
  /** Quantity/pieces recorded in a single sale. */
  quantity?: number;
  /** Unit spoken by the shopkeeper, e.g. kg, litre, packet or unit. */
  quantityUnit?: string;
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

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  ek: 1, eka: 1, aik: 1, ikk: 1, ik: 1, do: 2, dho: 2, teen: 3, tin: 3,
  char: 4, chaar: 4, paanch: 5, panch: 5, paanchh: 5, cheh: 6,
  chhe: 6, chhah: 6, chha: 6, saat: 7, sat: 7, aath: 8, ath: 8, nau: 9,
  nao: 9, das: 10, dus: 10, gyarah: 11, gyaarah: 11, barah: 12, baarah: 12,
  terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18,
  unnis: 19, bees: 20, ikkis: 21, ikkees: 21, bais: 22, baees: 22, teis: 23,
  chaubees: 24, pachis: 25, pachchis: 25, chhabis: 26, sattais: 27,
  athais: 28, untis: 29, tees: 30, ikattis: 31, battis: 32, taintis: 33,
  chauntis: 34, paintis: 35, chhattis: 36, saintis: 37, adtis: 38,
  untalis: 39, chalis: 40, bayalis: 42, taintalis: 43, chawalis: 44,
  paintalis: 45, chiyalis: 46, saintalis: 47, adtalis: 48, unchaas: 49,
  pachaas: 50, pachhas: 50, ikyavan: 51, bavan: 52, tirpan: 53, chauvan: 54,
  pachpan: 55, chhappan: 56, sattavan: 57, athavan: 58, unsath: 59,
  saath: 60, sath: 60, iksath: 61, basath: 62, tirsath: 63, chaunsath: 64,
  painsath: 65, chhiyasath: 66, sadsath: 67, adsath: 68, unhattar: 69,
  sattar: 70, ikahattar: 71, bahattar: 72, tihattar: 73, chauhattar: 74,
  pachhattar: 75, chhihattar: 76, satahattar: 77, athahattar: 78, unaasi: 79,
  assi: 80, ikyasi: 81, bayasi: 82, tirasi: 83, chaurasi: 84, pachasi: 85,
  chhiyasi: 86, sattasi: 87, athasi: 88, navasi: 89, nabbe: 90, ikyanve: 91,
  baanve: 92, tiranve: 93, chauranve: 94, pachanve: 95, chhiyanve: 96,
  satyanve: 97, athanve: 98, ninyanve: 99,
  'एक': 1, 'इक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'ग्यारह': 11,
  'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'बाइस': 22, 'तेईस': 23, 'चौबीस': 24,
  'पच्चीस': 25, 'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'उनतीस': 29,
  'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80,
  'नब्बे': 90,

  // Common Mumbai/Hinglish spellings and alternate transliterations.
  ikatees: 31, ekattis: 31, iktis: 31, baatis: 32, teintees: 33, chautis: 34, pantees: 35, chattis: 36, saintees: 37, adtees: 38, untaalis: 39, chaalis: 40, chalees: 40,
  iktalis: 41, iktalees: 41, baalis: 42, taintalees: 43, chavalis: 44, paitalis: 45, paintaalis: 45, paitalees: 45, chhiyalis: 46, saintalees: 47, adtaalis: 48, unchas: 49, ikavan: 51, baavan: 52, tirpann: 53, chauwan: 54, pachpann: 55, chappan: 56, satavan: 57, atthavan: 58, unsaath: 59, iksathh: 61, 'ba-sath': 62, tirsaath: 63, chaunsathh: 64, 'pain-sath': 65, chiyasath: 66, sadsathh: 67, adsaath: 68, unahattar: 69, satttar: 70, ikattar: 71, bahttar: 72,
  chauhatar: 74, pachattar: 75,
  chhihatar: 76, satattar: 77,
  athattar: 78, unasi: 79, asi: 80, ikasi: 81,
  baasi: 82, tiraasi: 83,
  choraasi: 84, pachaasi: 85,
  chiyasi: 86, satasi: 87,
  atthasi: 88, navaasi: 89,
  nabay: 90, ikyanaway: 91,
  banve: 92, tiraanve: 93,
  chauranaway: 94, panchanve: 95,
  chhiyanaway: 96, satyanaway: 97,
  athanaway: 98, ninyaanve: 99,
  'इकतीस': 31, 'इकत्तीस': 31, 'बत्तीस': 32, 'तैंतीस': 33, 'चौंतीस': 34,
  'चौतीस': 34, 'पैंतीस': 35, 'छत्तीस': 36, 'सैंतीस': 37,
  'अड़तीस': 38, 'अड़तीस': 38, 'उनतालीस': 39, 'उनचालीस': 39, 'इकतालीस': 41, 'इकतालिस': 41, 'बयालीस': 42, 'बयालिस': 42,
  'तैंतालीस': 43, 'तैतालीस': 43, 'चवालीस': 44, 'चव्वालीस': 44,
  'पैंतालीस': 45, 'पैतालीस': 45, 'छियालीस': 46, 'सैंतालीस': 47,
  'अड़तालीस': 48, 'अड़तालीस': 48, 'उनचास': 49,
  'इक्यावन': 51, 'बावन': 52, 'तिरपन': 53, 'चौवन': 54, 'पचपन': 55, 'छप्पन': 56, 'सत्तावन': 57, 'अट्ठावन': 58,
  'उनसठ': 59, 'उनसट': 59, 'इकसठ': 61, 'बासठ': 62,
  'तिरसठ': 63, 'चौंसठ': 64, 'पैंसठ': 65, 'छियासठ': 66,
  'सड़सठ': 67, 'सड़सठ': 67, 'अड़सठ': 68, 'अड़सठ': 68, 'उनहत्तर': 69, 'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73, 'चौहत्तर': 74,
  'पचहत्तर': 75, 'छिहत्तर': 76, 'सतहत्तर': 77, 'अठहत्तर': 78,
  'उन्नासी': 79, 'इक्यासी': 81, 'बयासी': 82,
  'तिरासी': 83, 'चौरासी': 84, 'पचासी': 85, 'छियासी': 86,
  'सतासी': 87, 'अट्ठासी': 88, 'नवासी': 89,
  'इक्यानवे': 91, 'इक्यानबे': 91, 'बानवे': 92, 'बानबे': 92,
  'तिरानवे': 93, 'तिरानबे': 93, 'चौरानवे': 94, 'चौरानबे': 94,
  'पचानवे': 95, 'पंचानवे': 95, 'छियानवे': 96, 'छियानबे': 96,
  'सत्तानवे': 97, 'सत्तानबे': 97, 'अट्ठानवे': 98, 'अट्ठानबे': 98,
  'निन्यानवे': 99, 'निन्यानबे': 99,
};

const HUNDRED_WORDS = new Set(['hundred', 'sau', 'सौ']);
const THOUSAND_WORDS = new Set(['thousand', 'hazaar', 'hazar', 'हज़ार', 'हजार']);
const LAKH_WORDS = new Set(['lakh', 'lac', 'लाख']);
const CRORE_WORDS = new Set(['crore', 'karod', 'करोड़', 'करोड']);
const NUMBER_WORD_SET = new Set([
  ...Object.keys(NUMBER_WORDS),
  ...HUNDRED_WORDS,
  ...THOUSAND_WORDS,
  ...LAKH_WORDS,
  ...CRORE_WORDS,
]);

function normalizeDigits(value: string): string {
  const digitMap: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return value.replace(/[०-९]/g, (digit) => digitMap[digit] || digit);
}

function parseWordNumber(words: string[]): number {
  let total = 0;
  let current = 0;
  for (const raw of words) {
    const word = raw.toLowerCase();
    if (word === 'and' || word === 'और') continue;
    if (HUNDRED_WORDS.has(word)) {
      current = (current || 1) * 100;
    } else if (THOUSAND_WORDS.has(word)) {
      total += (current || 1) * 1000;
      current = 0;
    } else if (LAKH_WORDS.has(word)) {
      total += (current || 1) * 100000;
      current = 0;
    } else if (CRORE_WORDS.has(word)) {
      total += (current || 1) * 10000000;
      current = 0;
    } else if (NUMBER_WORDS[word] !== undefined) {
      current += NUMBER_WORDS[word];
    } else {
      return 0;
    }
  }
  return total + current;
}

function findAmountSpans(text: string): AmountSpan[] {
  const tokens: Array<{ value: string; start: number; end: number }> = [];
  const tokenPattern = /[0-9०-९][0-9०-९,]*(?:\.[0-9]+)?|[a-z]+|[\u0900-\u097f]+/giu;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenPattern.exec(text)) !== null) {
    tokens.push({
      value: normalizeDigits(tokenMatch[0]).replace(/,/g, '').toLowerCase(),
      start: tokenMatch.index,
      end: tokenMatch.index + tokenMatch[0].length,
    });
  }

  const spans: AmountSpan[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(token.value)) {
      const amount = Number(token.value);
      if (Number.isFinite(amount) && amount > 0) {
        spans.push({ start: token.start, end: token.end, amount: Math.round(amount) });
      }
      continue;
    }

    if (!NUMBER_WORD_SET.has(token.value)) continue;

    const words = [token.value];
    let endIndex = token.end;
    let j = i + 1;
    while (j < tokens.length) {
      const next = tokens[j];
      if (NUMBER_WORD_SET.has(next.value)) {
        words.push(next.value);
        endIndex = next.end;
        j++;
        continue;
      }
      if (
        (next.value === 'and' || next.value === 'और') &&
        j + 1 < tokens.length &&
        NUMBER_WORD_SET.has(tokens[j + 1].value)
      ) {
        words.push(next.value);
        endIndex = next.end;
        j++;
        continue;
      }
      break;
    }

    const amount = parseWordNumber(words);
    if (amount > 0 && Number.isFinite(amount)) {
      spans.push({ start: token.start, end: endIndex, amount: Math.round(amount) });
      i = j - 1;
    }
  }
  return spans;
}

function findMarkers(text: string): Span[] {
  const patterns: Array<{ type: VoiceTransactionType; pattern: RegExp }> = [
    { type: 'sale', pattern: /\b(?:sales?|sell|sold|bikri|bika|becha)\b|बिक्री|बिका|बेचा|सेल/giu },
    { type: 'expense', pattern: /\b(?:expenses?|kharch(?:a|aa)?)\b|खर्च|ख़र्च|खर्चा|व्यय/giu },
    { type: 'udhaar', pattern: /\b(?:udhaar|udhar|credit)\b|उधार/giu },
  ];

  const markers: Span[] = [];
  for (const item of patterns) {
    let match: RegExpExecArray | null;
    while ((match = item.pattern.exec(text)) !== null) {
      markers.push({ type: item.type, start: match.index, end: match.index + match[0].length });
    }
  }
  return markers.sort((a, b) => a.start - b.start);
}

function distanceBetween(a: AmountSpan, marker: Span): number {
  if (a.end <= marker.start) return marker.start - a.end;
  if (a.start >= marker.end) return a.start - marker.end;
  return 0;
}

function getCustomerName(text: string): string | undefined {
  const patterns = [
    /\b([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,1})\s+(?:ko|ke naam se|ke naam par)\b/i,
    /([\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,1})\s+(?:को|के नाम से|के नाम पर)/u,
    /\b(?:for|to|customer|named|name is)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})/i,
    /(?:नाम है|को)\s*([\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,2})/u,
    /\b(?:naam|naam pe|naam par)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const name = match[1].trim().replace(/\s+(?:rupees?|rupaye?|rs|udhaar|udhar|credit|add|jodo|karo|please).*$/i, '').trim();
      const reserved = /^(?:rupees?|rupaye?|rs|add|sale|sales|expense|expenses|udhaar|udhar|credit)$/i.test(name) ||
        /^(?:उधार|बिक्री|खर्च|जोड़ो|जोड़ें|डालो|दर्ज)$/u.test(name);
      if (name && !reserved) return name.slice(0, 80);
    }
  }
  return undefined;
}

interface ExpenseCategoryMatch {
  category: string;
  start: number;
  end: number;
}

function findExpenseCategoryMatches(text: string): ExpenseCategoryMatch[] {
  const patterns: Array<{ category: string; pattern: RegExp }> = [
    {
      category: 'rent',
      pattern: /\b(?:rent|rental|kiraya|kiraye|kirayaa)\b|किराया|किराए|किराये/iu,
    },
    {
      category: 'electricity',
      pattern: /\b(?:electricity|electric|bijli|light bill|electric bill|power bill)\b|बिजली(?:\s+का)?\s*बिल?|लाइट\s*बिल/iu,
    },
    {
      category: 'salary',
      pattern: /\b(?:salary|salaries|wage|wages|payroll|staff payment|staff salary|employee payment|mazdoori|majduri|tankhwa|tankha|pagar|pagaar|vetan)\b|तनख़्वाह|तनख्वाह|वेतन|मजदूरी|मज़दूरी/iu,
    },
    {
      category: 'transport',
      pattern: /\b(?:transport|delivery|fuel|petrol|diesel|shipping|courier|freight|vehicle expense|travel expense|transportation)\b|ढुलाई|पेट्रोल|डीजल|डीज़ल|ईंधन|डिलीवरी|यातायात|ट्रांसपोर्ट/iu,
    },
    {
      category: 'packaging',
      pattern: /\b(?:packaging|packing|packing material|carry bags|package)\b|पैकिंग|पैकेजिंग|थैली|पैकिंग का सामान/iu,
    },
    {
      category: 'maintenance',
      pattern: /\b(?:maintenance|repair|repairs|repairing|servicing|service charge|plumbing)\b|मरम्मत|रिपेयर|मेंटेनेंस|सर्विसिंग/iu,
    },
    {
      category: 'stock',
      pattern: /\b(?:stock purchase|stock|inventory|goods purchase|purchase of goods|items purchase|purchase|goods|maal|samaan|saman)\b|स्टॉक|सामान|माल|खरीदारी|माल खरीद/iu,
    },
  ];

  return patterns.flatMap(({ category, pattern }) => {
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    return [...text.matchAll(globalPattern)].map((match) => ({
      category,
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }));
  });
}

function detectExpenseCategory(text: string, marker?: Span): string {
  const matches = findExpenseCategoryMatches(text);
  if (!matches.length) return 'other';

  if (!marker) {
    return matches.sort((a, b) => a.start - b.start)[0].category;
  }

  const distance = (match: ExpenseCategoryMatch) => {
    if (match.end <= marker.start) return marker.start - match.end;
    if (match.start >= marker.end) return match.start - marker.end;
    return 0;
  };
  const closest = matches.sort((a, b) => distance(a) - distance(b))[0];
  return distance(closest) <= 80 ? closest.category : 'other';
}


const MAX_VOICE_BATCH = 5;
const MAX_VOICE_AMOUNT = 10_000_000;

function isQuantitySpan(span: AmountSpan, text: string): boolean {
  const after = text.slice(span.end, span.end + 55);
  return /^\s*(?:(?:aadhe?|aadha|aadhi|aadhay|half)\s+kilo\s+ke\s+packets?|half[- ]kilo\s+packets?|(?:aadhe?|aadha|half)\s+kilo\s+packets?|(?:[0-9]+(?:\.[0-9]+)?\s*)?(?:kg|kilos?|kilograms?|grams?|gram|gm|g|litres?|liters?|ltr|l|packets?|packs?|pieces?|pcs?|units?|items?|bottles?|boxes?|dozen|dz|किलो|किलोग्राम|ग्राम|लीटर|लिटर|पैकेट|पीस|नग|बोतल|डिब्बा|डिब्बे|पाव|आधा|आधे|आधी|क्विंटल))/iu.test(after);
}

function isAttachedBrandNumber(span: AmountSpan, text: string): boolean {
  const after = text.slice(span.end, span.end + 3);
  if (!after || /^\s/.test(after)) return false;
  if (/^\s*(?:₹|rs\.?|rupees?|rupay|rupaye|rupaya|rupiya|रुपये?|रुपया|रुपए)/iu.test(after)) return false;
  return /^[a-z]/i.test(after);
}

function currencySuffixEnd(span: AmountSpan, text: string): number {
  const after = text.slice(span.end);
  const match = /^\s*(?:₹|rs\.?|rupees?|rupee|rupay(?:e)?|rupaye|rupaya|rupiya|rupaiya|रुपये?|रुपया|रुपए|रूपये?|रूपए|रुपिया|रुपइया|रुपिया|पैसे?)/iu.exec(after);
  return span.end + (match ? match[0].length : 0);
}

function closestExpenseCategory(text: string, span: AmountSpan): ExpenseCategoryMatch | undefined {
  const local = text.slice(Math.max(0, span.start - 65), Math.min(text.length, span.end + 90));
  if (/(?:samaan|saman|maal)\s+(?:bhejne|bhejna|bhejane|bhejne\s+mein|bhejne\s+me)|सामान\s+भेजने|माल\s+भेजने|भेजने\s+में/iu.test(local)) {
    const match = /(?:samaan|saman|maal)\s+(?:bhejne|bhejna|bhejane|bhejne\s+mein|bhejne\s+me)|सामान\s+भेजने|माल\s+भेजने|भेजने\s+में/iu.exec(local);
    if (match) {
      const start = Math.max(0, span.start - 65) + (match.index || 0);
      return { category: 'transport', start, end: start + match[0].length };
    }
  }
  const matches = findExpenseCategoryMatches(text);
  matches.sort((a, b) => {
    const distA = span.end <= a.start ? a.start - span.end : span.start >= a.end ? span.start - a.end : 0;
    const distB = span.end <= b.start ? b.start - span.end : span.start >= b.end ? span.start - b.end : 0;
    return distA - distB;
  });
  if (!matches.length) return undefined;
  const chosen = matches[0];
  const distance = span.end <= chosen.start ? chosen.start - span.end : span.start >= chosen.end ? span.start - chosen.end : 0;
  return distance <= 90 ? chosen : undefined;
}

function stripVoiceCommandWords(value: string): string {
  return value
    // Remove command/type tokens individually rather than cutting off everything
    // after the first one. That preserves item names in phrases like
    // "add sales: do kilo aloo 100 rupaye".
    .replace(/\b(?:in\s+sab|sab\s+ka|sabka|sab\s+ki|please|add\s+it|add|record|enter|log|save|put|jod(?:o|na)?|daal(?:o)?|darj|jama|karo|kar\s+do|sales?|sell|sold|bikri|bika|becha|bech\s+diya|bik\s+gaya|bik\s+gayi|expenses?|kharch(?:a|e|aa)?|udhaar|udhar|credit)\b/giu, ' ')
    .replace(/जोड़(?:ो|ें|ना|िए)?|डाल(?:ो|िए)?|दर्ज|जमा|करो|करें|कर\s+दो|बिक्री|बिका|बेचा|बेच\s+दिया|बिक\s+गया|बिक\s+गई|खर्च(?:ा|े)?|उधार|ऐड|एड/gu, ' ')
    .replace(/\b(?:in|mein|mai|me|and|aur|phir|then|total)\b/giu, ' ')
    .replace(/(?:में|मै|और|फिर|कुल)\s*$/gu, '')
    .replace(/[,:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLeadingQuantity(segment: string): { quantity: number; quantityUnit: string; remainder: string } {
  let value = segment.trim().replace(/^[,;:\s]+/, '');
  value = value.replace(/^(?:and|aur|phir|then|plus|और|फिर)\s+/iu, '');
  const spans = findAmountSpans(value);
  const first = spans[0];
  if (!first || first.start > 3 || isQuantitySpan(first, value) === false && currencySuffixEnd(first, value) > first.end) {
    return { quantity: 1, quantityUnit: 'unit', remainder: value };
  }

  const after = value.slice(first.end);
  const halfPacket = /^\s*(?:(?:aadhe?|aadha|aadhi|aadhay|half)\s+kilo\s+ke\s+packets?|half[- ]kilo\s+packets?|(?:aadhe?|aadha|half)\s+kilo\s+packets?)/iu.exec(after);
  if (halfPacket) {
    return {
      quantity: first.amount,
      quantityUnit: '500 g packet',
      remainder: value.slice(first.end + halfPacket[0].length),
    };
  }

  const unitMatch = /^\s*(kilos?|kilograms?|kg|grams?|gm|g|litres?|liters?|ltr|l|packets?|packs?|pieces?|pcs?|units?|items?|bottles?|boxes?|dozen|dz|किलो|किलोग्राम|ग्राम|लीटर|लिटर|पैकेट|पीस|नग|बोतल|डिब्बा|डिब्बे|पाव|क्विंटल)/iu.exec(after);
  if (unitMatch) {
    const word = unitMatch[1].toLowerCase();
    let quantityUnit = word;
    if (/^(?:kilo|kilogram|kg)/i.test(word) || word === 'किलो' || word === 'किलोग्राम') quantityUnit = 'kg';
    else if (/^(?:gram|gm|g)$/i.test(word) || word === 'ग्राम') quantityUnit = 'g';
    else if (/^(?:litre|liter|ltr|l)$/i.test(word) || word === 'लीटर' || word === 'लिटर') quantityUnit = 'litre';
    else if (/^(?:packet|pack|पैकेट)/i.test(word)) quantityUnit = 'packet';
    else if (/^(?:piece|pc|pcs|पीस|नग)/i.test(word)) quantityUnit = 'piece';
    else if (/^(?:bottle|बोतल)/i.test(word)) quantityUnit = 'bottle';
    else if (/^(?:box|boxes|डिब्बा|डिब्बे)/i.test(word)) quantityUnit = 'box';
    else if (/^(?:dozen|dz)/i.test(word)) quantityUnit = 'dozen';
    const consumed = first.end + unitMatch[0].length;
    return { quantity: first.amount, quantityUnit, remainder: value.slice(consumed) };
  }

  // A spoken number immediately before a product name is treated as count.
  // The price span itself is excluded from this descriptor, so it cannot be consumed here.
  return { quantity: first.amount, quantityUnit: 'unit', remainder: value.slice(first.end) };
}

function cleanSaleItemName(segment: string): { itemName: string; quantity: number; quantityUnit: string } {
  const parsed = parseLeadingQuantity(segment);
  let itemName = stripVoiceCommandWords(parsed.remainder);
  itemName = itemName
    .replace(/\b(?:rupees?|rupee|rs|rupay|rupaye|rupaya|rupiya|रुपये?|रुपया|रुपए|रूपये?|रूपए)\b/giu, ' ')
    .replace(/^(?:of|for|the|a|an|ka|ki|ke|kilo|kg|packet|pack|aur|and|में|की|का|के)\s+/iu, '')
    .replace(/(?:से|में)\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { itemName, quantity: parsed.quantity, quantityUnit: parsed.quantityUnit };
}

function getNameFromContext(context: string): string | undefined {
  const name = getCustomerName(context);
  if (name) return name;
  const devanagariName = /([\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,1})\s+(?:को|के नाम से|के नाम पर)/u.exec(context);
  if (devanagariName?.[1]) return devanagariName[1].trim().slice(0, 80);

  // Accept a plain customer name only when the local amount segment resolves
  // to one or two name-like tokens. Never substitute "Unknown" silently.
  let candidate = stripVoiceCommandWords(context)
    .replace(/[0-9०-९,₹.]+/gu, ' ')
    .replace(/\b(?:rupees?|rupee|rs|rupay|rupaye|rupaya|rupiya|रुपये?|रुपया|रुपए|रूपये?|रूपए|पैसे?|udhaar|udhar|credit|उधार|को|नाम|पर|से|for|to|customer|named|name|is)\b/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = candidate.split(/\s+/u).filter(Boolean);
  if (
    words.length >= 1 &&
    words.length <= 2 &&
    words.every(word => /^[\p{L}][\p{L}'-]*$/u.test(word)) &&
    !words.some(word => NUMBER_WORD_SET.has(word.toLowerCase())) &&
    !/^(?:sales?|expense|expenses|sale|add|please|total|amount|and|or)$/iu.test(candidate)
  ) {
    return candidate.slice(0, 80);
  }
  return undefined;
}

function classifyVoiceTransaction(
  text: string,
  span: AmountSpan,
  markers: Span[],
  distinctTypes: Set<VoiceTransactionType>,
  fallbackType: VoiceTransactionType,
): VoiceTransactionType | undefined {
  if (distinctTypes.size === 1) return fallbackType;
  const category = closestExpenseCategory(text, span);
  const nearbyMarkers = markers
    .map(marker => ({
      marker,
      distance: span.end <= marker.start ? marker.start - span.end : span.start >= marker.end ? span.start - marker.end : 0,
    }))
    .filter(item => item.distance <= 58)
    .sort((a, b) => a.distance - b.distance);
  if (category && distinctTypes.has('expense')) {
    const categoryDistance = span.end <= category.start ? category.start - span.end : span.start >= category.end ? span.start - category.end : 0;
    if (!nearbyMarkers.length || nearbyMarkers[0].distance >= categoryDistance) return 'expense';
  }
  if (nearbyMarkers.length) {
    const first = nearbyMarkers[0];
    const conflicting = nearbyMarkers.find(item => item.marker.type !== first.marker.type && item.distance - first.distance < 10);
    if (conflicting) return undefined;
    return first.marker.type;
  }
  return undefined;
}


export function parseVoiceTransactions(input: string): VoiceParseResult {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) return { transactions: [], error: 'not_command' };

  const actionPattern =
    /\b(?:add|record|enter|log|save|put|jod|jodo|jodna|likho?|likh|daal|dalo|dal|darj|jama|karo|kar do|kar do na)\b|जोड़|जोड़ो|जोड़ें|जोड़ना|जोड़िए|डाल|डालो|डालिए|दर्ज|लिख|जमा|ऐड|एड|करो|करें|करना|डाल दो/iu;
  const questionPattern =
    /\b(?:what|when|where|why|how|can|should|tell|show|kitna|kitne|kitni|kya|kaise|kyun|batao)\b|कितना|कितनी|कितने|क्या|कैसे|क्यों|बताओ/iu;
  if (!actionPattern.test(text) || questionPattern.test(text)) {
    return { transactions: [], error: 'not_command' };
  }

  const markers = findMarkers(text);
  const distinctTypes = new Set(markers.map(marker => marker.type));
  const mentionedExpenseCategory = detectExpenseCategory(text);
  if (!distinctTypes.size && mentionedExpenseCategory !== 'other') distinctTypes.add('expense');
  if (!distinctTypes.size) return { transactions: [], error: 'no_type' };
  const fallbackType = distinctTypes.size === 1
    ? [...distinctTypes][0]
    : undefined;

  const numberSpans = findAmountSpans(text);
  const moneySpans = numberSpans.filter(span =>
    !isQuantitySpan(span, text) && !isAttachedBrandNumber(span, text),
  );
  if (!moneySpans.length) return { transactions: [], error: 'missing_amount' };
  if (moneySpans.length > MAX_VOICE_BATCH) {
    return { transactions: [], error: 'too_many_entries' };
  }
  if (moneySpans.some(span => span.amount > MAX_VOICE_AMOUNT)) {
    return { transactions: [], error: 'amount_out_of_range' };
  }

  const suffixEnds = moneySpans.map(span => currencySuffixEnd(span, text));
  const firstLeft = text.slice(0, moneySpans[0].start);
  const firstRight = text.slice(suffixEnds[0], moneySpans.length > 1 ? moneySpans[1].start : text.length);
  const firstLeftItem = cleanSaleItemName(firstLeft).itemName;
  const firstRightItem = cleanSaleItemName(firstRight).itemName;
  const amountBeforeDescriptor = !firstLeftItem && Boolean(firstRightItem);

  const transactions: VoiceTransaction[] = [];
  for (let index = 0; index < moneySpans.length; index++) {
    const span = moneySpans[index];
    const leftStart = index === 0 ? 0 : suffixEnds[index - 1];
    const left = text.slice(leftStart, span.start);
    const right = text.slice(suffixEnds[index], index + 1 < moneySpans.length ? moneySpans[index + 1].start : text.length);
    const type = distinctTypes.size === 1
      ? fallbackType
      : classifyVoiceTransaction(text, span, markers, distinctTypes, 'sale');
    if (!type) return { transactions: [], error: 'ambiguous_amount' };

    if (type === 'sale') {
      const descriptor = amountBeforeDescriptor ? right : left;
      const parsedItem = cleanSaleItemName(descriptor);
      if (!parsedItem.itemName) return { transactions: [], error: 'missing_item' };
      transactions.push({
        type,
        amount: span.amount,
        itemName: parsedItem.itemName,
        quantity: parsedItem.quantity,
        quantityUnit: parsedItem.quantityUnit,
      });
      continue;
    }

    if (type === 'udhaar') {
      const name = getNameFromContext(left) || getNameFromContext(right);
      if (!name) return { transactions: [], error: 'missing_customer' };
      transactions.push({ type, amount: span.amount, customerName: name });
      continue;
    }

    const categoryMatch = closestExpenseCategory(text, span);
    const expenseCategory = categoryMatch?.category || 'other';
    const categoryInLeft = categoryMatch ? categoryMatch.start >= leftStart && categoryMatch.end <= span.start : false;
    const noteSource = categoryInLeft ? left : right;
    const note = stripVoiceCommandWords(noteSource).slice(0, 100);
    transactions.push({
      type: 'expense',
      amount: span.amount,
      expenseCategory,
      note: note || undefined,
    });
  }

  if (transactions.length > MAX_VOICE_BATCH) return { transactions: [], error: 'too_many_entries' };
  return { transactions };
}
