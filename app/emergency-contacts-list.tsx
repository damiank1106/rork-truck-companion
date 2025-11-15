import { Stack, useRouter } from "expo-router";
import { Plus, Phone, X } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Clickable } from "@/components/Clickable";
import { useEmergencyContacts } from "@/contexts/EmergencyContactsContext";

export default function EmergencyContactsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { contacts } = useEmergencyContacts();

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
    Linking.openURL(phoneUrl).catch(() => {
      console.error("Unable to make phone call");
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <Clickable onPress={() => router.back()} style={styles.headerButton}>
          <X color={Colors.black} size={24} />
        </Clickable>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <Clickable
          onPress={() => router.push("/emergency-contact-detail")}
          style={styles.headerButton}
        >
          <Plus color={Colors.primaryLight} size={24} />
        </Clickable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyStateText}>
              Add your first emergency contact by tapping the + button above
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <Clickable
                key={contact.id}
                style={styles.contactCard}
                onPress={() => router.push(`/emergency-contact-detail?id=${contact.id}`)}
              >
                <View style={styles.contactCardLeft}>
                  {contact.photoUri ? (
                    <View style={styles.contactCircle}>
                      <Image source={{ uri: contact.photoUri }} style={styles.contactPhoto} />
                    </View>
                  ) : (
                    <View style={styles.contactCircle}>
                      <Text style={styles.contactInitials}>
                        {contact.displayPhotoId || contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.companyName && (
                      <Text style={styles.contactCompany}>{contact.companyName}</Text>
                    )}
                    {contact.position && (
                      <Text style={styles.contactPosition}>{contact.position}</Text>
                    )}
                    <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                  </View>
                </View>
                <Clickable
                  style={styles.callButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(contact.phoneNumber);
                  }}
                >
                  <Phone color={Colors.white} size={20} />
                </Clickable>
              </Clickable>
            ))}
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.black,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  contactCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  contactCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contactPhoto: {
    width: 60,
    height: 60,
  },
  contactInitials: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.white,
  },
  contactInfo: {
    flex: 1,
    gap: 3,
  },
  contactName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.black,
  },
  contactCompany: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  contactPosition: {
    fontSize: 13,
    color: Colors.textLight,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
