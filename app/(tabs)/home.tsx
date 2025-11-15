import { Truck, MapPinIcon, Container, Plus, ShieldPlus, CreditCard } from "lucide-react-native";
import React, { useState, useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View, Platform, Alert, Image, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import PageHeader from "@/components/PageHeader";
import WeatherAnimatedBackground from "@/components/WeatherAnimatedBackground";
import { Clickable } from "@/components/Clickable";
import { useDriverID } from "@/contexts/DriverIDContext";
import { useEmergencyContacts } from "@/contexts/EmergencyContactsContext";
import { useHealthInsurance } from "@/contexts/HealthInsuranceContext";
import { usePlaces } from "@/contexts/PlacesContext";
import { useTruck } from "@/contexts/TruckContext";
import { Modal, TextInput as RNTextInput } from "react-native";
import { useTrailers } from "@/contexts/TrailerContext";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { truckProfile, updateTruckProfile } = useTruck();
  const { places } = usePlaces();
  const { trailers } = useTrailers();
  const { contacts } = useEmergencyContacts();
  const { insurance } = useHealthInsurance();
  const { driverID } = useDriverID();
  const firstTrailer = trailers.length > 0 ? trailers[0] : null;
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>("Loading...");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [isCelsius, setIsCelsius] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(0);
  const [isSpeedKmh, setIsSpeedKmh] = useState<boolean>(false);
  const [lastGeocodeTime, setLastGeocodeTime] = useState<number>(0);
  const [cachedLocation, setCachedLocation] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [isTrailerModalVisible, setIsTrailerModalVisible] = useState<boolean>(false);
  const [trailerNumberInput, setTrailerNumberInput] = useState<string>("");
  const [isTruckModalVisible, setIsTruckModalVisible] = useState<boolean>(false);
  const [truckNumberInput, setTruckNumberInput] = useState<string>("");
  const hasTruckInfo = truckProfile.truckNumber || truckProfile.driverId;
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isBiggerScreen = width >= 768;
  const isNightTime = currentTime.getHours() < 6 || currentTime.getHours() >= 18;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLocation();
      startSpeedTracking();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const startSpeedTracking = async () => {
    if (Platform.OS === 'web') {
      console.log('Speed tracking not available on web');
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          if (location.coords.speed !== null && location.coords.speed !== undefined) {
            const speedMps = location.coords.speed;
            setSpeed(Math.max(0, Math.round(speedMps)));
          }
        }
      );
    } catch (error) {
      console.error("Error starting speed tracking:", error);
    }
  };

  const loadLocation = async (forceRefresh: boolean = false) => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
          (navigator as any).geolocation.getCurrentPosition(
            async (pos: GeolocationPosition) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              setLocation(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
              await fetchWeather(lat, lon);
              setIsLoadingLocation(false);
            },
            (err: GeolocationPositionError) => {
              console.warn('Geolocation error on web', err);
              setLocation('Location unavailable');
              setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
          );
        } else {
          console.log('navigator.geolocation not available on web');
          setLocation('Location unavailable');
          setIsLoadingLocation(false);
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation("Permission denied");
        setIsLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const currentTime = Date.now();
      const timeSinceLastGeocode = currentTime - lastGeocodeTime;
      const GEOCODE_COOLDOWN = 60000;

      if (cachedLocation && !forceRefresh) {
        const distance = Math.sqrt(
          Math.pow(loc.coords.latitude - cachedLocation.lat, 2) +
          Math.pow(loc.coords.longitude - cachedLocation.lon, 2)
        );
        
        if (distance < 0.01 && timeSinceLastGeocode < GEOCODE_COOLDOWN) {
          setLocation(cachedLocation.name);
          await fetchWeather(loc.coords.latitude, loc.coords.longitude);
          setIsLoadingLocation(false);
          return;
        }
      }

      if (timeSinceLastGeocode < GEOCODE_COOLDOWN && !forceRefresh) {
        if (cachedLocation) {
          setLocation(cachedLocation.name);
        }
        await fetchWeather(loc.coords.latitude, loc.coords.longitude);
        setIsLoadingLocation(false);
        return;
      }

      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const city = address?.city || address?.name || "Unknown";
          const state = address?.region || "";
          const locationName = state ? `${city}, ${state}` : city;
          setLocation(locationName);
          setCachedLocation({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            name: locationName
          });
          setLastGeocodeTime(currentTime);
        } else {
          setLocation("Unknown Location");
        }
      } catch (geocodeError: any) {
        console.error("Geocoding error:", geocodeError);
        if (geocodeError?.message?.includes("rate limit")) {
          if (cachedLocation) {
            setLocation(cachedLocation.name);
          } else {
            setLocation(`${loc.coords.latitude.toFixed(2)}°, ${loc.coords.longitude.toFixed(2)}°`);
          }
        } else {
          setLocation("Location unavailable");
        }
      }

      await fetchWeather(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error("Error loading location:", error);
      setLocation("Unable to load");
    } finally {
      // avoid double set false on web success path
      setIsLoadingLocation(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    setIsWeatherLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: any = await response.json();

      if (data?.current && typeof data.current.temperature_2m === 'number' && typeof data.current.weather_code === 'number') {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: getWeatherCondition(data.current.weather_code),
          icon: getWeatherIcon(data.current.weather_code),
        });
      } else {
        setWeather(null);
      }

      if (Array.isArray(data?.daily?.time) && Array.isArray(data?.daily?.temperature_2m_max) && Array.isArray(data?.daily?.temperature_2m_min) && Array.isArray(data?.daily?.weather_code)) {
        const forecastData: ForecastDay[] = data.daily.time.map((date: string, index: number) => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          tempMax: Math.round(Number(data.daily.temperature_2m_max[index] ?? 0)),
          tempMin: Math.round(Number(data.daily.temperature_2m_min[index] ?? 0)),
          condition: getWeatherCondition(Number(data.daily.weather_code[index] ?? 0)),
          icon: getWeatherIcon(Number(data.daily.weather_code[index] ?? 0)),
        }));
        setForecast(forecastData);
      } else {
        setForecast([]);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather(null);
      setForecast([]);
    } finally {
      clearTimeout(timeoutId);
      setIsWeatherLoading(false);
    }
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return "Clear";
    if (code <= 3) return "Cloudy";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 99) return "Storm";
    return "Unknown";
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return "\u2600\ufe0f";
    if (code <= 3) return "\u2601\ufe0f";
    if (code <= 67) return "\ud83c\udf27\ufe0f";
    if (code <= 77) return "\u2744\ufe0f";
    if (code <= 99) return "\u26c8\ufe0f";
    return "\ud83c\udf24\ufe0f";
  };

  const convertTemp = (celsius: number): number => {
    if (isCelsius) return celsius;
    return Math.round((celsius * 9) / 5 + 32);
  };

  const getTempUnit = (): string => {
    return isCelsius ? "°C" : "°F";
  };

  const handleLocationPress = () => {
    const timeSinceLastGeocode = Date.now() - lastGeocodeTime;
    const GEOCODE_COOLDOWN = 60000;
    
    if (timeSinceLastGeocode < GEOCODE_COOLDOWN) {
      const remainingSeconds = Math.ceil((GEOCODE_COOLDOWN - timeSinceLastGeocode) / 1000);
      Alert.alert(
        "Please Wait",
        `Location updates are limited. Please wait ${remainingSeconds} seconds before refreshing again.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (Platform.OS === "ios") {
      Alert.alert(
        "Update Location",
        "Do you want to refresh your location?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Update", onPress: () => loadLocation(true) },
        ]
      );
    } else {
      loadLocation(true);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="TD Companion"
        subtitle="Your journey, organized"
        topInset={insets.top + 16}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.dateTimeSection} testID="date-time-card">
            <Text style={[styles.dateTextSmall, isSmallScreen && styles.dateTextSmallCompact]}>{formatDate(currentTime)}</Text>
            <Text style={[styles.timeTextSmall, isSmallScreen && styles.timeTextSmallCompact]}>{formatTime(currentTime)}</Text>
          </View>
          <Clickable
            style={styles.speedGauge}
            onPress={() => setIsSpeedKmh(!isSpeedKmh)}
          >
            <Text style={[styles.speedValue, isSmallScreen && styles.speedValueCompact]}>
              {isSpeedKmh ? Math.round(speed * 3.6) : Math.round(speed * 2.23694)}
            </Text>
            <Text style={[styles.speedUnit, isSmallScreen && styles.speedUnitCompact]}>{isSpeedKmh ? 'km/h' : 'mph'}</Text>
          </Clickable>
        </View>

        <View style={[styles.weatherContainer, isBiggerScreen ? styles.weatherContainerBigScreen : styles.weatherContainerSmallScreen]} testID="weather-widget">
          <View style={styles.weatherBackgroundWrapper}>
            <WeatherAnimatedBackground
              condition={weather?.condition}
              timeOfDay={isNightTime ? "night" : "day"}
              borderRadius={16}
            />
          </View>
          <View style={styles.weatherContent}>
            <View style={styles.weatherHeader}>
              <View style={styles.locationRow}>
                <Clickable onPress={handleLocationPress} disabled={isLoadingLocation}>
                  <MapPinIcon color={Colors.primaryLight} size={20} />
                </Clickable>
                <Text style={styles.locationText}>{location}</Text>
              </View>
              <Clickable
                style={styles.tempUnitSwitch}
                onPress={() => setIsCelsius(!isCelsius)}
              >
                <Text style={[styles.tempUnitText, isCelsius && styles.tempUnitActive]}>°C</Text>
                <Text style={styles.tempUnitSeparator}>|</Text>
                <Text style={[styles.tempUnitText, !isCelsius && styles.tempUnitActive]}>°F</Text>
              </Clickable>
            </View>

            {(isLoadingLocation || isWeatherLoading) && (
              <View style={styles.weatherLoadingRow}>
                <ActivityIndicator size="small" color={Colors.primaryLight} />
                <Text style={styles.weatherLoadingText}>Updating weather...</Text>
              </View>
            )}

            {!isLoadingLocation && !isWeatherLoading && forecast.length > 0 && (
              <View style={styles.forecastContainer}>
                {forecast.map((day, index) => (
                  <View key={index} style={styles.forecastDay}>
                    <Text style={styles.forecastDayName}>{day.date}</Text>
                    <Text style={styles.forecastIcon}>{day.icon}</Text>
                    <View style={styles.forecastTempContainer}>
                      <Text style={styles.forecastTempDay}>{convertTemp(day.tempMax)}°</Text>
                      <Text style={styles.forecastTempNight}>{convertTemp(day.tempMin)}°</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Truck color={Colors.primaryLight} size={24} />}
            title="My Truck"
            value={truckProfile.truckNumber ? `Truck #${truckProfile.truckNumber}` : "Not set"}
            color={Colors.primaryLight}
            onPress={() => router.push("/(tabs)/truck")}
            showPlusIcon
            onPlusPress={() => {
              setTruckNumberInput(truckProfile.truckNumber || "");
              setIsTruckModalVisible(true);
            }}
            compact={isSmallScreen}
          />
          <StatCard
            icon={<Container color={Colors.secondary} size={24} />}
            title="Trailer"
            value={firstTrailer?.trailerNumber ? `#${firstTrailer.trailerNumber}` : (truckProfile.trailerNumber ? `#${truckProfile.trailerNumber}` : "Not set")}
            color={Colors.secondary}
            onPress={() => router.push("/(tabs)/trailer")}
            showPlusIcon
            onPlusPress={() => {
              setTrailerNumberInput(truckProfile.trailerNumber || "");
              setIsTrailerModalVisible(true);
            }}
            compact={isSmallScreen}
          />
        </View>

        <View style={styles.emergencySection}>
          <View style={styles.emergencySectionHeader}>
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleCompact]}>Emergency Contacts</Text>
            <Clickable
              style={styles.viewAllButton}
              onPress={() => router.push("/emergency-contacts-list")}
            >
              <Text style={[styles.viewAllText, isSmallScreen && styles.viewAllTextCompact]}>View All</Text>
            </Clickable>
          </View>
          <View style={styles.emergencyContactsContainer}>
            {contacts.slice(0, 5).map((contact) => (
              <Clickable
                key={contact.id}
                style={styles.emergencyContactCircle}
                onPress={() => router.push(`/emergency-contact-detail?id=${contact.id}`)}
              >
                {contact.photoUri ? (
                  <Image source={{ uri: contact.photoUri }} style={styles.contactPhoto} />
                ) : (
                  <View style={styles.contactInitialsCircle}>
                    <Text style={styles.contactInitials}>
                      {contact.displayPhotoId || contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                )}
              </Clickable>
            ))}
            <Clickable
              style={styles.addContactCircle}
              onPress={() => router.push("/emergency-contact-detail")}
            >
              <Plus color={Colors.primaryLight} size={24} />
            </Clickable>
          </View>
        </View>

        <Clickable
          style={styles.healthInsuranceSection}
          onPress={() => router.push("/health-insurance")}
        >
          <View style={styles.healthInsuranceHeader}>
            <View style={styles.healthInsuranceIconContainer}>
              <ShieldPlus color={Colors.white} size={26} />
            </View>
            <View style={styles.healthInsuranceContent}>
              <Text style={[styles.healthInsuranceTitle, isSmallScreen && styles.healthInsuranceTitleCompact]}>Health Insurance</Text>
              <Text style={[styles.healthInsuranceSubtitle, isSmallScreen && styles.healthInsuranceSubtitleCompact]}>
                {insurance ? insurance.providerName : "Add insurance info"}
              </Text>
            </View>
          </View>
        </Clickable>

        <Clickable
          style={styles.driverIDSection}
          onPress={() => router.push("/driver-id")}
        >
          <View style={styles.driverIDHeader}>
            <View style={styles.driverIDIconContainer}>
              <CreditCard color={Colors.white} size={26} />
            </View>
            <View style={styles.driverIDContent}>
              <Text style={[styles.driverIDTitle, isSmallScreen && styles.driverIDTitleCompact]}>Driver ID</Text>
              <Text style={[styles.driverIDSubtitle, isSmallScreen && styles.driverIDSubtitleCompact]}>
                {driverID ? `${driverID.name} - ${driverID.state}` : "Add driver ID info"}
              </Text>
            </View>
          </View>
        </Clickable>
      </ScrollView>

      <Modal
        visible={isTrailerModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTrailerModalVisible(false)}
      >
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerModalContent}>
            <Text style={styles.trailerModalTitle}>Update Trailer Number</Text>
            <RNTextInput
              style={styles.trailerModalInput}
              placeholder="Enter trailer number"
              placeholderTextColor={Colors.textLight}
              value={trailerNumberInput}
              onChangeText={setTrailerNumberInput}
              autoFocus
            />
            <View style={styles.trailerModalButtons}>
              <Clickable
                style={styles.trailerModalCancelButton}
                onPress={() => setIsTrailerModalVisible(false)}
              >
                <Text style={styles.trailerModalCancelText}>Cancel</Text>
              </Clickable>
              <Clickable
                style={styles.trailerModalConfirmButton}
                onPress={async () => {
                  await updateTruckProfile({ trailerNumber: trailerNumberInput });
                  setIsTrailerModalVisible(false);
                }}
              >
                <Text style={styles.trailerModalConfirmText}>Confirm</Text>
              </Clickable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTruckModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTruckModalVisible(false)}
      >
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerModalContent}>
            <Text style={styles.trailerModalTitle}>Update Truck Info</Text>
            <Text style={styles.modalFieldLabel}>Truck Number</Text>
            <RNTextInput
              style={styles.trailerModalInput}
              placeholder="Enter truck number"
              placeholderTextColor={Colors.textLight}
              value={truckNumberInput}
              onChangeText={setTruckNumberInput}
            />
            <View style={styles.trailerModalButtons}>
              <Clickable
                style={styles.trailerModalCancelButton}
                onPress={() => setIsTruckModalVisible(false)}
              >
                <Text style={styles.trailerModalCancelText}>Cancel</Text>
              </Clickable>
              <Clickable
                style={styles.trailerModalConfirmButton}
                onPress={async () => {
                  await updateTruckProfile({
                    truckNumber: truckNumberInput
                  });
                  setIsTruckModalVisible(false);
                }}
              >
                <Text style={styles.trailerModalConfirmText}>Confirm</Text>
              </Clickable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  thirdLine?: string;
  color: string;
  onPress: () => void;
  onSubtitlePress?: () => void;
  onThirdLinePress?: () => void;
  showPlusIcon?: boolean;
  onPlusPress?: () => void;
  compact?: boolean;
}

function StatCard({ icon, title, value, subtitle, thirdLine, color, onPress, onSubtitlePress, onThirdLinePress, showPlusIcon, onPlusPress, compact = false }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shouldShowShadow = title === "My Truck" || title === "Trailer";

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
      style={styles.statCard}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Animated.View
        style={[
          styles.statCardGlass,
          shouldShowShadow && styles.statCardShadow,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        {showPlusIcon && onPlusPress && (
          <Clickable
            style={styles.statCardPlusIcon}
            onPress={(e) => {
              e.stopPropagation();
              onPlusPress();
            }}
          >
            <Plus color={Colors.secondary} size={28} />
          </Clickable>
        )}
        <Text style={[styles.statTitle, compact && styles.statTitleCompact]}>{title}</Text>
        <Text style={[styles.statValue, compact && styles.statValueCompact]}>{value}</Text>
        {subtitle && (
          onSubtitlePress ? (
            <Clickable onPress={(e) => {
              e.stopPropagation();
              onSubtitlePress();
            }}>
              <Text style={[styles.statSubtitle, styles.touchableText, compact && styles.statSubtitleCompact]}>{subtitle}</Text>
            </Clickable>
          ) : (
            <Text style={[styles.statSubtitle, compact && styles.statSubtitleCompact]}>{subtitle}</Text>
          )
        )}
        {thirdLine && (
          onThirdLinePress ? (
            <Clickable onPress={(e) => {
              e.stopPropagation();
              onThirdLinePress();
            }}>
              <Text style={[styles.statThirdLine, styles.touchableText, compact && styles.statThirdLineCompact]}>{thirdLine}</Text>
            </Clickable>
          ) : (
            <Text style={[styles.statThirdLine, compact && styles.statThirdLineCompact]}>{thirdLine}</Text>
          )
        )}
      </Animated.View>
    </Clickable>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  onPress: () => void;
}

function QuickActionButton({ icon, title, color, onPress }: QuickActionButtonProps) {
  return (
    <Clickable style={styles.quickActionButton} onPress={onPress}>
      <View style={styles.quickActionGlass}>
        <View style={styles.quickActionIcon}>{icon}</View>
        <Text style={styles.quickActionText}>{title}</Text>
      </View>
    </Clickable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    height: 160,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "visible",
    position: "relative",
    height: "100%",
  },
  statCardGlass: {
    backgroundColor: Colors.white,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 16,
    height: "100%",
  },
  statCardShadow: {
    ...standardShadow,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 13,
    color: "#000000",
    marginBottom: 3,
    fontWeight: "700" as const,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statTitleCompact: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 3,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexWrap: "wrap",
    lineHeight: 28,
  },
  statValueCompact: {
    fontSize: 16,
    lineHeight: 24,
  },
  statSubtitle: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700" as const,
  },
  statSubtitleCompact: {
    fontSize: 12,
  },
  statThirdLine: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700" as const,
    marginTop: 2,
  },
  statThirdLineCompact: {
    fontSize: 12,
  },
  quickActionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitleCompact: {
    fontSize: 18,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 120,
  },
  quickActionGlass: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateTimeSection: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
    justifyContent: "center",
  },
  dateTextSmall: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "700" as const,
  },
  dateTextSmallCompact: {
    fontSize: 12,
  },
  timeTextSmall: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#000000",
  },
  timeTextSmallCompact: {
    fontSize: 16,
  },
  speedGauge: {
    width: 120,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
    alignItems: "center",
    justifyContent: "center",
  },
  speedValue: {
    fontSize: 36,
    fontWeight: "bold" as const,
    color: Colors.primaryLight,
    lineHeight: 40,
  },
  speedValueCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.6,
    marginTop: 2,
  },
  speedUnitCompact: {
    fontSize: 12,
  },
  dateTimeContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...standardShadow,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#000000",
    opacity: 0.7,
    marginBottom: 8,
    fontWeight: "600" as const,
  },
  timeText: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: "#000000",
  },
  weatherContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    position: "relative" as const,
    ...standardShadow,
  },
  weatherBackgroundWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  weatherContainerSmallScreen: {},
  weatherContainerBigScreen: {},
  weatherContent: {
    position: "relative",
    zIndex: 1,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tempUnitSwitch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  tempUnitText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.4,
  },
  tempUnitActive: {
    opacity: 1,
    color: Colors.primaryLight,
  },
  tempUnitSeparator: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.3,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 32,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#000000",
  },
  weatherCondition: {
    fontSize: 16,
    color: "#000000",
    opacity: 0.7,
  },
  weatherLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.6,
  },
  forecastContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  forecastDay: {
    alignItems: "center",
    gap: 3,
  },
  forecastDayName: {
    fontSize: 11,
    color: "#000000",
    opacity: 0.6,
    fontWeight: "600" as const,
  },
  forecastIcon: {
    fontSize: 20,
  },
  forecastTempContainer: {
    alignItems: "center",
    gap: 2,
  },
  forecastTempDay: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000000",
  },
  forecastTempNight: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.5,
  },
  quickActionIcon: {
    marginBottom: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.black,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emergencySection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    ...standardShadow,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  emergencySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  viewAllTextCompact: {
    fontSize: 11,
  },
  emergencyContactsContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  emergencyContactCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: Colors.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      }
    }),
  },
  contactPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactPhotoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      }
    }),
  },
  contactInitials: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.white,
  },
  addContactCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
  },
  statCardPlusIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trailerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  trailerModalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  trailerModalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 24,
    textAlign: "center",
  },
  modalFieldLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#000000",
    marginBottom: 8,
    opacity: 0.8,
  },
  trailerModalInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#000000",
    marginBottom: 16,
  },
  trailerModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  trailerModalCancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trailerModalCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  trailerModalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trailerModalConfirmText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  healthInsuranceSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    ...standardShadow,
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  healthInsuranceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  healthInsuranceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  healthInsuranceContent: {
    flex: 1,
  },
  healthInsuranceTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 4,
  },
  healthInsuranceTitleCompact: {
    fontSize: 16,
  },
  healthInsuranceSubtitle: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.6,
  },
  healthInsuranceSubtitleCompact: {
    fontSize: 12,
  },
  driverIDSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    marginBottom: 16,
    ...standardShadow,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  driverIDHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  driverIDIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  driverIDContent: {
    flex: 1,
  },
  driverIDTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 4,
  },
  driverIDTitleCompact: {
    fontSize: 16,
  },
  driverIDSubtitle: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.6,
  },
  driverIDSubtitleCompact: {
    fontSize: 12,
  },
  touchableText: {
    textDecorationLine: "underline" as const,
  },
});
