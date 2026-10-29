export type VoiceTransactionType = 'sale' | 'expense' | 'udhaar';

export interface VoiceTransaction {
  type: VoiceTransactionType;
  amount: number;
  itemName?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
  customerName?: string;
  expenseCategory?: string;
}

export interface VoiceParseResult {
  transactions: VoiceTransaction[];
  error?: 'not_command' | 'no_type' | 'missing_amount' | 'ambiguous_amount' | 'missing_item' | 'missing_customer' | 'unclear_entry' | 'too_many_entries';
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
};


Object.assign(NUMBER_WORDS, {
  // Common speech-to-text and shopkeeper transliteration variants.
  chalis: 40, chaalis: 40, chalees: 40, chalish: 40, challees: 40,
  iktaalis: 41, iktalis: 41, iktalees: 41,
  byaalees: 42, taintalis: 43, teintalis: 43,
  chaunalis: 44, chavaalis: 44, paitalis: 45, pentaalis: 45, pentalis: 45, paintalees: 45,
  chhiyalis: 46, saintaalis: 47, athtalis: 48, unachas: 49,
  pachhaas: 50, ikyawan: 51, bawan: 52, tirpaan: 53, chavan: 54,
  pachpaan: 55, chappan: 56, satavan: 57, atthavan: 58, unsathh: 59,
  saathh: 60, iksathh: 61, baasath: 62, chonsath: 64, paainsath: 65,
  chhiyasathh: 66, sadsathh: 67, athsath: 68, unahattar: 69,
  satttar: 70, ikahatar: 71, bahatar: 72, tiahattar: 73, chauhatar: 74,
  pachattar: 75, chihattar: 76, satattar: 77, unasi: 79, asi: 80,
  ikyassi: 81, baasi: 82, pachaasi: 85, satasi: 87, nabbey: 90,
  ikyanway: 91, banve: 92, panchanve: 95, chiyanve: 96,
  sattanve: 97, atthanve: 98, ninyanvey: 99,
  'इकतीस': 31, 'तैंतीस': 33, 'चौंतीस': 34, 'चौतीस': 34,
  'पैंतीस': 35, 'छत्तीस': 36, 'सैंतीस': 37, 'अड़तीस': 38, 'अड़तीस': 38,
  'उनतालीस': 39, 'इकतालीस': 41, 'बयालिस': 42,
  'तैंतालीस': 43, 'चवालीस': 44, 'पैंतालीस': 45, 'छियालीस': 46,
  'सैंतालीस': 47, 'अड़तालीस': 48, 'अड़तालीस': 48, 'उनचास': 49,
  'इक्यावन': 51, 'बावन': 52, 'तिरपन': 53, 'चौवन': 54, 'पचपन': 55,
  'छप्पन': 56, 'सत्तावन': 57, 'अट्ठावन': 58, 'उनसठ': 59,
  'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'चौंसठ': 64, 'पैंसठ': 65,
  'छियासठ': 66, 'सड़सठ': 67, 'सड़सठ': 67, 'अड़सठ': 68, 'अड़सठ': 68,
  'उनहत्तर': 69, 'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73,
  'चौहत्तर': 74, 'पचहत्तर': 75, 'छिहत्तर': 76, 'सतहत्तर': 77,
  'अठहत्तर': 78, 'उन्नासी': 79, 'इक्यासी': 81, 'बयासी': 82,
  'तिरासी': 83, 'चौरासी': 84, 'पचासी': 85, 'छियासी': 86,
  'सतासी': 87, 'अठासी': 88, 'नवासी': 89, 'इक्यानवे': 91,
  'बानवे': 92, 'तिरानवे': 93, 'चौरानवे': 94, 'पचानवे': 95,
  'छियानवे': 96, 'सत्तानवे': 97, 'अट्ठानवे': 98, 'निन्यानवे': 99,
});

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
    if (word === 'and' || word === 'aur' || word === 'और') continue;
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
    } else if (/^\d+(?:\.\d+)?$/.test(word)) {
      current += Number(word);
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

  const isNumberPart = (value: string) =>
    /^\d+(?:\.\d+)?$/.test(value) ||
    NUMBER_WORDS[value] !== undefined ||
    HUNDRED_WORDS.has(value) ||
    THOUSAND_WORDS.has(value) ||
    LAKH_WORDS.has(value) ||
    CRORE_WORDS.has(value);
  const spans: AmountSpan[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!isNumberPart(tokens[i].value)) continue;
    const words = [tokens[i].value];
    let end = tokens[i].end;
    let j = i + 1;
    while (j < tokens.length) {
      const gap = text.slice(tokens[j - 1].end, tokens[j].start);
      if (!/^\s*(?:(?:and|aur|और)\s*)?$/iu.test(gap)) break;
      if (isNumberPart(tokens[j].value)) {
        words.push(tokens[j].value);
        end = tokens[j].end;
        j++;
        continue;
      }
      break;
    }
    const amount = parseWordNumber(words);
    if (Number.isFinite(amount) && amount > 0) {
      spans.push({ start: tokens[i].start, end, amount: Math.round(amount * 1000) / 1000 });
    }
    i = j - 1;
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
      pattern: /\b(?:transport|delivery|fuel|petrol|diesel|shipping|courier|freight|vehicle expense|travel expense|transportation|samaan bhejne|saman bhejne|maal bhejne|bhejne ka kharcha)\b|ढुलाई|पेट्रोल|डीजल|डीज़ल|ईंधन|डिलीवरी|यातायात|ट्रांसपोर्ट|सामान भेजने|माल भेजने|भेजने का खर्च/iu,
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
    const match = pattern.exec(text);
    return match ? [{ category, start: match.index, end: match.index + match[0].length }] : [];
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


function isNumberToken(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value) ||
    NUMBER_WORDS[value] !== undefined ||
    HUNDRED_WORDS.has(value) ||
    THOUSAND_WORDS.has(value) ||
    LAKH_WORDS.has(value) ||
    CRORE_WORDS.has(value);
}

function isNumberStartingWord(value: string): boolean {
  return /^\d/.test(value) || isNumberToken(value);
}

function splitVoiceSegments(text: string): string[] {
  const normalized = normalizeDigits(text).replace(/([0-9]),(?=[0-9])/g, '$1').replace(/\s+/g, ' ').trim();
  const separator = /[,;،।\n]+|\s+(?:and|aur|phir|then|plus|और|फिर)\s+/giu;
  const parts: string[] = [];
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = separator.exec(normalized)) !== null) {
    const token = match[0].trim().toLowerCase();
    const isPunctuation = /^[,;،।\n]+$/.test(token);
    if (!isPunctuation) {
      const rest = normalized.slice(match.index + match[0].length);
      const next = /[0-9०-९][0-9०-९,]*(?:\.[0-9]+)?|[a-z]+|[\u0900-\u097f]+/iu.exec(rest);
      if (!next || !isNumberStartingWord(normalizeDigits(next[0]).replace(/,/g, '').toLowerCase())) continue;
    }
    const part = normalized.slice(start, match.index).trim();
    if (part) parts.push(part);
    start = match.index + match[0].length;
  }
  const tail = normalized.slice(start).trim();
  if (tail) parts.push(tail);

  // If speech recognition omitted commas/conjunctions but repeated currency
  // markers are clear, use the end of each currency phrase as a safe boundary.
  if (parts.length === 1) {
    const currencyPattern = /₹|\b(?:rupees?|rs\.?|rupaye?|rupaya|rupiy[ae]?|rupay|rupye|rupaiya)\b|रुपये?|रुपए|रूपये|रूपए|रुपिया|रूपया/giu;
    const currencyMatches = [...normalized.matchAll(currencyPattern)];
    if (currencyMatches.length > 1 && currencyMatches.length <= 5) {
      const split: string[] = [];
      let chunkStart = 0;
      currencyMatches.forEach((currency) => {
        const end = (currency.index || 0) + currency[0].length;
        const chunk = normalized.slice(chunkStart, end).trim();
        if (chunk) split.push(chunk);
        chunkStart = end;
      });
      const remainder = normalized.slice(chunkStart).trim();
      if (remainder) split.push(remainder);
      if (split.length > 1) return split;
    }
  }
  return parts;
}

function mentionedTypes(text: string): VoiceTransactionType[] {
  const found: VoiceTransactionType[] = [];
  const hasSale = /\b(?:sales?|sell|sold|bikri|bika|biki|becha|bechi|bik|bech)\b|बिक्री|बिका|बिकी|बिके|बेचा|बेची|बेच|सेल/iu.test(text);
  const hasExpense = /\b(?:expenses?|kharch(?:a|aa|e)?)\b|खर्च|ख़र्च|खर्चा|खर्चे|व्यय/iu.test(text);
  const hasUdhaar = /\b(?:udhaar|udhar|credit|customer\s+credit)\b|उधार/iu.test(text);
  if (hasSale) found.push('sale');
  if (hasExpense) found.push('expense');
  if (hasUdhaar) found.push('udhaar');
  return found;
}

function getSegmentType(
  segment: string,
  allTextTypes: VoiceTransactionType[],
): VoiceTransactionType | undefined {
  const localTypes = mentionedTypes(segment);
  if (localTypes.length === 1) return localTypes[0];
  if (localTypes.length > 1) return undefined;

  if (detectExpenseCategory(segment) !== 'other') return 'expense';
  if (allTextTypes.length === 1) return allTextTypes[0];
  return undefined;
}

interface CurrencyMarker {
  start: number;
  end: number;
  text: string;
}

function findCurrencyMarkers(text: string): CurrencyMarker[] {
  const pattern = /₹|\b(?:rupees?|rs\.?|rupaye?|rupaya|rupiy[ae]?|rupay|rupye|rupaiya)\b|रुपये?|रुपए|रूपये|रूपए|रुपिया|रूपया/giu;
  const matches: CurrencyMarker[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
  }
  return matches;
}

function findTransactionAmount(
  segment: string,
  type: VoiceTransactionType,
): { span?: AmountSpan; error?: 'missing_amount' | 'ambiguous_amount' } {
  const spans = findAmountSpans(segment);
  if (!spans.length) return { error: 'missing_amount' };
  const currencyMarkers = findCurrencyMarkers(segment);
  if (currencyMarkers.length > 1) return { error: 'ambiguous_amount' };

  if (currencyMarkers.length === 1) {
    const marker = currencyMarkers[0];
    if (marker.text === '₹') {
      const after = spans.find((span) => span.start >= marker.end);
      return after ? { span: after } : { error: 'missing_amount' };
    }
    const before = spans
      .filter((span) => span.end <= marker.start)
      .filter((span) => /^\s*$/.test(segment.slice(span.end, marker.start)))
      .sort((a, b) => b.end - a.end)[0];
    if (before) return { span: before };
    const after = spans.find((span) => span.start >= marker.end);
    return after ? { span: after } : { error: 'missing_amount' };
  }

  // In a spoken expense list, "do hazar bijli, paanch hazar saaman" places
  // the value before the category. In sales, the final amount usually follows
  // the item/quantity. Where this pattern isn't clear, callers fail closed.
  const first = spans[0];
  if (type === 'expense' && segment.slice(0, first.start).trim() === '') {
    return { span: first };
  }
  return { span: spans[spans.length - 1] };
}

interface QuantityDetails {
  quantity: number;
  unit: string;
  consumed: number;
}

function extractLeadingQuantity(text: string): QuantityDetails | undefined {
  const leftTrimmed = text.trimStart();
  const offset = text.length - leftTrimmed.length;
  const fractionOnly = /^(aadhe?|adha|aadha|half|आधे?|आधा)\s*(kilo|kg|kilogram|kilograms|किलो)\b/iu.exec(leftTrimmed);
  if (fractionOnly) {
    return { quantity: 0.5, unit: 'kg', consumed: offset + fractionOnly[0].length };
  }

  const leadingSpans = findAmountSpans(leftTrimmed);
  const first = leadingSpans.find((span) => span.start === 0);
  if (!first || !Number.isFinite(first.amount) || first.amount <= 0) return undefined;

  const afterNumber = leftTrimmed.slice(first.end);
  const halfPack = /^\s*(?:aadhe?|adha|aadha|half|आधे?|आधा)\s+(?:kilo|kg|kilogram|kilograms|किलो)\s*(?:(?:ke|ki|ka|के|की|का)\s*)?(?:packets?|packet|packs?|पैकेट)\b/iu.exec(afterNumber);
  if (halfPack) {
    return { quantity: first.amount, unit: 'packet', consumed: offset + first.end + halfPack[0].length };
  }

  const unitPatterns: Array<{ pattern: RegExp; unit: string }> = [
    { pattern: /^\s*(?:kilograms?|kilos?|kgs?)\b/iu, unit: 'kg' },
    { pattern: /^\s*(?:grams?|gms?|g)\b/iu, unit: 'g' },
    { pattern: /^\s*(?:litres?|liters?|ltrs?|liters?|l)\b/iu, unit: 'litre' },
    { pattern: /^\s*(?:packets?|packet|packs?|पैकेट)\b/iu, unit: 'packet' },
    { pattern: /^\s*(?:pieces?|pcs?|units?|items?|बोतल|बोतलें|पीस|नग)\b/iu, unit: 'unit' },
    { pattern: /^\s*(?:bottles?)\b/iu, unit: 'bottle' },
    { pattern: /^\s*(?:dozen|dozens)\b/iu, unit: 'dozen' },
    { pattern: /^\s*(?:metres?|meters?|m)\b/iu, unit: 'metre' },
  ];
  for (const candidate of unitPatterns) {
    const unitMatch = candidate.pattern.exec(afterNumber);
    if (unitMatch) {
      return {
        quantity: first.amount,
        unit: candidate.unit,
        consumed: offset + first.end + unitMatch[0].length,
      };
    }
  }

  // If the number clearly starts an item phrase ("2 aloo 100 rupaye"),
  // treat it as a count. A model/brand number inside a name isn't leading.
  const after = afterNumber.trimStart();
  if (after && !/^(?:hazar|hazaar|thousand|lakh|lac|crore|karod|sau|hundred|हज़ार|हजार|लाख|करोड़|करोड|सौ)\b/iu.test(after)) {
    return { quantity: first.amount, unit: 'unit', consumed: offset + first.end };
  }
  return undefined;
}

function stripVoiceCommands(value: string): string {
  return value
    .replace(/\b(?:add|added|record|enter|log|save|put|please|sales?|sell|sold|bikri|bika|biki|becha|bechi|bik|bech|expenses?|expense|kharch(?:a|aa|e)?|udhaar|udhar|credit|rupaye?|rupaya|rupiy[ae]?|rupees?|rs\.?|in sab|sab ka|isme|is mein|mein|mai|me|karo|kar do|jodo|jod do|likho|likh do|daalo|dalo|dal do|daarj|darj|hogaya|ho gaya|gaya|gayi|gaye|hua|hui|hai|hain|ka|ki|ke|to|for|and|aur|phir|then)\b/giu, ' ')
    .replace(/(?:बिक गया|बिक गई|बिके|बिक्री|बेच दिया|बेच दी|बेचा|बेची|बेचें|खर्च में|खर्चे में|खर्च में डालो|बिक्री में|जोड़ दो|जोड़ें|जोड़ो|जोड़ना|डाल दो|डालो|डालें|लिख दो|लिखो|कर दो|करना|करो|करें|होगया|हो गया|हो गई|उधार|रुपये|रुपया|रुपए|रूपये|रूपए|और|में|का|की|के|से|को|पर|है|हैं|था|थी|थे)/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:;()\-]+|[\s,.:;()\-]+$/g, '')
    .trim();
}

function cleanItemName(segment: string, amountSpan: AmountSpan, quantity?: QuantityDetails): string {
  const beforeAmount = segment.slice(0, amountSpan.start);
  let candidate = beforeAmount;
  if (quantity && quantity.consumed <= beforeAmount.length) {
    candidate = beforeAmount.slice(quantity.consumed);
  } else if (!candidate.trim()) {
    candidate = segment.slice(amountSpan.end);
  }
  const cleaned = stripVoiceCommands(candidate);
  return cleaned.slice(0, 80);
}

function cleanExpenseNote(segment: string): string | undefined {
  let result = segment;
  const spans = findAmountSpans(segment).sort((a, b) => b.start - a.start);
  spans.forEach((span) => {
    result = result.slice(0, span.start) + ' ' + result.slice(span.end);
  });
  result = result.replace(/₹|\b(?:rupees?|rs\.?|rupaye?|rupaya|rupiy[ae]?|rupay|rupye|rupaiya)\b|रुपये?|रुपए|रूपये|रूपए|रुपिया|रूपया/giu, ' ');
  result = stripVoiceCommands(result);
  return result ? result.slice(0, 100) : undefined;
}

function extractUdhaarCustomer(segment: string, amountSpan: AmountSpan): string | undefined {
  const patterns = [
    /\b([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})\s+(?:ko|ka|ki|ke|se|par|ke naam se|ke naam par)\b/iu,
    /([\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,2})\s+(?:को|का|की|के|से|पर|के नाम से|के नाम पर)/u,
    /\b(?:for|to|customer|named|name is|naam|naam pe|naam par)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})/iu,
    /(?:नाम है|नाम पर|नाम से)\s*([\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,2})/u,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(segment);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name && !/^(add|sale|sales|expense|expenses|udhaar|udhar|credit|रुपये|बिक्री|खर्च)$/iu.test(name)) {
        return name.slice(0, 80);
      }
    }
  }

  const beforeAmount = segment.slice(0, amountSpan.start).trim();
  const cleanedBefore = stripVoiceCommands(beforeAmount)
    .replace(/\b(?:ko|ka|ki|ke|se|par|naam)\b/giu, ' ')
    .replace(/^\s*(?:udhaar|udhar|credit)\s*/iu, '')
    .trim();
  if (cleanedBefore && !/\d/.test(cleanedBefore) && cleanedBefore.split(/\s+/).length <= 3) {
    return cleanedBefore.slice(0, 80);
  }

  const afterAmount = segment.slice(amountSpan.end);
  const afterMatch = /\b(?:for|to|customer|named|naam(?:\s+hai)?|के नाम पर|के नाम से)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2}|[\u0900-\u097f]+(?:\s+[\u0900-\u097f]+){0,2})/iu.exec(afterAmount);
  return afterMatch?.[1]?.trim().slice(0, 80);
}

export function parseVoiceTransactions(input: string): VoiceParseResult {
  const text = normalizeDigits(input).replace(/([0-9]),(?=[0-9])/g, '$1').replace(/\s+/g, ' ').trim();
  if (!text) return { transactions: [], error: 'not_command' };

  const actionPattern =
    /\b(?:add|record|enter|log|save|put|jod|jodo|jodna|likho?|likh|daal|dalo|dal|darj|jama|karo|kar do|bik gaya|bik gayi|bech diya|sold|sell)\b|जोड़|जोड़ो|जोड़ें|जोड़ना|जोड़िए|डाल|डालो|डालिए|दर्ज|लिख|जमा|ऐड|एड|करो|करें|करना|बिक गया|बिक गई|बेच दिया|बेच दी/iu;
  const questionPattern =
    /\b(?:what|when|where|why|how|can|should|tell|show|kitna|kitne|kitni|kya|kaise|kyun|kyon|batao)\b|कितना|कितनी|कितने|क्या|कैसे|क्यों|बताओ/iu;
  if (!actionPattern.test(text) || questionPattern.test(text)) {
    return { transactions: [], error: 'not_command' };
  }

  const allTextTypes = mentionedTypes(text);
  if (!allTextTypes.length) {
    const category = detectExpenseCategory(text);
    if (category === 'other') return { transactions: [], error: 'no_type' };
  }

  const segments = splitVoiceSegments(text);
  const candidates = segments.filter((segment) => findAmountSpans(segment).length > 0);
  const currencyCount = findCurrencyMarkers(text).length;
  if (candidates.length > 5 || (candidates.length <= 1 && currencyCount > 5)) {
    return { transactions: [], error: 'too_many_entries' };
  }
  if (!candidates.length) return { transactions: [], error: 'missing_amount' };

  const transactions: VoiceTransaction[] = [];
  for (const segment of candidates) {
    const segmentTypes = mentionedTypes(segment);
    const type = getSegmentType(segment, allTextTypes);
    if (!type || segmentTypes.length > 1) {
      return { transactions: [], error: 'unclear_entry' };
    }
    const money = findTransactionAmount(segment, type);
    if (!money.span || money.error) {
      return { transactions: [], error: money.error || 'missing_amount' };
    }
    if (!Number.isFinite(money.span.amount) || money.span.amount <= 0) {
      return { transactions: [], error: 'missing_amount' };
    }

    if (type === 'sale') {
      const quantity = extractLeadingQuantity(segment.slice(0, money.span.start));
      const itemName = cleanItemName(segment, money.span, quantity);
      if (!itemName) return { transactions: [], error: 'missing_item' };
      transactions.push({
        type,
        amount: Math.round(money.span.amount),
        itemName,
        quantity: quantity?.quantity ?? 1,
        quantityUnit: quantity?.unit ?? 'unit',
      });
      continue;
    }

    if (type === 'expense') {
      const expenseCategory = detectExpenseCategory(segment);
      transactions.push({
        type,
        amount: Math.round(money.span.amount),
        expenseCategory: expenseCategory === 'other' ? 'other' : expenseCategory,
        note: cleanExpenseNote(segment),
      });
      continue;
    }

    const customerName = extractUdhaarCustomer(segment, money.span);
    if (!customerName) return { transactions: [], error: 'missing_customer' };
    transactions.push({
      type,
      amount: Math.round(money.span.amount),
      customerName,
    });
  }

  if (!transactions.length) return { transactions: [], error: 'missing_amount' };
  if (transactions.length > 5) return { transactions: [], error: 'too_many_entries' };
  return { transactions };
}
