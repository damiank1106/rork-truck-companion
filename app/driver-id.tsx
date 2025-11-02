import { X, Camera, Trash2, ArrowLeft, Edit2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { useDriverID } from "@/contexts/DriverIDContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 72) / 2;

export default function DriverIDScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { driverID, saveDriverID, deleteDriverID } = useDriverID();

  const [isEditing, setIsEditing] = useState<boolean>(!driverID);
  const [name, setName] = useState<string>(driverID?.name || "");
  const [driverIdNumber, setDriverIdNumber] = useState<string>(driverID?.driverIdNumber || "");
  const [state, setState] = useState<string>(driverID?.state || "");
  const [frontCardUri, setFrontCardUri] = useState<string | undefined>(driverID?.frontCardUri);
  const [backCardUri, setBackCardUri] = useState<string | undefined>(driverID?.backCardUri);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert("Error", "Please enter driver name");
        return;
      }

      if (!driverIdNumber.trim()) {
        Alert.alert("Error", "Please enter driver ID number");
        return;
      }

      if (!state.trim()) {
        Alert.alert("Error", "Please enter state");
        return;
      }

      await saveDriverID({
        name: name.trim(),
        driverIdNumber: driverIdNumber.trim(),
        state: state.trim(),
        frontCardUri,
        backCardUri,
      });

      setIsEditing(false);
      Alert.alert("Success", "Driver ID saved successfully");
    } catch (error) {
      console.error("Error saving driver ID:", error);
      Alert.alert("Error", "Failed to save driver ID");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Driver ID",
      "Are you sure you want to delete this driver ID information?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDriverID();
              router.back();
            } catch (error) {
              console.error("Error deleting driver ID:", error);
              Alert.alert("Error", "Failed to delete driver ID");
            }
          },
        },
      ]
    );
  };

  const pickImage = async (side: "front" | "back") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (side === "front") {
          setFrontCardUri(result.assets[0].uri);
        } else {
          setBackCardUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = (side: "front" | "back") => {
    if (side === "front") {
      setFrontCardUri(undefined);
    } else {
      setBackCardUri(undefined);
    }
  };

  if (!isEditing && driverID) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={Colors.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DL. NO.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={Colors.black} size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ID Cards</Text>
            <View style={styles.cardsGrid}>
              {frontCardUri && (
                <TouchableOpacity
                  style={styles.cardThumbnail}
                  onPress={() => setSelectedImage(frontCardUri)}
                >
                  <Image source={{ uri: frontCardUri }} style={styles.cardThumbnailImage} />
                  <View style={styles.cardLabel}>
                    <Text style={styles.cardLabelText}>Front</Text>
                  </View>
                </TouchableOpacity>
              )}
              {backCardUri && (
                <TouchableOpacity
                  style={styles.cardThumbnail}
                  onPress={() => setSelectedImage(backCardUri)}
                >
                  <Image source={{ uri: backCardUri }} style={styles.cardThumbnailImage} />
                  <View style={styles.cardLabel}>
                    <Text style={styles.cardLabelText}>Back</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Edit2 color={Colors.white} size={20} />
              <Text style={styles.editButtonText}>Edit Driver ID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 color={Colors.white} size={20} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={selectedImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.fullScreenOverlay}>
            <TouchableOpacity
              style={[styles.fullScreenCloseButton, { top: insets.top + 10 }]}
              onPress={() => setSelectedImage(null)}
            >
              <X color={Colors.white} size={32} />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.glassOverlay}>
              <View style={styles.glassContent}>
                <Text style={styles.glassTitle}>{driverID.name}</Text>
                <View style={styles.glassRow}>
                  <Text style={styles.glassLabel}>Driver ID:</Text>
                  <Text style={styles.glassValue}>{driverID.driverIdNumber}</Text>
                </View>
                <View style={styles.glassRow}>
                  <Text style={styles.glassLabel}>State:</Text>
                  <Text style={styles.glassValue}>{driverID.state}</Text>
                </View>
                <TouchableOpacity
                  style={styles.glassEditButton}
                  onPress={() => {
                    setSelectedImage(null);
                    setIsEditing(true);
                  }}
                >
                  <Edit2 color={Colors.white} size={18} />
                  <Text style={styles.glassEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => driverID ? setIsEditing(false) : router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver ID</Text>
        <TouchableOpacity onPress={() => driverID ? setIsEditing(false) : router.back()} style={styles.closeButton}>
          <X color={Colors.black} size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ID Cards</Text>
          <View style={styles.cardsRow}>
            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>Front</Text>
              {frontCardUri ? (
                <TouchableOpacity
                  style={styles.cardImageContainer}
                  onPress={() => setSelectedImage(frontCardUri)}
                >
                  <Image source={{ uri: frontCardUri }} style={styles.cardImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage("front")}
                  >
                    <Trash2 color={Colors.white} size={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addCardButton}
                  onPress={() => pickImage("front")}
                >
                  <Camera color={Colors.primaryLight} size={32} />
                  <Text style={styles.addCardText}>Add Front</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>Back</Text>
              {backCardUri ? (
                <TouchableOpacity
                  style={styles.cardImageContainer}
                  onPress={() => setSelectedImage(backCardUri)}
                >
                  <Image source={{ uri: backCardUri }} style={styles.cardImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage("back")}
                  >
                    <Trash2 color={Colors.white} size={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addCardButton}
                  onPress={() => pickImage("back")}
                >
                  <Camera color={Colors.primaryLight} size={32} />
                  <Text style={styles.addCardText}>Add Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter driver name"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver ID *</Text>
            <TextInput
              style={styles.input}
              value={driverIdNumber}
              onChangeText={setDriverIdNumber}
              placeholder="Enter driver ID number"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Enter state"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          {driverID && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 color={Colors.white} size={20} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  closeButton: {
    padding: 4,
    width: 40,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
  },
  cardContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
    marginBottom: 8,
  },
  cardImageContainer: {
    width: "100%",
    aspectRatio: 1.586,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 20,
    padding: 8,
  },
  addCardButton: {
    width: "100%",
    aspectRatio: 1.586,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primaryLight,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.black,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cardThumbnail: {
    width: CARD_WIDTH,
    aspectRatio: 1.586,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  cardLabelText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.white,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  fullScreenCloseButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  glassOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  glassContent: {
    gap: 12,
  },
  glassTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  glassRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  glassLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  glassValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  glassEditButton: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  glassEditText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
