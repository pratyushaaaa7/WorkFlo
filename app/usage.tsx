import api from "@/lib/api";
import {
  Analytics01Icon,
  Cancel01Icon,
  Clock01Icon,
  Menu02Icon,
  PieChart01Icon,
  Search01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
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
import GlobalAvatar from "../components/GlobalAvatar";
import { useAuth } from "../context/AuthContext";

const TABS = ["Today", "Week", "Month", "Custom"];

export default function UsageScreen() {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Today");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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

      const res = await api.get("/usage/users/leaderboard", {
        params,
        headers: { Authorization: "Bearer " + token },
      });

      // console.log(JSON.stringify(res.data, null, 2));

      const data = res.data;
      if (Array.isArray(data)) {
        setUserLeaderboard(data);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [selectedTab, token]); // Added dependencies

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTab]); // Refetch when tab changes

  const filteredLeaderboard = userLeaderboard.filter((item) => {
    const name = (item.userId?.fullName || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

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

    return (
      <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] mx-4 mb-4 rounded-[16px]">
        {/* Header Row: Rank & Last Active */}
        <View className="flex-row justify-between px-4 items-center py-2">
          <Text className="text-black dark:text-white font-dmBold text-sm">
            # {index + 1}
            {index === 0
              ? "st"
              : index === 1
                ? "nd"
                : index === 2
                  ? "rd"
                  : "th"}
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
      </View>
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
          <TouchableOpacity>
            <HugeiconsIcon
              icon={Xsl01Icon}
              size={24}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
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
                onPress={() => setSelectedTab(item)}
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
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 🔹 LIST */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5B4CCC" />
        </View>
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
    </View>
  );
}
