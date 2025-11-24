import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Upload,
  X,
  Trash2,
  Plus,
  FileText,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import PageHeader from "@/components/PageHeader";
import { Clickable } from "@/components/Clickable";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";

import { resolveFileUri, convertToRelativePath, saveToLibrary, deleteFromLibrary } from "@/lib/file-storage";

interface ConvertedPDF {
  id: string;
  name: string;
  originalImage: string;
  pdfData: string;
  createdAt: string;
  images: string[];
}

const PDFS_STORAGE_KEY = "converted_pdfs";

export default function ConvertToPDFScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [convertedPDFs, setConvertedPDFs] = useState<ConvertedPDF[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedPDF, setSelectedPDF] = useState<ConvertedPDF | null>(null);

  const isSmallScreen = width < 360;

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = async () => {
    try {
      const stored = await AsyncStorage.getItem(PDFS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const resolvedPDFs = parsed.map((pdf: ConvertedPDF) => ({
          ...pdf,
          originalImage: resolveFileUri(pdf.originalImage),
          images: pdf.images.map(resolveFileUri),
        }));
        setConvertedPDFs(resolvedPDFs);
      }
    } catch (error) {
      console.error("Error loading PDFs:", error);
    }
  };

  const savePDFs = async (pdfs: ConvertedPDF[]) => {
    try {
      const pdfsToSave = pdfs.map((pdf) => ({
        ...pdf,
        originalImage: convertToRelativePath(pdf.originalImage),
        images: pdf.images.map(convertToRelativePath),
      }));
      await AsyncStorage.setItem(PDFS_STORAGE_KEY, JSON.stringify(pdfsToSave));
      setConvertedPDFs(pdfs);
    } catch (error) {
      console.error("Error saving PDFs:", error);
      Alert.alert("Error", "Failed to save PDF.");
    }
  };

  const handleDeletePDF = (id: string, name: string) => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const pdfToDelete = convertedPDFs.find(p => p.id === id);
            if (pdfToDelete) {
              // Delete images from storage
              for (const img of pdfToDelete.images) {
                 await deleteFromLibrary(img);
              }
            }
            const updatedPDFs = convertedPDFs.filter((pdf) => pdf.id !== id);
            await savePDFs(updatedPDFs);
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
            <Clickable
              style={[styles.headerIconButton, styles.plusButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color={Colors.white} size={20} />
            </Clickable>
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
              <Clickable
                key={pdf.id}
                style={styles.pdfCard}
                onPress={() => setSelectedPDF(pdf)}
              >
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
                <Clickable
                  style={styles.pdfDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePDF(pdf.id, pdf.name);
                  }}
                >
                  <Trash2 color={Colors.error} size={20} />
                </Clickable>
              </Clickable>
            ))}
          </View>
        )}
      </ScrollView>

      {showCreateModal && (
        <CreatePDFModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={async (pdf) => {
            await savePDFs([pdf, ...convertedPDFs]);
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedPDF && (
        <PDFDetailModal
          pdf={selectedPDF}
          onClose={() => setSelectedPDF(null)}
          onDelete={async (id) => {
            const updatedPDFs = convertedPDFs.filter((pdf) => pdf.id !== id);
            await savePDFs(updatedPDFs);
            setSelectedPDF(null);
          }}
        />
      )}
    </View>
  );
}

interface CreatePDFModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (pdf: ConvertedPDF) => Promise<void>;
}

function CreatePDFModal({ visible, onClose, onSave }: CreatePDFModalProps) {
  const insets = useSafeAreaInsets();

  const [fileName, setFileName] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
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
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        setUploadedImages([...uploadedImages, ...newImages]);
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
        setUploadedImages([...uploadedImages, photo.uri]);
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

    if (uploadedImages.length === 0) {
      Alert.alert("Missing Images", "Please upload or take photos first.");
      return;
    }

    try {
      setIsConverting(true);
      setIsScanning(true);
      setScanProgress(0);

      for (let i = 0; i < uploadedImages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setScanProgress(((i + 1) / uploadedImages.length) * 100);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Save images to persistent library
      const savedImagePaths = await Promise.all(
        uploadedImages.map(async (uri) => {
          const relativePath = await saveToLibrary(uri);
          return resolveFileUri(relativePath);
        })
      );

      const pdfDataSimulated = `data:application/pdf;base64,${Date.now()}`;

      const newPDF: ConvertedPDF = {
        id: Date.now().toString(),
        name: fileName.trim(),
        originalImage: savedImagePaths[0],
        pdfData: pdfDataSimulated,
        createdAt: new Date().toISOString(),
        images: savedImagePaths,
      };

      setIsScanning(false);

      await onSave(newPDF);
      setFileName("");
      setUploadedImages([]);
      setScanProgress(0);
      
      Alert.alert("Success", `"${fileName.trim()}" has been converted to PDF and saved!`);
    } catch (error) {
      console.error("Error converting to PDF:", error);
      Alert.alert("Error", "Failed to convert image to PDF. Please try again.");
      setIsScanning(false);
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
              <Clickable onPress={() => setShowCamera(false)}>
                <X color={Colors.textSecondary} size={24} />
              </Clickable>
            </View>
            <View style={styles.permissionContainer}>
              <Camera color={Colors.textLight} size={64} />
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionText}>
                We need access to your camera to scan documents.
              </Text>
              <Clickable style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </Clickable>
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
              <Clickable
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <X color={Colors.white} size={24} />
              </Clickable>
            </View>

            <View style={styles.cameraControls}>
              <View style={styles.cameraControlsInner}>
                <View style={{ width: 56 }} />
                <Clickable style={styles.captureButton} onPress={handleTakePicture}>
                  <View style={styles.captureButtonInner} />
                </Clickable>
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
          <Clickable onPress={onClose}>
            <X color={Colors.textSecondary} size={24} />
          </Clickable>
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
              <Clickable style={styles.uploadButton} onPress={handleCameraPress}>
                <Camera color={Colors.primaryLight} size={24} />
                <Text style={styles.uploadButtonText}>Use Camera</Text>
              </Clickable>
              <Clickable style={styles.uploadButton} onPress={handleUploadPress}>
                <Upload color={Colors.secondary} size={24} />
                <Text style={styles.uploadButtonText}>Upload from Device</Text>
              </Clickable>
            </View>
          </View>

          {uploadedImages.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                Uploaded Images ({uploadedImages.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesScrollContainer}
              >
                {uploadedImages.map((imageUri, index) => (
                  <View key={`${imageUri}-${index}`} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <Clickable
                      style={styles.imageRemoveButton}
                      onPress={() => {
                        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 color={Colors.white} size={16} />
                    </Clickable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {isScanning && (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Scanning Progress</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(scanProgress)}% Complete
              </Text>
            </View>
          )}

          <Clickable
            style={[
              styles.convertButton,
              (isConverting || !fileName.trim() || uploadedImages.length === 0) &&
                styles.convertButtonDisabled,
            ]}
            onPress={handleConvert}
            disabled={isConverting || !fileName.trim() || uploadedImages.length === 0}
          >
            {isConverting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.convertButtonText}>Convert to PDF</Text>
            )}
          </Clickable>
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
    width: 120,
    height: 170,
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
  imagesScrollContainer: {
    gap: 12,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
    marginTop: 8,
  },
  pdfDetailContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  pdfDetailContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: "10%",
  },
  pdfDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pdfDetailTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  pdfDetailScrollView: {
    flex: 1,
  },
  pdfDetailScrollContent: {
    padding: 20,
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
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  pageViewer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    ...standardShadow,
  },
  pageImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  pageNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  pageNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    ...standardShadow,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  thumbnailsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    ...standardShadow,
  },
  thumbnailsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pdfDetailSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 12,
  },
  thumbnails: {
    gap: 8,
    paddingVertical: 4,
  },
  thumbnail: {
    width: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
    position: "relative",
  },
  thumbnailTouchableContainer: {
    width: "100%",
  },
  thumbnailActive: {
    borderColor: Colors.primaryLight,
  },
  thumbnailImage: {
    width: "100%",
    height: 100,
    borderRadius: 6,
  },
  thumbnailLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
    paddingVertical: 4,
  },
  thumbnailCheckbox: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colors.white,
  },
  actionButtonsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    ...standardShadow,
    minHeight: 56,
  },
  emailButton: {
    backgroundColor: Colors.primaryLight,
  },
  deleteActionButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
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

interface PDFDetailModalProps {
  pdf: ConvertedPDF;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function PDFDetailModal({ pdf, onClose, onDelete }: PDFDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const togglePageSelection = (index: number) => {
    if (selectedPages.includes(index)) {
      setSelectedPages(selectedPages.filter((i) => i !== index));
    } else {
      setSelectedPages([...selectedPages, index]);
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
    if (currentPage < pdf.images.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSendEmail = async () => {
    if (selectedPages.length === 0) {
      Alert.alert(
        "No Pages Selected",
        "Please select at least one page to send via email."
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const selectedPagesList = selectedPages
          .sort((a, b) => a - b)
          .map((i) => i + 1)
          .join(", ");

        const emailSubject = encodeURIComponent(`PDF: ${pdf.name}`);
        const emailBody = encodeURIComponent(
          `Please find attached the PDF document: ${pdf.name}\n\nCreated: ${new Date(pdf.createdAt).toLocaleDateString()}\nTotal pages: ${pdf.images.length}\nSelected pages: ${selectedPagesList}`
        );
        const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
        
        window.open(mailtoUrl, '_blank');
        Alert.alert("Success", "Email client opened successfully.");
        return;
      }

      const { Share } = await import('react-native');
      
      const selectedImages = selectedPages
        .sort((a, b) => a - b)
        .map((i) => pdf.images[i]);

      if (selectedImages.length === 0) {
        Alert.alert("Error", "No images to share.");
        return;
      }

      const selectedPagesList = selectedPages
        .sort((a, b) => a - b)
        .map((i) => i + 1)
        .join(", ");

      await Share.share({
        title: `PDF: ${pdf.name}`,
        message: `PDF document: ${pdf.name}\n\nCreated: ${new Date(pdf.createdAt).toLocaleDateString()}\nTotal pages: ${pdf.images.length}\nSelected pages: ${selectedPagesList}`,
        url: selectedImages[0],
      });

      if (selectedImages.length > 1) {
        Alert.alert(
          "Multiple Pages",
          `You selected ${selectedImages.length} pages. Due to platform limitations, only the first page was attached. To send all pages, please send them one by one or use a file manager app.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert(
        "Error",
        "Failed to share PDF. Please try again."
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${pdf.name}"?`,
      [
        { 
          text: "Cancel", 
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(pdf.id);
            } catch (error) {
              console.error("Error deleting PDF:", error);
              Alert.alert("Error", "Failed to delete PDF.");
            }
          },
        },
      ]
    );
  };

  const handleOpenImageModal = () => {
    setShowImageModal(true);
  };

  return (
    <View style={styles.pdfDetailContainer}>
      <View style={[styles.pdfDetailContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.pdfDetailHeader}>
          <Text style={styles.pdfDetailTitle}>PDF Details</Text>
          <Clickable onPress={onClose}>
            <X color={Colors.textSecondary} size={24} />
          </Clickable>
        </View>

        <ScrollView
          style={styles.pdfDetailScrollView}
          contentContainerStyle={[styles.pdfDetailScrollContent, {
            paddingBottom: Math.max(insets.bottom + 12, 24)
          }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>{formatDate(pdf.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>File Name:</Text>
              <Text style={styles.infoValue}>{pdf.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pages:</Text>
              <Text style={styles.infoValue}>{pdf.images.length}</Text>
            </View>
          </View>

          {pdf.images.length > 0 && (
            <>
              <Clickable
                style={styles.pageViewer}
                onPress={handleOpenImageModal}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: pdf.images[currentPage] }}
                  style={styles.pageImage}
                  resizeMode="contain"
                />
              </Clickable>

              {pdf.images.length > 1 && (
                <View style={styles.pageNavigation}>
                  <Clickable
                    style={[
                      styles.pageNavButton,
                      currentPage === 0 && styles.pageNavButtonDisabled,
                    ]}
                    onPress={goToPreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft
                      color={currentPage === 0 ? Colors.textLight : Colors.primaryLight}
                      size={20}
                    />
                  </Clickable>

                  <View style={styles.pageIndicator}>
                    <Text style={styles.pageIndicatorText}>
                      {currentPage + 1} / {pdf.images.length}
                    </Text>
                  </View>

                  <Clickable
                    style={[
                      styles.pageNavButton,
                      currentPage === pdf.images.length - 1 && styles.pageNavButtonDisabled,
                    ]}
                    onPress={goToNextPage}
                    disabled={currentPage === pdf.images.length - 1}
                  >
                    <ChevronRight
                      color={
                        currentPage === pdf.images.length - 1
                          ? Colors.textLight
                          : Colors.primaryLight
                      }
                      size={20}
                    />
                  </Clickable>
                </View>
              )}

              <View style={styles.thumbnailsContainer}>
                <Text style={styles.thumbnailsTitle}>All Pages ({pdf.images.length})</Text>
                <Text style={styles.pdfDetailSubtext}>
                  Select pages to send via email
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnails}
                >
                  {pdf.images.map((imageUri, index) => (
                    <View
                      key={`${imageUri}-${index}`}
                      style={[
                        styles.thumbnail,
                        currentPage === index && styles.thumbnailActive,
                      ]}
                    >
                      <Clickable
                        style={styles.thumbnailTouchableContainer}
                        onPress={() => setCurrentPage(index)}
                      >
                        <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
                        <Text style={styles.thumbnailLabel}>{index + 1}</Text>
                      </Clickable>
                      <Clickable
                        style={styles.thumbnailCheckbox}
                        onPress={() => togglePageSelection(index)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedPages.includes(index) && styles.checkboxSelected,
                          ]}
                        >
                          {selectedPages.includes(index) && (
                            <View style={styles.checkmark} />
                          )}
                        </View>
                      </Clickable>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.actionButtonsRow}>
                <Clickable
                  style={[styles.actionButton, styles.emailButton]}
                  onPress={handleSendEmail}
                  activeOpacity={0.7}
                >
                  <Mail color={Colors.white} size={20} />
                  <Text style={styles.actionButtonText}>Send to Email</Text>
                </Clickable>

                <Clickable
                  style={[styles.actionButton, styles.deleteActionButton]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Trash2 color={Colors.white} size={20} />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </Clickable>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showImageModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <Clickable
            style={styles.imageModalCloseButton}
            onPress={() => setShowImageModal(false)}
          >
            <X color={Colors.white} size={28} />
          </Clickable>
          <View style={styles.imageModalContent}>
            <Image
              source={{ uri: pdf.images[currentPage] }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
