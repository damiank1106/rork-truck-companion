import { MapPin, Plus, Search, X, Camera, Image as ImageIcon } from "lucide-react-native";
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
  Image,
  Alert,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import AnimatedBackground from "@/components/AnimatedBackground";
import { usePlaces } from "@/contexts/PlacesContext";
import { Place } from "@/types";

export default function PlacesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { places, addPlace, deletePlace } = usePlaces();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  const filteredPlaces = places.filter(
    (place) =>
      place.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlace = () => {
    setIsAddModalVisible(true);
  };

  const handleViewPlace = (place: Place) => {
    router.push(`/place-detail?id=${place.id}`);
  };

  const handleDeletePlace = async (id: string) => {
    await deletePlace(id);
    setSelectedPlace(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AnimatedBackground />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Places</Text>
            <Text style={styles.headerSubtitle}>{places.length} locations saved</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPlace}>
            <Plus color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search color={Colors.textLight} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredPlaces.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin color={Colors.textLight} size={64} />
          <Text style={styles.emptyStateTitle}>No places yet</Text>
          <Text style={styles.emptyStateText}>
            Start logging the places you visit on your routes
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPlace}>
            <Text style={styles.emptyStateButtonText}>Add Your First Place</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => handleViewPlace(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddPlaceModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={addPlace}
      />

      <PlaceDetailModal
        place={selectedPlace}
        visible={selectedPlace !== null}
        onClose={() => setSelectedPlace(null)}
        onDelete={handleDeletePlace}
      />

      <FullScreenPhotoModal
        photoUri={fullScreenPhoto}
        visible={fullScreenPhoto !== null}
        onClose={() => setFullScreenPhoto(null)}
      />
    </View>
  );
}

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

function PlaceCard({ place, onPress }: PlaceCardProps) {
  const [fullScreenPhoto, setFullScreenPhoto] = React.useState<string | null>(null);
  
  const handlePhotoPress = (e: any) => {
    if (place.photos.length > 0) {
      e.stopPropagation();
      setFullScreenPhoto(place.photos[0]);
    }
  };
  
  return (
    <>
      <TouchableOpacity style={styles.placeCard} onPress={onPress}>
        {place.photos.length > 0 ? (
          <TouchableOpacity onPress={handlePhotoPress}>
            <Image source={{ uri: place.photos[0] }} style={styles.placeCardImage} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeIconContainer}>
            <MapPin color={Colors.primaryLight} size={24} />
          </View>
        )}
        <View style={styles.placeInfo}>
          <Text style={styles.placeCompany}>{place.companyName}</Text>
          <Text style={styles.placeLocation}>
            {place.city}, {place.state}
          </Text>
          <View style={styles.placeAmenities}>
            {place.hasRestroom && (
              <View style={styles.amenityBadge}>
                <Text style={styles.amenityText}>Restroom</Text>
              </View>
            )}
            {place.parkingAvailability !== "no" && (
              <View style={styles.amenityBadge}>
                <Text style={styles.amenityText}>Parking</Text>
              </View>
            )}
            {place.photos.length > 0 && (
              <View style={styles.amenityBadge}>
                <Text style={styles.amenityText}>{place.photos.length} photos</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      <FullScreenPhotoModal
        photoUri={fullScreenPhoto}
        visible={fullScreenPhoto !== null}
        onClose={() => setFullScreenPhoto(null)}
      />
    </>
  );
}

interface AddPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (place: Omit<Place, "id" | "createdAt">) => Promise<Place>;
}

function AddPlaceModal({ visible, onClose, onAdd }: AddPlaceModalProps) {
  const [formData, setFormData] = useState<Omit<Place, "id" | "createdAt">>({
    companyName: "",
    city: "",
    state: "",
    address: "",
    contactNumber: "",
    dispatchInfo: "",
    hasRestroom: false,
    parkingAvailability: "yes",
    overnightParking: false,
    notes: "",
    photos: [],
  });

  const pickImage = async () => {
    if (formData.photos.length >= 5) {
      Alert.alert("Limit Reached", "You can only add up to 5 photos per place.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as ImagePicker.MediaTypeOptions,
      allowsMultipleSelection: false,
      quality: 0.3,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        photos: [...formData.photos, result.assets[0].uri],
      });
    }
  };

  const takePhoto = async () => {
    if (formData.photos.length >= 5) {
      Alert.alert("Limit Reached", "You can only add up to 5 photos per place.");
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.3,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        photos: [...formData.photos, result.assets[0].uri],
      });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.city || !formData.state) {
      Alert.alert("Required Fields", "Please fill in Company Name, City, and State.");
      return;
    }
    try {
      await onAdd(formData);
      setFormData({
        companyName: "",
        city: "",
        state: "",
        address: "",
        contactNumber: "",
        dispatchInfo: "",
        hasRestroom: false,
        parkingAvailability: "yes",
        overnightParking: false,
        notes: "",
        photos: [],
      });
      onClose();
    } catch (error: any) {
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError')) {
        Alert.alert(
          "Storage Full",
          "Your device storage is full. Please delete some old places or photos to free up space.",
          [
            { text: "OK" }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to add place. Please try again.");
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Place</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.modalInput}
              placeholder="Company Name *"
              placeholderTextColor={Colors.textLight}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="City *"
              placeholderTextColor={Colors.textLight}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="State *"
              placeholderTextColor={Colors.textLight}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Address"
              placeholderTextColor={Colors.textLight}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Contact Number"
              placeholderTextColor={Colors.textLight}
              value={formData.contactNumber}
              onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Dispatch Info"
              placeholderTextColor={Colors.textLight}
              value={formData.dispatchInfo}
              onChangeText={(text) => setFormData({ ...formData, dispatchInfo: text })}
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

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, hasRestroom: !formData.hasRestroom })}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData.hasRestroom && styles.checkboxBoxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>Has Restroom</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, overnightParking: !formData.overnightParking })}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData.overnightParking && styles.checkboxBoxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>Overnight Parking</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photosSection}>
              <Text style={styles.photosSectionTitle}>Photos ({formData.photos.length}/5)</Text>
              
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera color={Colors.white} size={20} />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon color={Colors.white} size={20} />
                  <Text style={styles.photoButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>

              {formData.photos.length > 0 && (
                <View style={styles.photosGrid}>
                  {formData.photos.map((uri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.photoRemoveButton}
                        onPress={() => removePhoto(index)}
                      >
                        <X color={Colors.white} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Place</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface PlaceDetailModalProps {
  place: Place | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function PlaceDetailModal({ place, visible, onClose, onDelete }: PlaceDetailModalProps) {
  const [fullScreenPhoto, setFullScreenPhoto] = React.useState<string | null>(null);
  
  if (!place) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{place.companyName}</Text>
              <TouchableOpacity onPress={onClose}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <DetailRow label="Location" value={`${place.city}, ${place.state}`} />
              {place.address && <DetailRow label="Address" value={place.address} />}
              {place.contactNumber && <DetailRow label="Contact" value={place.contactNumber} />}
              {place.dispatchInfo && <DetailRow label="Dispatch" value={place.dispatchInfo} />}
              <DetailRow label="Restroom" value={place.hasRestroom ? "Yes" : "No"} />
              <DetailRow
                label="Parking"
                value={
                  place.parkingAvailability === "yes"
                    ? "Available"
                    : place.parkingAvailability === "limited"
                      ? "Limited"
                      : "Not Available"
                }
              />
              <DetailRow label="Overnight Parking" value={place.overnightParking ? "Yes" : "No"} />
              {place.notes && <DetailRow label="Notes" value={place.notes} />}

              {place.photos.length > 0 && (
                <View style={styles.detailPhotosSection}>
                  <Text style={styles.detailPhotosTitle}>Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.detailPhotosRow}>
                      {place.photos.map((uri, index) => (
                        <TouchableOpacity key={index} onPress={() => setFullScreenPhoto(uri)}>
                          <Image source={{ uri }} style={styles.detailPhoto} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(place.id)}
              >
                <Text style={styles.deleteButtonText}>Delete Place</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <FullScreenPhotoModal
        photoUri={fullScreenPhoto}
        visible={fullScreenPhoto !== null}
        onClose={() => setFullScreenPhoto(null)}
      />
    </>
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

interface FullScreenPhotoModalProps {
  photoUri: string | null;
  visible: boolean;
  onClose: () => void;
}

function FullScreenPhotoModal({ photoUri, visible, onClose }: FullScreenPhotoModalProps) {
  const [scale, setScale] = React.useState<number>(1);
  const [lastScale, setLastScale] = React.useState<number>(1);
  const [translateX, setTranslateX] = React.useState<number>(0);
  const [translateY, setTranslateY] = React.useState<number>(0);
  const [lastTranslateX, setLastTranslateX] = React.useState<number>(0);
  const [lastTranslateY, setLastTranslateY] = React.useState<number>(0);
  const initialDistanceRef = React.useRef<number | null>(null);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setLastScale(scale);
        setLastTranslateX(translateX);
        setLastTranslateY(translateY);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (!initialDistanceRef.current) {
            initialDistanceRef.current = distance;
          } else {
            const newScale = (distance / initialDistanceRef.current) * lastScale;
            setScale(Math.max(1, Math.min(newScale, 5)));
          }
        } else if (scale > 1) {
          setTranslateX(lastTranslateX + gestureState.dx);
          setTranslateY(lastTranslateY + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
        if (scale < 1.1) {
          setScale(1);
          setTranslateX(0);
          setTranslateY(0);
          setLastTranslateX(0);
          setLastTranslateY(0);
        }
      },
    })
  ).current;

  const handleClose = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
    initialDistanceRef.current = null;
    onClose();
  };

  if (!photoUri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.fullScreenPhotoOverlay}>
        <TouchableOpacity style={styles.fullScreenPhotoCloseButton} onPress={handleClose}>
          <X color={Colors.white} size={32} />
        </TouchableOpacity>
        <View style={styles.fullScreenPhotoContainer} {...panResponder.panHandlers}>
          <Image 
            source={{ uri: photoUri }} 
            style={[
              styles.fullScreenPhoto,
              {
                transform: [
                  { scale },
                  { translateX },
                  { translateY },
                ],
              },
            ]} 
            resizeMode="contain" 
          />
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
  placeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeCardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  placeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: `${Colors.primaryLight}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeCompany: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  placeLocation: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.6,
    marginBottom: 8,
  },
  placeAmenities: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  amenityBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
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
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#000000",
  },
  photosSection: {
    marginBottom: 20,
  },
  photosSectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
    marginBottom: 12,
  },
  photoButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  photoButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    position: "relative",
    width: 100,
    height: 100,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  photoRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
  detailPhotosSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailPhotosTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
    marginBottom: 12,
  },
  detailPhotosRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
  fullScreenPhotoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenPhotoCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  fullScreenPhotoContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenPhoto: {
    width: "100%",
    height: "100%",
  },
  fullScreenPhotoImage: {
    width: "100%",
    height: "100%",
  },
});
