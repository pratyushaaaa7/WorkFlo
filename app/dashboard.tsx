import {
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
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import GlassNav from "../components/GlassNav";
import { useAuth } from "../context/AuthContext";

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

  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = ["Overview", "Projects", "Tasks", "Calendar", "Notes"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return <OverviewTab />;
      case "Projects":
        return <ProjectsTab />;
      case "Tasks":
        return <TasksTab />;
      case "Calendar":
        return <CalendarTab />;
      case "Notes":
        return <NotesTab />;
      default:
        return <OverviewTab />;
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

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* 1. FIXED TOP HEADER (App Name & Profile) */}
      <View className="pt-14 px-3 pb-3 bg-white dark:bg-black z-50">
        <View className="flex-row items-center justify-between ">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="mr-3"
              onPress={() => (navigation as any).openDrawer()}
            >
              <HugeiconsIcon
                icon={Menu02Icon}
                size={24}
                color={isDarkMode ? "#919191" : "#454545"}
              />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center mr-2">
                <Text className="text-white font-bold text-lg">T</Text>
              </View>
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Thuhroh
              </Text>
            </View>
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
              <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-600 items-center justify-center border-2 border-indigo-200 dark:border-[#252525]">
                <Text className="text-indigo-600 dark:text-white font-bold text-base">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* 2. SEARCH BAR (Scrolls with content) */}
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

        {/* 3. NAVIGATION TABS (Sticky below Header) */}
        <View
          className="bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-[#252525]"
          style={{ zIndex: 100 }}
        >
          <GlassNav
            activeTabIndex={tabs.indexOf(activeTab)}
            totalTabs={tabs.length}
            activeTabName={activeTab}
          >
            <View className="flex-1 flex-row items-center justify-between gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const themeColor = getTabColor(tab);

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="flex-1 py-1 px-1 items-center justify-center"
                    hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
                    delayPressIn={0}
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
                        className={`text-[10px] sm:text-xs font-semibold mt-1 ${
                          isActive ? "" : "text-gray-500 dark:text-[#919191]"
                        }`}
                        style={isActive ? { color: themeColor } : {}}
                      >
                        {tab}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassNav>
        </View>

        {/* 4. MAIN CONTENT */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default Dashboard;
