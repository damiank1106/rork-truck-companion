import { Edit3, Save, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { TextInputWithSound } from "@/components/TextInputWithSound";
import standardShadow from "@/constants/shadows";
import PageHeader from "@/components/PageHeader";
import { Clickable } from "@/components/Clickable";
import { useTruck } from "@/contexts/TruckContext";
import { TruckProfile } from "@/types";

type TabType = "main" | "truck" | "trailer" | "load" | "weight" | "tire";

const TAB_HORIZONTAL_PADDING = 12;

export default function TruckScreen() {
  const insets = useSafeAreaInsets();
  const { truckProfile, updateTruckProfile } = useTruck();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<TruckProfile>(truckProfile);
  const [activeTab, setActiveTab] = useState<TabType>("main");
  const [tabsLayoutWidth, setTabsLayoutWidth] = useState(0);
  const [tabsContentWidth, setTabsContentWidth] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const indicatorTrackWidth = React.useMemo(
    () => Math.max(tabsLayoutWidth - TAB_HORIZONTAL_PADDING * 2, 0),
    [tabsLayoutWidth]
  );

  const indicatorWidth = React.useMemo(() => {
    if (
      !indicatorTrackWidth ||
      !tabsLayoutWidth ||
      tabsContentWidth <= tabsLayoutWidth
    ) {
      return 0;
    }

    const visibleRatio = tabsLayoutWidth / tabsContentWidth;
    return indicatorTrackWidth * visibleRatio;
  }, [indicatorTrackWidth, tabsContentWidth, tabsLayoutWidth]);

  const indicatorTranslateX =
    tabsContentWidth > tabsLayoutWidth &&
    indicatorTrackWidth > 0 &&
    indicatorWidth > 0
      ? scrollX.interpolate({
          inputRange: [0, tabsContentWidth - tabsLayoutWidth],
          outputRange: [
            0,
            Math.max(indicatorTrackWidth - indicatorWidth, 0),
          ],
          extrapolate: "clamp",
        })
      : 0;

  const handleEdit = () => {
    setEditedProfile(truckProfile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(truckProfile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    await updateTruckProfile(editedProfile);
    setIsEditing(false);
    Alert.alert("Success", "Truck profile updated successfully!");
  };

  const updateField = (field: keyof TruckProfile, value: string) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const profile = isEditing ? editedProfile : truckProfile;

  const headerRight = !isEditing ? (
    <Clickable style={styles.editButton} onPress={handleEdit}>
      <Edit3 color={Colors.white} size={20} />
      <Text style={styles.editButtonText}>Edit</Text>
    </Clickable>
  ) : (
    <View style={styles.actionButtons}>
      <Clickable style={styles.cancelButton} onPress={handleCancel}>
        <X color={Colors.error} size={20} />
      </Clickable>
      <Clickable style={styles.saveButton} onPress={handleSave}>
        <Save color={Colors.white} size={20} />
      </Clickable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PageHeader
        title="My Truck"
        subtitle="Vehicle specifications"
        topInset={insets.top + 16}
        rightAccessory={headerRight}
      />

      <View style={styles.tabsWrapper}>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onLayout={({ nativeEvent }) => setTabsLayoutWidth(nativeEvent.layout.width)}
          onContentSizeChange={(contentWidth) => setTabsContentWidth(contentWidth)}
          scrollEventThrottle={16}
        >
          <TabButton
            label="Main"
            isActive={activeTab === "main"}
            onPress={() => setActiveTab("main")}
          />
          <TabButton
            label="Truck"
            isActive={activeTab === "truck"}
            onPress={() => setActiveTab("truck")}
          />
          <TabButton
            label="Trailer"
            isActive={activeTab === "trailer"}
            onPress={() => setActiveTab("trailer")}
          />
          <TabButton
            label="Load"
            isActive={activeTab === "load"}
            onPress={() => setActiveTab("load")}
          />
          <TabButton
            label="Weight"
            isActive={activeTab === "weight"}
            onPress={() => setActiveTab("weight")}
          />
          <TabButton
            label="Tires"
            isActive={activeTab === "tire"}
            onPress={() => setActiveTab("tire")}
          />
        </Animated.ScrollView>
        {indicatorWidth > 0 && indicatorTrackWidth > 0 && (
          <View style={styles.tabsIndicatorWrapper}>
            <View
              style={[
                styles.tabsIndicatorTrack,
                { width: indicatorTrackWidth },
              ]}
            >
              <Animated.View
                style={[
                  styles.tabsIndicatorThumb,
                  {
                    width: indicatorWidth,
                    transform: [{ translateX: indicatorTranslateX }],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "main" && (
          <View style={styles.section}>
            <InputField
              label="Company Name"
              value={profile.companyName}
              onChangeText={(text) => updateField("companyName", text)}
              editable={isEditing}
              placeholder="Enter Company Name"
            />
            <InputField
              label="Driver ID"
              value={profile.driverId}
              onChangeText={(text) => updateField("driverId", text)}
              editable={isEditing}
              placeholder="Enter Driver ID"
            />
            <InputField
              label="MCN (Motor Carrier Number)"
              value={profile.mcn}
              onChangeText={(text) => updateField("mcn", text)}
              editable={isEditing}
              placeholder="Enter MCN"
            />
            <InputField
              label="DOT Number"
              value={profile.dotNumber}
              onChangeText={(text) => updateField("dotNumber", text)}
              editable={isEditing}
              placeholder="Enter DOT Number"
            />
          </View>
        )}

        {activeTab === "truck" && (
          <View style={styles.section}>
            <InputField
              label="Truck Number"
              value={profile.truckNumber}
              onChangeText={(text) => updateField("truckNumber", text)}
              editable={isEditing}
              placeholder="Enter Truck Number"
            />
            <InputField
              label="VIN Number"
              value={profile.vinNumber}
              onChangeText={(text) => updateField("vinNumber", text)}
              editable={isEditing}
              placeholder="Enter VIN Number"
            />
            <InputField
              label="Make"
              value={profile.make}
              onChangeText={(text) => updateField("make", text)}
              editable={isEditing}
              placeholder="e.g., Freightliner"
            />
            <InputField
              label="Model"
              value={profile.model}
              onChangeText={(text) => updateField("model", text)}
              editable={isEditing}
              placeholder="e.g., Cascadia"
            />
            <InputField
              label="Year"
              value={profile.year}
              onChangeText={(text) => updateField("year", text)}
              editable={isEditing}
              placeholder="e.g., 2022"
              keyboardType="numeric"
            />
            <InputField
              label="Registration Number"
              value={profile.registrationNumber}
              onChangeText={(text) => updateField("registrationNumber", text)}
              editable={isEditing}
              placeholder="Enter Registration Number"
            />
            <InputField
              label="Mileage"
              value={profile.mileage}
              onChangeText={(text) => updateField("mileage", text)}
              editable={isEditing}
              placeholder="e.g., 150,000 miles"
            />
          </View>
        )}

        {activeTab === "trailer" && (
          <View style={styles.section}>
            <InputField
              label="Trailer Number"
              value={profile.trailerNumber}
              onChangeText={(text) => updateField("trailerNumber", text)}
              editable={isEditing}
              placeholder="Enter Trailer Number"
            />
            <InputField
              label="Trailer Type"
              value={profile.trailerType}
              onChangeText={(text) => updateField("trailerType", text)}
              editable={isEditing}
              placeholder="e.g., 53 ft dry van"
            />
            <InputField
              label="Year"
              value={profile.trailerYear}
              onChangeText={(text) => updateField("trailerYear", text)}
              editable={isEditing}
              placeholder="e.g., 2020"
              keyboardType="numeric"
            />
            <InputField
              label="Registration Plate"
              value={profile.trailerRegistrationPlate}
              onChangeText={(text) => updateField("trailerRegistrationPlate", text)}
              editable={isEditing}
              placeholder="Enter Registration Plate"
            />
            <InputField
              label="Insurance"
              value={profile.trailerInsurance}
              onChangeText={(text) => updateField("trailerInsurance", text)}
              editable={isEditing}
              placeholder="Enter Insurance Info"
            />
            <InputField
              label="Inspection"
              value={profile.trailerInspection}
              onChangeText={(text) => updateField("trailerInspection", text)}
              editable={isEditing}
              placeholder="Enter Inspection Date"
            />
            <InputField
              label="Trailer Length"
              value={profile.trailerLength}
              onChangeText={(text) => updateField("trailerLength", text)}
              editable={isEditing}
              placeholder="e.g., 53'"
            />
            <InputField
              label="Trailer Width"
              value={profile.trailerWidth}
              onChangeText={(text) => updateField("trailerWidth", text)}
              editable={isEditing}
              placeholder="e.g., 8'6&quot;"
            />
            <InputField
              label="Trailer Height"
              value={profile.trailerHeight}
              onChangeText={(text) => updateField("trailerHeight", text)}
              editable={isEditing}
              placeholder="e.g., 13'6&quot;"
            />
          </View>
        )}

        {activeTab === "load" && (
          <View style={styles.section}>
            <InputField
              label="PU Number"
              value={profile.puNumber}
              onChangeText={(text) => updateField("puNumber", text)}
              editable={isEditing}
              placeholder="Enter PU Number"
            />
            <InputField
              label="BOL"
              value={profile.bol}
              onChangeText={(text) => updateField("bol", text)}
              editable={isEditing}
              placeholder="Enter BOL"
            />
            <InputField
              label="Weight"
              value={profile.loadWeight}
              onChangeText={(text) => updateField("loadWeight", text)}
              editable={isEditing}
              placeholder="e.g., 42,000 lbs"
            />
            <InputField
              label="Freight"
              value={profile.freight}
              onChangeText={(text) => updateField("freight", text)}
              editable={isEditing}
              placeholder="Describe freight"
            />
          </View>
        )}

        {activeTab === "weight" && (
          <View style={styles.section}>
            <InputField
              label="Maximum Load Weight"
              value={profile.maxLoadWeight}
              onChangeText={(text) => updateField("maxLoadWeight", text)}
              editable={isEditing}
              placeholder="e.g., 45,000 lbs"
            />
            <InputField
              label="Steer Axle Weight"
              value={profile.steerAxleWeight}
              onChangeText={(text) => updateField("steerAxleWeight", text)}
              editable={isEditing}
              placeholder="e.g., 12,000 lbs"
            />
            <InputField
              label="Drive Axle Weight"
              value={profile.driveAxleWeight}
              onChangeText={(text) => updateField("driveAxleWeight", text)}
              editable={isEditing}
              placeholder="e.g., 34,000 lbs"
            />
            <InputField
              label="Trailer Axle Weight"
              value={profile.trailerAxleWeight}
              onChangeText={(text) => updateField("trailerAxleWeight", text)}
              editable={isEditing}
              placeholder="e.g., 34,000 lbs"
            />
            <InputField
              label="Gross Vehicle Weight"
              value={profile.grossVehicleWeight}
              onChangeText={(text) => updateField("grossVehicleWeight", text)}
              editable={isEditing}
              placeholder="e.g., 80,000 lbs"
            />
          </View>
        )}

        {activeTab === "tire" && (
          <View style={styles.section}>
            <InputField
              label="Steer Tire PSI"
              value={profile.steerTirePSI}
              onChangeText={(text) => updateField("steerTirePSI", text)}
              editable={isEditing}
              placeholder="e.g., 110 PSI"
              keyboardType="numeric"
            />
            <InputField
              label="Drive Tire PSI"
              value={profile.driveTirePSI}
              onChangeText={(text) => updateField("driveTirePSI", text)}
              editable={isEditing}
              placeholder="e.g., 100 PSI"
              keyboardType="numeric"
            />
            <InputField
              label="Trailer Tire PSI"
              value={profile.trailerTirePSI}
              onChangeText={(text) => updateField("trailerTirePSI", text)}
              editable={isEditing}
              placeholder="e.g., 100 PSI"
              keyboardType="numeric"
            />
            <InputField
              label="Steer Tire Size"
              value={profile.steerTireSize}
              onChangeText={(text) => updateField("steerTireSize", text)}
              editable={isEditing}
              placeholder="e.g., 295/75R22.5"
            />
            <InputField
              label="Drive Tire Size"
              value={profile.driveTireSize}
              onChangeText={(text) => updateField("driveTireSize", text)}
              editable={isEditing}
              placeholder="e.g., 11R22.5"
            />
            <InputField
              label="Trailer Tire Size"
              value={profile.trailerTireSize}
              onChangeText={(text) => updateField("trailerTireSize", text)}
              editable={isEditing}
              placeholder="e.g., 11R22.5"
            />
            <InputField
              label="Steering Tread Depth"
              value={profile.steeringTreadDepth}
              onChangeText={(text) => updateField("steeringTreadDepth", text)}
              editable={isEditing}
              placeholder="e.g., 4/32&quot;"
            />
            <InputField
              label="Driver Tread Depth"
              value={profile.driverTreadDepth}
              onChangeText={(text) => updateField("driverTreadDepth", text)}
              editable={isEditing}
              placeholder="e.g., 4/32&quot;"
            />
            <InputField
              label="Trailer Tread Depth"
              value={profile.trailerTreadDepth}
              onChangeText={(text) => updateField("trailerTreadDepth", text)}
              editable={isEditing}
              placeholder="e.g., 4/32&quot;"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ label, isActive, onPress }: TabButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Clickable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabButtonInner,
          isActive && styles.tabButtonActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </Clickable>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}

function InputField({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  keyboardType = "default",
}: InputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInputWithSound
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 8,
  },
  tabsWrapper: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: TAB_HORIZONTAL_PADDING,
    paddingVertical: 12,
    gap: 8,
  },
  tabsIndicatorWrapper: {
    paddingHorizontal: TAB_HORIZONTAL_PADDING,
  },
  tabsIndicatorTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  tabsIndicatorThumb: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  tabButton: {
    minWidth: 96,
    flexShrink: 0,
  },
  tabButtonInner: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.6,
    textAlign: "center",
  },
  tabButtonTextActive: {
    color: Colors.white,
    opacity: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    ...standardShadow,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000000",
  },
  inputDisabled: {
    backgroundColor: Colors.background,
    color: "#000000",
    opacity: 0.6,
  },
});
