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
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Upload,
  X,
  Trash2,
  Plus,
  FileText,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";

interface ConvertedPDF {
  id: string;
  name: string;
  originalImage: string;
  pdfData: string;
  createdAt: string;
}

export default function ConvertToPDFScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [convertedPDFs, setConvertedPDFs] = useState<ConvertedPDF[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const isSmallScreen = width < 360;

  const handleDeletePDF = (id: string, name: string) => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setConvertedPDFs(convertedPDFs.filter((pdf) => pdf.id !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Convert to PDF"
        subtitle="Scan and convert documents to PDF"
        topInset={insets.top + (isSmallScreen ? 24 : 16)}
        rightAccessory={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerIconButton, styles.plusButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color={Colors.white} size={20} />
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
        showsVerticalScrollIndicator={true}
      >
        {convertedPDFs.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color={Colors.textLight} size={64} />
            <Text style={styles.emptyStateTitle}>No PDFs yet</Text>
            <Text style={styles.emptyStateText}>
              Tap + to convert your first document to PDF
            </Text>
          </View>
        ) : (
          <View style={styles.pdfList}>
            {convertedPDFs.map((pdf) => (
              <View key={pdf.id} style={styles.pdfCard}>
                <Image source={{ uri: pdf.originalImage }} style={styles.pdfThumbnail} />
                <View style={styles.pdfInfo}>
                  <Text style={styles.pdfName}>{pdf.name}</Text>
                  <Text style={styles.pdfDate}>
                    {new Date(pdf.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.pdfDeleteButton}
                  onPress={() => handleDeletePDF(pdf.id, pdf.name)}
                >
                  <Trash2 color={Colors.error} size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showCreateModal && (
        <CreatePDFModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={(pdf) => {
            setConvertedPDFs([pdf, ...convertedPDFs]);
            setShowCreateModal(false);
          }}
        />
      )}
    </View>
  );
}

interface CreatePDFModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (pdf: ConvertedPDF) => void;
}

function CreatePDFModal({ visible, onClose, onSave }: CreatePDFModalProps) {
  const insets = useSafeAreaInsets();

  const [fileName, setFileName] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);

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
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to upload image from device.");
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (photo?.uri && photo.uri.trim() !== "") {
        setUploadedImage(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture.");
    }
  };

  const handleConvert = async () => {
    if (!fileName.trim()) {
      Alert.alert("Missing Name", "Please provide a name for the PDF.");
      return;
    }

    if (!uploadedImage) {
      Alert.alert("Missing Image", "Please upload or take a photo first.");
      return;
    }

    try {
      setIsConverting(true);

      const pdfDataSimulated = `data:application/pdf;base64,${Date.now()}`;

      const newPDF: ConvertedPDF = {
        id: Date.now().toString(),
        name: fileName.trim(),
        originalImage: uploadedImage,
        pdfData: pdfDataSimulated,
        createdAt: new Date().toISOString(),
      };

      Alert.alert("Success", `"${fileName.trim()}" has been converted to PDF!`, [
        {
          text: "OK",
          onPress: () => {
            onSave(newPDF);
            setFileName("");
            setUploadedImage(null);
          },
        },
      ]);
    } catch (error) {
      console.error("Error converting to PDF:", error);
      Alert.alert("Error", "Failed to convert image to PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Camera Permission</Text>
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <X color={Colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
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
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
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
                <View style={{ width: 56 }} />
                <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <View style={{ width: 56 }} />
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create PDF</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={Colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>File Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter PDF name..."
              placeholderTextColor={Colors.textLight}
              value={fileName}
              onChangeText={setFileName}
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Upload Image</Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleCameraPress}>
                <Camera color={Colors.primaryLight} size={24} />
                <Text style={styles.uploadButtonText}>Use Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
                <Upload color={Colors.secondary} size={24} />
                <Text style={styles.uploadButtonText}>Upload from Device</Text>
              </TouchableOpacity>
            </View>
          </View>

          {uploadedImage && (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Uploaded Image</Text>
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: uploadedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => setUploadedImage(null)}
                >
                  <Trash2 color={Colors.white} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.convertButton,
              (isConverting || !fileName.trim() || !uploadedImage) && styles.convertButtonDisabled,
            ]}
            onPress={handleConvert}
            disabled={isConverting || !fileName.trim() || !uploadedImage}
          >
            {isConverting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.convertButtonText}>Convert to PDF</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  plusButton: {
    backgroundColor: Colors.primaryLight,
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
  pdfList: {
    gap: 12,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
  },
  pdfThumbnail: {
    width: 60,
    height: 85,
    borderRadius: 8,
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pdfDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  pdfDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.error}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: "10%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadButtons: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  imagePreviewContainer: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.background,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageRemoveButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  convertButton: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    ...standardShadow,
  },
  convertButtonDisabled: {
    opacity: 0.5,
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.black,
    zIndex: 1001,
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
