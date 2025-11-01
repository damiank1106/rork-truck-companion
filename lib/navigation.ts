import { Alert, Linking } from "react-native";

interface NavigationOptions {
  latitude?: number | null;
  longitude?: number | null;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

const buildLabel = (options: NavigationOptions) => {
  if (options.companyName && options.companyName.trim().length > 0) {
    return options.companyName.trim();
  }

  const parts = [options.address, options.city, options.state]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .map((part) => part.trim());

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Saved Place";
};

export const presentNavigationOptions = (options: NavigationOptions) => {
  const { latitude, longitude } = options;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    Alert.alert("Location Unavailable", "This place does not have a saved location yet.");
    return;
  }

  const label = buildLabel(options);
  const encodedLabel = encodeURIComponent(label);

  const appleUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("App Not Available", "The selected maps application is not installed on this device.");
      }
    } catch (error) {
      console.error("Failed to open maps URL", error);
      Alert.alert("Unable to Open", "Something went wrong while trying to open the maps application.");
    }
  };

  Alert.alert(`Navigate to ${label}`, "Choose the app you'd like to use", [
    { text: "Apple Maps", onPress: () => void openUrl(appleUrl) },
    { text: "Google Maps", onPress: () => void openUrl(googleUrl) },
    { text: "Waze", onPress: () => void openUrl(wazeUrl) },
    { text: "Cancel", style: "cancel" },
  ]);
};

