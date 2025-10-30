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

const NEWS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwXT7kvkkj_8vIbtHnqCYlS1GKTWyi9obmRKRl1BPLXR0sYmorNenPXYPBYpJ1B3pk/exec";

interface NewsItem {
  title: string;
  description?: string;
  link?: string;
  publishedAt?: string;
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
        const link = record.link ?? record.url;
        const publishedAt = record.publishedAt ?? record.date ?? record.updatedAt;

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

export default function DailyNewsScreen() {
  const insets = useSafeAreaInsets();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      setError(null);
      const url = `${NEWS_ENDPOINT}?ts=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      let payload: unknown;

      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        const rawBody = await response.text();
        try {
          payload = JSON.parse(rawBody);
        } catch (parseError) {
          console.warn("Unexpected response from news endpoint", {
            parseError,
            rawBody,
          });
          throw new Error("We received an unexpected response from the news feed.");
        }
      }

      const parsedNews = parseNewsEntries(payload);
      setNewsItems(parsedNews);

      if (payload && typeof payload === "object" && payload !== null) {
        const record = payload as Record<string, unknown>;
        const updated =
          record.updatedAt ??
          record.lastUpdated ??
          (typeof record.metadata === "object" && record.metadata !== null
            ? (record.metadata as Record<string, unknown>).updatedAt
            : null);
        if (typeof updated === "string" && updated.trim()) {
          setLastUpdated(updated.trim());
        } else {
          setLastUpdated(new Date().toISOString());
        }
      } else {
        setLastUpdated(new Date().toISOString());
      }

      if (parsedNews.length === 0) {
        setError("No news items are available right now. Pull down to refresh.");
      }
    } catch (err) {
      console.warn("Failed to load news", err);
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
  }, []);

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
    marginBottom: 16,
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
    textAlign: "center",
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
