import { ArrowDown01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

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
  const { userId } = useLocalSearchParams();
  const { token } = useContext(AuthContext) || {};

  const isDark = useColorScheme() === "dark";

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Filter state
  const filterOptions = ["Today", "Week", "Month"];
  const [selectedFilter, setSelectedFilter] = useState("Month");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/usage/users/${userId}/summary?type=${selectedFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSummaryData(res.data);
    } catch (err) {
      console.error("Failed to fetch usage summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSummary();
    }
  }, [userId, selectedFilter]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading && !summaryData) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#000" : "#FBFCFD",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  const data = summaryData;
  const maxScreenDuration = data?.screens.length
    ? Math.max(...data.screens.map((s) => s.duration))
    : 1;
  const mostUsedScreen = data?.screens.length
    ? data.screens[0].screenName
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

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {data && (
          <>
            {/* Profile Section */}
            <View className="items-center mt-6">
              <GlobalAvatar
                name={data.user.fullName || "User"}
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
                  {formatDuration(data.totalDuration)}
                </Text>
              </View>
            </View>

            {/* Time Spent Section */}
            <View
              className="mt-6 mx-4 rounded-2xl p-5"
              style={{
                backgroundColor: isDark ? "#111111" : "#FFF",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-[#6B7280] font-poppins text-xs mb-1">
                    Time Spent by Page
                  </Text>
                  <Text className="text-black dark:text-white font-dmBold text-3xl">
                    {formatDuration(data.totalDuration)}
                  </Text>
                  <Text className="text-black dark:text-[#D2D2D2] font-poppinsMedium text-xs mt-1">
                    Most used page{" "}
                    <Text className="text-[#6B7280] font-poppins">
                      - {mostUsedScreen}
                    </Text>
                  </Text>
                </View>

                {/* Filter Dropdown */}
                <TouchableOpacity
                  className="flex-row items-center px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: isDark ? "#000" : "#F3F4F6" }}
                  onPress={() => setDropdownVisible(true)}
                >
                  <Text className="text-black dark:text-white font-poppins text-xs mr-2">
                    {selectedFilter === "Month"
                      ? "Last 30 days"
                      : selectedFilter === "Week"
                        ? "Last 7 days"
                        : "Today"}
                  </Text>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={16}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              <View className="mt-8 gap-5">
                {data.screens.map((screen, idx) => {
                  // Map percentage to the total duration of ALL screens instead of the max individual screen
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
                          {screen.screenName}
                        </Text>
                        <Text className="text-[#6B7280] font-poppins text-xs">
                          {formatDuration(screen.duration)} - Visit{" "}
                          {screen.visits}
                        </Text>
                      </View>
                      <View
                        className="h-3 rounded-full overflow-hidden w-full flex-row"
                        style={{
                          backgroundColor: isDark ? "#2A0066" : "#EAE0FC",
                        }}
                      >
                        <LinearGradient
                          colors={["#A78BFA", "#7C3AED"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className="h-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View
            className="bg-white dark:bg-[#1A1A1A] w-3/4 rounded-xl overflow-hidden py-2"
            onStartShouldSetResponder={() => true}
          >
            {filterOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                className="py-4 px-6 border-b border-gray-100 dark:border-zinc-800"
                onPress={() => {
                  setSelectedFilter(opt);
                  setDropdownVisible(false);
                }}
              >
                <Text className="text-black dark:text-white font-poppins text-base text-center">
                  {opt === "Month"
                    ? "Last 30 days"
                    : opt === "Week"
                      ? "Last 7 days"
                      : "Today"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
