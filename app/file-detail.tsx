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
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Trash2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  Upload,
  X,
  Edit3,
  Save,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import { useFiles } from "@/contexts/FilesContext";

export default function FileDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { files, deleteFile, updateFile } = useFiles();

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editFileName, setEditFileName] = useState<string>("");
  const [editTripNumber, setEditTripNumber] = useState<string>("");
  const [editDisplayField, setEditDisplayField] = useState<'fileName' | 'tripNumber'>('fileName');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const isSmallScreen = width < 360;

  const file = useMemo(() => {
    return files.find((f) => f.id === id);
  }, [files, id]);

  React.useEffect(() => {
    if (file) {
      setEditFileName(file.fileName || "");
      setEditTripNumber(file.tripNumber || "");
      setEditDisplayField(file.displayField || 'fileName');
    }
  }, [file]);

  if (!file) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="File Not Found"
          topInset={insets.top + (isSmallScreen ? 24 : 16)}
          leftAccessory={
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft color={Colors.primaryLight} size={24} />
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

  const handleAddFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        await updateFile(file.id, {
          scanImages: [...file.scanImages, ...newImages],
        });
        setShowAddPhotoModal(false);
        Alert.alert("Success", "Photos added successfully!");
      }
    } catch (error) {
      console.error("Error adding from camera:", error);
      Alert.alert("Error", "Failed to add photos from camera.");
    }
  };

  const handleAddFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        await updateFile(file.id, {
          scanImages: [...file.scanImages, ...newImages],
        });
        setShowAddPhotoModal(false);
        Alert.alert("Success", "Photos added successfully!");
      }
    } catch (error) {
      console.error("Error adding from device:", error);
      Alert.alert("Error", "Failed to add photos from device.");
    }
  };

  const handleDeletePage = (index: number) => {
    Alert.alert(
      "Delete Photo",
      `Are you sure you want to delete photo ${index + 1}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const newImages = file.scanImages.filter((_, i) => i !== index);
            if (newImages.length === 0) {
              Alert.alert(
                "Cannot Delete",
                "You must keep at least one photo in the file."
              );
              return;
            }
            await updateFile(file.id, { scanImages: newImages });
            if (currentPage >= newImages.length) {
              setCurrentPage(newImages.length - 1);
            }
            Alert.alert("Success", "Photo deleted successfully!");
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    const finalFileName = editFileName.trim();
    const finalTripNumber = editTripNumber.trim();

    if (!finalFileName && !finalTripNumber) {
      Alert.alert("Error", "Please provide either a File Name or Trip Number.");
      return;
    }

    try {
      await updateFile(file.id, {
        fileName: finalFileName || undefined,
        tripNumber: finalTripNumber || undefined,
        displayField: editDisplayField,
      });
      setIsEditMode(false);
      Alert.alert("Success", "File updated successfully!");
    } catch (error) {
      console.error("Error updating file:", error);
      Alert.alert("Error", "Failed to update file.");
    }
  };

  const handleCancelEdit = () => {
    setEditFileName(file.fileName || "");
    setEditTripNumber(file.tripNumber || "");
    setEditDisplayField(file.displayField || 'fileName');
    setIsEditMode(false);
  };

  const handleOpenImageModal = () => {
    setShowImageModal(true);
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={isEditMode ? "Edit File" : ""}
        topInset={insets.top + (isSmallScreen ? 24 : 16)}
        leftAccessory={
          <TouchableOpacity onPress={isEditMode ? handleCancelEdit : () => router.back()}>
            <ChevronLeft color={Colors.primaryLight} size={24} />
          </TouchableOpacity>
        }
        rightAccessory={
          isEditMode ? (
            <TouchableOpacity
              style={[styles.headerIconButton, styles.saveButton]}
              onPress={handleSaveEdit}
            >
              <Save color={Colors.white} size={20} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerIconButton, styles.cameraButton]}
                onPress={() => setShowAddPhotoModal(true)}
              >
                <Camera color={Colors.white} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setIsEditMode(true)}
              >
                <Edit3 color={Colors.primaryLight} size={20} />
              </TouchableOpacity>
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
          )
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
        {isEditMode ? (
          <View style={styles.editContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>{formatDate(file.createdAt)}</Text>
              </View>

              <View style={styles.editSection}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.editLabel}>File Name</Text>
                  <View style={styles.checkboxContainer}>
                    <Text style={styles.displayText}>Display</Text>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEditDisplayField('fileName')}
                    >
                      {editDisplayField === 'fileName' && (
                        <View style={styles.checkboxChecked} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={styles.editInput}
                  placeholder="Enter file name..."
                  placeholderTextColor={Colors.textLight}
                  value={editFileName}
                  onChangeText={setEditFileName}
                />
              </View>

              <View style={styles.editSection}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.editLabel}>Trip Number</Text>
                  <View style={styles.checkboxContainer}>
                    <Text style={styles.displayText}>Display</Text>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEditDisplayField('tripNumber')}
                    >
                      {editDisplayField === 'tripNumber' && (
                        <View style={styles.checkboxChecked} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={styles.editInput}
                  placeholder="Enter trip number..."
                  placeholderTextColor={Colors.textLight}
                  value={editTripNumber}
                  onChangeText={setEditTripNumber}
                />
              </View>

              <View style={[styles.infoRow, styles.lastRow]}>
                <Text style={styles.infoLabel}>Photos:</Text>
                <Text style={styles.infoValue}>{file.scanImages.length}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => setShowAddPhotoModal(true)}
              >
                <Plus color={Colors.white} size={20} />
                <Text style={styles.addPhotoButtonText}>Add Photos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.thumbnailsContainer}>
              <Text style={styles.thumbnailsTitle}>Photos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnails}
              >
                {file.scanImages.map((uri, index) => (
                  <View
                    key={index}
                    style={styles.thumbnail}
                  >
                    <View style={styles.thumbnailTouchable}>
                      <Image source={{ uri }} style={styles.thumbnailImage} />
                      <Text style={styles.thumbnailLabel}>Photo {index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.thumbnailDeleteButton}
                      onPress={() => handleDeletePage(index)}
                    >
                      <Trash2 color={Colors.white} size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>{formatDate(file.createdAt)}</Text>
              </View>
              {file.fileName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>File Name:</Text>
                  <Text style={styles.infoValue}>{file.fileName}</Text>
                </View>
              )}
              {file.tripNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Trip Number:</Text>
                  <Text style={styles.infoValue}>{file.tripNumber}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Photos:</Text>
                <Text style={styles.infoValue}>{file.scanImages.length}</Text>
              </View>
            </View>

            {file.scanImages.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.pageViewer}
                  onPress={handleOpenImageModal}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: file.scanImages[currentPage] }}
                    style={styles.pageImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

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
                  <Text style={styles.thumbnailsTitle}>Photos</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnails}
                  >
                    {file.scanImages.map((uri, index) => (
                      <View
                        key={index}
                        style={[
                          styles.thumbnail,
                          currentPage === index && styles.thumbnailActive,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.thumbnailTouchable}
                          onPress={() => setCurrentPage(index)}
                        >
                          <Image source={{ uri }} style={styles.thumbnailImage} />
                          <Text style={styles.thumbnailLabel}>Photo {index + 1}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.thumbnailDeleteButton}
                          onPress={() => handleDeletePage(index)}
                        >
                          <Trash2 color={Colors.white} size={12} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAddPhotoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Photos</Text>
              <TouchableOpacity onPress={() => setShowAddPhotoModal(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleAddFromCamera}>
              <Camera color={Colors.primaryLight} size={24} />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleAddFromDevice}>
              <Upload color={Colors.secondary} size={24} />
              <Text style={styles.modalButtonText}>Choose from Device</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showImageModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setShowImageModal(false)}
          >
            <X color={Colors.white} size={28} />
          </TouchableOpacity>
          <View style={styles.imageModalContent}>
            <Image
              source={{ uri: file.scanImages[currentPage] }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
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
  cameraButton: {
    backgroundColor: Colors.primaryLight,
  },
  saveButton: {
    backgroundColor: Colors.primaryLight,
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
  editContainer: {
    flex: 1,
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
  lastRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textLight,
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
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
    position: "relative",
  },
  thumbnailTouchable: {
    width: "100%",
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
  thumbnailDeleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 16,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  editSection: {
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  fieldHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  displayText: {
    fontSize: 12,
    color: "#6B7280" as const,
    fontWeight: "500" as const,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: Colors.primaryLight,
  },
  editInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtons: {
    marginBottom: 20,
  },
  addPhotoButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    ...standardShadow,
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  imageModalCloseButton: {
    position: "absolute" as const,
    top: Platform.select({ ios: 60, android: 40, default: 40 }),
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 10,
  },
  imageModalContent: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  imageModalImage: {
    width: "100%" as const,
    height: "100%" as const,
  },
});
