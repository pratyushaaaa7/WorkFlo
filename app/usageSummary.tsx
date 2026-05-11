import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { Skeleton } from "moti/skeleton";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Modal from "react-native-modal";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getReadableScreenName } from "../utils/screenNames";

type ScreenStat = {
  screenName: string;
  duration: number;
  visits: number;
};

type SummaryData = {
  user: {
    fullName: string;
    designation: string;
    profileImage?: string;
  };
  totalRequests: number;
  totalDuration: number;
  totalSessions: number;
  screens: ScreenStat[];
};

export default function UsageSummaryScreen() {
  const router = useRouter();
  const {
    userId,
    fullName,
    designation,
    totalRequests,
    totalSessions,
    totalDuration: prefillDuration,
    profileImage,
  } = useLocalSearchParams<{
    userId: string;
    fullName?: string;
    designation?: string;
    totalRequests?: string;
    totalSessions?: string;
    totalDuration?: string;
    profileImage?: string;
  }>();
  const { token } = useContext(AuthContext) || {};

  const isDark = useColorScheme() === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(() => {
    if (fullName) {
      return {
        user: {
          fullName: decodeURIComponent(fullName),
          designation: designation ? decodeURIComponent(designation) : "User",
          profileImage: profileImage
            ? decodeURIComponent(profileImage)
            : undefined,
        },
        totalRequests: totalRequests ? parseInt(totalRequests) : 0,
        totalDuration: prefillDuration ? parseInt(prefillDuration) : 0,
        totalSessions: totalSessions ? parseInt(totalSessions) : 0,
        screens: [],
      };
    }
    return null;
  });

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState("Custom");

  // Date Filter Modal State
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [modalView, setModalView] = useState<"MENU" | "CALENDAR">("MENU");
  const [activePreset, setActivePreset] = useState<string | null>("Today");
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

  const fetchSummary = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const params: any = { type: selectedFilter };
      if (selectedFilter === "Custom" && startDate && endDate) {
        params.startDate = moment(startDate).format("YYYY-MM-DD");
        params.endDate = moment(endDate).format("YYYY-MM-DD");
      }


      const res = await api.get(`/usage/users/${userId}/summary`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaryData(res.data);
      // console.log("✅ Usage summary data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("Failed to fetch usage summary", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    fetchSummary(true);
  }, [userId, selectedFilter, startDate, endDate, token]);

  useEffect(() => {
    if (userId) {
      fetchSummary();
    }
  }, [userId, selectedFilter, startDate, endDate]);

  // -------------------------------------
  // 📅 Date Filter Logic
  // -------------------------------------
  const onDayPress = (day: any) => {
    const dateString = day.dateString;

    if (selectionType === "single") {
      // For "Review date" mode, we select one day and immediately apply
      setTempStartDate(dateString);
      setTempEndDate(null);

      // Auto-apply logic
      setStartDate(new Date(dateString));
      setEndDate(new Date(dateString));
      setActivePreset(null);
      setSelectedFilter("Custom");
      setDateFilterVisible(false);
      return;
    }

    // Range selection logic
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
    setActivePreset(null);
    setDateFilterVisible(false);
  };

  const openDateFilterModal = () => {
    // We batch state updates for better performance
    if (!dateFilterVisible) {
      setTempStartDate(
        startDate ? startDate.toISOString().split("T")[0] : null,
      );
      setTempEndDate(endDate ? endDate.toISOString().split("T")[0] : null);
      setCurrentCalendarDate(
        (startDate || new Date()).toISOString().split("T")[0],
      );
      setModalView("MENU");
      setDateFilterVisible(true);
    }
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
    setTempEndDate(
      start.toISOString().split("T")[0] === end.toISOString().split("T")[0]
        ? null
        : end.toISOString().split("T")[0],
    );

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

      let start = new Date(tempStartDate!);
      let end = new Date(tempEndDate);
      let curr = new Date(start);
      curr.setDate(curr.getDate() + 1);

      while (curr < end) {
        const dStr = curr.toISOString().split("T")[0];
        marks[dStr] = {
          color: isDark ? "#5B4CCC44" : "#E0E7FF",
          textColor: isDark ? "white" : "#4338CA",
        };
        curr.setDate(curr.getDate() + 1);
      }
    }
    return marks;
  }, [tempStartDate, tempEndDate, isDark, selectionType]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const data = summaryData;
  const mostUsedScreen = data?.screens?.length
    ? getReadableScreenName(data.screens[0].screenName)
    : loading
      ? ""
      : "None";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#FBFCFD" }}>
      {/* Header */}
      <View className="flex-row items-center pt-14 pb-4 px-5">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-dmSemiBold ml-3 text-black dark:text-white">
          Usage Summary
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B4CCC"]}
            tintColor="#5B4CCC"
          />
        }
      >
        {data && (
          <>
            {/* Profile Section */}
            <View className="items-center mt-6">
              <GlobalAvatar
                name={data.user.fullName || "User"}
                uri={data.user.profileImage}
                size={100}
                fontSize={36}
                borderRadius={24}
              />
              <Text className="text-2xl font-dmBold text-black dark:text-white mt-4">
                {data.user.fullName || "Unknown"}
              </Text>
              <Text className="text-base text-[#6B7280] font-poppins mt-1">
                Role : {data.user.designation || "User"}
              </Text>
            </View>

            {/* Top Stats */}
            <View
              className="mt-8 flex-row mx-4 rounded-2xl py-4"
              style={{ backgroundColor: isDark ? "#111111" : "#F6F8FA" }}
            >
              <View
                className="flex-1 items-center border-r"
                style={{ borderColor: isDark ? "#333" : "#E5E7EB" }}
              >
                <Text className="text-[#6B7280] font-poppins text-xs mb-1">
                  Sessions
                </Text>
                <Text className="text-black dark:text-white font-dmSemiBold text-lg">
                  {data.totalSessions}
                </Text>
              </View>
              <View
                className="flex-1 items-center border-r"
                style={{ borderColor: isDark ? "#333" : "#E5E7EB" }}
              >
                <Text className="text-[#6B7280] font-poppins text-xs mb-1">
                  Request
                </Text>
                <Text className="text-black dark:text-white font-dmSemiBold text-lg">
                  {data.totalRequests}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-[#6B7280] font-poppins text-xs mb-1">
                  Total Time
                </Text>
                <Text className="text-black dark:text-white font-dmSemiBold text-lg">
                  {data ? formatDuration(data.totalDuration) : "0m"}
                </Text>
              </View>
            </View>

            {/* Time Spent Section */}
            <View
              className="mt-6 mx-4 rounded-2xl p-5"
              style={{
                backgroundColor: isDark ? "#111111" : "#FFF",
                shadowColor: "#000",
                shadowOpacity: 0.01,
                shadowRadius: 5,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-[#6B7280] font-poppins text-xs mb-1">
                    Time Spent by Page
                  </Text>
                  <Text className="text-black dark:text-white font-dmBold text-3xl">
                    {data ? formatDuration(data.totalDuration) : "0m"}
                  </Text>
                  <View className="mt-1">
                    {loading && !mostUsedScreen ? (
                      <Skeleton
                        colorMode={isDark ? "dark" : "light"}
                        width={150}
                        height={14}
                        radius={4}
                      />
                    ) : (
                      <Text className="text-black dark:text-[#D2D2D2] font-poppinsMedium text-xs">
                        Most used page{" "}
                        <Text className="text-[#6B7280] font-poppins">
                          - {mostUsedScreen}
                        </Text>
                      </Text>
                    )}
                  </View>
                </View>

                {/* Filter Dropdown */}
                <TouchableOpacity
                  className="flex-row items-center px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: isDark ? "#000" : "#F3F4F6" }}
                  onPress={() => openDateFilterModal()}
                >
                  <Text className="text-black dark:text-white font-poppins text-xs mr-2">
                    {selectedFilter === "Custom" && startDate && endDate
                      ? moment(startDate).isSame(endDate, "day")
                        ? moment(startDate).format("DD-MM-YYYY")
                        : `${moment(startDate).format("DD-MM-YYYY")} - ${moment(endDate).format("DD-MM-YYYY")}`
                      : selectedFilter === "Month"
                        ? "Last 30 days"
                        : selectedFilter === "Week"
                          ? "Last 7 days"
                          : selectedFilter}
                  </Text>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={16}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              <View className="mt-8 gap-5">
                {loading &&
                (!data || !data.screens || data.screens.length === 0) ? (
                  [1, 2, 3, 4].map((i) => (
                    <View key={i} className="mb-4">
                      <View className="flex-row justify-between mb-2">
                        <Skeleton
                          colorMode={isDark ? "dark" : "light"}
                          width={120}
                          height={16}
                          radius={4}
                        />
                        <Skeleton
                          colorMode={isDark ? "dark" : "light"}
                          width={80}
                          height={14}
                          radius={4}
                        />
                      </View>
                      <Skeleton
                        colorMode={isDark ? "dark" : "light"}
                        width="100%"
                        height={12}
                        radius={6}
                      />
                    </View>
                  ))
                ) : data?.screens?.length === 0 ? (
                  <View className="items-center py-10">
                    <Text className="text-[#6B7280] font-poppins">
                      No usage data
                    </Text>
                  </View>
                ) : (
                  data?.screens.map((screen, idx) => {
                    const percentage =
                      data.totalDuration > 0
                        ? Math.min(
                            (screen.duration / data.totalDuration) * 100,
                            100,
                          )
                        : 0;

                    return (
                      <View key={idx}>
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-black dark:text-[#D2D2D2] font-poppinsMedium text-sm">
                            {getReadableScreenName(screen.screenName)}
                          </Text>
                          <Text className="text-[#6B7280] font-poppins text-xs">
                            {formatDuration(screen.duration)} - Visit{" "}
                            {screen.visits}
                          </Text>
                        </View>
                        <LinearGradient
                          colors={["#F0E7F8", "#E1D2F9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: 12,
                            borderRadius: 9999,
                            overflow: "hidden",
                            width: "100%",
                            flexDirection: "row",
                            backgroundColor: isDark ? "#2A0066" : "#EAE0FC",
                          }}
                        >
                          <LinearGradient
                            colors={["#C08EFF", "#6A28D8"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              height: "100%",
                              borderRadius: 9999,
                              width: `${percentage}%`,
                            }}
                          />
                        </LinearGradient>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 🔹 DATE FILTER MODAL */}
      <Modal
        isVisible={dateFilterVisible}
        onBackdropPress={() => setDateFilterVisible(false)}
        onBackButtonPress={() => setDateFilterVisible(false)}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{
          margin: 16,
          marginBottom: 40,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <View className="bg-white dark:bg-[#1A1A1A] rounded-[32px] overflow-hidden w-full">
          <View className="items-center mt-6 mb-2">
            <View className="w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          </View>

          <View className="pb-4 border-b border-gray-100 dark:border-zinc-800 mb-2 flex-row items-center justify-center px-4">
            <Text className="text-[18px] font-dmSemiBold text-black dark:text-white text-center">
              Date Range
            </Text>
          </View>

          {modalView === "MENU" ? (
            <View>
              {/* Custom date range */}
              <TouchableOpacity
                onPress={() => {
                  setSelectionType("range");
                  setTempStartDate(
                    startDate ? startDate.toISOString().split("T")[0] : null,
                  );
                  setTempEndDate(
                    endDate ? endDate.toISOString().split("T")[0] : null,
                  );
                  setCurrentCalendarDate(
                    (startDate || new Date()).toISOString().split("T")[0],
                  );
                  setModalView("CALENDAR");
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-800 px-4"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 items-center justify-center mr-4">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={24}
                      color={isDark ? "#D2D2D2" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text className="text-[16px] font-poppins text-black dark:text-white">
                      Custom date range
                    </Text>
                    {activePreset === null &&
                    selectionType === "range" &&
                    startDate &&
                    endDate &&
                    !moment(startDate).isSame(endDate, "day") ? (
                      <Text className="text-[12px] font-poppins text-[#5B4CCC]">
                        {moment(startDate).format("DD-MM-YYYY")} -{" "}
                        {moment(endDate).format("DD-MM-YYYY")}
                      </Text>
                    ) : (
                      <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
                        Define a time period
                      </Text>
                    )}
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Review date */}
              <TouchableOpacity
                onPress={() => {
                  setSelectionType("single");
                  setTempStartDate(
                    startDate ? startDate.toISOString().split("T")[0] : null,
                  );
                  setTempEndDate(null);
                  setCurrentCalendarDate(
                    (startDate || new Date()).toISOString().split("T")[0],
                  );
                  setModalView("CALENDAR");
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-800 px-4"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 items-center justify-center mr-4">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={24}
                      color={isDark ? "#D2D2D2" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text className="text-[16px] font-poppins text-black dark:text-white">
                      Review date
                    </Text>
                    {activePreset === null &&
                    (selectionType === "single" ||
                      (startDate &&
                        endDate &&
                        moment(startDate).isSame(endDate, "day"))) ? (
                      <Text className="text-[12px] font-poppins text-[#5B4CCC]">
                        {moment(startDate).format("DD-MM-YYYY")}
                      </Text>
                    ) : null}
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
                        setSelectedFilter("Custom");
                      }}
                      className={`flex-row items-center py-4 px-4 ${!isLast ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}
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
            </View>
          ) : (
            <View className="px-4 pb-6">
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
                            color={isDark ? "#94A3B8" : "#64748B"}
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
                      color={isDark ? "#FFF" : "#000"}
                    />
                  )}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: "#94A3B8",
                    selectedDayBackgroundColor: "#5B4CCC",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#5B4CCC",
                    dayTextColor: isDark ? "#E2E8F0" : "#2D3748",
                    textDisabledColor: isDark ? "#4A5568" : "#CBD5E0",
                    monthTextColor: isDark ? "#E2E8F0" : "#2D3748",
                    arrowColor: isDark ? "#FFF" : "#000",
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
                <View className="absolute top-[80px] left-0 right-0 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 z-50">
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
                  onPress={() => setModalView("MENU")}
                  activeOpacity={0.85}
                  className="flex-1 py-3 items-center justify-center rounded-[20px] bg-gray-100 dark:bg-zinc-800"
                >
                  <Text className="text-[16px] font-poppins text-black dark:text-white">
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Apply Button */}
                <TouchableOpacity
                  onPress={() => {
                    applyDateFilter();
                    setSelectedFilter("Custom");
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
                    style={{
                      paddingVertical: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text className="text-[16px] font-poppins text-white">
                      Apply
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Floating Close Button */}
        <TouchableOpacity
          onPress={() => setDateFilterVisible(false)}
          activeOpacity={0.9}
          className="w-[40%] py-3 mt-4 rounded-full bg-white dark:bg-[#1A1A1A] items-center justify-center "
        >
          <Text className="text-[16px] font-poppins text-black dark:text-white">
            Close
          </Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
