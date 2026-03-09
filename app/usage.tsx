import api from "@/lib/api";
import {
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Menu02Icon,
  PieChart01Icon,
  Search01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import moment from "moment";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Modal from "react-native-modal";
import GlobalAvatar from "../components/GlobalAvatar";
import { useAuth } from "../context/AuthContext";

const TABS = ["Today", "Week", "Month", "Custom"];

const UsageSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="bg-[#F0F3F7] dark:bg-[#1A1A1A] mx-4 mb-4 rounded-[16px]"
    style={{ opacity: 0.6 }}
  >
    <View className="flex-row justify-between px-4 items-center py-2">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={60}
        height={14}
        radius={4}
      />
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={100}
        height={12}
        radius={4}
      />
    </View>

    <View className="bg-[#F6F8FA] dark:bg-[#0D0D0D] p-5 rounded-[16px]">
      <View className="flex-row items-center mb-5">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={44}
          height={44}
          radius={8}
        />
        <View className="ml-3 flex-1">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width="60%"
            height={20}
            radius={4}
          />
          <View className="mt-1">
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width="40%"
              height={14}
              radius={4}
            />
          </View>
        </View>
        <View className="items-end">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width={40}
            height={24}
            radius={4}
          />
          <View className="mt-1">
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width={50}
              height={12}
              radius={4}
            />
          </View>
        </View>
      </View>

      <View className="gap-2">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center">
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width={18}
              height={18}
              radius={4}
            />
            <View className="ml-2">
              <Skeleton
                colorMode={isDarkMode ? "dark" : "light"}
                width={120}
                height={14}
                radius={4}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  </View>
);

export default function UsageScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { token, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Today");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Date Filter Modal State
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [modalView, setModalView] = useState<"MENU" | "CALENDAR">("MENU");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<"single" | "range">(
    "range",
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [userLeaderboard, setUserLeaderboard] = useState<any[]>([]);

  // Enable LayoutAnimation for Android (suppress warning in New Architecture)
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental &&
      !(global as any).nativeFabricUIManager
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isSearching) {
      setSearchQuery("");
    }
    setIsSearching(!isSearching);
  };

  // -------------------------------
  // 🔥 Fetch leaderboard data
  // -------------------------------
  const fetchLeaderboard = async () => {
    try {
      if (!refreshing) setLoading(true);

      const typeMap: any = {
        Today: "day",
        Week: "week",
        Month: "month",
        Custom: "custom",
      };

      const params: any = { type: typeMap[selectedTab] };
      if (selectedTab === "Custom" && startDate && endDate) {
        params.startDate = moment(startDate).startOf("day").toISOString();
        params.endDate = moment(endDate).endOf("day").toISOString();
      }

      const res = await api.get("/usage/users/leaderboard", {
        params,
        headers: { Authorization: "Bearer " + token },
      });

      // console.log(JSON.stringify(res.data, null, 2));

      const data = res.data;
      if (Array.isArray(data)) {
        setUserLeaderboard(data);
        console.log("✅ Leaderboard data:", JSON.stringify(data, null, 2));
      } else {
        console.warn("⚠️ Unexpected leaderboard data format", data);
        setUserLeaderboard([]);
      }
    } catch (err) {
      console.log("❌ Leaderboard fetch error:", err);
      setUserLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -------------------------------------
  // 📅 Date Filter Logic
  // -------------------------------------
  const onDayPress = (day: any) => {
    const dateString = day.dateString;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateString);
      setTempEndDate(null);
    } else {
      if (dateString < tempStartDate) {
        setTempStartDate(dateString);
        setTempEndDate(null);
      } else {
        setTempEndDate(dateString);
      }
    }
  };

  const applyDateFilter = () => {
    setStartDate(tempStartDate ? new Date(tempStartDate) : null);
    setEndDate(tempEndDate ? new Date(tempEndDate) : null);
    setDateFilterVisible(false);
  };

  const openDateFilterModal = () => {
    setTempStartDate(startDate ? startDate.toISOString().split("T")[0] : null);
    setTempEndDate(endDate ? endDate.toISOString().split("T")[0] : null);
    setCurrentCalendarDate(
      (startDate || new Date()).toISOString().split("T")[0],
    );
    setModalView("CALENDAR");
    setDateFilterVisible(true);
  };

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case "Today":
        start = today;
        break;
      case "Yesterday":
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = start;
        break;
      case "Last 7 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case "Last 30 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      default:
        return;
    }

    setTempStartDate(start.toISOString().split("T")[0]);
    // If start and end are the same day, set tempEndDate to null to indicate a single day selection
    // Otherwise, set it to the end date.
    setTempEndDate(
      start.toISOString().split("T")[0] === end.toISOString().split("T")[0]
        ? null
        : end.toISOString().split("T")[0],
    );

    // Apply immediately and close
    setStartDate(start);
    setEndDate(end);
    setDateFilterVisible(false);
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (tempStartDate) {
      marks[tempStartDate] = {
        startingDay: true,
        endingDay: selectionType === "single" ? true : !tempEndDate,
        color: "#5B4CCC",
        textColor: "white",
      };
    }
    if (tempEndDate && selectionType === "range") {
      marks[tempEndDate] = {
        endingDay: true,
        color: "#5B4CCC",
        textColor: "white",
      };

      // Fill range
      let start = new Date(tempStartDate!);
      let end = new Date(tempEndDate);
      let curr = new Date(start);
      curr.setDate(curr.getDate() + 1);

      while (curr < end) {
        const dStr = curr.toISOString().split("T")[0];
        marks[dStr] = {
          color: isDarkMode ? "#5B4CCC44" : "#E0E7FF",
          textColor: isDarkMode ? "white" : "#4338CA",
        };
        curr.setDate(curr.getDate() + 1);
      }
    }
    return marks;
  }, [tempStartDate, tempEndDate, isDarkMode, selectionType]);

  // -------------------------------------
  // 📥 Export Excel
  // -------------------------------------
  const handleExportExcel = async () => {
    try {
      setDownloadingExcel(true);

      const typeMap: any = {
        Today: "day",
        Week: "week",
        Month: "month",
        Custom: "custom",
      };

      const params: any = { type: typeMap[selectedTab] };
      if (selectedTab === "Custom" && startDate && endDate) {
        params.startDate = moment(startDate).startOf("day").toISOString();
        params.endDate = moment(endDate).endOf("day").toISOString();
      }

      const response = await api.get("/usage/users/leaderboard/export", {
        params,
        responseType: "blob",
        headers: { Authorization: "Bearer " + token },
      });

      const fileName = `UsageLeaderboard_${selectedTab}_${moment().format("DDMMMYYYY")}.xlsx`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const blobToBase64 = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

        const base64data = await blobToBase64(response.data);
        const fileUri = FileSystem.cacheDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          console.warn("Sharing is not available on this device");
        }
      }
    } catch (err) {
      console.error("❌ Excel export error:", err);
    } finally {
      setDownloadingExcel(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [selectedTab, token, startDate, endDate]); // Added dependencies

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTab, startDate, endDate]); // Refetch when tab or dates change

  const filteredLeaderboard = useMemo(() => {
    return userLeaderboard
      .map((item, index) => ({
        ...item,
        originalRank: index + 1,
      }))
      .filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const name = (item.userId?.fullName || "").toLowerCase();
        const rankMatch = item.originalRank.toString() === query;

        return name.includes(query) || rankMatch;
      });
  }, [userLeaderboard, searchQuery]);

  // -------------------------------------
  // HELPER: Format Duration (seconds -> 3h - 12m)
  // -------------------------------------
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h - ${m}m`;
    return `${m}m`;
  };

  // -------------------------------------
  // RENDER ITEM
  // -------------------------------------
  const renderUserCard = ({ item, index }: { item: any; index: number }) => {
    // New API Fields Mapping
    const name = item.userId?.fullName || "Unknown User";
    const designation = item.userId?.designation || "N/A";
    const requests = item.apiRequestCount || 0;
    const lastActive = item.lastSeen
      ? moment(item.lastSeen).calendar(null, {
          sameDay: "[Today], h:mm A",
          lastDay: "[Yesterday], h:mm A",
          lastWeek: "dddd, h:mm A",
          sameElse: "DD MMM, h:mm A",
        })
      : "Never";

    const sessions = item.sessionCount || 0;
    const timeString = item.totalDuration
      ? formatDuration(item.totalDuration)
      : "0h - 0m";
    const mostUsed = item.mostUsedScreen || "N/A";

    const rank = item.originalRank;
    const suffix =
      rank === 11 || rank === 12 || rank === 13
        ? "th"
        : rank % 10 === 1
          ? "st"
          : rank % 10 === 2
            ? "nd"
            : rank % 10 === 3
              ? "rd"
              : "th";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/usageSummary?userId=${item.userId._id}`)}
        className="bg-[#F0F3F7] dark:bg-[#1A1A1A] mx-4 mb-4 rounded-[16px]"
      >
        {/* Header Row: Rank & Last Active */}
        <View className="flex-row justify-between px-4 items-center py-2">
          <Text className="text-black dark:text-white font-dmBold text-sm">
            # {rank}
            {suffix}
          </Text>
          <Text className="text-[#8E8E8E] dark:text-[#919191] font-poppins text-xs">
            Last seen : {lastActive}
          </Text>
        </View>

        <View className="bg-[#F6F8FA]  dark:bg-[#0D0D0D]  p-5 rounded-[16px]">
          {/* Profile Row */}
          <View className="flex-row  items-center mb-5">
            <GlobalAvatar
              name={name}
              size={44}
              fontSize={18}
              borderRadius={8}
            />

            <View className="ml-3 flex-1">
              <Text className="text-black dark:text-white text-lg font-dmBold">
                {name}
              </Text>
              <Text className="text-[#8E8E8E] dark:text-[#919191] text-sm font-poppins">
                {designation}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-black dark:text-white text-2xl font-dmBold">
                {requests}
              </Text>
              <Text className="text-[#8E8E8E] dark:text-[#919191] text-xs font-poppins">
                requests
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="gap-2">
            {/* Sessions */}
            <View className="flex-row items-center">
              <HugeiconsIcon
                icon={PieChart01Icon}
                size={18}
                color={isDarkMode ? "#919191" : "#454545"}
              />
              <Text className="ml-2 text-[#454545] dark:text-[#D2D2D2] text-sm font-poppinsMedium">
                Sessions : {sessions}
              </Text>
            </View>

            {/* Time */}
            <View className="flex-row items-center">
              <HugeiconsIcon
                icon={Clock01Icon}
                size={18}
                color={isDarkMode ? "#919191" : "#454545"}
              />
              <Text className="ml-2 text-[#454545] dark:text-[#D2D2D2] text-sm font-poppinsMedium">
                Total time : {timeString}
              </Text>
            </View>

            {/* Most Used Page */}
            <View className="flex-row items-center">
              <HugeiconsIcon
                icon={Analytics01Icon}
                size={18}
                color={isDarkMode ? "#919191" : "#454545"}
              />
              <Text className="ml-2 text-[#454545] dark:text-[#D2D2D2] text-sm font-poppinsMedium">
                Most used page - {mostUsed}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 pt-14 bg-[#FBFCFD] dark:bg-[#000]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="mr-3"
          >
            <HugeiconsIcon
              icon={Menu02Icon}
              size={24}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmBold text-black dark:text-white">
            Usage Insights
          </Text>
        </View>

        <View className="flex-row gap-4">
          <TouchableOpacity onPress={toggleSearch}>
            <HugeiconsIcon
              icon={isSearching ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
          {/* Excel Icon Placeholder */}
          <TouchableOpacity
            disabled={downloadingExcel}
            onPress={handleExportExcel}
          >
            {downloadingExcel ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#D2D2D2" : "#454545"}
              />
            ) : (
              <HugeiconsIcon
                icon={Xsl01Icon}
                size={24}
                color={isDarkMode ? "#D2D2D2" : "#454545"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 SEARCH BAR (Collapsible - Central Directory Style) */}
      {isSearching && (
        <View className="px-4 pb-2 bg-[#FBFCFD] dark:bg-[#000]">
          <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              color={isDarkMode ? "#606060" : "#454545"}
            />
            <TextInput
              placeholder="Search name..."
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1 font-poppins text-black dark:text-white text-base"
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* 🔹 TABS */}
      <View className="px-4 py-4">
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => {
            const isActive = selectedTab === item;
            return (
              <TouchableOpacity
                onPress={() => {
                  if (item === "Custom") {
                    openDateFilterModal();
                  } else {
                    setSelectedTab(item);
                    setStartDate(null);
                    setEndDate(null);
                  }
                }}
                className={`px-6 py-2 rounded-full border ${
                  isActive
                    ? "bg-[#DDE2FB] dark:bg-[#11162F] border-[#5B4CCC]"
                    : "bg-transparent border-[#E0E5EB] dark:border-[#333]"
                }`}
              >
                <Text
                  className={`text-sm font-dmMedium ${
                    isActive ? "text-[#5B4CCC]" : "text-black dark:text-white"
                  }`}
                >
                  {item === "Custom" && startDate && endDate
                    ? `${moment(startDate).format("DD MMM")} - ${moment(endDate).format("DD MMM")}`
                    : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 🔹 LIST */}
      {loading && !refreshing ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <UsageSkeleton isDarkMode={isDarkMode} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredLeaderboard}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderUserCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B4CCC"]}
              tintColor={isDarkMode ? "#5B4CCC" : "#5B4CCC"}
            />
          }
          ListEmptyComponent={
            <View className="mt-20 items-center px-6">
              <Text className="text-[#8E8E8E] font-poppins text-center text-base">
                No usage data found.
              </Text>
            </View>
          }
        />
      )}

      {/* 🔹 DATE FILTER MODAL */}
      <Modal
        isVisible={dateFilterVisible}
        onBackdropPress={() => setDateFilterVisible(false)}
        onBackButtonPress={() => setDateFilterVisible(false)}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{ margin: 0, justifyContent: "flex-end" }}
      >
        <View className="bg-white dark:bg-[#1A1A1A] rounded-t-[32px] p-6 pb-14">
          <View className="items-center mb-2">
            <View className="w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          </View>

          <View className="pb-4 border-b border-gray-100 dark:border-zinc-800 mb-2 flex-row items-center justify-between">
            <View className="w-10" />
            <Text className="text-[20px] font-dmSemiBold text-black dark:text-white text-center">
              Date Range
            </Text>
            <TouchableOpacity
              onPress={() => setDateFilterVisible(false)}
              className="w-10 h-10 items-center justify-center"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={24}
                color={isDarkMode ? "#D2D2D2" : "#454545"}
              />
            </TouchableOpacity>
          </View>

          {modalView === "MENU" ? (
            <View>
              <TouchableOpacity
                onPress={() => {
                  setSelectionType("range");
                  setModalView("CALENDAR");
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-800"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 items-center justify-center mr-4">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={24}
                      color={isDarkMode ? "#D2D2D2" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text className="text-[16px] font-poppins text-black dark:text-white">
                      Custom date range
                    </Text>
                    <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
                      Define a time period relative to today
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Presets */}
              {["Today", "Yesterday", "Last 7 Days", "Last 30 Days"].map(
                (preset, index) => {
                  const isLast = index === 3;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        handlePresetSelect(preset);
                        setSelectedTab("Custom");
                      }}
                      className={`flex-row items-center py-4 ${!isLast ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}
                    >
                      <View className="mr-4">
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${activePreset === preset ? "border-[#5B4CCC]" : "border-gray-200 dark:border-zinc-700"}`}
                        >
                          {activePreset === preset && (
                            <View className="w-3 h-3 rounded-full bg-[#5B4CCC]" />
                          )}
                        </View>
                      </View>
                      <Text className="text-[16px] font-poppins text-black dark:text-white">
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}

              <TouchableOpacity
                onPress={() => {
                  applyDateFilter();
                  setSelectedTab("Custom");
                  setDateFilterVisible(false);
                }}
                className="w-full py-4 mt-6 rounded-[20px] bg-gray-100 dark:bg-zinc-800 items-center justify-center "
              >
                <Text className="text-[18px] font-poppins text-black dark:text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="min-h-[350px]">
                <Calendar
                  key={`range-${currentCalendarDate}`}
                  current={currentCalendarDate}
                  markingType={"period"}
                  markedDates={markedDates}
                  onDayPress={onDayPress}
                  onMonthChange={(month: any) => {
                    setCurrentCalendarDate(month.dateString);
                  }}
                  renderHeader={(date: any) => {
                    // Safety check for date formatting
                    let month = "";
                    let year = "";
                    try {
                      month = date.toString("MMM");
                      year = date.toString("yyyy");
                    } catch (e) {
                      const d = new Date(date.getTime ? date.getTime() : date);
                      month = d.toLocaleDateString("en-US", { month: "short" });
                      year = d.getFullYear().toString();
                    }
                    return (
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => setShowMonthPicker(!showMonthPicker)}
                          className="flex-row items-center bg-white dark:bg-[#262626] border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl"
                        >
                          <Text className="text-[15px] font-poppinsMedium text-black dark:text-white mr-1.5">
                            {month}
                          </Text>
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            color={isDarkMode ? "#94A3B8" : "#64748B"}
                          />
                        </TouchableOpacity>
                        <View className="flex-row items-center bg-white dark:bg-[#262626] border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                          <Text className="text-[15px] font-poppinsMedium text-black dark:text-white">
                            {year}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  renderArrow={(direction: any) => (
                    <HugeiconsIcon
                      icon={
                        direction === "left"
                          ? ArrowLeft01Icon
                          : ArrowRight01Icon
                      }
                      size={20}
                      color={isDarkMode ? "#FFF" : "#000"}
                    />
                  )}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: "#94A3B8",
                    selectedDayBackgroundColor: "#5B4CCC",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#5B4CCC",
                    dayTextColor: isDarkMode ? "#E2E8F0" : "#2D3748",
                    textDisabledColor: isDarkMode ? "#4A5568" : "#CBD5E0",
                    monthTextColor: isDarkMode ? "#E2E8F0" : "#2D3748",
                    arrowColor: isDarkMode ? "#FFF" : "#000",
                    textDayFontFamily: "Poppins_400Regular",
                    textMonthFontFamily: "DM-Sans-Bold",
                    textDayHeaderFontFamily: "Poppins_400Regular",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                />
              </View>

              {/* Month Picker Overlay */}
              {showMonthPicker && (
                <View className="absolute top-[80px] left-0 right-0 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xl z-50">
                  <View className="flex-row flex-wrap justify-between">
                    {months.map((m, index) => {
                      const d = new Date(currentCalendarDate);
                      const isSelected = index === d.getMonth();
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            const newDate = new Date(currentCalendarDate);
                            newDate.setMonth(index);
                            setCurrentCalendarDate(
                              newDate.toISOString().split("T")[0],
                            );
                            setShowMonthPicker(false);
                          }}
                          className={`w-[30%] py-3 mb-2 rounded-xl items-center ${isSelected ? "bg-[#5B4CCC]" : "bg-gray-50 dark:bg-zinc-800"}`}
                        >
                          <Text
                            className={`text-[14px] font-poppinsMedium ${isSelected ? "text-white" : "text-black dark:text-white"}`}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className="mt-6 flex-row gap-3">
                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setDateFilterVisible(false)}
                  activeOpacity={0.85}
                  className="flex-1 py-4 items-center justify-center rounded-[20px] bg-gray-100 dark:bg-zinc-800"
                >
                  <Text className="text-[18px] font-poppins text-black dark:text-white">
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Apply Button */}
                <TouchableOpacity
                  onPress={() => {
                    applyDateFilter();
                    setSelectedTab("Custom");
                    setDateFilterVisible(false);
                  }}
                  activeOpacity={0.85}
                  className="flex-1 rounded-[20px] overflow-hidden"
                >
                  <LinearGradient
                    colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                    locations={[0, 0.5183, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.1 }}
                    className="py-4 items-center justify-center"
                  >
                    <Text className="text-[18px] font-poppins text-white">
                      Apply
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
