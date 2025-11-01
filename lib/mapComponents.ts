import { Platform } from "react-native";
import Constants from "expo-constants";

export type MapViewType = typeof import("react-native-maps").default;
export type MarkerType = typeof import("react-native-maps").Marker;

let MapView: MapViewType | null = null;
let Marker: MarkerType | null = null;

const isExpoGo = Constants.appOwnership === "expo";

if (!isExpoGo && (Platform.OS === "ios" || Platform.OS === "android")) {
  try {
    const maps = require("react-native-maps") as typeof import("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (error) {
    console.log("react-native-maps not available. Maps will show placeholder.");
  }
}

export const NativeMapView = MapView;
export const NativeMarker = Marker;
export const isNativeMapAvailable = MapView !== null && Marker !== null;
