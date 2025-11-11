import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Platform } from "react-native";
import { enableFreeze } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DriverIDContext } from "@/contexts/DriverIDContext";
import { EmergencyContactsContext } from "@/contexts/EmergencyContactsContext";
import { FilesContext } from "@/contexts/FilesContext";
import { HealthInsuranceProvider } from "@/contexts/HealthInsuranceContext";
import { PlacesProvider } from "@/contexts/PlacesContext";
import { TrailerProvider } from "@/contexts/TrailerContext";
import { TruckProvider } from "@/contexts/TruckContext";
import { trpc, trpcClient } from "@/lib/trpc";
import Colors from "@/constants/colors";

if (Platform.OS === 'ios') {
  enableFreeze(false);
}

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        animation: "fade",
        animationDuration: 400,
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 600,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 600,
        }}
      />
      <Stack.Screen
        name="health-insurance"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="driver-id"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="daily-news"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 450,
        }}
      />
      <Stack.Screen
        name="safety-information"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 450,
        }}
      />
      <Stack.Screen
        name="donations"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 450,
        }}
      />
      <Stack.Screen
        name="files"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 450,
        }}
      />
      <Stack.Screen
        name="scan-document"
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="file-detail"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TruckProvider>
        <TrailerProvider>
          <PlacesProvider>
            <EmergencyContactsContext>
              <HealthInsuranceProvider>
                <DriverIDContext>
                  <FilesContext>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <SafeAreaProvider>
                        <RootLayoutNav />
                      </SafeAreaProvider>
                    </GestureHandlerRootView>
                  </FilesContext>
                </DriverIDContext>
              </HealthInsuranceProvider>
            </EmergencyContactsContext>
          </PlacesProvider>
        </TrailerProvider>
      </TruckProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
