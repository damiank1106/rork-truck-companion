import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";

export default function DonationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isBigScreen = width >= 768;

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
        <View style={styles.infoCard}>
          <Text style={[
            styles.infoText,
            isSmallScreen && styles.infoTextSmallScreen,
            isBigScreen && styles.infoTextBigScreen
          ]}>
            Thanks for keeping the wheels turning.{"\n"}
            This app is free—tips are 100% optional{"\n"}
            and don&apos;t unlock any features.{"\n"}
            Your support helps pay for servers,{"\n"}
            data, and new features.{"\n"}{"\n"}
            Payments are processed by PayPal{"\n"}
            on their side.{"\n"}{"\n"}
            Questions or refunds:{"\n"}
            tdcompanionsupport@icloud.com
          </Text>
        </View>

        <TouchableOpacity
          style={styles.donateButton}
          onPress={() => {
            Linking.openURL("https://www.paypal.com/donate?hosted_button_id=8YCU6SXJ59BW4");
          }}
          accessibilityRole="button"
          accessibilityLabel="Donate with PayPal"
        >
          <Text style={styles.donateButtonText}>Donate with PayPal</Text>
        </TouchableOpacity>
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
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 22,
  },
  infoTextSmallScreen: {
    fontSize: 16,
    lineHeight: 20,
  },
  infoTextBigScreen: {
    fontSize: 22,
    lineHeight: 24,
  },
  donateButton: {
    backgroundColor: "#0070BA",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
});
