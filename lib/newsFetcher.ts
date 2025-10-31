export const NEWS_JSON_URL =
  "https://drive.google.com/uc?export=download&id=1WBqRRedfPL0DlvEPzS-rSWTdEyrWYxtp";

const LS_KEY_PAYLOAD = "news_payload_v1";
const LS_KEY_LASTDATE_CHI = "news_last_fetch_date_chi_v1";

type ChicagoTimeParts = {
  dateStr: string;
  hour: number;
  minute: number;
};

type NewsItem = {
  title: string;
  summary?: string;
  tag?: string;
  source_url?: string;
  published_date?: string;
};

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

function shouldAutoFetch() {
  try {
    const now = chicagoNowParts();
    const last = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY_LASTDATE_CHI) : null;
    return isAfter630Chicago(now) && last !== now.dateStr;
  } catch {
    return true;
  }
}

function cacheNews(items: NewsItem[]) {
  try {
    const now = chicagoNowParts();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LS_KEY_PAYLOAD, JSON.stringify(items));
      localStorage.setItem(LS_KEY_LASTDATE_CHI, now.dateStr);
    }
  } catch {
    // ignore
  }
}

export function getCachedNews(): NewsItem[] | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(LS_KEY_PAYLOAD);
    if (!raw) return null;
    return JSON.parse(raw) as NewsItem[];
  } catch {
    return null;
  }
}

async function loadNews({ force = false }: { force?: boolean } = {}): Promise<NewsItem[]> {
  if (!force) {
    const cached = getCachedNews();
    if (!shouldAutoFetch() && cached) {
      return cached;
    }
  }

  try {
    const res = await fetch(NEWS_JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = (await res.json()) as NewsItem[];
    if (!Array.isArray(items)) throw new Error("Feed is not an array");
    cacheNews(items);
    return items;
  } catch (err) {
    const cached = getCachedNews();
    if (cached) return cached;
    throw err;
  }
}

export function autoFetchNewsOnAppStart() {
  return loadNews({ force: false });
}

export function refreshNewsNow() {
  return loadNews({ force: true });
}

export type { NewsItem };
