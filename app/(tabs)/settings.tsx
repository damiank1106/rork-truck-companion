import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronRight, Info, FileText, Shield, RefreshCw, Scale } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import PageHeader from "@/components/PageHeader";

import { usePlaces } from "@/contexts/PlacesContext";
import { useTruck } from "@/contexts/TruckContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetTruckProfile } = useTruck();
  const { places } = usePlaces();

  const [storageSize, setStorageSize] = useState<string>("0 KB");
  const [truckSize, setTruckSize] = useState<string>("0 KB");
  const [placesSize, setPlacesSize] = useState<string>("0 KB");

  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showPolicy, setShowPolicy] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);

  const calculateStorageSize = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      let truckDataSize = 0;
      let placesDataSize = 0;

      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          
          if (key.includes('truck_profile')) {
            truckDataSize += size;
          } else if (key.includes('places')) {
            placesDataSize += size;
          }
        }
      }
      
      setStorageSize(formatSize(totalSize));
      setTruckSize(formatSize(truckDataSize));
      setPlacesSize(formatSize(placesDataSize));

    } catch (error) {
      console.error("Error calculating storage size:", error);
    }
  };

  useEffect(() => {
    calculateStorageSize();
  }, [places]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all your data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await resetTruckProfile();
              await calculateStorageSize();
              Alert.alert("Success", "All data has been cleared");
            } catch {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const handleSupport = () => {
    Linking.openURL("mailto:tdcompanionsupport@icloud.com?subject=Support Request");
  };

  const handleReloadApp = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } else {
      Alert.alert(
        "Reload App",
        "This will restart the app.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reload",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Settings"
        subtitle="Manage your app preferences"
        topInset={insets.top + 16}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Storage Used</Text>
              <Text style={styles.statValue}>{storageSize}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowAbout(true)}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${Colors.primaryLight}15` }]}>
                  <Info color={Colors.primaryLight} size={20} />
                </View>
                <Text style={styles.menuItemText}>About</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />



            <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${Colors.success}15` }]}>
                  <FileText color={Colors.success} size={20} />
                </View>
                <Text style={styles.menuItemText}>Support</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setShowLegal(true)}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${Colors.primaryLight}15` }]}>
                  <Scale color={Colors.primaryLight} size={20} />
                </View>
                <Text style={styles.menuItemText}>Legal</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReloadApp}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${Colors.primaryLight}15` }]}>
                  <RefreshCw color={Colors.primaryLight} size={20} />
                </View>
                <Text style={styles.menuItemText}>Reload App</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Trucker Companion v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Made with care for professional truck drivers
          </Text>
        </View>
      </ScrollView>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} storageSize={storageSize} />
      <PolicyModal visible={showPolicy} onClose={() => setShowPolicy(false)} />
      <LegalModal visible={showLegal} onClose={() => setShowLegal(false)} />
    </View>
  );
}

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  storageSize: string;
}

function AboutModal({ visible, onClose, storageSize }: AboutModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About Trucker Companion</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalSectionTitle}>App Information</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Version:</Text> 1.0.0{"\n"}
              <Text style={styles.modalBoldText}>Created:</Text> October 15, 2025{"\n"}
              <Text style={styles.modalBoldText}>Last Updated:</Text> November 02, 2025
            </Text>

            <Text style={styles.modalSectionTitle}>Core Features</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>🚛 Truck Profile Management</Text>{"\n"}
              • Store truck number, make, model, year{"\n"}
              • Track driver ID and registration details{"\n"}
              • Manage trailer information{"\n"}
              • Insurance and inspection tracking{"\n"}
              • Quick-edit truck and trailer numbers from home{"\n\n"}
              
              <Text style={styles.modalBoldText}>📍 Places & Locations</Text>{"\n"}
              • Save visited locations with photos{"\n"}
              • Track company name, city, and state{"\n"}
              • Add amenities and features{"\n"}
              • Full-screen photo viewing{"\n"}
              • Edit and manage all place details{"\n"}
              • Search and filter saved places{"\n\n"}
              

              
              <Text style={styles.modalBoldText}>🏠 Home Dashboard</Text>{"\n"}
              • Real-time date and time display{"\n"}
              • Digital speed gauge (GPS-based){"\n"}
              • Weather widget with temperature and conditions{"\n"}
              • Quick access to truck and trailer info{"\n"}
              • Emergency contacts with quick dial{"\n"}
              • Health insurance card access{"\n"}
              • Driver ID card access{"\n\n"}
              
              <Text style={styles.modalBoldText}>🏥 Health & Safety</Text>{"\n"}
              • Store health insurance cards (front & back){"\n"}
              • Save provider, group, and ID numbers{"\n"}
              • Store driver license photos{"\n"}
              • Emergency contacts with photos{"\n"}
              • Quick access from home screen{"\n\n"}
              
              <Text style={styles.modalBoldText}>💾 Data & Storage</Text>{"\n"}
              • Offline-first architecture{"\n"}
              • Local device storage{"\n"}
              • Storage usage tracking{"\n"}
              • No cloud sync required{"\n"}
              • Complete data privacy
            </Text>

            <Text style={styles.modalSectionTitle}>How to Use the App</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>🌡️ Weather Widget</Text>{"\n"}
              • Tap the location icon to update your current location{"\n"}
              • Tap the temperature to toggle between °C and °F{"\n"}
              • Weather updates automatically based on GPS{"\n\n"}
              
              <Text style={styles.modalBoldText}>⚡ Speed Gauge</Text>{"\n"}
              • Tap the speedometer to toggle between mph and km/h{"\n"}
              • Speed is calculated using GPS{"\n"}
              • Works in real-time while driving{"\n\n"}
              
              <Text style={styles.modalBoldText}>🚚 Quick Edit Truck/Trailer</Text>{"\n"}
              • Tap the + icon on truck or trailer containers{"\n"}
              • Enter the new number in the popup{"\n"}
              • Changes update instantly on home and detail pages{"\n\n"}

              <Text style={styles.modalBoldText}>📰 Daily News</Text>{"\n"}
              • Fresh stories post every day at 6:30 AM Central Time{"\n"}
              • Find the latest headlines on the Home dashboard{"\n\n"}

              <Text style={styles.modalBoldText}>📇 Emergency Contacts</Text>{"\n"}
              • Tap “View All” to see all contacts{"\n"}
              • Use + button to add new contacts{"\n"}
              • Add custom photo ID (up to 4 letters){"\n"}
              • Upload contact photo for easy identification{"\n"}
              • Tap phone icon to call directly{"\n\n"}
              
              <Text style={styles.modalBoldText}>💳 Health Insurance & Driver ID</Text>{"\n"}
              • Tap container on home to view cards{"\n"}
              • View list of card photos{"\n"}
              • Tap any card for full-screen view{"\n"}
              • Glass overlay shows all details{"\n"}
              • Tap Edit button to update information{"\n"}
              • Keyboard scrolls automatically when editing{"\n\n"}
              

              
              <Text style={styles.modalBoldText}>🗺️ Places</Text>{"\n"}
              • Save locations you visit{"\n"}
              • Add multiple photos per place{"\n"}
              • Mark amenities (restroom, parking, etc.){"\n"}
              • Tap photos for full-screen view{"\n"}
              • Edit place details anytime
            </Text>

            <Text style={styles.modalSectionTitle}>Tips & Tricks</Text>
            <Text style={styles.modalText}>
              • <Text style={styles.modalBoldText}>Keyboard Navigation:</Text> All edit screens support keyboard scrolling to prevent fields from being covered{"\n\n"}
              • <Text style={styles.modalBoldText}>Quick Updates:</Text> Use + icons on home screen for fast truck/trailer number updates{"\n\n"}
              • <Text style={styles.modalBoldText}>Photo Management:</Text> Long-press or tap Edit in full-screen view to modify photo details{"\n\n"}
              • <Text style={styles.modalBoldText}>Emergency Access:</Text> Health insurance and driver ID cards are always one tap away from home{"\n\n"}
              • <Text style={styles.modalBoldText}>Data Privacy:</Text> All data stays on your device - no internet required{"\n\n"}
              • <Text style={styles.modalBoldText}>Storage Management:</Text> Check Settings to see storage usage and manage data
            </Text>

            <Text style={styles.modalSectionTitle}>Update History</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>v1.0.0 - November 02, 2025</Text>{"\n"}
              • Initial release{"\n"}
              • Complete truck profile system{"\n"}
              • Places tracking with photo support{"\n"}

              • Weather widget with C/F toggle{"\n"}
              • Real-time speed tracking with mph/km/h toggle{"\n"}
              • Trailer information management{"\n"}
              • Emergency contacts with custom photo IDs{"\n"}
              • Health insurance card storage{"\n"}
              • Driver ID card storage{"\n"}
              • Settings and data management{"\n"}
              • Added News and Safety Information{"\n"}

              • Keyboard-aware scrolling{"\n"}
              • Cross-platform support (iOS, Android, Web){"\n\n"}
              <Text style={styles.modalBoldText}>Key Features:</Text>{"\n"}
              • Offline-first architecture{"\n"}
              • Local device storage{"\n"}
              • Storage usage tracking{"\n"}
              • No cloud sync required{"\n"}
              • Privacy-focused design{"\n"}
              • Animated backgrounds on all headers
            </Text>

            <Text style={styles.modalSectionTitle}>Technology Stack</Text>
            <Text style={styles.modalText}>
              • Built with React Native & Expo{"\n"}
              • TypeScript for type safety{"\n"}
              • AsyncStorage for local data{"\n"}
              • Expo Location for GPS tracking{"\n"}
              • Designed for professional truck drivers{"\n"}
              • Optimized for performance and reliability
            </Text>

            <Text style={styles.modalSectionTitle}>Storage Information</Text>
            <Text style={styles.modalText}>
              Total data stored: {storageSize}{"\n"}
              Storage location: Local device only{"\n"}
              Privacy: No data transmitted to servers
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

function PolicyModal({ visible, onClose }: PolicyModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalSectionTitle}>Data Collection</Text>
            <Text style={styles.modalText}>
              Trucker Companion stores all data locally on your device. We do not collect, transmit, or store any personal information on external servers.
            </Text>

            <Text style={styles.modalSectionTitle}>Information Stored</Text>
            <Text style={styles.modalText}>
              • Truck specifications and details{"\n"}
              • Location information for places you visit{"\n"}

              • App preferences and settings
            </Text>

            <Text style={styles.modalSectionTitle}>Data Security</Text>
            <Text style={styles.modalText}>
              All data is stored locally using secure device storage. Your information remains on your device and is never transmitted to external servers.
            </Text>

            <Text style={styles.modalSectionTitle}>Data Control</Text>
            <Text style={styles.modalText}>
              You have complete control over your data. You can delete individual items or clear all data at any time through the Settings screen.
            </Text>

            <Text style={styles.modalSectionTitle}>Third-Party Services</Text>
            <Text style={styles.modalText}>
              This app does not use any third-party analytics, tracking, or advertising services.
            </Text>

            <Text style={styles.modalSectionTitle}>Contact</Text>
            <Text style={styles.modalText}>
              For questions about privacy or data handling, contact us at tdcompanionsupport@icloud.com
            </Text>

            <Text style={styles.modalFooter}>
              Last updated: November 02, 2025
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
}

function LegalModal({ visible, onClose }: LegalModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Legal</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalSectionTitle}>About and Copyright</Text>
            <Text style={styles.modalText}>
              TD Companion helps professional drivers with on-the-road tools and info.{"\n"}
              © 2025 TD Companion. All rights reserved.
            </Text>

            <Text style={styles.modalSectionTitle}>Privacy Policy</Text>
            
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Data Collection</Text>{"\n"}
              TD Companion stores all data locally on your device. We do not collect, transmit, or store any personal information on external servers.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Information Stored</Text>{"\n"}
              • Truck specifications and details{"\n"}
              • Location information for places you visit{"\n"}

              • App preferences and settings
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Data Security</Text>{"\n"}
              All data is stored locally using secure device storage. Your information remains on your device and is never transmitted to external servers.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Data Control</Text>{"\n"}
              You have complete control over your data. You can delete individual items or clear all data at any time through the Settings screen.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Third-Party Services</Text>{"\n"}
              This app does not use any third-party analytics, tracking, or advertising services.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Contact</Text>{"\n"}
              For questions about privacy or data handling, contact us at tdcompanionsupport@icloud.com
            </Text>

            <Text style={styles.modalSectionTitle}>Donations & Tips Policy</Text>
            
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Nature of tips:</Text> Tips are voluntary and do not provide access to additional features, content, or services in this app.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Payment processor:</Text> Tips are handled by PayPal. We do not collect or store card details. See PayPal&apos;s policies for how they process data.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Fees:</Text> Payment-processor fees may apply; we do not add surcharges.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Refunds:</Text> If you tipped by mistake, email tdcompanionsupport@icloud.com with your PayPal receipt and we&apos;ll assist.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Tax:</Text> Tips to us are not charitable donations and are generally not tax-deductible.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Data we receive from PayPal:</Text> We may receive payer name, email, and amount. We use this only for receipts/support and do not sell this data.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Contact:</Text> tdcompanionsupport@icloud.com
            </Text>

            <Text style={styles.modalSectionTitle}>Terms of Use</Text>
            
            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>License</Text>{"\n"}
              We grant you a personal, non-transferable license to use the app.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Acceptable use</Text>{"\n"}
              Don&apos;t misuse the app or violate laws. No reverse engineering, scraping, or security testing.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>User content</Text>{"\n"}
              The app has no public posting features at this time. If you later add UGC, you must keep it lawful and respectful; we may remove content and suspend access.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Safety & disclaimers</Text>{"\n"}
              Use the app responsibly. Do not interact with the app while driving; obey local laws. Information is provided &quot;as is,&quot; without warranties. You are responsible for how you use the app.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Liability</Text>{"\n"}
              To the maximum extent permitted by law, we&apos;re not liable for indirect, incidental, or consequential damages.
            </Text>

            <Text style={styles.modalText}>
              <Text style={styles.modalBoldText}>Termination</Text>{"\n"}
              We may suspend or end access for violations or misuse.
            </Text>

            <Text style={styles.modalSectionTitle}>Driving Safety Notice</Text>
            <Text style={styles.modalText}>
              For safety, do not use this app while driving. Stop your vehicle in a safe place before interacting with your phone. Obey all laws and company policies.
            </Text>

            <Text style={styles.modalSectionTitle}>EULA</Text>
            <Text style={styles.modalText}>
              This app is licensed under Apple&apos;s Standard EULA:{"\n"}
              https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
            </Text>

            <Text style={styles.modalFooter}>
              Last updated: November 2, 2025
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    ...standardShadow,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 16,
    color: "#000000",
    opacity: 0.7,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500" as const,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: "10%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
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
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: "300" as const,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 8,
  },
  modalBoldText: {
    fontWeight: "700" as const,
    color: "#000000",
    opacity: 1,
  },
  modalFooter: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 24,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic" as const,
  },
});
