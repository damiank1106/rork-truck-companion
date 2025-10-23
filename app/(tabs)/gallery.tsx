import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, MapPin, Plus, Trash2, X, Edit2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import Colors from "@/constants/colors";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useGallery } from "@/contexts/GalleryContext";
import { GalleryPhoto } from "@/types";

const { width } = Dimensions.get("window");
const THUMBNAIL_SIZE = (width - 72) / 3;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const { photos, addPhoto, deletePhoto, updatePhoto } = useGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);

  const handleAddPhoto = () => {
    setIsAddModalVisible(true);
  };

  const handleViewPhoto = (photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhoto(id);
    setSelectedPhoto(null);
  };

  const groupedPhotos = photos.reduce(
    (acc, photo) => {
      const date = new Date(photo.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(photo);
      return acc;
    },
    {} as Record<string, GalleryPhoto[]>
  );

  const sections = Object.entries(groupedPhotos).map(([date, items]) => ({
    date,
    data: items,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AnimatedBackground />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Gallery</Text>
            <Text style={styles.headerSubtitle}>{photos.length} photos</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
            <Plus color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <ImageIcon color={Colors.textLight} size={64} />
          <Text style={styles.emptyStateTitle}>No photos yet</Text>
          <Text style={styles.emptyStateText}>
            Start documenting your journey with photos
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPhoto}>
            <Text style={styles.emptyStateButtonText}>Add Your First Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.date} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.date}</Text>
              <View style={styles.photoGrid}>
                {section.data.map((photo) => (
                  <View key={photo.id} style={styles.photoItem}>
                    <TouchableOpacity
                      style={styles.photoTouchable}
                      onPress={() => handleViewPhoto(photo)}
                      activeOpacity={0.95}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                      <View style={styles.photoOverlay}>
                        <View style={styles.photoOverlayContent}>
                          <View style={styles.photoInfoSection}>
                            <View style={styles.photoCategoryBadge}>
                              <Text style={styles.photoCategoryText}>{photo.category}</Text>
                            </View>
                            {photo.location && (
                              <View style={styles.photoLocationRow}>
                                <MapPin color={Colors.white} size={14} />
                                <Text style={styles.photoLocationText} numberOfLines={1}>
                                  {photo.location}
                                </Text>
                              </View>
                            )}
                            {photo.notes && (
                              <Text style={styles.photoNotesText} numberOfLines={2}>
                                {photo.notes}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.photoDeleteButton}
                            onPress={() => {
                              Alert.alert(
                                "Delete Photo",
                                "Are you sure you want to delete this photo?",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => handleDeletePhoto(photo.id),
                                  },
                                ]
                              );
                            }}
                          >
                            <Trash2 color={Colors.white} size={20} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <AddPhotoModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={addPhoto}
      />

      <PhotoDetailModal
        photo={selectedPhoto}
        visible={selectedPhoto !== null && !isEditModalVisible}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handleDeletePhoto}
        onEdit={() => setIsEditModalVisible(true)}
      />

      <EditPhotoModal
        photo={selectedPhoto}
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedPhoto(null);
        }}
        onUpdate={updatePhoto}
      />
    </View>
  );
}

interface AddPhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (photo: Omit<GalleryPhoto, "id" | "createdAt">) => Promise<GalleryPhoto>;
}

function AddPhotoModal({ visible, onClose, onAdd }: AddPhotoModalProps) {
  const [selectedUri, setSelectedUri] = useState<string>("");
  const [category, setCategory] = useState<GalleryPhoto["category"]>("truck");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant photo library access to add photos");
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as ImagePicker.MediaTypeOptions,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera access to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUri) {
      Alert.alert("Error", "Please select a photo");
      return;
    }

    await onAdd({
      uri: selectedUri,
      category,
      location: location || undefined,
      notes: notes || undefined,
    });

    setSelectedUri("");
    setCategory("truck");
    setLocation("");
    setNotes("");
    onClose();
  };

  const handleClose = () => {
    setSelectedUri("");
    setCategory("truck");
    setLocation("");
    setNotes("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            <TouchableOpacity onPress={handleClose}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!selectedUri ? (
              <View style={styles.photoPickerContainer}>
                <TouchableOpacity style={styles.photoPickerButton} onPress={pickImage}>
                  <ImageIcon color={Colors.primaryLight} size={32} />
                  <Text style={styles.photoPickerText}>Choose from Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoPickerButton} onPress={takePhoto}>
                  <Camera color={Colors.primaryLight} size={32} />
                  <Text style={styles.photoPickerText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Image source={{ uri: selectedUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryContainer}>
                  {(["truck", "scenic", "location", "maintenance", "other"] as const).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          category === cat && styles.categoryButtonActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            category === cat && styles.categoryButtonTextActive,
                          ]}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Location (optional)"
                  placeholderTextColor={Colors.textLight}
                  value={location}
                  onChangeText={setLocation}
                />

                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Notes (optional)"
                  placeholderTextColor={Colors.textLight}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Add Photo</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface PhotoDetailModalProps {
  photo: GalleryPhoto | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

function PhotoDetailModal({ photo, visible, onClose, onDelete, onEdit }: PhotoDetailModalProps) {
  const insets = useSafeAreaInsets();
  
  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <StatusBar style="light" />
      <View style={styles.photoDetailOverlay}>
        <TouchableOpacity 
          style={[styles.photoDetailClose, { top: insets.top + 10 }]} 
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={Colors.white} size={32} />
        </TouchableOpacity>

        <Image source={{ uri: photo.uri }} style={styles.photoDetailImage} />

        <View style={styles.photoDetailGlassOverlay}>
          <View style={styles.photoDetailInfo}>
            <View style={styles.photoDetailBadge}>
              <Text style={styles.photoDetailBadgeText}>{photo.category}</Text>
            </View>
            {photo.location && (
              <View style={styles.photoDetailLocationRow}>
                <MapPin color={Colors.white} size={18} />
                <Text style={styles.photoDetailLocation}>{photo.location}</Text>
              </View>
            )}
            {photo.notes && <Text style={styles.photoDetailNotes}>{photo.notes}</Text>}
            <Text style={styles.photoDetailDate}>
              {new Date(photo.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <View style={styles.photoDetailActions}>
              <TouchableOpacity
                style={styles.photoDetailEditButton}
                onPress={onEdit}
              >
                <Edit2 color={Colors.white} size={20} />
                <Text style={styles.photoDetailEditText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoDetailDeleteButton}
                onPress={() => {
                  Alert.alert(
                    "Delete Photo",
                    "Are you sure you want to delete this photo?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onDelete(photo.id),
                      },
                    ]
                  );
                }}
              >
                <Trash2 color={Colors.white} size={20} />
                <Text style={styles.photoDetailDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface EditPhotoModalProps {
  photo: GalleryPhoto | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<GalleryPhoto>) => Promise<void>;
}

function EditPhotoModal({ photo, visible, onClose, onUpdate }: EditPhotoModalProps) {
  const [category, setCategory] = useState<GalleryPhoto["category"]>(photo?.category || "truck");
  const [location, setLocation] = useState<string>(photo?.location || "");
  const [notes, setNotes] = useState<string>(photo?.notes || "");

  React.useEffect(() => {
    if (photo) {
      setCategory(photo.category);
      setLocation(photo.location || "");
      setNotes(photo.notes || "");
    }
  }, [photo]);

  const handleSubmit = async () => {
    if (!photo) return;

    await onUpdate(photo.id, {
      category,
      location: location || undefined,
      notes: notes || undefined,
    });

    onClose();
  };

  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Photo</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              {(["truck", "scenic", "location", "maintenance", "other"] as const).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Location (optional)"
              placeholderTextColor={Colors.textLight}
              value={location}
              onChangeText={setLocation}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  headerContent: {
    position: "relative" as const,
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 2,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: "System",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#000000",
    opacity: 0.75,
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: "System",
  },
  addButton: {
    backgroundColor: Colors.primaryLight,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#000000",
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.black,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  photoTouchable: {
    width: "100%",
    height: "100%",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoOverlay: {
    display: "none",
  },
  photoOverlayContent: {
    display: "none",
  },
  photoInfoSection: {
    display: "none",
  },
  photoCategoryBadge: {
    display: "none",
  },
  photoCategoryText: {
    display: "none",
  },
  photoLocationRow: {
    display: "none",
  },
  photoLocationText: {
    display: "none",
  },
  photoNotesText: {
    display: "none",
  },
  photoDeleteButton: {
    display: "none",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#000000",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 400,
  },
  photoPickerContainer: {
    gap: 16,
  },
  photoPickerButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  photoPickerText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "contain",
  },
  changePhotoButton: {
    alignSelf: "center",
    marginBottom: 20,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: "600" as const,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.7,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500" as const,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
    marginBottom: 12,
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  photoDetailOverlay: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  photoDetailClose: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  photoDetailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  photoDetailGlassOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  photoDetailInfo: {
    gap: 12,
  },
  photoDetailBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoDetailBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "700" as const,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  photoDetailLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  photoDetailLocation: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.white,
    flex: 1,
  },
  photoDetailNotes: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  photoDetailDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.7,
  },
  photoDetailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  photoDetailEditButton: {
    flex: 1,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoDetailEditText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  photoDetailDeleteButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoDetailDeleteText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },

});
