import { Container, Plus, Search, X, Edit3, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useTrailers } from "@/contexts/TrailerContext";
import { Trailer } from "@/types";

export default function TrailerScreen() {
  const insets = useSafeAreaInsets();
  const { trailers, addTrailer, deleteTrailer, updateTrailer } = useTrailers();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const filteredTrailers = trailers.filter(
    (trailer) =>
      trailer.trailerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trailer.trailerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trailer.make.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTrailer = () => {
    setIsEditMode(false);
    setIsAddModalVisible(true);
  };

  const handleViewTrailer = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
  };

  const handleEditTrailer = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    setIsEditMode(true);
    setIsAddModalVisible(true);
  };

  const handleDeleteTrailer = async (id: string) => {
    Alert.alert(
      "Delete Trailer",
      "Are you sure you want to delete this trailer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTrailer(id);
            setSelectedTrailer(null);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trailers</Text>
          <Text style={styles.headerSubtitle}>{trailers.length} trailers saved</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTrailer}>
          <Plus color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color={Colors.textLight} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search trailers..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredTrailers.length === 0 ? (
        <View style={styles.emptyState}>
          <Container color={Colors.textLight} size={64} />
          <Text style={styles.emptyStateTitle}>No trailers yet</Text>
          <Text style={styles.emptyStateText}>
            Start tracking your trailers and their specifications
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddTrailer}>
            <Text style={styles.emptyStateButtonText}>Add Your First Trailer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTrailers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrailerCard 
              trailer={item} 
              onPress={() => handleViewTrailer(item)}
              onEdit={() => handleEditTrailer(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TrailerFormModal
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          setSelectedTrailer(null);
          setIsEditMode(false);
        }}
        onAdd={addTrailer}
        onUpdate={updateTrailer}
        trailer={isEditMode ? selectedTrailer : null}
        isEditMode={isEditMode}
      />

      <TrailerDetailModal
        trailer={!isEditMode ? selectedTrailer : null}
        visible={selectedTrailer !== null && !isEditMode}
        onClose={() => setSelectedTrailer(null)}
        onDelete={handleDeleteTrailer}
        onEdit={handleEditTrailer}
      />
    </View>
  );
}

interface TrailerCardProps {
  trailer: Trailer;
  onPress: () => void;
  onEdit: () => void;
}

function TrailerCard({ trailer, onPress, onEdit }: TrailerCardProps) {
  return (
    <TouchableOpacity style={styles.trailerCard} onPress={onPress}>
      <View style={styles.trailerIconContainer}>
        <Container color={Colors.primaryLight} size={24} />
      </View>
      <View style={styles.trailerInfo}>
        <Text style={styles.trailerNumber}>#{trailer.trailerNumber}</Text>
        <Text style={styles.trailerType}>{trailer.trailerType}</Text>
        {trailer.make && trailer.model && (
          <Text style={styles.trailerDetails}>
            {trailer.make} {trailer.model} {trailer.year && `(${trailer.year})`}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.editIconButton} onPress={onEdit}>
        <Edit3 color={Colors.primaryLight} size={18} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface TrailerFormModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (trailer: Omit<Trailer, "id" | "createdAt">) => Promise<Trailer>;
  onUpdate: (id: string, updates: Partial<Trailer>) => Promise<void>;
  trailer: Trailer | null;
  isEditMode: boolean;
}

function TrailerFormModal({ visible, onClose, onAdd, onUpdate, trailer, isEditMode }: TrailerFormModalProps) {
  const [formData, setFormData] = useState<Omit<Trailer, "id" | "createdAt">>({
    trailerNumber: "",
    trailerType: "",
    make: "",
    model: "",
    year: "",
    length: "",
    width: "",
    height: "",
    maxLoadWeight: "",
    axleWeight: "",
    tirePSI: "",
    tireSize: "",
    registrationNumber: "",
    inspectionDate: "",
    notes: "",
  });

  React.useEffect(() => {
    if (isEditMode && trailer) {
      setFormData({
        trailerNumber: trailer.trailerNumber,
        trailerType: trailer.trailerType,
        make: trailer.make,
        model: trailer.model,
        year: trailer.year,
        length: trailer.length,
        width: trailer.width,
        height: trailer.height,
        maxLoadWeight: trailer.maxLoadWeight,
        axleWeight: trailer.axleWeight,
        tirePSI: trailer.tirePSI,
        tireSize: trailer.tireSize,
        registrationNumber: trailer.registrationNumber,
        inspectionDate: trailer.inspectionDate,
        notes: trailer.notes,
      });
    } else {
      setFormData({
        trailerNumber: "",
        trailerType: "",
        make: "",
        model: "",
        year: "",
        length: "",
        width: "",
        height: "",
        maxLoadWeight: "",
        axleWeight: "",
        tirePSI: "",
        tireSize: "",
        registrationNumber: "",
        inspectionDate: "",
        notes: "",
      });
    }
  }, [isEditMode, trailer, visible]);

  const handleSubmit = async () => {
    if (!formData.trailerNumber || !formData.trailerType) {
      Alert.alert("Required Fields", "Please fill in Trailer Number and Trailer Type.");
      return;
    }
    
    if (isEditMode && trailer) {
      await onUpdate(trailer.id, formData);
    } else {
      await onAdd(formData);
    }
    
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditMode ? "Edit Trailer" : "Add New Trailer"}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.modalInput}
              placeholder="Trailer Number *"
              placeholderTextColor={Colors.textLight}
              value={formData.trailerNumber}
              onChangeText={(text) => setFormData({ ...formData, trailerNumber: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Trailer Type * (e.g., 53 ft Dry Van)"
              placeholderTextColor={Colors.textLight}
              value={formData.trailerType}
              onChangeText={(text) => setFormData({ ...formData, trailerType: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Make"
              placeholderTextColor={Colors.textLight}
              value={formData.make}
              onChangeText={(text) => setFormData({ ...formData, make: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Model"
              placeholderTextColor={Colors.textLight}
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Year"
              placeholderTextColor={Colors.textLight}
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Length (e.g., 53')"
              placeholderTextColor={Colors.textLight}
              value={formData.length}
              onChangeText={(text) => setFormData({ ...formData, length: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Width (e.g., 8'6&quot;)"
              placeholderTextColor={Colors.textLight}
              value={formData.width}
              onChangeText={(text) => setFormData({ ...formData, width: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Height (e.g., 13'6&quot;)"
              placeholderTextColor={Colors.textLight}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Max Load Weight (e.g., 45,000 lbs)"
              placeholderTextColor={Colors.textLight}
              value={formData.maxLoadWeight}
              onChangeText={(text) => setFormData({ ...formData, maxLoadWeight: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Axle Weight (e.g., 34,000 lbs)"
              placeholderTextColor={Colors.textLight}
              value={formData.axleWeight}
              onChangeText={(text) => setFormData({ ...formData, axleWeight: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Tire PSI (e.g., 100 PSI)"
              placeholderTextColor={Colors.textLight}
              value={formData.tirePSI}
              onChangeText={(text) => setFormData({ ...formData, tirePSI: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Tire Size (e.g., 11R22.5)"
              placeholderTextColor={Colors.textLight}
              value={formData.tireSize}
              onChangeText={(text) => setFormData({ ...formData, tireSize: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Registration Number"
              placeholderTextColor={Colors.textLight}
              value={formData.registrationNumber}
              onChangeText={(text) => setFormData({ ...formData, registrationNumber: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Last Inspection Date (e.g., 2024-01-15)"
              placeholderTextColor={Colors.textLight}
              value={formData.inspectionDate}
              onChangeText={(text) => setFormData({ ...formData, inspectionDate: text })}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Notes"
              placeholderTextColor={Colors.textLight}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>{isEditMode ? "Update Trailer" : "Add Trailer"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface TrailerDetailModalProps {
  trailer: Trailer | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (trailer: Trailer) => void;
}

function TrailerDetailModal({ trailer, visible, onClose, onDelete, onEdit }: TrailerDetailModalProps) {
  if (!trailer) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trailer #{trailer.trailerNumber}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <DetailRow label="Trailer Number" value={trailer.trailerNumber} />
            <DetailRow label="Trailer Type" value={trailer.trailerType} />
            {trailer.make && <DetailRow label="Make" value={trailer.make} />}
            {trailer.model && <DetailRow label="Model" value={trailer.model} />}
            {trailer.year && <DetailRow label="Year" value={trailer.year} />}
            {trailer.length && <DetailRow label="Length" value={trailer.length} />}
            {trailer.width && <DetailRow label="Width" value={trailer.width} />}
            {trailer.height && <DetailRow label="Height" value={trailer.height} />}
            {trailer.maxLoadWeight && <DetailRow label="Max Load Weight" value={trailer.maxLoadWeight} />}
            {trailer.axleWeight && <DetailRow label="Axle Weight" value={trailer.axleWeight} />}
            {trailer.tirePSI && <DetailRow label="Tire PSI" value={trailer.tirePSI} />}
            {trailer.tireSize && <DetailRow label="Tire Size" value={trailer.tireSize} />}
            {trailer.registrationNumber && <DetailRow label="Registration Number" value={trailer.registrationNumber} />}
            {trailer.inspectionDate && <DetailRow label="Last Inspection" value={trailer.inspectionDate} />}
            {trailer.notes && <DetailRow label="Notes" value={trailer.notes} />}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  onClose();
                  onEdit(trailer);
                }}
              >
                <Edit3 color={Colors.white} size={18} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(trailer.id)}
              >
                <Trash2 color={Colors.white} size={18} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
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
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  trailerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trailerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primaryLight}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trailerInfo: {
    flex: 1,
  },
  trailerNumber: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  trailerType: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.7,
    marginBottom: 2,
  },
  trailerDetails: {
    fontSize: 12,
    color: "#000000",
    opacity: 0.5,
  },
  editIconButton: {
    padding: 8,
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
    maxHeight: "90%",
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
    padding: 20,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
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
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#000000",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
