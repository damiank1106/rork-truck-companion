import { Tabs } from "expo-router";
import { Home, Truck, MapPin, Image, Settings } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const bottomPadding = Math.max(insets.bottom, isIOS ? 24 : 16);
  const extraVerticalInset = isIOS ? 12 : 10;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: (isIOS ? 64 : 60) + bottomPadding + extraVerticalInset,
          paddingBottom: bottomPadding + extraVerticalInset,
          paddingTop: 8,
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700' as const,
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="truck"
        options={{
          title: "My Truck",
          tabBarIcon: ({ color }) => <Truck color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: "Places",
          tabBarIcon: ({ color }) => <MapPin color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color }) => <Image color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="trailer"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
