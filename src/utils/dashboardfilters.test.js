import { getDashboardRange, getDashboardBuckets, localDateValue } from './dashboardfilters';

test.each([
  ['daily', '2026-12-31', '2026-12-31', '2027-01-01'],
  ['weekly', '2026-09-20', '2026-09-14', '2026-09-21'],
  ['monthly', '2024-02-20', '2024-02-01', '2024-03-01'],
  ['yearly', '2026-09-17', '2026-01-01', '2027-01-01']
])('%s range uses calendar boundaries', (period, date, start, end) => {
  const range = getDashboardRange({ period, date });
  expect(localDateValue(range.start)).toBe(start);
  expect(localDateValue(range.end)).toBe(end);
});

test('custom range includes the entire end date', () => {
  const range = getDashboardRange({ period: 'custom', date: '2026-09-01', endDate: '2026-09-17' });
  expect(localDateValue(range.end)).toBe('2026-09-18');
  const buckets = getDashboardBuckets(range);
  expect(buckets).toHaveLength(17);
  expect(buckets[16].end).toEqual(range.end);
});

test('invalid and reversed dates return no range', () => {
  expect(getDashboardRange({ period: 'daily', date: '' })).toBeNull();
  expect(getDashboardRange({ period: 'custom', date: '2026-09-17', endDate: '2026-09-01' })).toBeNull();
});

test('yearly chart has twelve monthly buckets', () => {
  expect(getDashboardBuckets(getDashboardRange({ period: 'yearly', date: '2026-09-17' }))).toHaveLength(12);
});
