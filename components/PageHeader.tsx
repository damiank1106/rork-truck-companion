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
import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
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
  Send,
  Volume2,
  VolumeX,
  Navigation,
} from "lucide-react-native";
import { useVoiceAI, AIResponse } from "@/contexts/VoiceAIContext";
import { useTruck } from "@/contexts/TruckContext";
import { useTrailers } from "@/contexts/TrailerContext";
import { usePlaces } from "@/contexts/PlacesContext";
import { useFiles } from "@/contexts/FilesContext";
import { useEmergencyContacts } from "@/contexts/EmergencyContactsContext";

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

const SCREEN_ROUTES: Record<string, string> = {
  "home": "/(tabs)/home",
  "truck": "/(tabs)/truck",
  "trailer": "/(tabs)/trailer",
  "places": "/(tabs)/places",
  "files": "/files",
  "settings": "/(tabs)/settings",
  "health-insurance": "/health-insurance",
  "driver-id": "/driver-id",
  "safety-information": "/safety-information",
  "safety": "/safety-information",
  "donations": "/donations",
  "ai-notes": "/ai-notes",
  "notes": "/ai-notes",
  "emergency-contacts": "/emergency-contacts-list",
  "contacts": "/emergency-contacts-list",
  "scan": "/scan-document",
  "scan-document": "/scan-document",
  "camera": "/scan-document",
};

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
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const { truckProfile, updateTruckProfile } = useTruck();
  const { trailers, updateTrailer } = useTrailers();
  const { places } = usePlaces();
  const { files } = useFiles();
  const { contacts } = useEmergencyContacts();
  
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
    clearConversation,
  } = useVoiceAI();
  
  const isSmallScreen = width < 360;
  const adjustedTopInset = topInset;

  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording, pulseAnimation]);

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

  const executeCommand = useCallback(async (response: AIResponse) => {
    if (!response.command || response.command.action === "none") {
      return;
    }

    const { action, params } = response.command;
    console.log("VoiceAI: Executing command:", action, params);

    try {
      switch (action) {
        case "navigate": {
          const screen = params.screen as string;
          const route = SCREEN_ROUTES[screen.toLowerCase()];
          if (route) {
            setShowVoiceModal(false);
            setTimeout(() => {
              router.push(route as Href);
            }, 300);
          }
          break;
        }
        
        case "update_truck_number": {
          const number = params.number as string;
          if (number) {
            await updateTruckProfile({ truckNumber: number });
            console.log("VoiceAI: Truck number updated to:", number);
          }
          break;
        }
        
        case "update_trailer_number": {
          const number = params.number as string;
          if (number) {
            const firstTrailer = trailers[0];
            if (firstTrailer) {
              await updateTrailer(firstTrailer.id, { trailerNumber: number });
            } else {
              await updateTruckProfile({ trailerNumber: number });
            }
            console.log("VoiceAI: Trailer number updated to:", number);
          }
          break;
        }
        
        case "open_camera":
        case "create_file": {
          setShowVoiceModal(false);
          setTimeout(() => {
            router.push("/scan-document" as Href);
          }, 300);
          break;
        }
        
        case "show_truck_info": {
          setShowVoiceModal(false);
          setTimeout(() => {
            router.push("/(tabs)/truck" as Href);
          }, 300);
          break;
        }
        
        case "show_trailer_info": {
          setShowVoiceModal(false);
          setTimeout(() => {
            router.push("/(tabs)/trailer" as Href);
          }, 300);
          break;
        }
        
        default:
          console.log("VoiceAI: Unknown action:", action);
      }
    } catch (error) {
      console.error("VoiceAI: Error executing command:", error);
    }
  }, [router, updateTruckProfile, trailers, updateTrailer]);

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
      setAiResponse(null);
      setIsRecording(false);
      clearConversation();
    } else {
      setListening(true);
      setShowVoiceModal(true);
      setVoiceInput("");
      setAiResponse(null);
      setIsRecording(false);
    }
  }, [isApiKeySet, isListening, setListening, stopSpeaking, cancelRequest, router, clearConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!voiceInput.trim()) return;
    
    Keyboard.dismiss();
    const message = voiceInput.trim();
    setVoiceInput("");
    setAiResponse(null);
    
    const context = {
      screen: title,
      truckData: truckProfile as unknown as Record<string, unknown>,
      trailerData: trailers[0] as unknown as Record<string, unknown>,
      placesCount: places.length,
      filesCount: files.length,
      contactsCount: contacts.length,
    };
    
    const response = await sendToAI(message, context);
    setAiResponse(response);
    
    if (isSpeakingEnabled && response.message) {
      speakResponse(response.message);
    }
    
    if (response.command && response.command.action !== "none") {
      setTimeout(() => {
        executeCommand(response);
      }, isSpeakingEnabled ? 1500 : 500);
    }
  }, [voiceInput, sendToAI, title, truckProfile, trailers, places, files, contacts, speakResponse, isSpeakingEnabled, executeCommand]);

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
    setAiResponse(null);
    setIsRecording(false);
    clearConversation();
  }, [setListening, stopSpeaking, cancelRequest, clearConversation]);

  const toggleSpeaking = useCallback(() => {
    if (isSpeakingEnabled) {
      stopSpeaking();
    }
    setIsSpeakingEnabled(!isSpeakingEnabled);
  }, [isSpeakingEnabled, stopSpeaking]);

  const startVoiceRecording = useCallback(async () => {
    if (Platform.OS === 'web') {
      interface WebkitWindow {
        SpeechRecognition?: new () => WebSpeechRecognition;
        webkitSpeechRecognition?: new () => WebSpeechRecognition;
      }
      
      interface WebSpeechRecognition {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } }; length: number } }) => void;
        onerror: (event: { error: string }) => void;
        onend: () => void;
        start: () => void;
      }
      
      const webWindow = window as unknown as WebkitWindow;
      
      if (!webWindow.webkitSpeechRecognition && !webWindow.SpeechRecognition) {
        Alert.alert("Not Supported", "Voice recognition is not supported in this browser. Please type your message instead.");
        return;
      }
      
      try {
        const SpeechRecognitionAPI = webWindow.SpeechRecognition || webWindow.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
          const recognition = new SpeechRecognitionAPI();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          setIsRecording(true);
          
          recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            setVoiceInput(transcript);
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
          };
          
          recognition.onend = () => {
            setIsRecording(false);
          };
          
          recognition.start();
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        Alert.alert("Error", "Could not start voice recognition. Please type your message instead.");
      }
    } else {
      Alert.alert(
        "Voice Input", 
        "For voice input on mobile, please use your device's built-in keyboard dictation feature (microphone button on keyboard)."
      );
    }
  }, []);

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
                <View style={styles.voiceModalIconContainer}>
                  <Mic color={Colors.white} size={20} />
                </View>
                <View>
                  <Text style={styles.voiceModalTitle}>AI Assistant</Text>
                  <Text style={styles.voiceModalSubtitle}>Ask anything or give commands</Text>
                </View>
              </View>
              <View style={styles.voiceModalHeaderActions}>
                <Clickable
                  style={[styles.speakToggle, !isSpeakingEnabled && styles.speakToggleOff]}
                  onPress={toggleSpeaking}
                >
                  {isSpeakingEnabled ? (
                    <Volume2 color={Colors.secondary} size={18} />
                  ) : (
                    <VolumeX color={Colors.textLight} size={18} />
                  )}
                </Clickable>
                <Clickable
                  style={styles.voiceModalClose}
                  onPress={handleCloseVoiceModal}
                >
                  <X color={Colors.textSecondary} size={24} />
                </Clickable>
              </View>
            </View>

            <ScrollView 
              style={styles.voiceModalBody}
              contentContainerStyle={styles.voiceModalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {aiResponse ? (
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeader}>
                    <View style={styles.responseIconContainer}>
                      <MessageSquare color={Colors.white} size={16} />
                    </View>
                    <Text style={styles.responseLabel}>AI Response</Text>
                  </View>
                  <Text style={styles.responseText}>{aiResponse.message}</Text>
                  
                  {aiResponse.command && aiResponse.command.action !== "none" && (
                    <View style={styles.commandIndicator}>
                      <Navigation color={Colors.primaryLight} size={14} />
                      <Text style={styles.commandText}>
                        Executing: {aiResponse.command.action.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.responseActions}>
                    <Clickable
                      style={styles.saveNoteButton}
                      onPress={() => handleSaveNote("assistant", aiResponse.message)}
                    >
                      <Text style={styles.saveNoteButtonText}>Save to Notes</Text>
                    </Clickable>
                  </View>
                </View>
              ) : isProcessing ? (
                <View style={styles.processingContainer}>
                  <View style={styles.processingAnimation}>
                    <ActivityIndicator size="large" color={Colors.secondary} />
                  </View>
                  <Text style={styles.processingText}>Processing your request...</Text>
                  <Text style={styles.processingSubtext}>Please wait</Text>
                </View>
              ) : (
                <View style={styles.voiceInputHint}>
                  <View style={styles.hintIconContainer}>
                    <Mic color={Colors.secondary} size={32} />
                  </View>
                  <Text style={styles.voiceInputHintTitle}>How can I help?</Text>
                  <Text style={styles.voiceInputHintText}>
                    Ask me anything about your truck, trailer, or navigate the app. Try saying:
                  </Text>
                  <View style={styles.examplesContainer}>
                    <Text style={styles.exampleItem}>&quot;Open my files&quot;</Text>
                    <Text style={styles.exampleItem}>&quot;Change truck number to 1234&quot;</Text>
                    <Text style={styles.exampleItem}>&quot;Scan a document&quot;</Text>
                    <Text style={styles.exampleItem}>&quot;Show safety tips&quot;</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.voiceInputContainer}>
              <View style={styles.inputRow}>
                {Platform.OS === 'web' && (
                  <Clickable
                    style={[styles.voiceMicButton, isRecording && styles.voiceMicButtonActive]}
                    onPress={startVoiceRecording}
                    disabled={isProcessing}
                  >
                    <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnimation : 1 }] }}>
                      {isRecording ? (
                        <MicOff color={Colors.white} size={20} />
                      ) : (
                        <Mic color={Colors.secondary} size={20} />
                      )}
                    </Animated.View>
                  </Clickable>
                )}
                <TextInput
                  style={styles.voiceTextInput}
                  placeholder={isRecording ? "Listening..." : "Type or speak your message..."}
                  placeholderTextColor={Colors.textLight}
                  value={voiceInput}
                  onChangeText={setVoiceInput}
                  multiline
                  maxLength={1000}
                  editable={!isProcessing}
                  onSubmitEditing={handleSendMessage}
                />
                <Clickable
                  style={[
                    styles.sendButton,
                    (!voiceInput.trim() || isProcessing) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!voiceInput.trim() || isProcessing}
                >
                  <Send color={Colors.white} size={18} />
                </Clickable>
              </View>
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
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  voiceModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: 400,
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
    gap: 12,
  },
  voiceModalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
  },
  voiceModalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  voiceModalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  speakToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  speakToggleOff: {
    backgroundColor: `${Colors.textLight}15`,
  },
  voiceModalClose: {
    padding: 4,
  },
  voiceModalBody: {
    flex: 1,
    maxHeight: 350,
  },
  voiceModalBodyContent: {
    padding: 20,
  },
  voiceInputHint: {
    alignItems: "center",
    paddingVertical: 20,
  },
  hintIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  voiceInputHintTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 8,
  },
  voiceInputHintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  examplesContainer: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  exampleItem: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: "500" as const,
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  processingAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.secondary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    fontSize: 18,
    color: "#000000",
    fontWeight: "600" as const,
  },
  processingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  responseContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  responseIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.secondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  responseText: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 24,
  },
  commandIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commandText: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: "500" as const,
    textTransform: "capitalize" as const,
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
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveNoteButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  voiceInputContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  voiceMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  voiceMicButtonActive: {
    backgroundColor: Colors.secondary,
  },
  voiceTextInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
    maxHeight: 100,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
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
