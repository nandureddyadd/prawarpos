export function formatCurrency(amount: number, symbol: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  return `${symbol}${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`;
}

/** Returns true when an ISO timestamp falls on today in the user's local timezone. */
export function isToday(isoString?: string): boolean {
  if (!isoString) return false;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Returns true when an ISO timestamp falls within the requested local calendar range. */
export function isWithinDateRange(
  isoString: string | undefined,
  range: 'today' | 'week' | 'month'
): boolean {
  if (!isoString) return false;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'week') {
    const day = start.getDay();
    const daysSinceMonday = (day + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (range === 'month') {
    start.setDate(1);
  }

  return date.getTime() >= start.getTime() && date.getTime() <= now.getTime();
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatDuration(isoString?: string): string {
  if (!isoString) return '';
  try {
    const start = new Date(isoString).getTime();
    const now = Date.now();
    const diffMin = Math.max(0, Math.floor((now - start) / (1000 * 60)));
    if (diffMin < 60) {
      return `${diffMin}m`;
    }
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hrs}h ${mins}m`;
  } catch {
    return '';
  }
}
