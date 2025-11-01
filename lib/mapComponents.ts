import { Platform } from "react-native";

export type MapViewType = any;
export type MarkerType = any;

let NativeMapView: MapViewType | null = null;
let NativeMarker: MarkerType | null = null;
let isNativeMapAvailable = false;

if (Platform.OS === "web") {
  const webMaps = require("./mapComponents.web");
  NativeMapView = webMaps.NativeMapView;
  NativeMarker = webMaps.NativeMarker;
  isNativeMapAvailable = webMaps.isNativeMapAvailable;
} else {
  const nativeMaps = require("./mapComponents.native");
  NativeMapView = nativeMaps.NativeMapView;
  NativeMarker = nativeMaps.NativeMarker;
  isNativeMapAvailable = nativeMaps.isNativeMapAvailable;
}

export { NativeMapView, NativeMarker, isNativeMapAvailable };
