import { Truck, MapPinIcon, Container, Plus, ShieldPlus, CreditCard, Menu, X, Newspaper, Shield, HeartHandshake } from "lucide-react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Alert, Image, ActivityIndicator, Pressable, Easing, useWindowDimensions, Modal, TextInput as RNTextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { PermissionStatus } from "expo-modules-core";

import Colors from "@/constants/colors";
import AnimatedBackground from "@/components/AnimatedBackground";
import WeatherAnimatedBackground from "@/components/WeatherAnimatedBackground";
import { useDriverID } from "@/contexts/DriverIDContext";
import { useEmergencyContacts } from "@/contexts/EmergencyContactsContext";
import { useHealthInsurance } from "@/contexts/HealthInsuranceContext";
import { usePlaces } from "@/contexts/PlacesContext";
import { useTruck } from "@/contexts/TruckContext";
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
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isMenuMounted, setIsMenuMounted] = useState<boolean>(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;
  const locationPermissionStatusRef = useRef<PermissionStatus | null>(null);
  const locationPermissionRequestRef = useRef<Promise<PermissionStatus> | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const hasTruckInfo = truckProfile.truckNumber || truckProfile.driverId;

  const ensureLocationPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS === "web") {
      locationPermissionStatusRef.current = PermissionStatus.GRANTED;
      return PermissionStatus.GRANTED;
    }

    if (locationPermissionStatusRef.current === PermissionStatus.GRANTED) {
      return PermissionStatus.GRANTED;
    }

    if (locationPermissionRequestRef.current) {
      return locationPermissionRequestRef.current;
    }

    const permissionRequest = (async () => {
      try {
        const currentStatus = await Location.getForegroundPermissionsAsync();
        locationPermissionStatusRef.current = currentStatus.status;

        if (currentStatus.status === PermissionStatus.GRANTED || !currentStatus.canAskAgain) {
          return currentStatus.status;
        }
      } catch (error) {
        console.error("Error checking location permission:", error);
      }

      const response = await Location.requestForegroundPermissionsAsync();
      locationPermissionStatusRef.current = response.status;
      return response.status;
    })().finally(() => {
      locationPermissionRequestRef.current = null;
    });

    locationPermissionRequestRef.current = permissionRequest;
    return permissionRequest;
  }, []);

  const openMenu = () => {
    if (menuVisible) {
      return;
    }
    setMenuVisible(true);
    setIsMenuMounted(true);
    menuAnimation.stopAnimation();
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (onClosed?: () => void) => {
    if (!menuVisible && !isMenuMounted) {
      onClosed?.();
      return;
    }
    menuAnimation.stopAnimation();
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      setIsMenuMounted(false);
      onClosed?.();
    });
  };

  const handleMenuToggle = () => {
    if (menuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleMenuClose = () => {
    closeMenu();
  };

  const handleMenuNavigate = (path: string) => {
    closeMenu(() => router.push(path));
  };

  const menuDropdownTop = insets.top + 16 + 44 + 12;

  const menuIconOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const closeIconOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuIconScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const closeIconScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const dropdownTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const dropdownScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

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

  useEffect(() => {
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
    };
  }, []);

  const startSpeedTracking = async () => {
    if (Platform.OS === 'web') {
      console.log('Speed tracking not available on web');
      return;
    }
    try {
      const status = await ensureLocationPermission();
      if (status !== PermissionStatus.GRANTED) {
        return;
      }

      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }

      locationWatchRef.current = await Location.watchPositionAsync(
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
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
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

      const status = await ensureLocationPermission();
      if (status !== PermissionStatus.GRANTED) {
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
          const locationName = address?.city || address?.region || address?.name || "Unknown Location";
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AnimatedBackground />
        <View style={styles.headerContent}>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.headerTitle, isSmallDevice && styles.headerTitleSmall]}>Trucker Companion</Text>
            <Text style={[styles.headerSubtitle, isSmallDevice && styles.headerSubtitleSmall]}>Your journey, organized</Text>
          </View>
          <TouchableOpacity
            style={[styles.menuButton, menuVisible && styles.menuButtonActive]}
            onPress={handleMenuToggle}
            accessibilityRole="button"
            accessibilityLabel={menuVisible ? "Close menu" : "Open menu"}
          >
            <View style={styles.menuButtonIconContainer} pointerEvents="none">
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

      {isMenuMounted && (
        <Animated.View
          style={[styles.menuOverlay, { opacity: menuAnimation }]}
          pointerEvents={menuVisible ? "auto" : "none"}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={handleMenuClose}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <Animated.View
            style={[
              styles.menuDropdown,
              {
                top: menuDropdownTop,
                transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuNavigate('/daily-news')}
              accessibilityRole="button"
            >
              <Newspaper color={Colors.primaryLight} size={18} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Daily News</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuNavigate('/safety-information')}
              accessibilityRole="button"
            >
              <Shield color={Colors.secondary} size={18} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Safety Information</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuNavigate('/donations')}
              accessibilityRole="button"
            >
              <HeartHandshake color={Colors.primary} size={18} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Donations</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.dateTimeSection} testID="date-time-card">
            <Text style={styles.dateTextSmall}>{formatDate(currentTime)}</Text>
            <Text style={styles.timeTextSmall}>{formatTime(currentTime)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.speedGauge}
            onPress={() => setIsSpeedKmh(!isSpeedKmh)}
          >
            <Text style={styles.speedValue}>
              {isSpeedKmh ? Math.round(speed * 3.6) : Math.round(speed * 2.23694)}
            </Text>
            <Text style={styles.speedUnit}>{isSpeedKmh ? 'km/h' : 'mph'}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.weatherContainer,
            isSmallDevice && styles.weatherContainerSmall,
            !isSmallDevice && styles.weatherContainerLarge,
          ]}
          testID="weather-widget"
        >
          <View
            style={[
              styles.weatherContent,
              isSmallDevice && styles.weatherContentSmall,
            ]}
          >
            <WeatherAnimatedBackground
              condition={weather?.condition ?? forecast[0]?.condition}
              borderRadius={isSmallDevice ? 16 : 18}
            />
            <View style={[styles.weatherHeader, isSmallDevice && styles.weatherHeaderSmall]}>
            <View style={styles.locationRow}>
              <TouchableOpacity onPress={handleLocationPress} disabled={isLoadingLocation}>
                <MapPinIcon color={Colors.primaryLight} size={20} />
              </TouchableOpacity>
              <Text style={[styles.locationText, isSmallDevice && styles.locationTextSmall]}>{location}</Text>
            </View>
            <TouchableOpacity
              style={[styles.tempUnitSwitch, isSmallDevice && styles.tempUnitSwitchSmall]}
              onPress={() => setIsCelsius(!isCelsius)}
            >
              <Text
                style={[
                  styles.tempUnitText,
                  isSmallDevice && styles.tempUnitTextSmall,
                  isCelsius ? styles.tempUnitActive : styles.tempUnitInactive,
                ]}
              >
                °C
              </Text>
              <Text style={[styles.tempUnitSeparator, isSmallDevice && styles.tempUnitTextSmall]}>|</Text>
              <Text
                style={[
                  styles.tempUnitText,
                  isSmallDevice && styles.tempUnitTextSmall,
                  !isCelsius ? styles.tempUnitActive : styles.tempUnitInactive,
                ]}
              >
                °F
              </Text>
            </TouchableOpacity>
          </View>

          {(isLoadingLocation || isWeatherLoading) && (
            <View style={styles.weatherLoadingRow}>
              <ActivityIndicator size="small" color={Colors.primaryLight} />
              <Text style={[styles.weatherLoadingText, isSmallDevice && styles.weatherLoadingTextSmall]}>Updating weather...</Text>
            </View>
          )}

          {!isLoadingLocation && !isWeatherLoading && (weather || forecast.length > 0) && (
            <View style={[styles.weatherBody, isSmallDevice && styles.weatherBodySmall]}>
              {weather && (
                <View style={[styles.currentWeather, isSmallDevice && styles.currentWeatherSmall]}>
                  <Text style={[styles.weatherIcon, isSmallDevice && styles.weatherIconSmall]}>{weather.icon}</Text>
                  <Text style={[styles.weatherTemp, isSmallDevice && styles.weatherTempSmall]}>
                    {convertTemp(weather.temp)}
                    {getTempUnit()}
                  </Text>
                  <Text style={[styles.weatherCondition, isSmallDevice && styles.weatherConditionSmall]}>{weather.condition}</Text>
                </View>
              )}

              {forecast.length > 0 && (
                <View
                  style={[
                    styles.forecastContainer,
                    !weather && styles.forecastContainerOnly,
                    isSmallDevice && styles.forecastContainerSmall,
                  ]}
                >
                  {forecast.map((day, index) => (
                    <View key={index} style={[styles.forecastDay, isSmallDevice && styles.forecastDaySmall]}>
                      <Text style={[styles.forecastDayName, isSmallDevice && styles.forecastDayNameSmall]}>{day.date}</Text>
                      <Text style={[styles.forecastIcon, isSmallDevice && styles.forecastIconSmall]}>{day.icon}</Text>
                      <View style={styles.forecastTempContainer}>
                        <Text style={[styles.forecastTempDay, isSmallDevice && styles.forecastTempDaySmall]}>
                          {convertTemp(day.tempMax)}°
                        </Text>
                        <Text style={[styles.forecastTempNight, isSmallDevice && styles.forecastTempNightSmall]}>
                          {convertTemp(day.tempMin)}°
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Truck color={Colors.primaryLight} size={24} />}
            title="My Truck"
            value={truckProfile.truckNumber ? `Truck #${truckProfile.truckNumber}` : "Not set"}
            subtitle={truckProfile.driverId ? `Driver ID: ${truckProfile.driverId}` : undefined}
            color={Colors.primaryLight}
            onPress={() => router.push("/(tabs)/truck")}
            showPlusIcon
            onPlusPress={() => {
              setTruckNumberInput(truckProfile.truckNumber || "");
              setIsTruckModalVisible(true);
            }}
            isCompact={isSmallDevice}
          />
          <StatCard
            icon={<Container color={Colors.secondary} size={24} />}
            title="Trailer"
            value={truckProfile.trailerNumber ? `#${truckProfile.trailerNumber}` : "Not set"}
            subtitle={truckProfile.trailerNumber ? truckProfile.trailerType : "Add trailer info"}
            color={Colors.secondary}
            onPress={() => router.push("/(tabs)/truck")}
            showPlusIcon
            onPlusPress={() => {
              setTrailerNumberInput(truckProfile.trailerNumber || "");
              setIsTrailerModalVisible(true);
            }}
            isCompact={isSmallDevice}
          />
        </View>

        <View style={styles.emergencySection}>
          <View style={styles.emergencySectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push("/emergency-contacts-list")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emergencyContactsContainer}>
            {contacts.slice(0, 5).map((contact) => (
              <TouchableOpacity
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
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addContactCircle}
              onPress={() => router.push("/emergency-contact-detail")}
            >
              <Plus color={Colors.primaryLight} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.healthInsuranceSection}
          onPress={() => router.push("/health-insurance")}
        >
          <View style={styles.healthInsuranceHeader}>
            <View style={styles.healthInsuranceIconContainer}>
              <ShieldPlus color={Colors.white} size={26} />
            </View>
            <View style={styles.healthInsuranceContent}>
              <Text style={styles.healthInsuranceTitle}>Health Insurance</Text>
              <Text style={styles.healthInsuranceSubtitle}>
                {insurance ? insurance.providerName : "Add insurance info"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.driverIDSection}
          onPress={() => router.push("/driver-id")}
        >
          <View style={styles.driverIDHeader}>
            <View style={styles.driverIDIconContainer}>
              <CreditCard color={Colors.white} size={26} />
            </View>
            <View style={styles.driverIDContent}>
              <Text style={styles.driverIDTitle}>Driver ID</Text>
              <Text style={styles.driverIDSubtitle}>
                {driverID ? `${driverID.name} - ${driverID.state}` : "Add driver ID info"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.trailerModalCancelButton}
                onPress={() => setIsTrailerModalVisible(false)}
              >
                <Text style={styles.trailerModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.trailerModalConfirmButton}
                onPress={async () => {
                  await updateTruckProfile({ trailerNumber: trailerNumberInput });
                  setIsTrailerModalVisible(false);
                }}
              >
                <Text style={styles.trailerModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.trailerModalCancelButton}
                onPress={() => setIsTruckModalVisible(false)}
              >
                <Text style={styles.trailerModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.trailerModalConfirmButton}
                onPress={async () => {
                  await updateTruckProfile({
                    truckNumber: truckNumberInput
                  });
                  setIsTruckModalVisible(false);
                }}
              >
                <Text style={styles.trailerModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
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
  showPlusIcon?: boolean;
  onPlusPress?: () => void;
  isCompact?: boolean;
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  thirdLine,
  color,
  onPress,
  showPlusIcon,
  onPlusPress,
  isCompact,
}: StatCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const shouldShowShadow = title !== "Places";

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
    <TouchableOpacity
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
          shouldShowShadow && isCompact && styles.statCardShadowCompact,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        {showPlusIcon && onPlusPress && (
          <TouchableOpacity
            style={styles.statCardPlusIcon}
            onPress={(e) => {
              e.stopPropagation();
              onPlusPress();
            }}
          >
            <Plus color={Colors.secondary} size={28} />
          </TouchableOpacity>
        )}
        <Text style={[styles.statTitle, isCompact && styles.statTitleSmall]}>{title}</Text>
        <Text style={[styles.statValue, isCompact && styles.statValueSmall]}>{value}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, isCompact && styles.statSubtitleSmall]}>{subtitle}</Text>
        )}
        {thirdLine && (
          <Text style={[styles.statThirdLine, isCompact && styles.statSubtitleSmall]}>{thirdLine}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
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
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <View style={styles.quickActionGlass}>
        <View style={styles.quickActionIcon}>{icon}</View>
        <Text style={styles.quickActionText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    position: "relative" as const,
    zIndex: 2,
  },
  headerContent: {
    position: "relative" as const,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 2,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: "System",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#000000",
    opacity: 0.75,
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: "System",
  },
  headerTitleSmall: {
    fontSize: 18,
    letterSpacing: 0.2,
  },
  headerSubtitleSmall: {
    fontSize: 11,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  menuButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  menuButtonIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuDropdown: {
    position: "absolute" as const,
    right: 20,
    width: 220,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 51,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    height: "100%",
  },
  statCardGlass: {
    backgroundColor: Colors.white,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 16,
    height: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  statCardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
      },
    }),
  },
  statCardShadowCompact: {
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.16)",
      },
    }),
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
  statTitleSmall: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 3,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexWrap: "wrap",
    lineHeight: 28,
  },
  statValueSmall: {
    fontSize: 16,
    lineHeight: 24,
  },
  statSubtitle: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700" as const,
  },
  statSubtitleSmall: {
    fontSize: 12,
  },
  statThirdLine: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700" as const,
    marginTop: 2,
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
    shadowOpacity: 0.15,
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
    padding: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    ...Platform.select({ web: { boxShadow: "0 4px 8px rgba(0,0,0,0.15)" } }),
  },
  dateTextSmall: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "700" as const,
  },
  timeTextSmall: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#000000",
  },
  speedGauge: {
    width: 100,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding:  12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { boxShadow: "0 4px 8px rgba(0,0,0,0.15)" } }),
  },
  speedValue: {
    fontSize: 36,
    fontWeight: "bold" as const,
    color: Colors.primaryLight,
    lineHeight: 40,
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
    opacity: 0.6,
    marginTop: 2,
  },
  dateTimeContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
  },
  dateText: {
    fontSize: 20,
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
    borderRadius: 18,
    marginBottom: 18,
    ...Platform.select({
      web: { boxShadow: "0 6px 16px -12px rgba(15,23,42,0.25)" },
    }),
  },
  weatherContainerLarge: {
    shadowColor: "rgba(15, 23, 42, 0.45)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.56,
    shadowRadius: 20,
    elevation: 14,
    ...Platform.select({
      web: { boxShadow: "0 18px 40px -10px rgba(15,23,42,0.35)" },
    }),
  },
  weatherContainerSmall: {
    borderRadius: 16,
    shadowColor: "rgba(15, 23, 42, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.56,
    shadowRadius: 18,
    elevation: 10,
    ...Platform.select({
      web: { boxShadow: "0 14px 36px -12px rgba(15,23,42,0.3)" },
    }),
  },
  weatherContent: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  weatherContentSmall: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
  },
  weatherHeaderSmall: {
    paddingBottom: 4,
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
  tempUnitSwitchSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  tempUnitText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#000000",
  },
  tempUnitActive: {
    fontWeight: "700" as const,
    textDecorationLine: "underline" as const,
  },
  tempUnitInactive: {
    fontWeight: "500" as const,
  },
  tempUnitSeparator: {
    fontSize: 14,
    color: "#000000",
  },
  tempUnitTextSmall: {
    fontSize: 13,
  },
  weatherBody: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  weatherBodySmall: {
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  locationTextSmall: {
    fontSize: 12,
  },
  currentWeather: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
    minWidth: 120,
  },
  currentWeatherSmall: {
    gap: 4,
    minWidth: 80,
  },
  weatherIcon: {
    fontSize: 30,
  },
  weatherIconSmall: {
    fontSize: 26,
  },
  weatherTemp: {
    fontSize: 22,
    fontWeight: "bold" as const,
    color: "#000000",
    textAlign: "center",
  },
  weatherTempSmall: {
    fontSize: 16,
  },
  weatherCondition: {
    fontSize: 13,
    color: "#000000",
    textAlign: "center",
  },
  weatherConditionSmall: {
    fontSize: 12,
  },
  weatherLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#000000',
  },
  weatherLoadingTextSmall: {
    fontSize: 12,
  },
  forecastContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
    gap: 14,
    flexWrap: "wrap",
    alignItems: "center",
    flexShrink: 1,
  },
  forecastContainerSmall: {
    gap: 12,
  },
  forecastContainerOnly: {
    justifyContent: "flex-start",
  },
  forecastDay: {
    alignItems: "center",
    gap: 2,
  },
  forecastDaySmall: {
    gap: 1,
  },
  forecastDayName: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "600" as const,
  },
  forecastDayNameSmall: {
    fontSize: 9,
  },
  forecastIcon: {
    fontSize: 18,
  },
  forecastIconSmall: {
    fontSize: 16,
  },
  forecastTempContainer: {
    alignItems: "center",
    gap: 1,
  },
  forecastTempDay: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#000000",
  },
  forecastTempDaySmall: {
    fontSize: 11,
  },
  forecastTempNight: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: "#000000",
  },
  forecastTempNightSmall: {
    fontSize: 9,
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
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
    fontSize: 20,
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
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
  healthInsuranceSubtitle: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.6,
  },
  driverIDSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
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
  driverIDSubtitle: {
    fontSize: 14,
    color: "#000000",
    opacity: 0.6,
  },
});
