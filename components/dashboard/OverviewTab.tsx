import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Progress03Icon,
  Relieved01Icon,
  SadDizzyIcon,
  SmileIcon,
  WifiOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, isValid, startOfDay } from "date-fns";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";

const OverviewTab = ({
  setActiveTab,
  loading,
  refreshing,
  onRefresh,
  responsibleItems,
  searchQuery = "",
}: {
  setActiveTab: (tab: string) => void;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  responsibleItems: any[];
  searchQuery?: string;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [statsLoading, setStatsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [projectCounts, setProjectCounts] = useState({
    active: 0,
    closed: 0,
    bd: 0,
    inactive: 0,
  });

  const fetchProjectStats = async () => {
    if (!token) return;
    try {
      if (!refreshing) setStatsLoading(true);
      setIsOffline(false);
      const res = await api.get("/projects/status-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.counts) {
        setProjectCounts(res.data.counts);
      }
    } catch (error: any) {
      console.error("Failed to fetch project stats:", error);
      // Check if it's a network error (no response)
      if (!error.response || error.message === "Network Error") {
        setIsOffline(true);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStats();
  }, [token]);

  useEffect(() => {
    if (refreshing) {
      fetchProjectStats();
    }
  }, [refreshing]);

  const projectStats = [
    {
      label: "Active",
      count: projectCounts.active,
      icon: null,
      useMatIcons: true,
      color: "#5B4CCC",
    },
    {
      label: "B.D",
      count: projectCounts.bd,
      icon: Relieved01Icon,
      color: "#0073CB",
    },
    {
      label: "In-Active",
      count: projectCounts.inactive,
      icon: SadDizzyIcon,
      color: "#FFC366",
    },
    {
      label: "Closed",
      count: projectCounts.closed,
      icon: CheckmarkCircle02Icon,
      color: "#1AA45B",
    },
  ];

  // Display only top 5 tasks in overview, filtered by searchQuery
  const filteredTasks = searchQuery.trim()
    ? responsibleItems.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.projectName?.toLowerCase().includes(q) ||
          item.type?.toLowerCase().includes(q)
        );
      })
    : responsibleItems;
  const displayTasks = filteredTasks.slice(0, 5);

  const getDateStatus = (dateString: string | null) => {
    if (!dateString || !isValid(new Date(dateString))) {
      return { color: isDarkMode ? "#919191" : "#454545", text: "For Info" }; // Gray-400
    }

    const date = new Date(dateString);
    const today = startOfDay(new Date());
    const targetDate = startOfDay(date);

    if (targetDate.getTime() === today.getTime()) {
      return { color: "#5B4CCC", text: "Today" }; // Purple
    } else if (targetDate < today) {
      return { color: "#DF5B5B", text: format(date, "d MMM yyyy") }; // Red
    } else {
      return { color: "#1AA45B", text: format(date, "d MMM yyyy") }; // Green
    }
  };

  if (loading) {
    return (
      <View className="py-5 px-3 bg-[#F6F8FA] dark:bg-black flex-1">
        {/* Project Summary Skeleton */}
        <View className="mb-6">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width={150}
            height={24}
            radius={4}
          />
          <View className="flex-row mt-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                colorMode={isDarkMode ? "dark" : "light"}
                width={100}
                height={100}
                radius={16}
              />
            ))}
          </View>
        </View>

        {/* Tasks Skeleton */}
        <View className="mb-6">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width={120}
            height={24}
            radius={4}
          />
          <View className="mt-4 gap-4">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="px-3 py-2 bg-white dark:bg-[#1A1A1A] rounded-2xl"
              >
                <Skeleton
                  colorMode={isDarkMode ? "dark" : "light"}
                  width="80%"
                  height={20}
                  radius={4}
                />
                <View className="mt-2" />
                <Skeleton
                  colorMode={isDarkMode ? "dark" : "light"}
                  width="40%"
                  height={14}
                  radius={4}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Calendar Skeleton */}
        {/* <View>
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width="100%"
            height={300}
            radius={16}
          />
        </View> */}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F6F8FA] dark:bg-black"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5B4CCC"]}
          tintColor="#5B4CCC"
        />
      }
    >
      <View className="py-5 px-3">
        {/* Offline Warning */}
        {isOffline && (
          <View className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-2xl flex-row items-center">
            <View className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full mr-3">
              <HugeiconsIcon icon={WifiOffIcon} size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-800 dark:text-red-200 font-poppinsSemiBold text-sm">
                No Internet Connection
              </Text>
              <Text className="text-red-600 dark:text-red-300 font-poppins text-xs">
                Showing outdated or empty data. Swipe down to retry.
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchProjectStats}
              className="bg-red-500 px-3 py-1.5 rounded-xl ml-2"
            >
              <Text className="text-white font-poppinsMedium text-xs">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Project Summary */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-dmBold text-gray-900 dark:text-white">
              Project Summary
            </Text>
            <TouchableOpacity onPress={() => setActiveTab("Projects")}>
              <Text className="text-[#0073CB] text-sm font-poppinsMedium">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={projectStats}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ gap: 6, paddingRight: 12 }}
            renderItem={({ item: stat }) => (
              <View
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] border border-[#E0E5EB] dark:border-[#2B2B2B] rounded-2xl p-2 px-3"
                style={{ width: 100 }}
              >
                {(stat as any).useMatIcons ? (
                  <MaterialIcons name="radio-button-checked" size={22} color={stat.color} />
                ) : (
                  <HugeiconsIcon icon={stat.icon} size={22} color={stat.color} />
                )}

                <Text className="text-2xl mt-4 font-dmSemiBold text-gray-900 dark:text-[#F5F5F5] mb-1">
                  {statsLoading ? "..." : stat.count}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-[#AAAAAA] font-poppins">
                  {stat.label}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Tasks */}
        <View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-dmBold text-gray-900 dark:text-white">
              Tasks
            </Text>
            <TouchableOpacity onPress={() => setActiveTab("Tasks")}>
              <Text className="text-[#0073CB] text-sm font-poppinsMedium">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {displayTasks.length > 0 ? (
            displayTasks.map((task, idx) => {
              const dateStatus = getDateStatus(task.targetDate);

              const handlePress = () => {
                switch (task.type) {
                  case "MOM":
                    router.push({
                      pathname: "/minuteDetail",
                      params: {
                        minuteId: task.id,
                        meetingId: task.meetingId,
                        issueSubject: task.title,
                        description: task.description,
                        targetDate: task.targetDate,
                        status: task.status,
                        remarks: task.remarks,
                        responsibility: JSON.stringify(
                          task.responsibility || [],
                        ),
                        raisedBy: JSON.stringify(task.raisedBy || []),
                      },
                    });
                    break;
                  case "Running Notes":
                    router.push({
                      pathname: "/runningNotes",
                      params: {
                        projectId: task.projectId,
                        projectName: task.projectName,
                        company: task.company,
                        highlightId: task.id,
                      },
                    });
                    break;
                  case "ILR":
                    router.push({
                      pathname: "/ilrActivities",
                      params: {
                        ilrId: task.id,
                        description: task.description,
                        targetDate: task.targetDate,
                        remarks: task.remarks,
                        status: task.status,
                        ilrNumber: task.ilrNumber,
                        responsibility: JSON.stringify(
                          task.responsibility || [],
                        ),
                        createdBy: task.createdBy,
                        createdAt: task.createdAt,
                      },
                    });
                    break;
                  default:
                    console.warn("Unknown task type:", task.type);
                    break;
                }
              };

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={handlePress}
                  className=" px-3 py-1 pt-2 "
                >
                  {idx !== 0 && (
                    <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#252525] mb-4" />
                  )}
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-start flex-1">
                      <View className="mr-3 mt-1">
                        <HugeiconsIcon
                          icon={Progress03Icon}
                          size={18}
                          color={isDarkMode ? "#5B4CCC" : "#5B4CCC"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className=" font-dmSemiBold text-gray-900 dark:text-white mb-1">
                          {task.title}
                        </Text>

                        {!!task.description && (
                          <Text
                            className="text-sm text-[#454545] dark:text-[#919191] font-poppins mb-2"
                            numberOfLines={2}
                          >
                            {task.description}
                          </Text>
                        )}

                        <View className="flex-row mt-1 items-center justify-between">
                          <View>
                            <Text
                              className="text-[12px] font-poppinsMedium"
                              style={{
                                color: isDarkMode ? "#919191" : "#919191",
                              }}
                            >
                              {task.type === "Running Notes"
                                ? "Running Note"
                                : task.type === "ILR"
                                  ? "ILR"
                                  : task.type === "MOM"
                                    ? "MOM"
                                    : task.type}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <HugeiconsIcon
                              icon={Calendar03Icon}
                              size={14}
                              color={dateStatus.color}
                            />
                            <Text
                              className="ml-1.5 text-[12px] font-poppinsMedium"
                              style={{ color: dateStatus.color }}
                            >
                              {dateStatus.text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 items-center">
              {searchQuery.trim() ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 300 }}
                >
                  <Text
                    className={`text-base font-poppins text-center ${
                      isDarkMode ? "text-[#BBBBBB]" : "text-[#454545]"
                    }`}
                  >
                    No tasks found for{" "}
                    <Text className="font-poppinsMedium text-black dark:text-white">
                      "{searchQuery}"
                    </Text>
                  </Text>
                </MotiView>
              ) : (
                <Text className="text-gray-500 dark:text-gray-400 font-poppins">
                  {isOffline ? "Unable to load tasks" : "You have no tasks :)"}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Calendar Section */}
        {/* <OverviewCalendar
          setActiveTab={setActiveTab}
          responsibleItems={responsibleItems}
        /> */}
      </View>
    </ScrollView>
  );
};

export default OverviewTab;
