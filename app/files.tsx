import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Grid3x3,
  Plus,
  Search,
  List,
  FileText,
  Calendar,
  Trash2,
  X,
  LayoutGrid,
  Menu,
  Home as HomeIcon,
  Truck,
  MapPin,
  Newspaper,
  Shield,
  Settings as SettingsIcon,
  HeartHandshake,
} from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Clickable } from "@/components/Clickable";
import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import { useFiles } from "@/contexts/FilesContext";
import { FileDocument } from "@/types";

type SortOption = "all" | "day" | "month" | "year";
type DisplayMode = "grid" | "list" | "icon";

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { files, deleteFile } = useFiles();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("all");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [showDisplayModal, setShowDisplayModal] = useState<boolean>(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const headerAnimation = useRef(new Animated.Value(0)).current;

  const isSmallScreen = width < 360;
  const isMediumScreen = width >= 360 && width < 768;

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((file) => {
        const fileName = file.fileName?.toLowerCase() || "";
        const tripNumber = file.tripNumber?.toLowerCase() || "";
        const date = new Date(file.createdAt);
        const dateStr = date.toLocaleDateString().toLowerCase();
        return fileName.includes(query) || tripNumber.includes(query) || dateStr.includes(query);
      });
    }

    if (selectedDate) {
      result = result.filter((file) => {
        const fileDate = new Date(file.createdAt);
        const fileDateDay = new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate());
        const selectedDateDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return fileDateDay.getTime() === selectedDateDay.getTime();
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [files, searchQuery, selectedDate]);

  const todayFiles = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return filteredAndSortedFiles.filter((file) => {
      const fileDate = new Date(file.createdAt);
      const fileDateDay = new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate());
      return fileDateDay.getTime() === today.getTime();
    });
  }, [filteredAndSortedFiles]);

  const monthFiles = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return filteredAndSortedFiles.filter((file) => {
      const fileDate = new Date(file.createdAt);
      return fileDate >= thisMonth;
    });
  }, [filteredAndSortedFiles]);

  const yearFiles = useMemo(() => {
    const now = new Date();
    const thisYear = new Date(now.getFullYear(), 0, 1);
    return filteredAndSortedFiles.filter((file) => {
      const fileDate = new Date(file.createdAt);
      return fileDate >= thisYear;
    });
  }, [filteredAndSortedFiles]);

  const handleDeleteFile = (id: string, fileName?: string) => {
    Alert.alert("Delete File", `Are you sure you want to delete ${fileName ? `"${fileName}"` : 'this file'}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFile(id);
        },
      },
    ]);
  };

  const handleBulkDelete = (period: 'day' | 'month' | 'year') => {
    let filesToDelete: FileDocument[] = [];
    let periodText = '';

    switch (period) {
      case 'day':
        filesToDelete = todayFiles;
        periodText = 'today';
        break;
      case 'month':
        filesToDelete = monthFiles;
        periodText = 'this month';
        break;
      case 'year':
        filesToDelete = yearFiles;
        periodText = 'this year';
        break;
    }

    if (filesToDelete.length === 0) {
      Alert.alert('No Files', `There are no files from ${periodText} to delete.`);
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${filesToDelete.length} file(s) from ${periodText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setShowDeleteModal(false);
            for (const file of filesToDelete) {
              await deleteFile(file.id);
            }
            Alert.alert('Success', `${filesToDelete.length} file(s) deleted successfully.`);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  function getDisplayFiles() {
    if (selectedDate || searchQuery) {
      return filteredAndSortedFiles;
    }

    switch (sortBy) {
      case 'all':
        return filteredAndSortedFiles;
      case 'day':
        return todayFiles;
      case 'month':
        return monthFiles;
      case 'year':
        return yearFiles;
      default:
        return filteredAndSortedFiles;
    }
  }

  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  const menuIconOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    [menuAnimation]
  );

  const closeIconOpacity = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    [menuAnimation]
  );

  const menuIconScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
      }),
    [menuAnimation]
  );

  const closeIconScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1],
      }),
    [menuAnimation]
  );

  const dropdownTranslateY = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-8, 0],
      }),
    [menuAnimation]
  );

  const dropdownScale = useMemo(
    () =>
      menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1],
      }),
    [menuAnimation]
  );

  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const openMenu = () => {
    if (isMenuVisible) {
      return;
    }
    setIsMenuMounted(true);
    setIsMenuVisible(true);
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (afterClose?: () => void) => {
    if (!isMenuMounted && !isMenuVisible) {
      afterClose?.();
      return;
    }
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIsMenuVisible(false);
      setIsMenuMounted(false);
      afterClose?.();
    });
  };

  const handleNavigate = (path: string) => {
    closeMenu(() => {
      router.push(path);
    });
  };

  const MENU_ITEMS = [
    { label: "Home", path: "/(tabs)/home", icon: HomeIcon },
    { label: "My Truck", path: "/(tabs)/truck", icon: Truck },
    { label: "Places", path: "/(tabs)/places", icon: MapPin },
    { label: "Files", path: "/files", icon: FileText },
    { label: "News", path: "/daily-news", icon: Newspaper },
    { label: "Safety Information", path: "/safety-information", icon: Shield },
    { label: "Settings", path: "/(tabs)/settings", icon: SettingsIcon },
    { label: "Donations", path: "/donations", icon: HeartHandshake },
  ] as const;

  return (
    <View style={styles.container}>
      {isSmallScreen ? (
        <Animated.View 
          style={[
            styles.compactHeader,
            { 
              paddingTop: insets.top + 16,
              opacity: headerAnimation,
              transform: [{
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            }
          ]}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <AnimatedBackground />
          <View style={styles.compactHeaderLine1}>
            {/* Empty line */}
          </View>
          <View style={styles.compactHeaderLine2}>
            <Text style={styles.compactTitle}>Files</Text>
            <View style={styles.compactHeaderLine2Icons}>
              <Clickable
                style={styles.compactIconButton}
                onPress={() => setShowDateFilterModal(true)}
              >
                <Calendar color={Colors.primaryLight} size={18} />
              </Clickable>
              <Clickable
                style={styles.compactIconButton}
                onPress={() => setShowDeleteModal(true)}
              >
                <Trash2 color={Colors.error} size={18} />
              </Clickable>
              <Clickable
                style={styles.compactIconButton}
                onPress={() => setShowDisplayModal(true)}
              >
                <LayoutGrid color={Colors.primaryLight} size={18} />
              </Clickable>
              <Clickable
                style={[styles.compactIconButton, styles.compactPlusButton]}
                onPress={() => router.push("/scan-document")}
              >
                <Plus color={Colors.white} size={18} />
              </Clickable>
              <Clickable
                style={[styles.compactIconButton, styles.mainMenuButton, isMenuVisible && styles.mainMenuButtonActive]}
                onPress={() => {
                  if (isMenuVisible) {
                    closeMenu();
                  } else {
                    openMenu();
                  }
                }}
              >
                <View style={styles.menuIconContainer} pointerEvents="none">
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
                    <Menu color={Colors.primaryLight} size={18} />
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
                    <X color={Colors.white} size={18} />
                  </Animated.View>
                </View>
              </Clickable>
            </View>
          </View>
        </Animated.View>
      ) : (
        <PageHeader
          title="Files"
          subtitle="Manage your scanned documents"
          topInset={insets.top + 16}
          rightAccessory={
            <View style={styles.headerActions}>
              <Clickable
                style={styles.headerIconButton}
                onPress={() => setShowDateFilterModal(true)}
              >
                <Calendar color={Colors.primaryLight} size={20} />
              </Clickable>
              <Clickable
                style={styles.headerIconButton}
                onPress={() => setShowDeleteModal(true)}
              >
                <Trash2 color={Colors.error} size={20} />
              </Clickable>
              <Clickable
                style={styles.headerIconButton}
                onPress={() => setShowDisplayModal(true)}
              >
                <LayoutGrid color={Colors.primaryLight} size={20} />
              </Clickable>
              <Clickable
                style={[styles.headerIconButton, styles.plusButton]}
                onPress={() => router.push("/scan-document")}
              >
                <Plus color={Colors.white} size={20} />
              </Clickable>
            </View>
          }
        />
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={Colors.textLight} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, trip number, or date..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Clickable onPress={() => setSearchQuery("")}>
              <X color={Colors.textLight} size={18} />
            </Clickable>
          )}
        </View>
      </View>

      {!selectedDate && !searchQuery && (
        <View style={styles.tabsContainer}>
          <Clickable
            style={[
              styles.sectionTab,
              sortBy === 'all' && styles.sectionTabActive,
            ]}
            onPress={() => setSortBy('all')}
          >
            <Text
              style={[
                styles.sectionTabText,
                sortBy === 'all' && styles.sectionTabTextActive,
              ]}
            >
              All ({filteredAndSortedFiles.length})
            </Text>
          </Clickable>
          <Clickable
            style={[
              styles.sectionTab,
              sortBy === 'day' && styles.sectionTabActive,
            ]}
            onPress={() => setSortBy('day')}
          >
            <Text
              style={[
                styles.sectionTabText,
                sortBy === 'day' && styles.sectionTabTextActive,
              ]}
            >
              Today ({todayFiles.length})
            </Text>
          </Clickable>
          <Clickable
            style={[
              styles.sectionTab,
              sortBy === 'month' && styles.sectionTabActive,
            ]}
            onPress={() => setSortBy('month')}
          >
            <Text
              style={[
                styles.sectionTabText,
                sortBy === 'month' && styles.sectionTabTextActive,
              ]}
            >
              Month ({monthFiles.length})
            </Text>
          </Clickable>
          <Clickable
            style={[
              styles.sectionTab,
              sortBy === 'year' && styles.sectionTabActive,
            ]}
            onPress={() => setSortBy('year')}
          >
            <Text
              style={[
                styles.sectionTabText,
                sortBy === 'year' && styles.sectionTabTextActive,
              ]}
            >
              Year ({yearFiles.length})
            </Text>
          </Clickable>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
        showsVerticalScrollIndicator={true}
      >

        {selectedDate && (
          <View style={styles.selectedDateBar}>
            <Text style={styles.selectedDateText}>
              Files from: {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Clickable onPress={() => setSelectedDate(null)}>
              <X color={Colors.error} size={20} />
            </Clickable>
          </View>
        )}

        {getDisplayFiles().length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color={Colors.textLight} size={64} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || selectedDate ? "No files found" : "No files yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedDate
                ? "Try a different search or date"
                : "Tap + to scan your first document"}
            </Text>
          </View>
        ) : displayMode === "icon" ? (
          <View style={styles.iconContainer}>
            {getDisplayFiles().map((file) => {
              const displayText = file.displayField === 'tripNumber' && file.tripNumber 
                ? file.tripNumber 
                : file.displayField === 'fileName' && file.fileName
                ? file.fileName
                : '';
              return (
                <View key={file.id} style={styles.iconItemWrapper}>
                  <Clickable
                    style={styles.iconItem}
                    onPress={() => router.push(`/file-detail?id=${file.id}`)}
                  >
                    {file.scanImages.length > 0 && file.scanImages[0] && file.scanImages[0].trim() !== "" ? (
                      <Image
                        source={{ uri: file.scanImages[0] }}
                        style={styles.iconThumbnail}
                      />
                    ) : (
                      <View style={styles.iconPlaceholder}>
                        <FileText color={Colors.primaryLight} size={28} />
                      </View>
                    )}
                  </Clickable>
                  {displayText ? (
                    <Text style={styles.iconText} numberOfLines={2}>
                      {displayText}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : displayMode === "grid" ? (
          <View style={styles.gridContainer}>
            {getDisplayFiles().map((file) => (
              <Clickable
                key={file.id}
                style={[
                  styles.gridItem,
                  isSmallScreen && styles.gridItemSmall,
                  isMediumScreen && styles.gridItemMedium,
                ]}
                onPress={() => router.push(`/file-detail?id=${file.id}`)}
              >
                {file.scanImages.length > 0 && file.scanImages[0] && file.scanImages[0].trim() !== "" ? (
                  <Image
                    source={{ uri: file.scanImages[0] }}
                    style={styles.gridThumbnail}
                  />
                ) : (
                  <View style={styles.gridIconContainer}>
                    <FileText color={Colors.primaryLight} size={32} />
                  </View>
                )}
                {(file.displayField === 'fileName' && file.fileName) || (file.displayField === 'tripNumber' && file.tripNumber) ? (
                  <Text style={styles.gridFileName} numberOfLines={2}>
                    {file.displayField === 'tripNumber' && file.tripNumber ? file.tripNumber : file.fileName}
                  </Text>
                ) : null}
                <Text style={styles.gridFileDate}>{formatDate(file.createdAt)}</Text>
                <Clickable
                  style={styles.gridDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id, file.fileName || file.tripNumber);
                  }}
                >
                  <Trash2 color={Colors.error} size={16} />
                </Clickable>
              </Clickable>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {getDisplayFiles().map((file) => (
              <Clickable
                key={file.id}
                style={styles.listItem}
                onPress={() => router.push(`/file-detail?id=${file.id}`)}
              >
                {file.scanImages.length > 0 && file.scanImages[0] && file.scanImages[0].trim() !== "" ? (
                  <Image
                    source={{ uri: file.scanImages[0] }}
                    style={styles.listThumbnail}
                  />
                ) : (
                  <View style={styles.listIconContainer}>
                    <FileText color={Colors.primaryLight} size={24} />
                  </View>
                )}
                <View style={styles.listContent}>
                  {(file.displayField === 'fileName' && file.fileName) || (file.displayField === 'tripNumber' && file.tripNumber) ? (
                    <Text style={styles.listFileName}>
                      {file.displayField === 'tripNumber' && file.tripNumber ? file.tripNumber : file.fileName}
                    </Text>
                  ) : null}
                  <View style={styles.listMeta}>
                    <Calendar color={Colors.textLight} size={14} />
                    <Text style={styles.listFileDate}>{formatDate(file.createdAt)}</Text>
                    <Text style={styles.listFilePages}>
                      {file.scanImages.length} page{file.scanImages.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <Clickable
                  style={styles.listDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id, file.fileName || file.tripNumber);
                  }}
                >
                  <Trash2 color={Colors.error} size={20} />
                </Clickable>
              </Clickable>
            ))}
          </View>
        )}
      </ScrollView>

      <DisplayModal
        visible={showDisplayModal}
        currentMode={displayMode}
        onClose={() => setShowDisplayModal(false)}
        onSelect={(mode) => {
          setDisplayMode(mode);
          setShowDisplayModal(false);
        }}
      />

      <DateFilterModal
        visible={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setShowDateFilterModal(false);
        }}
      />

      <DeleteModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={(period) => handleBulkDelete(period)}
      />

      {isMenuMounted && isSmallScreen ? (
        <View
          pointerEvents={isMenuVisible ? "box-none" : "none"}
          style={styles.menuLayer}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.menuDimmer,
              { opacity: menuAnimation, top: headerHeight },
            ]}
          />
          <Clickable
            style={[styles.menuBackdrop, { top: headerHeight }]}
            onPress={() => closeMenu()}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.menuDropdown,
              {
                top: headerHeight + 8,
                opacity: menuAnimation,
                transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              },
            ]}
          >
            {MENU_ITEMS.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = router.canGoBack() ? false : item.path === "/files";

              return (
                <React.Fragment key={item.path}>
                  <Clickable
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => handleNavigate(item.path)}
                    accessibilityRole="button"
                  >
                    <IconComponent
                      color={isActive ? Colors.white : Colors.primaryLight}
                      size={18}
                      style={styles.menuItemIcon}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        isActive && styles.menuItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Clickable>
                  {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
                </React.Fragment>
              );
            })}
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

interface DisplayModalProps {
  visible: boolean;
  currentMode: DisplayMode;
  onClose: () => void;
  onSelect: (mode: DisplayMode) => void;
}

function DisplayModal({ visible, currentMode, onClose, onSelect }: DisplayModalProps) {
  const displayOptions: { label: string; value: DisplayMode; icon: React.ReactNode }[] = [
    { label: "List View", value: "list", icon: <List color={Colors.primaryLight} size={20} /> },
    { label: "Grid View", value: "grid", icon: <Grid3x3 color={Colors.primaryLight} size={20} /> },
    { label: "Icon View", value: "icon", icon: <FileText color={Colors.primaryLight} size={20} /> },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Display Mode</Text>
          {displayOptions.map((option) => (
            <Clickable
              key={option.value}
              style={[
                styles.modalOption,
                currentMode === option.value && styles.modalOptionActive,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <View style={styles.modalOptionIcon}>{option.icon}</View>
              <Text
                style={[
                  styles.modalOptionText,
                  currentMode === option.value && styles.modalOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Clickable>
          ))}
          <Clickable style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Clickable>
        </View>
      </View>
    </Modal>
  );
}

interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

function DateFilterModal({ visible, onClose, onSelectDate }: DateFilterModalProps) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<'menu' | 'day' | 'month' | 'year'>('menu');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [tempDate, setTempDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      const current = new Date();
      setSelectedMonth(current.getMonth());
      setSelectedYear(current.getFullYear());
      setTempDate(null);
      setViewMode('menu');
    }
  }, [visible]);

  const handleDaySelect = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    setTempDate(date);
  };

  const handleMonthSelect = () => {
    const date = new Date(selectedYear, selectedMonth, 1);
    onSelectDate(date);
  };

  const handleYearSelect = () => {
    const date = new Date(selectedYear, 0, 1);
    onSelectDate(date);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayButton}>
          <Text style={[styles.dayText, styles.dayTextDisabled]}></Text>
        </View>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = tempDate?.getDate() === day && 
                         tempDate?.getMonth() === selectedMonth &&
                         tempDate?.getFullYear() === selectedYear;
      days.push(
        <Clickable
          key={day}
          style={[styles.dayButton, isSelected && styles.dayButtonActive]}
          onPress={() => handleDaySelect(day)}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
            {day}
          </Text>
        </Clickable>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.dateFilterModalContent}>
          <Text style={styles.dateFilterTitle}>
            {viewMode === 'menu' ? 'Find Files By Date' : 
             viewMode === 'day' ? 'Select Day' :
             viewMode === 'month' ? 'Select Month' : 'Select Year'}
          </Text>

          {viewMode === 'menu' && (
            <>
              <Clickable 
                style={styles.dateFilterOption} 
                onPress={() => setViewMode('day')}
              >
                <Text style={styles.dateFilterOptionText}>Specific Day</Text>
              </Clickable>
              <Clickable 
                style={styles.dateFilterOption} 
                onPress={() => setViewMode('month')}
              >
                <Text style={styles.dateFilterOptionText}>Specific Month</Text>
              </Clickable>
              <Clickable 
                style={styles.dateFilterOption} 
                onPress={() => setViewMode('year')}
              >
                <Text style={styles.dateFilterOptionText}>Specific Year</Text>
              </Clickable>
              <Clickable style={styles.modalCancelButton} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Clickable>
            </>
          )}

          {viewMode === 'day' && (
            <View style={styles.calendarContainer}>
              <View style={styles.monthYearSelector}>
                <Clickable 
                  style={styles.navButton}
                  onPress={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                >
                  <Text style={styles.monthYearText}>‹</Text>
                </Clickable>
                <Text style={styles.monthYearText}>
                  {monthNames[selectedMonth]} {selectedYear}
                </Text>
                <Clickable 
                  style={styles.navButton}
                  onPress={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                >
                  <Text style={styles.monthYearText}>›</Text>
                </Clickable>
              </View>
              <View style={styles.daysGrid}>
                {renderCalendar()}
              </View>
              <Clickable 
                style={[styles.modalCancelButton, { marginTop: 16 }]} 
                onPress={() => {
                  if (tempDate) {
                    onSelectDate(tempDate);
                  }
                }}
                disabled={!tempDate}
              >
                <Text style={styles.modalCancelText}>Select Date</Text>
              </Clickable>
              <Clickable 
                style={styles.modalCancelButton} 
                onPress={() => setViewMode('menu')}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </Clickable>
            </View>
          )}

          {viewMode === 'month' && (
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.monthYearSelector}>
                <Clickable 
                  style={styles.navButton}
                  onPress={() => setSelectedYear(selectedYear - 1)}
                >
                  <Text style={styles.monthYearText}>‹</Text>
                </Clickable>
                <Text style={styles.monthYearText}>{selectedYear}</Text>
                <Clickable 
                  style={styles.navButton}
                  onPress={() => setSelectedYear(selectedYear + 1)}
                >
                  <Text style={styles.monthYearText}>›</Text>
                </Clickable>
              </View>
              {monthNames.map((month, index) => (
                <Clickable
                  key={index}
                  style={styles.dateFilterOption}
                  onPress={() => {
                    setSelectedMonth(index);
                    handleMonthSelect();
                  }}
                >
                  <Text style={styles.dateFilterOptionText}>{month} {selectedYear}</Text>
                </Clickable>
              ))}
              <Clickable 
                style={styles.modalCancelButton} 
                onPress={() => setViewMode('menu')}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </Clickable>
            </ScrollView>
          )}

          {viewMode === 'year' && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.yearScrollContent}
                style={styles.yearScroll}
              >
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 15 + i).map((year) => (
                  <Clickable
                    key={year}
                    style={[
                      styles.yearOption,
                      selectedYear === year && styles.yearOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      handleYearSelect();
                    }}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        selectedYear === year && styles.yearOptionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </Clickable>
                ))}
              </ScrollView>
              <Clickable 
                style={[styles.modalCancelButton, { marginTop: 16 }]} 
                onPress={() => setViewMode('menu')}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </Clickable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: (period: 'day' | 'month' | 'year') => void;
}

function DeleteModal({ visible, onClose, onDelete }: DeleteModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalTitle}>Delete Files</Text>
          <Text style={styles.deleteModalSubtitle}>
            Select the time period for files to delete
          </Text>
          <Clickable
            style={styles.deleteOption}
            onPress={() => onDelete('day')}
          >
            <Text style={styles.deleteOptionText}>Delete files from today</Text>
          </Clickable>
          <Clickable
            style={styles.deleteOption}
            onPress={() => onDelete('month')}
          >
            <Text style={styles.deleteOptionText}>Delete files from this month</Text>
          </Clickable>
          <Clickable
            style={styles.deleteOption}
            onPress={() => onDelete('year')}
          >
            <Text style={styles.deleteOptionText}>Delete files from this year</Text>
          </Clickable>
          <Clickable style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Clickable>
        </View>
      </View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    ...standardShadow,
  },
  plusButton: {
    backgroundColor: Colors.primaryLight,
  },
  compactHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: "relative" as const,
    overflow: "hidden" as const,
    zIndex: 30,
    elevation: 6,
    ...standardShadow,
  },
  compactHeaderLine1: {
    height: 24,
    marginBottom: 4,
  },
  compactHeaderLine2: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  compactHeaderLine2Icons: {
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  compactTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  compactSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  compactIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.white,
    ...standardShadow,
  },
  compactPlusButton: {
    backgroundColor: Colors.primaryLight,
  },
  mainMenuButton: {
    backgroundColor: Colors.white,
  },
  mainMenuButtonActive: {
    backgroundColor: Colors.primary,
  },
  menuIconContainer: {
    width: 18,
    height: 18,
  },
  menuIconWrapper: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  menuLayer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  menuDimmer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
  },
  menuBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuDropdown: {
    position: "absolute" as const,
    right: 20,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 15,
    elevation: 8,
    width: 220,
    zIndex: 2,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  menuItemActive: {
    backgroundColor: Colors.primary,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  menuItemTextActive: {
    color: Colors.white,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    marginHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
    position: "relative",
  },
  gridItemSmall: {
    width: "100%",
  },
  gridItemMedium: {
    width: "47%",
  },
  gridIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gridThumbnail: {
    width: "100%",
    aspectRatio: 0.707,
    borderRadius: 8,
    marginBottom: 12,
  },
  gridFileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  gridFileDate: {
    fontSize: 14,
    color: Colors.text,
  },
  gridDeleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...standardShadow,
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listThumbnail: {
    width: 60,
    height: 85,
    borderRadius: 8,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listFileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listFileDate: {
    fontSize: 14,
    color: Colors.text,
  },
  listFilePages: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  listDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.error}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "flex-start",
  },
  iconItemWrapper: {
    width: 80,
    alignItems: "center",
  },
  iconItem: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    ...standardShadow,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  iconThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  iconPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: `${Colors.primaryLight}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...standardShadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  modalOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  modalOptionTextActive: {
    color: Colors.white,
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: "row" as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: "center" as const,
    ...standardShadow,
  },
  sectionTabActive: {
    backgroundColor: Colors.primaryLight,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  sectionTabTextActive: {
    color: Colors.white,
  },
  selectedDateBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...standardShadow,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  dateFilterModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "90%" as const,
    maxWidth: 400,
    maxHeight: "80%" as const,
  },
  dateFilterTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center" as const,
  },
  dateFilterOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  dateFilterOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  calendarContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  monthYearSelector: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  navButton: {
    padding: 8,
  },
  daysGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
  },
  dayButton: {
    width: "13%" as const,
    aspectRatio: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderRadius: 8,
  },
  dayButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  dayText: {
    fontSize: 14,
    color: Colors.text,
  },
  dayTextActive: {
    color: Colors.white,
    fontWeight: "600" as const,
  },
  dayTextDisabled: {
    color: Colors.textLight,
    opacity: 0.4,
  },
  yearScroll: {
    maxHeight: 400,
  },
  yearScrollContent: {
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center" as const,
  },
  yearOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  yearOptionTextActive: {
    color: Colors.white,
  },
  deleteModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%" as const,
    maxWidth: 400,
    ...standardShadow,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    textAlign: "center" as const,
  },
  deleteOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  deleteOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },

});
