import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RefreshCw, X, ExternalLink } from "lucide-react-native";

import AnimatedBackground from "@/components/AnimatedBackground";
import Colors from "@/constants/colors";
import {
  PublishedNewsItem,
  autoFetchNewsOnAppStart,
  getLastNewsFetchTimestamp,
  refreshNewsNow,
} from "@/lib/newsFetcher";

function formatDateLabel(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function extractLatestPublishedDate(items: PublishedNewsItem[]) {
  const timestamps = items
    .map((item) => (item.published_date ? Date.parse(item.published_date) : Number.NaN))
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => b - a);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(timestamps[0]).toISOString();
}

export default function DailyNewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [newsItems, setNewsItems] = useState<PublishedNewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<PublishedNewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const updateItems = useCallback((items: PublishedNewsItem[]) => {
    if (!isMountedRef.current) {
      return;
    }
    setNewsItems(items);
    const fetchTimestamp = getLastNewsFetchTimestamp();
    const latest = extractLatestPublishedDate(items);
    setLastUpdated(fetchTimestamp ?? latest);
  }, [getLastNewsFetchTimestamp, isMountedRef]);

  const loadInitialNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await autoFetchNewsOnAppStart();
      updateItems(items);
      if (isMountedRef.current) {
        setError(null);
      }
    } catch (err) {
      console.warn("Failed to load daily news", err);
      if (isMountedRef.current) {
        setError("We couldn't load the latest news. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isMountedRef, updateItems]);

  const checkForScheduledUpdate = useCallback(async () => {
    try {
      const items = await autoFetchNewsOnAppStart();
      updateItems(items);
    } catch (err) {
      console.warn("Scheduled Daily News check failed", err);
    }
  }, [updateItems]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const items = await refreshNewsNow();
      updateItems(items);
      if (isMountedRef.current) {
        setError(null);
      }
    } catch (err) {
      console.warn("Manual news refresh failed", err);
      if (isMountedRef.current) {
        setError("Refresh failed. Please check your connection and try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isMountedRef, isRefreshing, updateItems]);

  useEffect(() => {
    loadInitialNews().catch(() => {
      // handled in loadInitialNews
    });

    const interval = setInterval(() => {
      checkForScheduledUpdate().catch(() => {
        // handled inside helper
      });
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [checkForScheduledUpdate, loadInitialNews]);

  useFocusEffect(
    useCallback(() => {
      checkForScheduledUpdate().catch(() => {
        // handled inside helper
      });
    }, [checkForScheduledUpdate])
  );

  const headerUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return "";
    }

    const formatted = formatDateLabel(lastUpdated);
    return formatted ? `Last updated ${formatted}` : "";
  }, [lastUpdated]);

  const openSourceLink = useCallback((url?: string) => {
    if (!url) {
      return;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          throw new Error("Unsupported URL");
        }
        return Linking.openURL(url);
      })
      .catch(() => {
        setError("We couldn't open the source link. Please try again later.");
      });
  }, []);

  const renderNewsItem = useCallback(
    ({ item }: { item: PublishedNewsItem }) => {
      const tagLabel = item.tag ? item.tag.trim() : undefined;
      const publishedLabel = formatDateLabel(item.published_date);

      return (
        <TouchableOpacity
          style={styles.newsCard}
          onPress={() => setSelectedNews(item)}
          accessibilityRole="button"
          accessibilityLabel={`Read ${item.title}`}
        >
          <Text style={styles.newsTitle}>{item.title}</Text>
          {tagLabel ? <Text style={styles.newsTag}>{tagLabel}</Text> : null}
          {publishedLabel ? <Text style={styles.newsMeta}>{publishedLabel}</Text> : null}
        </TouchableOpacity>
      );
    },
    []
  );

  const listContentStyle = useMemo(
    () => ({
      paddingHorizontal: 20,
      paddingBottom: Math.max(insets.bottom, 32),
      paddingTop: 24,
    }),
    [insets.bottom]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <AnimatedBackground />
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.replace("/(tabs)/home")}
            accessibilityRole="button"
            accessibilityLabel="Go back to home"
          >
            <ArrowLeft color={Colors.text} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily News</Text>
          <TouchableOpacity
            style={[styles.headerButton, isRefreshing && styles.headerButtonDisabled]}
            onPress={handleRefresh}
            disabled={isRefreshing}
            accessibilityRole="button"
            accessibilityLabel="Refresh news"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <RefreshCw color={Colors.text} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {headerUpdatedLabel ? <Text style={styles.updatedText}>{headerUpdatedLabel}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryLight} />
            <Text style={styles.loadingText}>Loading headlines…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={newsItems}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            renderItem={renderNewsItem}
            contentContainerStyle={listContentStyle}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No news yet</Text>
                <Text style={styles.emptySubtitle}>
                  Check back after 6:30am Central or tap refresh to load the latest updates.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <Modal
        visible={!!selectedNews}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNews(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedNews?.title}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedNews(null)}
                accessibilityRole="button"
                accessibilityLabel="Close news details"
              >
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>
            {selectedNews?.summary ? (
              <Text style={styles.modalSummary}>{selectedNews.summary}</Text>
            ) : (
              <Text style={styles.modalSummary}>No summary is available for this update.</Text>
            )}
            {selectedNews?.source_url ? (
              <TouchableOpacity
                style={styles.modalLinkButton}
                onPress={() => openSourceLink(selectedNews.source_url)}
                accessibilityRole="link"
              >
                <ExternalLink color={Colors.white} size={18} style={styles.modalLinkIcon} />
                <Text style={styles.modalLinkText}>Open Source</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  updatedText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 16,
  },
  errorText: {
    textAlign: "center",
    color: Colors.error,
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  separator: {
    height: 12,
  },
  newsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  newsTag: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  newsMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 12,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSummary: {
    fontSize: 16,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  modalLinkIcon: {
    marginRight: 8,
  },
  modalLinkText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
});
