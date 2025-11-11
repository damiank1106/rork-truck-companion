import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  useWindowDimensions,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Trash2,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import { useFiles } from "@/contexts/FilesContext";

export default function FileDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { files, deleteFile } = useFiles();

  const [currentPage, setCurrentPage] = useState<number>(0);

  const isSmallScreen = width < 360;

  const file = useMemo(() => {
    return files.find((f) => f.id === id);
  }, [files, id]);

  if (!file) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="File Not Found"
          topInset={insets.top + (isSmallScreen ? 24 : 16)}
          leftAccessory={
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={Colors.primaryLight} size={24} />
            </TouchableOpacity>
          }
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>The requested file could not be found.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleDeleteFile = () => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.fileName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFile(file.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleShareFile = async () => {
    try {
      if (file.scanImages.length === 0) {
        Alert.alert("No Content", "This file has no pages to share.");
        return;
      }

      if (Platform.OS === "web") {
        Alert.alert("Not Available", "Sharing is not available on web.");
        return;
      }

      await Share.share({
        title: file.fileName,
        message: `Sharing document: ${file.fileName}`,
        url: file.scanImages[0],
      });
    } catch (error) {
      console.error("Error sharing file:", error);
      Alert.alert("Error", "Failed to share file.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < file.scanImages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={file.fileName}
        subtitle={`${file.scanImages.length} page${file.scanImages.length !== 1 ? "s" : ""}`}
        topInset={insets.top + (isSmallScreen ? 24 : 16)}
        leftAccessory={
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={Colors.primaryLight} size={24} />
          </TouchableOpacity>
        }
        rightAccessory={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleShareFile}
            >
              <Share2 color={Colors.primaryLight} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconButton, styles.deleteButton]}
              onPress={handleDeleteFile}
            >
              <Trash2 color={Colors.error} size={20} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(file.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pages:</Text>
            <Text style={styles.infoValue}>{file.scanImages.length}</Text>
          </View>
        </View>

        {file.scanImages.length > 0 && (
          <>
            <View style={styles.pageViewer}>
              <Image
                source={{ uri: file.scanImages[currentPage] }}
                style={styles.pageImage}
                resizeMode="contain"
              />
            </View>

            {file.scanImages.length > 1 && (
              <View style={styles.pageNavigation}>
                <TouchableOpacity
                  style={[
                    styles.pageNavButton,
                    currentPage === 0 && styles.pageNavButtonDisabled,
                  ]}
                  onPress={goToPreviousPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft
                    color={currentPage === 0 ? Colors.textLight : Colors.primaryLight}
                    size={24}
                  />
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    {currentPage + 1} / {file.scanImages.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageNavButton,
                    currentPage === file.scanImages.length - 1 && styles.pageNavButtonDisabled,
                  ]}
                  onPress={goToNextPage}
                  disabled={currentPage === file.scanImages.length - 1}
                >
                  <ChevronRight
                    color={
                      currentPage === file.scanImages.length - 1
                        ? Colors.textLight
                        : Colors.primaryLight
                    }
                    size={24}
                  />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.thumbnailsContainer}>
              <Text style={styles.thumbnailsTitle}>All Pages</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnails}
              >
                {file.scanImages.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnail,
                      currentPage === index && styles.thumbnailActive,
                    ]}
                    onPress={() => setCurrentPage(index)}
                  >
                    <Image source={{ uri }} style={styles.thumbnailImage} />
                    <Text style={styles.thumbnailLabel}>Page {index + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    ...standardShadow,
  },
  deleteButton: {
    backgroundColor: `${Colors.error}15`,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...standardShadow,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...standardShadow,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textLight,
  },
  pageViewer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    ...standardShadow,
  },
  pageImage: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 8,
  },
  pageNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  pageNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...standardShadow,
  },
  pageNavButtonDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    ...standardShadow,
  },
  pageIndicatorText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  thumbnailsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
  },
  thumbnailsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  thumbnails: {
    gap: 12,
    paddingVertical: 4,
  },
  thumbnail: {
    width: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: Colors.primaryLight,
  },
  thumbnailImage: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 6,
  },
  thumbnailLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
    paddingVertical: 8,
  },
});
