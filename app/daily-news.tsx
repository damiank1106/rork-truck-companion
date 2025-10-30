import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

import AnimatedBackground from "@/components/AnimatedBackground";
import Colors from "@/constants/colors";

const GOOGLE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwXT7kvkkj_8vIbtHnqCYlS1GKTWyi9obmRKRl1BPLXR0sYmorNenPXYPBYpJ1B3pk/exec";

type RawNewsItem = Record<string, unknown>;

type DailyNewsItem = {
  title: string;
  description?: string;
  date?: string;
  link?: string;
};

const normalizeValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  return undefined;
};

const normalizeNewsItems = (raw: any): DailyNewsItem[] => {
  const candidates: RawNewsItem[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.news)
    ? raw.news
    : [];

  return candidates
    .map((item) => ({
      title:
        normalizeValue(item?.title) ||
        normalizeValue(item?.headline) ||
        normalizeValue(item?.Title) ||
        "Untitled update",
      description:
        normalizeValue(item?.description) ||
        normalizeValue(item?.content) ||
        normalizeValue(item?.summary) ||
        normalizeValue(item?.Details),
      date:
        normalizeValue(item?.date) ||
        normalizeValue(item?.publishedAt) ||
        normalizeValue(item?.Date),
      link:
        normalizeValue(item?.link) ||
        normalizeValue(item?.url) ||
        normalizeValue(item?.Link),
    }))
    .filter((item) => Boolean(item.title));
};

const formatUpdatedAt = (date: Date) =>
  `${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} • ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

export default function DailyNewsScreen() {
  const [items, setItems] = useState<DailyNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadNews = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? true;

    if (showLoader) {
      setIsLoading(true);
    }

    try {
      setError(null);
      const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const raw = await response.json();
      const normalized = normalizeNewsItems(raw);
      setItems(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load daily news", err);
      setError(err instanceof Error ? err.message : "Unable to load daily news");
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNews();
    }, [loadNews])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews({ showLoader: false });
    setRefreshing(false);
  }, [loadNews]);

  const handleOpenLink = useCallback(async (url?: string) => {
    if (!url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn("Unable to open link", err);
    }
  }, []);

  const content = useMemo(() => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.primaryLight} />
          <Text style={styles.stateText}>Loading the latest updates...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>We hit a roadblock</Text>
          <Text style={styles.stateText}>
            {"We couldn't fetch the news right now. Please try again shortly."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNews()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!items.length) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No news just yet</Text>
          <Text style={styles.stateText}>
            Check back soon for the latest updates from dispatch.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item.title}-${index}`}
            style={styles.card}
            activeOpacity={item.link ? 0.85 : 1}
            onPress={() => handleOpenLink(item.link)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.date && <Text style={styles.cardDate}>{item.date}</Text>}
              {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              {item.link && <Text style={styles.cardLinkHint}>Tap to read more</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [error, handleOpenLink, isLoading, items, loadNews, refreshing]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedBackground />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Daily News</Text>
          <Text style={styles.headerSubtitle}>
            Stay in the loop with the latest updates prepared for your route.
          </Text>
          {lastUpdated && (
            <Text style={styles.headerMeta}>Updated {formatUpdatedAt(lastUpdated)}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
  },
  headerContent: {
    position: "relative" as const,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  headerMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardLinkHint: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: "600" as const,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  stateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  },
});
