export interface AiringInfo {
  adjustedDay: number; // 0-6 (0=Sun, 1=Mon, ..., 6=Sat)
  absoluteTime: string; // HH:MM
  relativeTime: string; // e.g., "airing in 3h 15m" or "aired 2h ago"
  isFuture: boolean;
}

/**
 * Parses an episode airDate (Unix ms or string) and returns timezone-safe JST 30-hour clock info.
 */
export function getJstAiringInfo(airDate: string | number): AiringInfo {
  // Convert UTC milliseconds or string to JST time by adding 9 hours
  const airDateMs = typeof airDate === "number" ? airDate : new Date(airDate).getTime();
  
  const jstDate = new Date(airDateMs + 9 * 60 * 60 * 1000);
  const hour = jstDate.getUTCHours();
  const minute = jstDate.getUTCMinutes();
  const day = jstDate.getUTCDay();

  let adjustedHour = hour;
  let adjustedDay = day;

  // 30-hour clock: JST late night hours (0:00 - 4:59 AM) are grouped under the previous day
  if (hour < 5) {
    adjustedHour = hour + 24;
    adjustedDay = (day - 1 + 7) % 7;
  }

  const absoluteTime = `${String(adjustedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const diffMs = airDateMs - Date.now();
  const isFuture = diffMs > 0;
  const absDiff = Math.abs(diffMs);
  const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
  const diffMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let relativeTime = "";
  if (isFuture) {
    if (diffHours > 0) {
      relativeTime = `airing in ${diffHours}h ${diffMins}m`;
    } else {
      relativeTime = `airing in ${diffMins}m`;
    }
  } else {
    if (diffHours >= 24) {
      relativeTime = "aired";
    } else if (diffHours > 0) {
      relativeTime = `aired ${diffHours}h ${diffMins}m ago`;
    } else {
      relativeTime = `aired ${diffMins}m ago`;
    }
  }

  return {
    adjustedDay,
    absoluteTime,
    relativeTime,
    isFuture,
  };
}
