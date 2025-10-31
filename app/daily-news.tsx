import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCcw, ExternalLink } from "lucide-react-native";

import AnimatedBackground from "@/components/AnimatedBackground";
import Colors from "@/constants/colors";
import { autoFetchNewsOnAppStart, refreshNewsNow, type NewsItem } from "@/lib/newsFetcher";

type FetchStatus = "idle" | "loading" | "error" | "success";

export default function DailyNewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setStatus("loading");
    autoFetchNewsOnAppStart()
      .then((items) => {
        setNewsItems(items ?? []);
        setStatus("success");
        setErrorMessage(null);
      })
      .catch((error) => {
        console.warn("Failed to auto fetch news", error);
        setErrorMessage("We couldn't refresh the news. Try again in a moment.");
        setStatus("error");
      });
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const items = await refreshNewsNow();
      setNewsItems(items ?? []);
      setErrorMessage(null);
      setStatus("success");
    } catch (error) {
      console.warn("Failed to refresh news", error);
      setErrorMessage("We couldn't refresh the news. Try again in a moment.");
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenSource = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Failed to open news link", error);
    }
  };

  const renderContent = () => {
    if (status === "loading" && newsItems.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.black} />
          <Text style={styles.loadingText}>Loading the latest stories...</Text>
        </View>
      );
    }

    if (status === "error" && newsItems.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (newsItems.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No news has been published yet today.</Text>
        </View>
      );
    }

    return newsItems.map((item, index) => (
      <TouchableOpacity
        key={`${item.title}-${index}`}
        style={styles.newsCard}
        onPress={() => setSelectedNews(item)}
        accessibilityRole="button"
      >
        <Text style={styles.newsTitle}>{item.title}</Text>
        {item.published_date ? (
          <Text style={styles.newsMeta}>{item.published_date}</Text>
        ) : null}
        {item.tag ? <Text style={styles.newsTag}>{item.tag}</Text> : null}
      </TouchableOpacity>
    ));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AnimatedBackground />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.replace("/(tabs)/home")}
            accessibilityLabel="Go back to home"
          >
            <ArrowLeft color={Colors.black} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily News</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
            accessibilityLabel="Refresh news"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Colors.black} />
            ) : (
              <RefreshCcw color={Colors.black} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {errorMessage && status !== "error" ? (
          <Text style={styles.infoText}>{errorMessage}</Text>
        ) : null}
        {renderContent()}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={!!selectedNews}
        onRequestClose={() => setSelectedNews(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedNews(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedNews?.title}</Text>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalSummary}>
                    {selectedNews?.summary || "No summary is available for this story."}
                  </Text>
                </ScrollView>
                <View style={styles.modalActions}>
                  {selectedNews?.source_url ? (
                    <TouchableOpacity
                      style={styles.sourceButton}
                      onPress={() => handleOpenSource(selectedNews?.source_url)}
                    >
                      <ExternalLink color={Colors.white} size={18} />
                      <Text style={styles.sourceButtonText}>Open Source</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedNews(null)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    height: 120,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative" as const,
    zIndex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.black,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    color: Colors.black,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.black,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: "600" as const,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.black,
    textAlign: "center",
    opacity: 0.8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.black,
    opacity: 0.6,
    marginBottom: 8,
    textAlign: "center",
  },
  newsCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 6,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.black,
  },
  newsMeta: {
    fontSize: 13,
    color: Colors.black,
    opacity: 0.6,
  },
  newsTag: {
    fontSize: 12,
    color: Colors.black,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.black,
  },
  modalBody: {
    maxHeight: 240,
  },
  modalSummary: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  sourceButtonText: {
    color: Colors.white,
    fontWeight: "600" as const,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.15)",
  },
  closeButtonText: {
    color: Colors.black,
    fontWeight: "600" as const,
  },
});
