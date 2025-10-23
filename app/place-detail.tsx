import { ArrowLeft, Camera, Image as ImageIcon, MapPin, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { usePlaces } from "@/contexts/PlacesContext";
import { Place } from "@/types";

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { places, updatePlace, deletePlace } = usePlaces();
  
  const placeId = params.id as string;
  const place = places.find((p) => p.id === placeId);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);
  const [editedPlace, setEditedPlace] = useState<Place | null>(place || null);

  if (!place || !editedPlace) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={Colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Not Found</Text>
        </View>
      </View>
    );
  }

  const pickImage = async () => {
    if (editedPlace.photos.length >= 5) {
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
      setEditedPlace({
        ...editedPlace,
        photos: [...editedPlace.photos, result.assets[0].uri],
      });
    }
  };

  const takePhoto = async () => {
    if (editedPlace.photos.length >= 5) {
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
      setEditedPlace({
        ...editedPlace,
        photos: [...editedPlace.photos, result.assets[0].uri],
      });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = editedPlace.photos.filter((_, i) => i !== index);
    setEditedPlace({ ...editedPlace, photos: newPhotos });
  };

  const handleSave = async () => {
    if (!editedPlace.companyName || !editedPlace.city || !editedPlace.state) {
      Alert.alert("Required Fields", "Please fill in Company Name, City, and State.");
      return;
    }
    try {
      await updatePlace(placeId, editedPlace);
      setIsEditing(false);
      Alert.alert("Success", "Place updated successfully!");
    } catch (error: any) {
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError')) {
        Alert.alert(
          "Storage Full",
          "Your device storage is full. Please delete some old places or photos to free up space.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to update place. Please try again.");
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Place",
      "Are you sure you want to delete this place? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePlace(placeId);
            router.back();
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setEditedPlace(place);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {editedPlace.companyName}
        </Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {editedPlace.photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {editedPlace.photos.map((uri, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <TouchableOpacity onPress={() => setFullScreenPhoto(uri)}>
                        <Image source={{ uri }} style={styles.photo} />
                      </TouchableOpacity>
                      {isEditing && (
                        <TouchableOpacity
                          style={styles.photoRemoveButton}
                          onPress={() => removePhoto(index)}
                        >
                          <X color={Colors.white} size={16} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {isEditing && (
            <View style={styles.addPhotosSection}>
              <Text style={styles.sectionTitle}>Add Photos ({editedPlace.photos.length}/5)</Text>
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
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Information</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Company Name *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.companyName}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, companyName: text })}
                  placeholder="Company Name"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.companyName}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>City *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.city}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, city: text })}
                  placeholder="City"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.city}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>State *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.state}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, state: text })}
                  placeholder="State"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.state}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.address}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, address: text })}
                  placeholder="Address"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.address || "Not provided"}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Contact Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.contactNumber}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, contactNumber: text })}
                  placeholder="Contact Number"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.contactNumber || "Not provided"}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Dispatch Info</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editedPlace.dispatchInfo}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, dispatchInfo: text })}
                  placeholder="Dispatch Info"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.dispatchInfo || "Not provided"}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notes</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, styles.fieldTextArea]}
                  value={editedPlace.notes}
                  onChangeText={(text) => setEditedPlace({ ...editedPlace, notes: text })}
                  placeholder="Notes"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <Text style={styles.fieldValue}>{editedPlace.notes || "No notes"}</Text>
              )}
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => isEditing && setEditedPlace({ ...editedPlace, hasRestroom: !editedPlace.hasRestroom })}
                disabled={!isEditing}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    editedPlace.hasRestroom && styles.checkboxBoxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>Has Restroom</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => isEditing && setEditedPlace({ ...editedPlace, overnightParking: !editedPlace.overnightParking })}
                disabled={!isEditing}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    editedPlace.overnightParking && styles.checkboxBoxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>Overnight Parking</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isEditing && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Place</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <FullScreenPhotoModal
        photoUri={fullScreenPhoto}
        visible={fullScreenPhoto !== null}
        onClose={() => setFullScreenPhoto(null)}
      />
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
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  photoRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotosSection: {
    marginBottom: 24,
  },
  photoButtonsRow: {
    flexDirection: "row",
    gap: 12,
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
  },
  photoButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  infoSection: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.6,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#000000",
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
  },
  fieldTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    marginBottom: 16,
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
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
});
