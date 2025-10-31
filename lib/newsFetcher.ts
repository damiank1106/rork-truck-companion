export interface PublishedNewsItem {
  title: string;
  summary?: string;
  tag?: string;
  source_url?: string;
  published_date?: string;
}

export const NEWS_JSON_URL =
  "https://drive.google.com/uc?export=download&id=1WBqRRedfPL0DlvEPzS-rSWTdEyrWYxtp";

const LS_KEY_PAYLOAD = "news_payload_v1";
const LS_KEY_LASTDATE_CHI = "news_last_fetch_date_chi_v1";

type ChicagoTimeParts = {
  dateStr: string;
  hour: number;
  minute: number;
};

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if ("localStorage" in globalThis && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage as Storage;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get the current date/time in America/Chicago, using Intl APIs.
 * Returns: { dateStr: 'YYYY-MM-DD', hour: number(0-23), minute: number(0-59) }
 */
function chicagoNowParts(): ChicagoTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };
  const pad = (n: number) => String(n).padStart(2, "0");

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const h = get("hour");
  const min = get("minute");
  return { dateStr: `${y}-${pad(m)}-${pad(d)}`, hour: h, minute: min };
}

function isAfter630Chicago({ hour, minute }: ChicagoTimeParts) {
  return hour > 6 || (hour === 6 && minute >= 30);
}

function shouldAutoFetch(storage: Storage | null) {
  try {
    const now = chicagoNowParts();
    const last = storage?.getItem(LS_KEY_LASTDATE_CHI);
    // Auto-fetch once per day AFTER 6:30am Central
    return isAfter630Chicago(now) && last !== now.dateStr;
  } catch {
    // If localStorage not available, just fetch
    return true;
  }
}

function cacheNews(storage: Storage | null, items: PublishedNewsItem[]) {
  try {
    const now = chicagoNowParts();
    storage?.setItem(LS_KEY_PAYLOAD, JSON.stringify(items));
    storage?.setItem(LS_KEY_LASTDATE_CHI, now.dateStr);
  } catch {
    // ignore
  }
}

export function getCachedNews(): PublishedNewsItem[] | null {
  const storage = getStorage();
  try {
    const raw = storage?.getItem(LS_KEY_PAYLOAD);
    if (!raw) return null;
    return JSON.parse(raw) as PublishedNewsItem[];
  } catch {
    return null;
  }
}

interface LoadNewsOptions {
  force?: boolean;
}

/**
 * Core fetcher. If force=true, always fetch.
 * Otherwise, it auto-fetches once/day after 6:30am Central OR
 * returns cached items if present.
 *
 * Returns: Promise<Array<{ title, summary, tag, source_url, published_date }>>
 */
export async function loadNews({ force = false }: LoadNewsOptions = {}): Promise<PublishedNewsItem[]> {
  const storage = getStorage();

  if (!force) {
    const cached = getCachedNews();
    if (!shouldAutoFetch(storage) && cached) {
      return cached;
    }
  }

  try {
    const res = await fetch(NEWS_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = (await res.json()) as PublishedNewsItem[];
    if (!Array.isArray(items)) throw new Error("Feed is not an array");
    cacheNews(storage, items);
    return items;
  } catch (err) {
    // If network fails, return cache if available
    const cached = getCachedNews();
    if (cached) return cached;
    throw err;
  }
}

/**
 * Convenience helper you can call on app start.
 * Example (React):
 *   useEffect(() => { autoFetchNewsOnAppStart().then(setNews); }, []);
 */
export function autoFetchNewsOnAppStart() {
  return loadNews({ force: false });
}

/**
 * Call this when the user pulls-to-refresh / taps a refresh button.
 * Example:
 *   const items = await refreshNewsNow();
 *   setNews(items);
 */
export function refreshNewsNow() {
  return loadNews({ force: true });
}
