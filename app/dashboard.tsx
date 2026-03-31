import thuhrohLogo from "@/assets/images/thuhrohLogo.png";
import {
  Add01Icon,
  Calendar04Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  File02Icon,
  FilterHorizontalIcon,
  Menu02Icon,
  Note03Icon,
  Notification01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import GlassNav from "../components/GlassNav";
import GlobalAvatar from "../components/GlobalAvatar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { useProject } from "../context/ProjectContext";

// Tab Components
import CalendarTab from "../components/dashboard/CalendarTab";
import NotesTab from "../components/dashboard/NotesTab";
import OverviewTab from "../components/dashboard/OverviewTab";
import ProjectsTab from "../components/dashboard/ProjectsTab";
import TasksTab from "../components/dashboard/TasksTab";

const Dashboard = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { user } = useAuth();
  const navigation = useNavigation();
  const { token } = useAuth();

  // Refs for Scrolling and Animation
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Measurement State
  const [searchHeight, setSearchHeight] = useState(70); // Default approx

  const [activeTab, setActiveTabState] = useState("Overview");

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.get("/dashboard/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setDashboardData(res.data);
      }
      // console.log(res.data);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { prefetchFirstPages } = useProject();

  useEffect(() => {
    fetchDashboardData();
    
    // Background pre-fetch projects after 2 seconds
    const timer = setTimeout(() => {
        prefetchFirstPages();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Handle back button / gesture on Android
      const onBackPress = () => {
        // Exit the app instead of showing the "GO_BACK" warning
        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      // Skip the very first load because useEffect handles it
      // or we can just call it silently
      fetchDashboardData(true);

      return () => {
        backHandler.remove();
      };
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const tabs = ["Overview", "Projects", "Tasks", "Calendar", "Notes"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            responsibleItems={dashboardData?.myResponsibleItems || []}
          />
        );
      case "Projects":
        return <ProjectsTab refreshing={refreshing} onRefresh={onRefresh} />;
      case "Tasks":
        return (
          <TasksTab
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            responsibleItems={dashboardData?.myResponsibleItems || []}
          />
        );
      case "Calendar":
        return (
          <CalendarTab
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            responsibleItems={dashboardData?.myResponsibleItems || []}
          />
        );
      case "Notes":
        return <NotesTab refreshing={refreshing} onRefresh={onRefresh} />;
      default:
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            responsibleItems={dashboardData?.myResponsibleItems || []}
          />
        );
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "Overview":
        return Clock01Icon;
      case "Projects":
        return File02Icon;
      case "Tasks":
        return CheckmarkSquare02Icon;
      case "Calendar":
        return Calendar04Icon;
      case "Notes":
        return Note03Icon;
      default:
        return Clock01Icon;
    }
  };

  const getTabColor = (tab: string) => {
    switch (tab) {
      case "Overview":
        return "#566FEC";
      case "Projects":
        return "#FF8A47";
      case "Tasks":
        return "#E841B8";
      case "Calendar":
        return "#335EB3";
      case "Notes":
        return "#FFC366";
      default:
        return "#566FEC";
    }
  };

  // Interpolation for Sticky Header
  const translateY = scrollY.interpolate({
    inputRange: [0, searchHeight],
    outputRange: [searchHeight, 0],
    extrapolateRight: "clamp",
  });

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* 1. FIXED TOP HEADER (App Name & Profile) */}
      <View
        className="pt-14 px-3 pb-3 bg-white dark:bg-black z-10"
        style={{ zIndex: 20 }}
      >
        <View className="flex-row items-center justify-between ">
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={1}
              className="mr-3 flex-row gap-2 items-center"
              onPress={() => (navigation as any).openDrawer()}
            >
              <HugeiconsIcon
                icon={Menu02Icon}
                size={24}
                color={isDarkMode ? "#919191" : "#454545"}
              />

              {/* <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center mr-2">
                  <Text className="text-white font-bold text-lg">T</Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  Thuhroh
                </Text>
              </View> */}

              <View className="flex-row items-center">
                {/* <Image
                          source={isDarkMode ? logoDark : logoLight}
                          style={{ width: 120, height: 40 }}
                          resizeMode="contain"
                        /> */}
                <View className="w-8 h-8 rounded-lg items-center justify-center mx-3">
                  {/* <Text className="text-white font-bold text-lg">T</Text> */}
                  <Image
                    source={thuhrohLogo}
                    style={{ width: 120, height: 40 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">
                  Thuhroh
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity>
              <HugeiconsIcon
                icon={Notification01Icon}
                size={24}
                color={isDarkMode ? "#D2D2D2" : "#454545"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <GlobalAvatar
                name={user?.fullName || user?.username || "User"}
                size={40}
                fontSize={16}
                borderRadius={20}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. CONTENT AREA */}
      <View className="flex-1">
        {/* Search Bar (Now Fixed) */}
        <View className="px-3 pt-3 bg-white dark:bg-black">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center px-4 py-3 rounded-2xl bg-[#F6F8FA] dark:bg-[#121212] border border-[#E0E5EB] dark:border-[#606060]">
              <HugeiconsIcon icon={Search01Icon} size={20} color="#606060" />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#606060"
                className="flex-1 ml-3 font-dm text-[#606060] py-1"
              />
            </View>
            <TouchableOpacity className="ml-2 p-3 rounded-2xl bg-[#F6F8FA] dark:bg-[#121212] border border-[#E0E5EB] dark:border-[#606060]">
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                size={24}
                color="#606060"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation (Now Fixed below search) */}
        <View className="bg-white dark:bg-[#1A1A1A]" style={{ height: 60 }}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            pointerEvents="none"
          >
            <GlassNav
              activeTabIndex={tabs.indexOf(activeTab)}
              totalTabs={tabs.length}
              activeTabName={activeTab}
            />
          </View>

          <View
            className="flex-1 flex-row items-center justify-between gap-1"
            style={{ paddingHorizontal: 12, paddingTop: 8 }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const themeColor = getTabColor(tab);
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="flex-1 items-center justify-center py-4"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="items-center justify-center">
                    <HugeiconsIcon
                      icon={getTabIcon(tab)}
                      size={22}
                      color={
                        isActive
                          ? themeColor
                          : isDarkMode
                            ? "#919191"
                            : "#6B7280"
                      }
                    />
                    <Text
                      className={`text-[10px] sm:text-xs font-poppinsMedium mt-1 ${
                        isActive ? "" : "text-gray-500 dark:text-[#919191]"
                      }`}
                      style={isActive ? { color: themeColor } : {}}
                    >
                      {tab}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. MAIN CONTENT (Scrollable within each tab) */}
        <View className="flex-1">{renderTabContent()}</View>
      </View>

      {/* 🔹 FLOATING ACTION BUTTON (ONLY FOR NOTES & CALENDAR) */}
      {(activeTab === "Notes" || activeTab === "Calendar") && (
        <View className="absolute bottom-10 right-6 z-50">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/createMyNote")}
            style={styles.fab}
            className="w-16 h-16 bg-[#5B4CCC] rounded-full items-center justify-center"
          >
            <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    shadowColor: "#5B4CCC",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 25,
  },
});

export default Dashboard;
