import {
  AlertCircleIcon,
  Calendar03Icon,
  Calendar04Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  ClockIcon,
  File02Icon,
  FilterHorizontalIcon,
  FilterVerticalIcon,
  Note03Icon,
  Menu02Icon,
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

const Dashboard = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { user } = useAuth();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = ["Overview", "Projects", "Tasks", "Calendar", "Setup"];

  const projectStats = [
    { label: "Active", count: 15, icon: ClockIcon, color: "#6366F1" },
    { label: "6.0", count: 15, icon: Cancel01Icon, color: "#EF4444" },
    { label: "In-Active", count: 15, icon: AlertCircleIcon, color: "#F59E0B" },
    {
      label: "Close",
      count: 15,
      icon: CheckmarkCircle02Icon,
      color: "#10B981",
    },
  ];

  const tasks = [
    {
      id: 1,
      title: "Prepare high-fidelity prototypes",
      description:
        "Present the prototypes to stakeholders for final approval before development.",
      date: "31 Dec 2025",
      dateColor: "#EF4444",
    },
    {
      id: 2,
      title: "Prepare high-fidelity prototypes",
      description:
        "Present the prototypes to stakeholders for final approval before development.",
      date: "16 Jan 2026",
      dateColor: "#10B981",
    },
    {
      id: 3,
      title: "Prepare high-fidelity prototypes",
      description:
        "Present the prototypes to stakeholders for final approval before development.",
      date: "Today",
      dateColor: "#6366F1",
    },
    {
      id: 4,
      title: "Prepare high-fidelity prototypes",
      description:
        "Present the prototypes to stakeholders for final approval before development.",
      date: "For Info",
      dateColor: "#6B7280",
    },
  ];

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* 1. FIXED TOP HEADER (App Name & Profile) */}
      <View className="pt-14 px-3 pb-3 bg-white dark:bg-black z-50 border-b border-gray-50 dark:border-gray-900">
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
        <View className="px-3 pt-3  bg-white dark:bg-black">
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
          style={{ zIndex: 100 }} // ⬅️ Ensure sticky header stays on top natively
        >
          <GlassNav
            activeTabIndex={tabs.indexOf(activeTab)}
            totalTabs={tabs.length}
            activeTabName={activeTab}
          >
            <View className="flex-1 flex-row items-center justify-between gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const themeColor =
                  tab === "Overview"
                    ? "#566FEC"
                    : tab === "Projects"
                    ? "#FF8A47"
                    : tab === "Tasks"
                    ? "#E841B8"
                    : tab === "Calendar"
                    ? "#335EB3"
                    : "#6366F1";

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="flex-1 py-1 px-1 items-center justify-center"
                    hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }} // ⬅️ Increased hitSlop
                    delayPressIn={0} // ⬅️ Instant response
                  >
                    <View className="items-center justify-center">
                      <HugeiconsIcon
                        icon={
                          tab === "Overview"
                            ? Clock01Icon
                            : tab === "Projects"
                            ? File02Icon
                            : tab === "Tasks"
                            ? CheckmarkSquare02Icon
                            : tab === "Calendar"
                            ? Calendar04Icon
                            : Note03Icon
                        }
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
        <View className="px-5 py-5">
          {/* Project Summary */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Project Summary
              </Text>
              <TouchableOpacity>
                <Text className="text-indigo-600 dark:text-[#5B4CCC] text-sm font-poppinsMedium">
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              {projectStats.map((stat, index) => (
                <View
                  key={index}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 items-center"
                  style={{ width: "23%" }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <HugeiconsIcon
                      icon={stat.icon}
                      size={24}
                      color={stat.color}
                    />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.count}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-[#919191] font-poppins">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tasks */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Tasks
              </Text>
              <TouchableOpacity>
                <Text className="text-indigo-600 dark:text-[#5B4CCC] text-sm font-poppinsMedium">
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3 flex-row"
              >
                <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3 mt-1">
                  <View className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-[#5B4CCC]" />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-poppinsMedium text-gray-900 dark:text-white mb-1">
                    {task.title}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-[#919191] font-poppins mb-2">
                    {task.description}
                  </Text>
                  <View className="flex-row items-center">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={14}
                      color={task.dateColor}
                    />
                    <Text
                      className="ml-1 text-xs font-poppinsMedium"
                      style={{ color: task.dateColor }}
                    >
                      {task.date}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Dashboard;
