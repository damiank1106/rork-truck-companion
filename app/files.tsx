import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowDownUp,
  Grid3x3,
  Plus,
  Search,
  List,
  FileText,
  Calendar,
  Trash2,
  X,
} from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import { useFiles } from "@/contexts/FilesContext";

type SortOption = "date-newest" | "date-oldest" | "name-az" | "name-za";
type DisplayMode = "grid" | "list";

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { files, deleteFile } = useFiles();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [showSortModal, setShowSortModal] = useState<boolean>(false);
  const [showDisplayModal, setShowDisplayModal] = useState<boolean>(false);

  const isSmallScreen = width < 360;
  const isMediumScreen = width >= 360 && width < 768;

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((file) => {
        const fileName = file.fileName.toLowerCase();
        const date = new Date(file.createdAt);
        const dateStr = date.toLocaleDateString().toLowerCase();
        return fileName.includes(query) || dateStr.includes(query);
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-az":
          return a.fileName.localeCompare(b.fileName);
        case "name-za":
          return b.fileName.localeCompare(a.fileName);
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, sortBy]);

  const handleDeleteFile = (id: string, fileName: string) => {
    Alert.alert("Delete File", `Are you sure you want to delete "${fileName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFile(id);
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Files"
        subtitle="Manage your scanned documents"
        topInset={insets.top + (isSmallScreen ? 24 : 16)}
        rightAccessory={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowSortModal(true)}
            >
              <ArrowDownUp color={Colors.primaryLight} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowDisplayModal(true)}
            >
              {displayMode === "grid" ? (
                <Grid3x3 color={Colors.primaryLight} size={20} />
              ) : (
                <List color={Colors.primaryLight} size={20} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconButton, styles.plusButton]}
              onPress={() => router.push("/scan-document")}
            >
              <Plus color={Colors.white} size={20} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={Colors.textLight} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or date..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X color={Colors.textLight} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color={Colors.textLight} size={64} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? "No files found" : "No files yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "Try a different search term"
                : "Tap + to scan your first document"}
            </Text>
          </View>
        ) : displayMode === "grid" ? (
          <View style={styles.gridContainer}>
            {filteredAndSortedFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[
                  styles.gridItem,
                  isSmallScreen && styles.gridItemSmall,
                  isMediumScreen && styles.gridItemMedium,
                ]}
                onPress={() => router.push(`/file-detail?id=${file.id}`)}
              >
                {file.scanImages.length > 0 ? (
                  <Image
                    source={{ uri: file.scanImages[0] }}
                    style={styles.gridThumbnail}
                  />
                ) : (
                  <View style={styles.gridIconContainer}>
                    <FileText color={Colors.primaryLight} size={32} />
                  </View>
                )}
                <Text style={styles.gridFileName} numberOfLines={2}>
                  {file.fileName}
                </Text>
                <Text style={styles.gridFileDate}>{formatDate(file.createdAt)}</Text>
                <TouchableOpacity
                  style={styles.gridDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id, file.fileName);
                  }}
                >
                  <Trash2 color={Colors.error} size={16} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredAndSortedFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.listItem}
                onPress={() => router.push(`/file-detail?id=${file.id}`)}
              >
                {file.scanImages.length > 0 ? (
                  <Image
                    source={{ uri: file.scanImages[0] }}
                    style={styles.listThumbnail}
                  />
                ) : (
                  <View style={styles.listIconContainer}>
                    <FileText color={Colors.primaryLight} size={24} />
                  </View>
                )}
                <View style={styles.listContent}>
                  <Text style={styles.listFileName}>{file.fileName}</Text>
                  <View style={styles.listMeta}>
                    <Calendar color={Colors.textLight} size={14} />
                    <Text style={styles.listFileDate}>{formatDate(file.createdAt)}</Text>
                    <Text style={styles.listFilePages}>
                      {file.scanImages.length} page{file.scanImages.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.listDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id, file.fileName);
                  }}
                >
                  <Trash2 color={Colors.error} size={20} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <SortModal
        visible={showSortModal}
        currentSort={sortBy}
        onClose={() => setShowSortModal(false)}
        onSelect={(option) => {
          setSortBy(option);
          setShowSortModal(false);
        }}
      />

      <DisplayModal
        visible={showDisplayModal}
        currentMode={displayMode}
        onClose={() => setShowDisplayModal(false)}
        onSelect={(mode) => {
          setDisplayMode(mode);
          setShowDisplayModal(false);
        }}
      />
    </View>
  );
}

interface SortModalProps {
  visible: boolean;
  currentSort: SortOption;
  onClose: () => void;
  onSelect: (option: SortOption) => void;
}

function SortModal({ visible, currentSort, onClose, onSelect }: SortModalProps) {
  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Date (Newest First)", value: "date-newest" },
    { label: "Date (Oldest First)", value: "date-oldest" },
    { label: "Name (A-Z)", value: "name-az" },
    { label: "Name (Z-A)", value: "name-za" },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sort By</Text>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                currentSort === option.value && styles.modalOptionActive,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  currentSort === option.value && styles.modalOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface DisplayModalProps {
  visible: boolean;
  currentMode: DisplayMode;
  onClose: () => void;
  onSelect: (mode: DisplayMode) => void;
}

function DisplayModal({ visible, currentMode, onClose, onSelect }: DisplayModalProps) {
  const displayOptions: { label: string; value: DisplayMode; icon: React.ReactNode }[] = [
    { label: "List View", value: "list", icon: <List color={Colors.primaryLight} size={20} /> },
    { label: "Grid View", value: "grid", icon: <Grid3x3 color={Colors.primaryLight} size={20} /> },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Display Mode</Text>
          {displayOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                currentMode === option.value && styles.modalOptionActive,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <View style={styles.modalOptionIcon}>{option.icon}</View>
              <Text
                style={[
                  styles.modalOptionText,
                  currentMode === option.value && styles.modalOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  plusButton: {
    backgroundColor: Colors.primaryLight,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
    position: "relative",
  },
  gridItemSmall: {
    width: "100%",
  },
  gridItemMedium: {
    width: "47%",
  },
  gridIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gridThumbnail: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 8,
    marginBottom: 12,
  },
  gridFileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  gridFileDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  gridDeleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listThumbnail: {
    width: 60,
    height: 85,
    borderRadius: 8,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listFileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listFileDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  listFilePages: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 6,
  },
  listDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.error}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...standardShadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  modalOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  modalOptionTextActive: {
    color: Colors.white,
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
