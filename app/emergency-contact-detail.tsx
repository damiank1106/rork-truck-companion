import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { X, Save, Trash2, Phone, Camera, Image as ImageIcon } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useEmergencyContacts } from "@/contexts/EmergencyContactsContext";

export default function EmergencyContactDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { contacts, addContact, updateContact, deleteContact } = useEmergencyContacts();

  const contactId = typeof params.id === "string" ? params.id : undefined;
  const existingContact = contactId ? contacts.find((c) => c.id === contactId) : undefined;

  const [companyName, setCompanyName] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [displayPhotoId, setDisplayPhotoId] = useState<string>("");
  const [photoUri, setPhotoUri] = useState<string>("");

  useEffect(() => {
    if (existingContact) {
      setCompanyName(existingContact.companyName);
      setName(existingContact.name);
      setPosition(existingContact.position);
      setPhoneNumber(existingContact.phoneNumber);
      setNotes(existingContact.notes);
      setDisplayPhotoId(existingContact.displayPhotoId || "");
      setPhotoUri(existingContact.photoUri || "");
    }
  }, [existingContact]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    try {
      if (existingContact) {
        await updateContact(existingContact.id, {
          companyName: companyName.trim(),
          name: name.trim(),
          position: position.trim(),
          phoneNumber: phoneNumber.trim(),
          notes: notes.trim(),
          displayPhotoId: displayPhotoId.trim(),
          photoUri: photoUri,
        });
      } else {
        await addContact({
          companyName: companyName.trim(),
          name: name.trim(),
          position: position.trim(),
          phoneNumber: phoneNumber.trim(),
          notes: notes.trim(),
          displayPhotoId: displayPhotoId.trim(),
          photoUri: photoUri,
        });
      }
      router.back();
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact");
    }
  };

  const handleDelete = () => {
    if (!existingContact) return;

    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this emergency contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact(existingContact.id);
              router.back();
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "No phone number available");
      return;
    }

    const phoneUrl = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert("Error", "Unable to make phone call");
    });
  };

  const getInitials = (): string => {
    if (displayPhotoId.trim()) return displayPhotoId.trim().toUpperCase().slice(0, 4);
    if (!name.trim()) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to upload a photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera permissions to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      "Add Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Library", onPress: handlePickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingContact ? "Edit Contact" : "New Contact"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Save color={Colors.primaryLight} size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoCircle} onPress={handlePhotoOptions}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Text style={styles.photoInitials}>{getInitials()}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editPhotoButton} onPress={handlePhotoOptions}>
              <Camera color={Colors.white} size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Enter company name"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter contact name"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="Enter position/title"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
                {phoneNumber.trim() && (
                  <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                    <Phone color={Colors.white} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Photo ID (up to 4 letters)</Text>
              <TextInput
                style={styles.input}
                value={displayPhotoId}
                onChangeText={(text) => setDisplayPhotoId(text.slice(0, 4))}
                placeholder="e.g., JD or JOHN"
                placeholderTextColor={Colors.textLight}
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {existingContact && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Trash2 color={Colors.white} size={20} />
                <Text style={styles.deleteButtonText}>Delete Contact</Text>
              </TouchableOpacity>
            )}
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  photoImage: {
    width: 100,
    height: 100,
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  photoInitials: {
    fontSize: 36,
    fontWeight: "bold" as const,
    color: Colors.white,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.black,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneInputContainer: {
    position: "relative",
  },
  phoneInput: {
    paddingRight: 60,
  },
  callButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },

});
