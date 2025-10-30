import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const NEWS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxLwMaJ2UVxbEIFN6C3UAdZBiTkUcjKpqjnKQFWPsb1cFtgK9JGhbgRYTryvgeogCuy/exec";
const DAILY_NEWS_SHEET_NAME = "Daily News";
const SHEET_NAME_CANDIDATES = Array.from(
  new Set([DAILY_NEWS_SHEET_NAME, "DailyNews", "Daily_News", "Sheet1", "News"])
);

interface NewsItem {
  title: string;
  description?: string;
  link?: string;
  publishedAt?: string;
}

interface FetchNewsResult {
  items: NewsItem[];
  updatedAt: string | null;
}

type ConnectionStatus = "idle" | "checking" | "connected" | "failed";

type RequestVariant = {
  label: string;
  params: Record<string, string>;
};

interface GvizTableColumn {
  id?: string | null;
  label?: string | null;
}

interface GvizTableRowValue {
  v?: unknown;
  f?: unknown;
}

interface GvizTableRow {
  c?: GvizTableRowValue[] | null;
}

interface GvizTable {
  cols?: GvizTableColumn[] | null;
  rows?: GvizTableRow[] | null;
}

const REQUEST_VARIANTS: RequestVariant[] = (() => {
  const variants: RequestVariant[] = [
    { label: "default", params: {} },
    { label: "alt-json", params: { alt: "json" } },
    { label: "tqx-json", params: { tqx: "out:json" } },
  ];

  const sheetParamKeys = ["sheet", "sheetName", "tab", "worksheet"];
  const sheetExtras: Array<{ suffix: string; extras: Record<string, string> }> = [
    { suffix: "", extras: {} },
    { suffix: "-alt-json", extras: { alt: "json" } },
    { suffix: "-tqx-json", extras: { tqx: "out:json" } },
  ];

  for (const key of sheetParamKeys) {
    for (const name of SHEET_NAME_CANDIDATES) {
      const labelSafeName = name.replace(/\s+/g, "_");
      for (const { suffix, extras: extrasMap } of sheetExtras) {
        const params: Record<string, string> = { ...extrasMap, [key]: name };
        variants.push({
          label: `${key}:${labelSafeName}${suffix}`,
          params,
        });
      }
    }
  }

  const gidExtras: Array<{ suffix: string; extras: Record<string, string> }> = [
    { suffix: "", extras: {} },
    { suffix: "-alt-json", extras: { alt: "json" } },
    { suffix: "-tqx-json", extras: { tqx: "out:json" } },
  ];

  for (const gid of ["0", "1"]) {
    for (const { suffix, extras: extrasMap } of gidExtras) {
      const params: Record<string, string> = { ...extrasMap, gid };
      variants.push({
        label: `gid:${gid}${suffix}`,
        params,
      });
    }
  }

  return variants;
})();

function buildRequestUrl(base: string, params: Record<string, string>) {
  try {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.set("ts", Date.now().toString());
    return url.toString();
  } catch (error) {
    console.warn("Failed to construct Daily News request URL", error);
    return base;
  }
}

function stripJsonSafeguards(rawBody: string) {
  return rawBody
    .replace(/^\)\]\}'/, "")
    .replace(/^while\s*\(true\);?/i, "")
    .replace(/^\/\/.*$/gm, "")
    .trim();
}

function parseResponseText(rawBody: string): unknown {
  const trimmed = stripJsonSafeguards(rawBody);

  if (!trimmed) {
    return [];
  }

  if (/load\s+failed/i.test(trimmed)) {
    throw new Error(
      "The Google Sheets web app reported \"Load Failed\". Ensure the deployment is accessible to anyone with the link."
    );
  }

  if (/^<(!doctype|html)/i.test(trimmed)) {
    throw new Error(
      "The news feed returned HTML instead of JSON. Publish the sheet as JSON or update the Apps Script deployment."
    );
  }

  const gvizMatch = trimmed.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
  if (gvizMatch && gvizMatch[1]) {
    try {
      return JSON.parse(gvizMatch[1]);
    } catch (error) {
      console.warn("Unable to parse Google Visualization response", error);
      throw new Error("We couldn't parse the Google Sheets response. Check that the sheet is published as JSON.");
    }
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      console.warn("Failed to parse JSON response", error, { rawBody: trimmed.slice(0, 200) });
      throw new Error("We couldn't parse the news feed response as JSON.");
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    const probableJson = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(probableJson);
    } catch (error) {
      console.warn("Failed to parse embedded JSON response", error, { rawBody: trimmed.slice(0, 200) });
    }
  }

  throw new Error("We received an unexpected response from the news feed. Please verify the Google Sheets script.");
}

function resolveColumnIndex(columns: string[], matcher: RegExp, fallback: number) {
  const index = columns.findIndex((label) => matcher.test(label));
  return index >= 0 ? index : fallback;
}

function parseGvizTable(table: GvizTable): FetchNewsResult {
  const columns = (table.cols ?? [])
    .map((column) => (column?.label ?? column?.id ?? "").toString().trim().toLowerCase())
    .map((label) => label.replace(/\s+/g, " "));

  const titleIndex = resolveColumnIndex(columns, /title|headline|subject/, 0);
  const descriptionIndex = resolveColumnIndex(columns, /description|summary|body/, 1);
  const linkIndex = resolveColumnIndex(columns, /link|url/, 2);
  const publishedAtIndex = resolveColumnIndex(columns, /date|published|updated/, 3);

  const rows = table.rows ?? [];
  const items: NewsItem[] = rows
    .map((row, rowIndex) => {
      const cells = row?.c ?? [];

      const resolveCell = (index: number) => {
        if (index < 0 || index >= cells.length) {
          return undefined;
        }
        const cell = cells[index];
        const value = cell?.v ?? cell?.f;
        return typeof value === "string" ? value : value != null ? String(value) : undefined;
      };

      const title = resolveCell(titleIndex) ?? `Update ${rowIndex + 1}`;
      const description = resolveCell(descriptionIndex);
      const link = resolveCell(linkIndex);
      const publishedAt = resolveCell(publishedAtIndex);

      return {
        title: title.trim(),
        description: description?.trim() || undefined,
        link: link?.trim() || undefined,
        publishedAt: publishedAt?.trim() || undefined,
      };
    })
    .filter((item) => item.title.length > 0);

  let updatedAt: string | null = null;
  const mostRecent = items
    .map((item) => (item.publishedAt ? Date.parse(item.publishedAt) : Number.NaN))
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => b - a)[0];

  if (Number.isFinite(mostRecent)) {
    updatedAt = new Date(mostRecent).toISOString();
  }

  return { items, updatedAt };
}

function parseNewsEntries(payload: unknown): NewsItem[] {
  let sourceArray: unknown[] = [];

  if (Array.isArray(payload)) {
    sourceArray = payload;
  } else if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.news)) {
      sourceArray = record.news as unknown[];
    } else if (Array.isArray(record.items)) {
      sourceArray = record.items as unknown[];
    } else if (Array.isArray(record.data)) {
      sourceArray = record.data as unknown[];
    } else if (Array.isArray(record.rows)) {
      sourceArray = record.rows as unknown[];
    } else if (Array.isArray(record.entries)) {
      sourceArray = record.entries as unknown[];
    }
  }

  return sourceArray
    .map((entry, index) => {
      if (Array.isArray(entry)) {
        const [title, description, link, publishedAt] = entry as unknown[];
        return {
          title: typeof title === "string" && title.trim() ? title.trim() : `Update ${index + 1}`,
          description: typeof description === "string" ? description.trim() : undefined,
          link: typeof link === "string" ? link.trim() : undefined,
          publishedAt: typeof publishedAt === "string" ? publishedAt.trim() : undefined,
        };
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const title = record.title ?? record.headline ?? record.subject ?? `Update ${index + 1}`;
        const description = record.description ?? record.summary ?? record.body;
        const link = record.link ?? record.url ?? record.href;
        const publishedAt = record.publishedAt ?? record.date ?? record.updatedAt ?? record.timestamp;

        const resolvedTitle =
          typeof title === "string" && title.trim().length > 0 ? title.trim() : String(title ?? `Update ${index + 1}`);

        return {
          title: resolvedTitle || `Update ${index + 1}`,
          description: typeof description === "string" ? description.trim() : undefined,
          link: typeof link === "string" ? link.trim() : undefined,
          publishedAt: typeof publishedAt === "string" ? publishedAt.trim() : undefined,
        };
      }

      return {
        title: typeof entry === "string" && entry.trim() ? entry.trim() : `Update ${index + 1}`,
      };
    })
    .filter((item) => item.title.trim().length > 0);
}

function normalizeNewsPayload(payload: unknown): FetchNewsResult {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.status === "string" && record.status.toLowerCase() === "error") {
      const message =
        typeof record.message === "string"
          ? record.message
          : "The news feed reported an error. Check the Google Sheets deployment.";
      throw new Error(message);
    }

    if (record.table && typeof record.table === "object") {
      return parseGvizTable(record.table as GvizTable);
    }

    const candidate =
      record.news ??
      record.items ??
      record.data ??
      record.records ??
      record.entries ??
      record.feed ??
      record.rows;

    const items = parseNewsEntries(candidate ?? payload);
    const metadata = record.metadata;
    let updatedAt: string | null = null;

    if (typeof record.updatedAt === "string") {
      updatedAt = record.updatedAt.trim();
    } else if (typeof record.lastUpdated === "string") {
      updatedAt = record.lastUpdated.trim();
    } else if (typeof record.lastRefreshed === "string") {
      updatedAt = record.lastRefreshed.trim();
    } else if (metadata && typeof metadata === "object") {
      const metadataRecord = metadata as Record<string, unknown>;
      if (typeof metadataRecord.updatedAt === "string") {
        updatedAt = metadataRecord.updatedAt.trim();
      }
    }

    return { items, updatedAt: updatedAt && updatedAt.length > 0 ? updatedAt : null };
  }

  return {
    items: parseNewsEntries(payload),
    updatedAt: null,
  };
}

async function fetchNewsFromGoogleSheets(): Promise<FetchNewsResult> {
  const errors: string[] = [];
  let lastSuccessfulResult: FetchNewsResult | null = null;

  for (const variant of REQUEST_VARIANTS) {
    const requestUrl = buildRequestUrl(NEWS_ENDPOINT, variant.params);

    try {
      const response = await fetch(requestUrl, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const rawBody = await response.text();

      if (!response.ok) {
        const snippet = rawBody.trim().slice(0, 120).replace(/\s+/g, " ");
        throw new Error(
          snippet.length > 0
            ? `Request failed with status ${response.status}: ${snippet}`
            : `Request failed with status ${response.status}`
        );
      }

      const payload = parseResponseText(rawBody);
      const result = normalizeNewsPayload(payload);

      if (result.items.length > 0) {
        return result;
      }

      if (!lastSuccessfulResult) {
        lastSuccessfulResult = result;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error while fetching the news feed.";
      errors.push(`${variant.label}: ${message}`);
      console.warn(`Failed Daily News fetch attempt (${variant.label})`, error);
    }
  }

  if (lastSuccessfulResult) {
    return lastSuccessfulResult;
  }

  throw new Error(
    errors.length > 0
      ? `Unable to load the Daily News feed.\n${errors.join("\n")}`
      : "Unable to load the Daily News feed from Google Sheets."
  );
}

function formatPublishedDate(rawDate?: string) {
  if (!rawDate) {
    return undefined;
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return parsedDate.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCheckedTimestamp(rawDate?: string) {
  if (!rawDate) {
    return undefined;
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DailyNewsScreen() {
  const insets = useSafeAreaInsets();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionCheckedAt, setConnectionCheckedAt] = useState<string | null>(null);

  const fetchNews = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setIsLoading(true);
      }

      setConnectionStatus((prev) => (isRefresh && prev === "connected" ? prev : "checking"));

      try {
        setError(null);
        const result = await fetchNewsFromGoogleSheets();
        setNewsItems(result.items);
        setLastUpdated(result.updatedAt ?? new Date().toISOString());
        setConnectionStatus("connected");
        setConnectionCheckedAt(new Date().toISOString());

        if (result.items.length === 0) {
          setError("No news items are available right now. Pull down to refresh.");
        }
      } catch (err) {
        console.warn("Failed to load news", err);
        setConnectionStatus("failed");
        setConnectionCheckedAt(new Date().toISOString());
        setError(
          err instanceof Error
            ? err.message || "We couldn't refresh the news. Pull to try again."
            : "We couldn't refresh the news. Pull to try again."
        );
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews(true);
  }, [fetchNews]);

  const subtitle = useMemo(() => {
    if (!lastUpdated) {
      return "Your dispatch team's latest notes";
    }

    const formatted = formatPublishedDate(lastUpdated);
    if (!formatted) {
      return "Your dispatch team's latest notes";
    }

    return `Updated ${formatted}`;
  }, [lastUpdated]);

  const connectionMessage = useMemo(() => {
    if (connectionStatus === "connected") {
      const checked = formatCheckedTimestamp(connectionCheckedAt ?? undefined);
      return checked ? `Connected to Google Sheets • Checked ${checked}` : "Connected to Google Sheets";
    }

    if (connectionStatus === "checking" || connectionStatus === "idle") {
      return "Checking Google Sheets connection…";
    }

    const checked = formatCheckedTimestamp(connectionCheckedAt ?? undefined);
    return checked
      ? `Unable to reach Google Sheets • Last tried ${checked}`
      : "Unable to reach Google Sheets";
  }, [connectionCheckedAt, connectionStatus]);

  const openLink = useCallback((link?: string) => {
    if (!link) {
      return;
    }

    Linking.canOpenURL(link)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(link);
        }
        throw new Error("Unsupported URL");
      })
      .catch(() => {
        setError("We couldn't open that link. Please try again later.");
      });
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <Text style={styles.heading}>Daily News</Text>
      <Text style={styles.subheading}>{subtitle}</Text>

      {connectionStatus !== "idle" && (
        <View style={styles.connectionRow}>
          <View
            style={[
              styles.connectionIndicator,
              connectionStatus === "connected" ? styles.connectionIndicatorConnected : null,
              connectionStatus === "failed" ? styles.connectionIndicatorFailed : null,
            ]}
          />
          <Text style={styles.connectionText}>{connectionMessage}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryLight} />
          <Text style={styles.loadingText}>Loading today's headlines...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            (newsItems.length === 0 && !error) || !!error ? styles.scrollContentStretch : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryLight}
              colors={[Colors.primaryLight]}
            />
          }
          alwaysBounceVertical
          bounces
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {newsItems.length === 0 && !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No updates yet</Text>
              <Text style={styles.emptyStateDescription}>
                Check back soon for the latest announcements from your dispatch team.
              </Text>
            </View>
          ) : (
            newsItems.map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.newsCard}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                {item.publishedAt && <Text style={styles.newsMeta}>{formatPublishedDate(item.publishedAt)}</Text>}
                {item.description && <Text style={styles.newsDescription}>{item.description}</Text>}
                {item.link && (
                  <TouchableOpacity onPress={() => openLink(item.link)}>
                    <Text style={styles.newsLink}>Read more</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.warning,
  },
  connectionIndicatorConnected: {
    backgroundColor: Colors.success,
  },
  connectionIndicatorFailed: {
    backgroundColor: Colors.error,
  },
  connectionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    flexWrap: "wrap" as const,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    gap: 16,
  },
  scrollContentStretch: {
    flexGrow: 1,
    justifyContent: "center",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  newsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  newsMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  newsDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  newsLink: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryLight,
  },
});
