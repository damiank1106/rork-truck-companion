import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";

export default function DonationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerLeft = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => router.replace("/(tabs)/home")}
      accessibilityRole="button"
      accessibilityLabel="Go back to home"
    >
      <ArrowLeft color={Colors.text} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Donations"
        topInset={insets.top + 12}
        leftAccessory={headerLeft}
      />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Thank you for your support!</Text>
          <Text style={styles.placeholderSubtitle}>
            We’re preparing a donations portal so you can help keep Trucker Companion running for everyone on the road.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  placeholderCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
