import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Progress03Icon,
  Relieved01Icon,
  SadDizzyIcon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isValid, startOfDay } from "date-fns";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import OverviewCalendar from "./OverviewCalendar";

const OverviewTab = ({
  setActiveTab,
  loading,
  responsibleItems,
}: {
  setActiveTab: (tab: string) => void;
  loading: boolean;
  responsibleItems: any[];
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [statsLoading, setStatsLoading] = useState(false);
  const [projectCounts, setProjectCounts] = useState({
    active: 0,
    closed: 0,
    bd: 0,
    inactive: 0,
  });

  useEffect(() => {
    const fetchProjectStats = async () => {
      if (!token) return;
      try {
        setStatsLoading(true);
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projects = res.data.projects;
        if (Array.isArray(projects)) {
          const counts = { active: 0, closed: 0, bd: 0, inactive: 0 };

          for (const proj of projects) {
            const status = proj.status?.toLowerCase();
            if (status === "active") counts.active++;
            else if (status === "closed" || status === "close") counts.closed++;
            else if (status === "bd" || status === "b.d") counts.bd++;
            else if (status === "inactive" || status === "in-active")
              counts.inactive++;
          }
          setProjectCounts(counts);
        }
      } catch (error) {
        console.error("Failed to fetch project stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchProjectStats();
  }, [token]);

  const projectStats = [
    {
      label: "Active",
      count: projectCounts.active,
      icon: SmileIcon,
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

  // Display only top 5 tasks in overview
  const displayTasks = responsibleItems.slice(0, 5);

  const getDateStatus = (dateString: string | null) => {
    if (!dateString || !isValid(new Date(dateString))) {
      return { color: "#9CA3AF", text: "For Info" }; // Gray-400
    }

    const date = new Date(dateString);
    const today = startOfDay(new Date());
    const targetDate = startOfDay(date);

    if (targetDate.getTime() === today.getTime()) {
      return { color: "#a855f7", text: "Today" }; // Purple
    } else if (targetDate < today) {
      return { color: "#ef4444", text: format(date, "d MMM yyyy") }; // Red
    } else {
      return { color: "#22c55e", text: format(date, "d MMM yyyy") }; // Green
    }
  };

  if (loading) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  return (
    <View className=" py-5 px-3 bg-[#F6F8FA] dark:bg-black">
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
          // className="w-full"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ gap: 6, paddingRight: 12 }}
          renderItem={({ item: stat }) => (
            <View
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] border border-[#E0E5EB] dark:border-[#2B2B2B] rounded-2xl p-2 px-3"
              style={{ width: 100 }}
            >
              <HugeiconsIcon icon={stat.icon} size={22} color={stat.color} />

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
              // ... handlePress logic stays the same
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
                      responsibility: JSON.stringify(task.responsibility || []),
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
                      responsibility: JSON.stringify(task.responsibility || []),
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

                      {/* <View className="flex-row items-center mb-2">
                        <Text className="text-[10px] text-gray-400 dark:text-[#919191] font-poppins">
                          {task.projectName}
                        </Text>
                        <View className="mx-2 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                        <View className="bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                          <Text className="text-[9px] text-indigo-600 dark:text-indigo-300 font-poppinsMedium">
                            {task.type}
                          </Text>
                        </View>
                      </View> */}

                      {!!task.description && (
                        <Text
                          className="text-sm text-[#454545] dark:text-[#919191] font-poppins mb-2"
                          numberOfLines={2}
                        >
                          {task.description}
                        </Text>
                      )}

                      <View className="flex-row mt-1 items-center">
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          size={14}
                          color={dateStatus.color}
                        />
                        <Text
                          className="ml-1.5 text-xs font-poppinsMedium"
                          style={{ color: dateStatus.color }}
                        >
                          {dateStatus.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 items-center">
            <Text className="text-gray-500 font-poppins">
              You have no tasks :)
            </Text>
          </View>
        )}
      </View>

      {/* Calendar Section */}
      <OverviewCalendar setActiveTab={setActiveTab} />
    </View>
  );
};

export default OverviewTab;
