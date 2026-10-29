export type VoiceTransactionType = 'sale' | 'expense' | 'udhaar';

export interface VoiceTransaction {
  type: VoiceTransactionType;
  amount: number;
  customerName?: string;
  expenseCategory?: string;
}

export interface VoiceParseResult {
  transactions: VoiceTransaction[];
  error?: 'not_command' | 'no_type' | 'missing_amount' | 'ambiguous_amount';
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
      pattern: /\b(?:salary|salaries|wage|wages|payroll|staff payment|staff salary|employee payment|mazdoori|majduri|tankhwa|tankh्वाह|vetan)\b|तनख़्वाह|तनख्वाह|वेतन|मजदूरी|मज़दूरी/iu,
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

export function parseVoiceTransactions(input: string): VoiceParseResult {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) return { transactions: [], error: 'not_command' };

  const actionPattern =
    /\b(?:add|record|enter|log|save|put|jod|jodo|jodna|likho?|likh|daal|dalo|dal|darj|jama|karo|kar do)\b|जोड़|जोड़ो|जोड़ें|जोड़ना|जोड़िए|डाल|डालो|डालिए|दर्ज|लिख|जमा|ऐड|एड|करो|करें|करना/iu;
  const questionPattern =
    /\b(?:what|when|where|why|how|can|should|tell|show|kitna|kitne|kitni|kya|kaise|kyun|batao)\b|कितना|कितनी|कितने|क्या|कैसे|क्यों|बताओ/iu;

  if (!actionPattern.test(text) || questionPattern.test(text)) {
    return { transactions: [], error: 'not_command' };
  }

  const markers = findMarkers(text);
  const mentionedExpenseCategory = detectExpenseCategory(text);
  // If the user names an expense category directly ("add 250 for rent"),
  // treat that as an expense even when they did not say the word "expense".
  if (!markers.length && mentionedExpenseCategory !== 'other') {
    markers.push({ type: 'expense', start: text.length, end: text.length });
  }
  if (!markers.length) return { transactions: [], error: 'no_type' };

  const amounts = findAmountSpans(text);
  if (!amounts.length) return { transactions: [], error: 'missing_amount' };

  const assigned: AmountSpan[][] = markers.map(() => []);
  amounts.forEach((amount) => {
    // Prefer a type keyword immediately after the amount ("200 rupees sales").
    // If the amount follows a type ("sales 200 and expenses 300"), assign it
    // to the preceding type instead of stealing it for the next transaction.
    let nextIndex = -1;
    let nextDistance = Number.POSITIVE_INFINITY;
    markers.forEach((marker, index) => {
      if (marker.start < amount.end) return;
      const gap = text.slice(amount.end, marker.start);
      const isCurrencyGap = /^[\s₹$]*(?:(?:rupees?|rs|rupay(?:e)?|rupaye|rupee|ka|ki|ke|worth|amount|of|रुपये?|रुपया|रुपए|रूपये|रूपए|का|की|के)\s*)*$/iu.test(gap);
      const distance = marker.start - amount.end;
      if (isCurrencyGap && distance < nextDistance) {
        nextDistance = distance;
        nextIndex = index;
      }
    });

    if (nextIndex >= 0 && nextDistance <= 45) {
      assigned[nextIndex].push(amount);
      return;
    }

    let previousIndex = -1;
    let previousDistance = Number.POSITIVE_INFINITY;
    markers.forEach((marker, index) => {
      if (marker.end > amount.start) return;
      const distance = amount.start - marker.end;
      if (distance < previousDistance) {
        previousDistance = distance;
        previousIndex = index;
      }
    });
    if (previousIndex >= 0 && previousDistance <= 55) {
      assigned[previousIndex].push(amount);
      return;
    }

    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    markers.forEach((marker, index) => {
      const distance = distanceBetween(amount, marker);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    if (nearestIndex >= 0 && nearestDistance <= 90) assigned[nearestIndex].push(amount);
  });

  const transactions: VoiceTransaction[] = [];
  const usedAmounts = new Set<AmountSpan>();
  for (let index = 0; index < markers.length; index++) {
    const marker = markers[index];
    const options = assigned[index].sort(
      (a, b) => distanceBetween(a, marker) - distanceBetween(b, marker),
    );
    const amount = options.find((candidate) => !usedAmounts.has(candidate));
    if (!amount || amount.amount <= 0) {
      return { transactions: [], error: 'missing_amount' };
    }
    usedAmounts.add(amount);
    transactions.push({
      type: marker.type,
      amount: amount.amount,
      customerName: marker.type === 'udhaar' ? getCustomerName(text) : undefined,
      expenseCategory: marker.type === 'expense' ? detectExpenseCategory(text, marker) : undefined,
    });
  }

  return { transactions };
}
