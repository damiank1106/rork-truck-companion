import { Href, usePathname, useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  HeartHandshake,
  Home as HomeIcon,
  Image as ImageIcon,
  MapPin,
  Menu,
  Newspaper,
  Settings as SettingsIcon,
  Shield,
  Truck,
  X,
} from "lucide-react-native";

import AnimatedBackground from "@/components/AnimatedBackground";
import Colors from "@/constants/colors";

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
  { label: "Gallery", path: "/(tabs)/gallery", icon: ImageIcon },
  { label: "Daily News", path: "/daily-news", icon: Newspaper },
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
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const menuAnimation = useRef(new Animated.Value(0)).current;

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
        outputRange: [-12, 0],
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

  return (
    <>
      <View
        style={StyleSheet.flatten([
          styles.header,
          { paddingTop: topInset },
          containerStyle,
        ])}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <AnimatedBackground />
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
            <TouchableOpacity
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
            </TouchableOpacity>
          </View>
        </View>
        {children}
      </View>

      {isMenuMounted ? (
        <Animated.View
          pointerEvents={isMenuVisible ? "auto" : "none"}
          style={[styles.menuOverlay, { opacity: menuAnimation }]}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => closeMenu()}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <Animated.View
            style={[
              styles.menuDropdown,
              {
                top: headerHeight - 12,
                transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              },
            ]}
          >
            {MENU_ITEMS.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <React.Fragment key={item.path}>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
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
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
  },
  menuBackdrop: {
    flex: 1,
  },
  menuDropdown: {
    position: "absolute",
    right: 20,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    width: 220,
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
});
