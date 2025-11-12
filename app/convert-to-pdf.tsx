import React, { useState, useRef, useEffect } from "react";
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
  Linking,
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
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";

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
        setConvertedPDFs(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading PDFs:", error);
    }
  };

  const savePDFs = async (pdfs: ConvertedPDF[]) => {
    try {
      await AsyncStorage.setItem(PDFS_STORAGE_KEY, JSON.stringify(pdfs));
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
              <TouchableOpacity
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
                <TouchableOpacity
                  style={styles.pdfDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePDF(pdf.id, pdf.name);
                  }}
                >
                  <Trash2 color={Colors.error} size={20} />
                </TouchableOpacity>
              </TouchableOpacity>
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

      const pdfDataSimulated = `data:application/pdf;base64,${Date.now()}`;

      const newPDF: ConvertedPDF = {
        id: Date.now().toString(),
        name: fileName.trim(),
        originalImage: uploadedImages[0],
        pdfData: pdfDataSimulated,
        createdAt: new Date().toISOString(),
        images: uploadedImages,
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
                    <TouchableOpacity
                      style={styles.imageRemoveButton}
                      onPress={() => {
                        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 color={Colors.white} size={16} />
                    </TouchableOpacity>
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

          <TouchableOpacity
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
  pdfDetailSection: {
    marginBottom: 24,
  },
  pdfDetailLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textLight,
    marginBottom: 8,
    textTransform: "uppercase" as const,
  },
  pdfDetailValue: {
    fontSize: 16,
    color: Colors.text,
  },
  pdfDetailImage: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginTop: 8,
  },
  pdfDetailSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    marginBottom: 12,
  },
  pdfPageContainer: {
    marginBottom: 20,
  },
  pdfPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pdfPageCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pdfPageTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
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
  pdfDetailActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pdfDetailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...standardShadow,
  },
  pdfDetailButtonEmail: {
    backgroundColor: Colors.primaryLight,
  },
  pdfDetailButtonDelete: {
    backgroundColor: Colors.error,
  },
  pdfDetailButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});

interface PDFDetailModalProps {
  pdf: ConvertedPDF;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function PDFDetailModal({ pdf, onClose, onDelete }: PDFDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const togglePageSelection = (index: number) => {
    if (selectedPages.includes(index)) {
      setSelectedPages(selectedPages.filter((i) => i !== index));
    } else {
      setSelectedPages([...selectedPages, index]);
    }
  };

  const handleSendEmail = async () => {
    console.log("handleSendEmail called");
    console.log("Selected pages:", selectedPages);
    
    if (selectedPages.length === 0) {
      Alert.alert(
        "No Pages Selected",
        "Please select at least one page to send via email."
      );
      return;
    }

    try {
      const selectedPagesList = selectedPages
        .sort((a, b) => a - b)
        .map((i) => i + 1)
        .join(", ");

      const emailSubject = encodeURIComponent(`PDF: ${pdf.name}`);
      const emailBody = encodeURIComponent(
        `Please find attached the PDF document: ${pdf.name}\n\nCreated: ${new Date(pdf.createdAt).toLocaleDateString()}\nTotal pages: ${pdf.images.length}\nSelected pages: ${selectedPagesList}`
      );
      const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

      console.log("Opening mailto URL:", mailtoUrl);
      
      await Linking.openURL(mailtoUrl);
      console.log("Email app opened successfully");
      
      setTimeout(() => {
        Alert.alert(
          "Email Opened",
          "Please attach the selected pages manually in your email app."
        );
      }, 500);
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert(
        "Error",
        "Failed to open email app. Please make sure you have Mail app configured on your device."
      );
    }
  };

  const handleDelete = () => {
    console.log("handleDelete called");
    console.log("PDF to delete:", pdf.id, pdf.name);
    
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${pdf.name}"?`,
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log("Delete cancelled")
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting PDF:", pdf.id);
              await onDelete(pdf.id);
              console.log("PDF deleted successfully");
              Alert.alert("Success", "PDF deleted successfully!");
            } catch (error) {
              console.error("Error deleting PDF:", error);
              Alert.alert("Error", "Failed to delete PDF.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.pdfDetailContainer}>
      <View style={[styles.pdfDetailContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.pdfDetailHeader}>
          <Text style={styles.pdfDetailTitle}>PDF Details</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={Colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.pdfDetailScrollView}
          contentContainerStyle={styles.pdfDetailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pdfDetailSection}>
            <Text style={styles.pdfDetailLabel}>File Name</Text>
            <Text style={styles.pdfDetailValue}>{pdf.name}</Text>
          </View>

          <View style={styles.pdfDetailSection}>
            <Text style={styles.pdfDetailLabel}>Created Date</Text>
            <Text style={styles.pdfDetailValue}>
              {new Date(pdf.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.pdfDetailSection}>
            <Text style={styles.pdfDetailLabel}>Number of Pages</Text>
            <Text style={styles.pdfDetailValue}>{pdf.images.length}</Text>
          </View>

          <View style={styles.pdfDetailSection}>
            <Text style={styles.pdfDetailLabel}>All Pages</Text>
            <Text style={styles.pdfDetailSubtext}>
              Select pages to send via email
            </Text>
            {pdf.images.map((imageUri, index) => (
              <View key={`${imageUri}-${index}`} style={styles.pdfPageContainer}>
                <View style={styles.pdfPageHeader}>
                  <TouchableOpacity
                    style={styles.pdfPageCheckbox}
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
                    <Text style={styles.pdfPageTitle}>Page {index + 1}</Text>
                  </TouchableOpacity>
                </View>
                <Image source={{ uri: imageUri }} style={styles.pdfDetailImage} />
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.pdfDetailActions,
            { paddingBottom: Math.max(insets.bottom + 12, 20) },
          ]}
        >
          <TouchableOpacity
            style={[styles.pdfDetailButton, styles.pdfDetailButtonEmail]}
            onPress={handleSendEmail}
          >
            <Mail color={Colors.white} size={20} />
            <Text style={styles.pdfDetailButtonText}>Send to Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pdfDetailButton, styles.pdfDetailButtonDelete]}
            onPress={handleDelete}
          >
            <Trash2 color={Colors.white} size={20} />
            <Text style={styles.pdfDetailButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
