import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretVoiceTransactions } from './voiceInterpreter.ts';

const originalFetch = globalThis.fetch;

function installResponse(payload: unknown, status = 200) {
  let requestedUrl = '';
  let requestedBody: Record<string, unknown> | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return {
    get url() { return requestedUrl; },
    get body() { return requestedBody; },
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('sends mixed-script and alternate speech transcripts to the AI interpreter', async () => {
  const mock = installResponse({
    transactions: [{
      type: 'sale',
      amount: 200,
      itemName: 'sugar',
      numberOfItemsSold: 2,
      quantity: 2,
      quantityUnit: 'kg',
    }],
    selectedTranscript: 'เคฆเฅ เคธเฅ rupe, เคฆเฅ kg เคถเค•เฅเค•เคฐ, เคธเฅเคฒ เคเคก เค•เคฐเฅ',
  });

  const result = await interpretVoiceTransactions({
    transcript: 'เคฆเฅ เคธเฅ rupe do kg sakkar sale add karo',
    candidates: [
      'เคฆเฅ เคธเฅ rupe เคฆเฅ kg เคถเค•เฅเค•เคฐ เคธเฅเคฒ เคเคก เค•เคฐเฅ',
      'เคฆเฅ เคธเฅ rupe เคฆเฅ kg เคถเค•เฅเค•เคฐ เคธเฅเคฒ เคเคก ถปงqซ^t€ญฅษ…นฐฑ…นี…”่€•ธ๔คฐ(€€€€ฝฅนฝตมฑ•ั”ัษ…นอ…ัฅฝธฑฅอะผฐ(€€ค์((€ฅนอั…ฑฑI•อมฝนอ”ก์(€€€ัษ…นอ…ัฅฝนฬ่ษษ…ไนษฝดก์ฑ•นั ่€ุ๔ฐ€ ค€๔๘€ก์(€€€€€ัๅม”่€ี‘ก……ศฐ…ตฝีนะ่€ฤภฐีอัฝต•ษ9…ต”่€I…ูคฐ(€€€๔คคฐ(€๔ค์(€…Ý…ฅะ…ออ•ษะนษ•ฉ•ัฬ (€€€ฅนั•ษมษ•ัYฝฅ•Qษ…นอ…ัฅฝนฬก์ัษ…นอษฅมะ่€ต…นไ•นัษฅ•ฬฐอกฝมQๅม”่€ญฅษ…นฐฑ…นี…”่€•ธ๔คฐ(€€€€ฝฅนฝตมฑ•ั”ัษ…นอ…ัฅฝธฑฅอะผฐ(€€ค์)๔ค์()ั•อะ ษ•ัีษนฬอัษีัีษ•ฑ…ษฅฅ…ัฅฝธÝฅักฝีะ…•มัฅนม…ษัฅ…ฐษ•ฝษ‘ฬฐ…อๅน€ ค€๔๘์(€ฅนอั…ฑฑI•อมฝนอ”ก์(€€€ัษ…นอ…ัฅฝนฬ่mtฐ(€€€•ษษฝศ่€ตฅออฅน}ีอัฝต•ศฐ(€€€ฑ…ษฅฅ…ัฅฝธ่€]กฅ ีอัฝต•ศอกฝีฑักฅฬษ•‘ฅะ”ษ•ฝษ‘•ฝศüฐ(€๔ค์((€ฝนอะษ•อีฑะ€๔…Ý…ฅะฅนั•ษมษ•ัYฝฅ•Qษ…นอ…ัฅฝนฬก์(€€€ัษ…นอษฅมะ่€ิภษีม••ฬี‘ก……ศฐ(€€€อกฝมQๅม”่€ญฅษ…นฐ(€€€ฑ…นี…”่€•ธฐ(€๔ค์((€…ออ•ษะน•ลี…ฐกษ•อีฑะน•ษษฝศฐ€ตฅออฅน}ีอัฝต•ศค์(€…ออ•ษะน•ลี…ฐกษ•อีฑะนัษ…นอ…ัฅฝนฬนฑ•นั ฐ€ภค์(€…ออ•ษะนต…ั กษ•อีฑะนฑ…ษฅฅ…ัฅฝธ๑๐€ฐ€ฝ]กฅ ีอัฝต•ศผค์)๔ค์()ั•อะ ‘ฝ•ฬนฝะฝนู•ษะอ•ษู•ศ…ฅฑีษ•ฬฅนัผี•ออ•ฑฝ…ฐ•นัษฅ•ฬฐ…อๅน€ ค€๔๘์(€ฅนอั…ฑฑI•อมฝนอ”ก์•ษษฝศ่€$ูฝฅ”ฅนั•ษมษ•ั…ัฅฝธฅฬั•ตมฝษ…ษฅฑไีน…ู…ฅฑ…ฑ”ธ๔ฐ€ิภศค์(€…Ý…ฅะ…ออ•ษะนษ•ฉ•ัฬ (€€€ฅนั•ษมษ•ัYฝฅ•Qษ…นอ…ัฅฝนฬก์ัษ…นอษฅมะ่€ศญอี…ศ€ฤภภฐอกฝมQๅม”่€ญฅษ…นฐฑ…นี…”่€•ธ๔คฐ(€€€€ฝั•ตมฝษ…ษฅฑไีน…ู…ฅฑ…ฑ”ผฐ(€€ค์)๔ค์