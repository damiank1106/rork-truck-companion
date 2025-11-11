import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Alert,
  Animated,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Camera,
  Upload,
  X,
  Check,
  ArrowLeft,
  Trash2,
  FileText,
} from "lucide-react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import { useFiles } from "@/contexts/FilesContext";

export default function ScanDocumentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { addFile } = useFiles();

  const [fileName, setFileName] = useState<string>("");
  const [tripNumber, setTripNumber] = useState<string>("");
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showScanAnimation, setShowScanAnimation] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const isSmallScreen = width < 360;

  const handleCameraPress = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Camera permission is required to scan documents.");
        return;
      }
    }

    setShowCamera(true);
  };

  const handleUploadPress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        setScannedImages([...scannedImages, ...newImages]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to upload images from device.");
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      setShowScanAnimation(true);

      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowScanAnimation(false);
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (photo?.uri && photo.uri.trim() !== "") {
        setScannedImages([...scannedImages, photo.uri]);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture.");
      setShowScanAnimation(false);
    }
  };

  const handleDeleteImage = (index: number) => {
    const newImages = scannedImages.filter((_, i) => i !== index);
    setScannedImages(newImages);
  };

  const handleSaveAsPDF = async () => {
    if (scannedImages.length === 0) {
      Alert.alert("No Images", "Please scan or upload at least one image.");
      return;
    }

    try {
      setIsSaving(true);

      await addFile({
        fileName: fileName.trim() || `Document_${Date.now()}`,
        tripNumber: tripNumber.trim() || undefined,
        scanImages: scannedImages,
      });

      Alert.alert("Success", "Document saved successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving document:", error);
      Alert.alert("Error", "Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <PageHeader
            title="Camera Permission"
            topInset={insets.top + (isSmallScreen ? 24 : 16)}
            leftAccessory={
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <ArrowLeft color={Colors.primaryLight} size={24} />
              </TouchableOpacity>
            }
          />
          <View style={styles.permissionContainer}>
            <Camera color={Colors.textLight} size={64} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to scan documents.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <View style={styles.cameraControlsInner}>
                <Text style={styles.cameraScannedCount}>
                  {scannedImages.length} photo{scannedImages.length !== 1 ? "s" : ""} taken
                </Text>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleTakePicture}
                  disabled={showScanAnimation}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraDoneButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Check color={Colors.white} size={24} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Create Document"
        subtitle="Create a new File"
        topInset={insets.top + (isSmallScreen ? 24 : 16)}
        leftAccessory={
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={Colors.primaryLight} size={24} />
          </TouchableOpacity>
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
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>File Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter document name..."
            placeholderTextColor={Colors.textLight}
            value={fileName}
            onChangeText={setFileName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trip Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter trip number..."
            placeholderTextColor={Colors.textLight}
            value={tripNumber}
            onChangeText={setTripNumber}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add Photos</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCameraPress}>
              <View style={styles.actionButtonIcon}>
                <Camera color={Colors.primaryLight} size={28} />
              </View>
              <Text style={styles.actionButtonText}>Scan with Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleUploadPress}>
              <View style={styles.actionButtonIcon}>
                <Upload color={Colors.secondary} size={28} />
              </View>
              <Text style={styles.actionButtonText}>Upload from Device</Text>
            </TouchableOpacity>
          </View>
        </View>

        {scannedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Taken Pictures ({scannedImages.length})
            </Text>
            <View style={styles.imagesGrid}>
              {scannedImages.map((uri, index) => (
                <View key={index} style={styles.imageCard}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageNumber}>Photo {index + 1}</Text>
                    <TouchableOpacity
                      style={styles.imageDeleteButton}
                      onPress={() => handleDeleteImage(index)}
                    >
                      <Trash2 color={Colors.white} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {scannedImages.length > 0 && (
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveAsPDF}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Check color={Colors.white} size={20} />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    ...standardShadow,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    ...standardShadow,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageCard: {
    width: "47%",
    aspectRatio: 0.707,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.white,
    ...standardShadow,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 8,
  },
  imageNumber: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  imageDeleteButton: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 12,
    ...standardShadow,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  cameraHeader: {
    paddingTop: Platform.select({ ios: 60, android: 40, default: 40 }),
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cameraControls: {
    paddingBottom: Platform.select({ ios: 40, android: 30, default: 30 }),
    paddingTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  cameraControlsInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  cameraScannedCount: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.white,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  cameraDoneButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...standardShadow,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
