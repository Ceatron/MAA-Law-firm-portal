/**
 * Activity & Audit Trail Date and Time Formatting Utilities
 * Formats timestamps into distinct, readable Date and Time representations
 * suitable for Kenyan Chambers records & Court compliance standards.
 */

export interface ActivityDateTimeResult {
  date: string; // e.g. "10 Sep 2026"
  time: string; // e.g. "02:06 PM"
  fullFormatted: string; // e.g. "10 Sep 2026, 02:06 PM"
  isRecent?: boolean;
}

/**
 * Parses and formats an activity timestamp into clear separate date and time.
 * Handles ISO strings, millisecond timestamps, date strings, and legacy relative strings.
 */
export function formatActivityDateTime(rawTimestamp?: string | number | null): ActivityDateTimeResult {
  if (!rawTimestamp) {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      date,
      time,
      fullFormatted: `${date}, ${time}`,
      isRecent: true,
    };
  }

  const str = String(rawTimestamp).trim();

  // If "Just now" or similar relative text
  if (/^just now$/i.test(str)) {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      date,
      time,
      fullFormatted: `${date}, ${time} (Just now)`,
      isRecent: true,
    };
  }

  // If raw string already contains both date and time formatted like "10 Sep 2026 14:30" or "2026-09-10 14:30"
  // Try parsing directly
  let parsedDate: Date | null = null;

  // Check numeric timestamp (e.g. 1725955200000)
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    parsedDate = new Date(num > 1e11 ? num : num * 1000);
  } else {
    const testDate = new Date(str);
    if (!isNaN(testDate.getTime())) {
      parsedDate = testDate;
    }
  }

  if (parsedDate && !isNaN(parsedDate.getTime())) {
    const date = parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = parsedDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const isToday = new Date().toDateString() === parsedDate.toDateString();

    return {
      date,
      time,
      fullFormatted: `${date}, ${time}`,
      isRecent: isToday,
    };
  }

  // If string has date & time separated by comma, space, or at, e.g. "Yesterday, 3:45 PM"
  if (str.includes(',')) {
    const parts = str.split(',').map((p) => p.trim());
    return {
      date: parts[0] || str,
      time: parts.slice(1).join(', ') || 'N/A',
      fullFormatted: str,
    };
  }

  // Fallback
  return {
    date: str,
    time: 'Recorded',
    fullFormatted: str,
  };
}
