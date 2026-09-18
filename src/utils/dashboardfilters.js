export const localDateValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const getDashboardRange = ({ period, date, endDate }) => {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  if (Number.isNaN(start.getTime())) return null;
  if (period === 'weekly') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else if (period === 'monthly') {
    start.setDate(1);
    end.setTime(start.getTime());
    end.setMonth(end.getMonth() + 1);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
    end.setTime(start.getTime());
    end.setFullYear(end.getFullYear() + 1);
  } else if (period === 'custom') {
    end.setTime(new Date(`${endDate}T00:00:00`).getTime());
    if (Number.isNaN(end.getTime()) || end < start) return null;
    end.setDate(end.getDate() + 1);
  } else end.setDate(end.getDate() + 1);
  return { start, end };
};

export const getDashboardBuckets = ({ start, end }) => {
  const days = Math.round((end - start) / 86400000);
  const unit = days <= 1 ? 'hour' : days <= 31 ? 'day' : 'month';
  const buckets = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const next = new Date(cursor);
    if (unit === 'hour') next.setHours(next.getHours() + 1);
    else if (unit === 'day') next.setDate(next.getDate() + 1);
    else { next.setDate(1); next.setMonth(next.getMonth() + 1); }
    buckets.push({ start: new Date(cursor), end: new Date(Math.min(next.getTime(), end.getTime())),
      label: cursor.toLocaleString('en-PH', unit === 'hour' ? { hour: 'numeric' } : unit === 'day'
        ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }) });
    cursor.setTime(next.getTime());
  }
  return buckets;
};
