import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        tabBarShowLabel: false,
      }}
      tabBar={() => null}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="truck"
        options={{
          title: "My Truck",
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: "Places",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarButton: () => null,
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
