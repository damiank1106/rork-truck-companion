import { Platform } from "react-native";

export type MapViewType = typeof import("react-native-maps").default;
export type MarkerType = typeof import("react-native-maps").Marker;

let MapView: MapViewType | null = null;
let Marker: MarkerType | null = null;

if (Platform.OS === "ios" || Platform.OS === "android") {
  const maps = require("react-native-maps") as typeof import("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

export const NativeMapView = MapView;
export const NativeMarker = Marker;
export const isNativeMapAvailable = MapView !== null && Marker !== null;
