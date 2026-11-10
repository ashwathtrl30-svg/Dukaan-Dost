import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatInsightsDateRange, getInsightsDashboard } from './analytics';

test('Wednesday dashboard ranges are Monday-to-date and month-to-date', () => {
  const dashboard = getInsightsDashboard([], [], new Date(2026, 10, 11, 12, 28));

  assert.deepEqual(dashboard.week.range, {
    start: '2026-11-09',
    end: '2026-11-11',
  });
  assert.deepEqual(dashboard.month.range, {
    start: '2026-11-01',
    end: '2026-11-11',
  });
  assert.equal(
    formatInsightsDateRange(dashboard.week.range, 'en'),
    '9 Nov – 11 Nov',
  );
  assert.equal(
    formatInsightsDateRange(dashboard.month.range, 'en'),
    '1 Nov – 11 Nov',
  );
});

test('a Sunday remains inside the Monday-starting calendar week', () => {
  const dashboard = getInsightsDashboard([], [], new Date(2026, 10, 15, 18, 0));

  assert.deepEqual(dashboard.week.range, {
    start: '2026-11-09',
    end: '2026-11-15',
  });
});

test('month and week ranges remain correct on the first day of a new month', () => {
  const dashboard = getInsightsDashboard([], [], new Date(2026, 10, 1, 9, 0));

  assert.deepEqual(dashboard.week.range, {
    start: '2026-10-26',
    end: '2026-11-01',
  });
  assert.deepEqual(dashboard.month.range, {
    start: '2026-11-01',
    end: '2026-11-01',
  });
});
