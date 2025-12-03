import { Href, usePathname, useRouter } from "expo-router";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  FileText,
  HeartHandshake,
  Home as HomeIcon,
  MapPin,
  Menu,
  Settings as SettingsIcon,
  Shield,
  Truck,
  X,
  Mic,
  MicOff,
  MessageSquare,
} from "lucide-react-native";
import { useVoiceAI } from "@/contexts/VoiceAIContext";

import AnimatedBackground from "@/components/AnimatedBackground";
import { Clickable } from "@/components/Clickable";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  topInset?: number;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const MENU_ITEMS = [
  { label: "Home", path: "/(tabs)/home", icon: HomeIcon },
  { label: "My Truck", path: "/(tabs)/truck", icon: Truck },
  { label: "Places", path: "/(tabs)/places", icon: MapPin },
  { label: "Files", path: "/files", icon: FileText },
  { label: "AI Notes", path: "/ai-notes", icon: MessageSquare },
  { label: "Safety Information", path: "/safety-information", icon: Shield },
  { label: "Settings", path: "/(tabs)/settings", icon: SettingsIcon },
  { label: "Donations", path: "/donations", icon: HeartHandshake },
] as const;

export default function PageHeader({
  title,
  subtitle,
  topInset = 0,
  leftAccessory,
  rightAccessory,
  children,
  containerStyle,
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const headerAnimation = useRef(new Animated.Value(0)).current;
  
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  
  const {
    isApiKeySet,
    isListening,
    isProcessing,
    setListening,
    sendToAI,
    speakResponse,
    stopSpeaking,
    saveNote,
    cancelRequest,
  } = useVoiceAI();
  
  const isSmallScreen = width < 360;
  const adjustedTopInset = topInset;

  React.useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const menuIconOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    [menuAnimation]
  );

  const closeIconOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    [menuAnimation]
  );

  const menuIconScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
      }),
    [menuAnimation]
  );

  const closeIconScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1],
      }),
    [menuAnimation]
  );

  const dropdownTranslateY = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-8, 0],
      }),
    [menuAnimation]
  );

  const dropdownScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1],
      }),
    [menuAnimation]
  );

  const openMenu = () => {
    if (isMenuVisible) {
      return;
    }
    setIsMenuMounted(true);
    setIsMenuVisible(true);
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (afterClose?: () => void) => {
    if (!isMenuMounted && !isMenuVisible) {
      afterClose?.();
      return;
    }
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIsMenuVisible(false);
      setIsMenuMounted(false);
      afterClose?.();
    });
  };

  const handleNavigate = (path: string) => {
    const normalizedPath = path.replace(/\/$/, "");
    const normalizedCurrent = pathname.replace(/\/$/, "");

    if (normalizedPath === normalizedCurrent) {
      closeMenu();
      return;
    }

    closeMenu(() => {
      router.replace(path as Href);
    });
  };

  const handleMicPress = useCallback(() => {
    if (!isApiKeySet) {
      Alert.alert(
        "Setup Required",
        "Please configure your OpenAI API key in Settings to use the Voice AI assistant.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Settings", onPress: () => router.push("/(tabs)/settings") },
        ]
      );
      return;
    }

    if (isListening) {
      setListening(false);
      stopSpeaking();
      cancelRequest();
      setShowVoiceModal(false);
      setVoiceInput("");
      setAiResponse("");
    } else {
      setListening(true);
      setShowVoiceModal(true);
      setVoiceInput("");
      setAiResponse("");
    }
  }, [isApiKeySet, isListening, setListening, stopSpeaking, cancelRequest, router]);

  const handleSendMessage = useCallback(async () => {
    if (!voiceInput.trim()) return;
    
    Keyboard.dismiss();
    const message = voiceInput.trim();
    setVoiceInput("");
    
    const response = await sendToAI(message, { screen: title });
    setAiResponse(response);
    
    if (Platform.OS !== 'web') {
      speakResponse(response);
    }
  }, [voiceInput, sendToAI, title, speakResponse]);

  const handleSaveNote = useCallback(async (noteType: "user" | "assistant", content: string) => {
    const now = new Date();
    const noteTitle = `${noteType === "user" ? "Question" : "AI Response"} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    
    await saveNote({
      title: noteTitle,
      content,
      type: noteType,
    });
    
    Alert.alert("Saved", "Note saved to AI Notes.");
  }, [saveNote]);

  const handleCloseVoiceModal = useCallback(() => {
    setListening(false);
    stopSpeaking();
    cancelRequest();
    setShowVoiceModal(false);
    setVoiceInput("");
    setAiResponse("");
  }, [setListening, stopSpeaking, cancelRequest]);

  return (
    <>
      <Animated.View
        style={StyleSheet.flatten([
          styles.header,
          { 
            paddingTop: adjustedTopInset,
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          },
          containerStyle,
        ])}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <AnimatedBackground />
        {isSmallScreen ? <View style={styles.emptyLine} /> : null}
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            {leftAccessory ? <View style={styles.leftAccessory}>{leftAccessory}</View> : null}
            <View style={styles.titleGroup}>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          <View style={styles.actions}>
            {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
            <Clickable
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={handleMicPress}
              accessibilityRole="button"
              accessibilityLabel={isListening ? "Stop voice AI" : "Start voice AI"}
            >
              {isListening ? (
                <MicOff color={Colors.white} size={18} />
              ) : (
                <Mic color={isApiKeySet ? Colors.secondary : Colors.textLight} size={18} />
              )}
            </Clickable>
            <Clickable
              style={[styles.menuButton, isMenuVisible && styles.menuButtonActive]}
              onPress={() => {
                if (isMenuVisible) {
                  closeMenu();
                } else {
                  openMenu();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isMenuVisible ? "Close menu" : "Open menu"}
            >
              <View style={styles.menuIconContainer} pointerEvents="none">
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.menuIconWrapper,
                    {
                      opacity: menuIconOpacity,
                      transform: [{ scale: menuIconScale }],
                    },
                  ]}
                >
                  <Menu color={Colors.text} size={20} />
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.menuIconWrapper,
                    {
                      opacity: closeIconOpacity,
                      transform: [{ scale: closeIconScale }],
                    },
                  ]}
                >
                  <X color={Colors.white} size={20} />
                </Animated.View>
              </View>
            </Clickable>
          </View>
        </View>
        {children}
      </Animated.View>

      {isMenuMounted ? (
        <View
          pointerEvents={isMenuVisible ? "box-none" : "none"}
          style={styles.menuLayer}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.menuDimmer,
              { opacity: menuAnimation, top: headerHeight },
            ]}
          />
          <Clickable
            style={[styles.menuBackdrop, { top: headerHeight }]}
            onPress={() => closeMenu()}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.menuDropdown,
              {
                top: headerHeight + 8,
                opacity: menuAnimation,
                transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              },
            ]}
          >
            {MENU_ITEMS.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <React.Fragment key={item.path}>
                  <Clickable
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => handleNavigate(item.path)}
                    accessibilityRole="button"
                  >
                    <IconComponent
                      color={isActive ? Colors.white : Colors.primaryLight}
                      size={18}
                      style={styles.menuItemIcon}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        isActive && styles.menuItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Clickable>
                  {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
                </React.Fragment>
              );
            })}
          </Animated.View>
        </View>
      ) : null}

      <Modal
        visible={showVoiceModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseVoiceModal}
      >
        <KeyboardAvoidingView 
          style={styles.voiceModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.voiceModalContent}>
            <View style={styles.voiceModalHeader}>
              <View style={styles.voiceModalTitleContainer}>
                <Mic color={Colors.secondary} size={24} />
                <Text style={styles.voiceModalTitle}>AI Assistant</Text>
              </View>
              <Clickable
                style={styles.voiceModalClose}
                onPress={handleCloseVoiceModal}
              >
                <X color={Colors.textSecondary} size={24} />
              </Clickable>
            </View>

            <ScrollView 
              style={styles.voiceModalBody}
              contentContainerStyle={styles.voiceModalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {aiResponse ? (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>AI Response:</Text>
                  <Text style={styles.responseText}>{aiResponse}</Text>
                  <View style={styles.responseActions}>
                    <Clickable
                      style={styles.saveNoteButton}
                      onPress={() => handleSaveNote("assistant", aiResponse)}
                    >
                      <Text style={styles.saveNoteButtonText}>Save to Notes</Text>
                    </Clickable>
                  </View>
                </View>
              ) : isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color={Colors.secondary} />
                  <Text style={styles.processingText}>Thinking...</Text>
                </View>
              ) : (
                <View style={styles.voiceInputHint}>
                  <Text style={styles.voiceInputHintText}>
                    Type your message below and tap Send to talk with the AI assistant.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.voiceInputContainer}>
              <TextInput
                style={styles.voiceTextInput}
                placeholder="Type your message..."
                placeholderTextColor={Colors.textLight}
                value={voiceInput}
                onChangeText={setVoiceInput}
                multiline
                maxLength={1000}
                editable={!isProcessing}
              />
              <Clickable
                style={[
                  styles.sendButton,
                  (!voiceInput.trim() || isProcessing) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!voiceInput.trim() || isProcessing}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </Clickable>
            </View>

            {voiceInput.trim() && (
              <Clickable
                style={styles.saveQuestionButton}
                onPress={() => handleSaveNote("user", voiceInput.trim())}
              >
                <Text style={styles.saveQuestionButtonText}>Save question as note</Text>
              </Clickable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emptyLine: {
    height: 24,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
    zIndex: 30,
    elevation: 6,
    ...standardShadow,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  leftAccessory: {
    marginRight: 12,
  },
  titleGroup: {
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 12,
  },
  rightAccessory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  menuButtonActive: {
    backgroundColor: Colors.primary,
  },
  menuIconContainer: {
    width: 20,
    height: 20,
  },
  menuIconWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  menuDimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuDropdown: {
    position: "absolute",
    right: 20,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 15,
    elevation: 8,
    width: 220,
    zIndex: 2,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemActive: {
    backgroundColor: Colors.primary,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  menuItemTextActive: {
    color: Colors.white,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    marginHorizontal: 16,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  micButtonActive: {
    backgroundColor: Colors.secondary,
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  voiceModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: 300,
  },
  voiceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  voiceModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
  },
  voiceModalClose: {
    padding: 4,
  },
  voiceModalBody: {
    flex: 1,
    maxHeight: 300,
  },
  voiceModalBodyContent: {
    padding: 20,
  },
  voiceInputHint: {
    alignItems: "center",
    paddingVertical: 40,
  },
  voiceInputHintText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  responseContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.secondary,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  responseText: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 24,
  },
  responseActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveNoteButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveNoteButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  voiceInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voiceTextInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  saveQuestionButton: {
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 20,
  },
  saveQuestionButtonText: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: "500" as const,
  },
});
