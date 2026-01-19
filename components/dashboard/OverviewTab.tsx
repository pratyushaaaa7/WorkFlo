import {
  AlertCircleIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ClockIcon,
  Relieved01Icon,
  SadDizzyIcon,
  CancelCircleIcon,
  SmileIcon,
  Progress03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isToday } from "date-fns";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
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

  const getDateDisplay = (dateStr: string) => {
    if (!dateStr) return { text: "No Date", color: "#6B7280" };
    const date = new Date(dateStr);
    if (isToday(date)) return { text: "Today", color: "#6366F1" };
    return { text: format(date, "d MMM yyyy"), color: "#10B981" };
  };

  if (loading) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  return (
    <View className=" py-5 px-2 bg-[#F6F8FA] dark:bg-black">
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
              style={{ width: 105 }}
            >
              <HugeiconsIcon icon={stat.icon} size={20} color={stat.color} />

              <Text className="text-2xl mt-6 font-dmSemiBold text-gray-900 dark:text-[#F5F5F5] mb-1">
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
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
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
            const dateInfo = getDateDisplay(task.targetDate);

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
                className=" rounded-2xl p-4 mb-3 flex-row"
              >
                {/* <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3 mt-1">
                  <View className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-[#5B4CCC]" />
                </View> */}

                <HugeiconsIcon
                  icon={Progress03Icon}
                  size={18}
                  color={task.status === "open" ? "#5B4CCC" : "#5B4CCC"}
                />

                <View className="flex-1">
                  <Text className="text-base font-poppinsMedium text-gray-900 dark:text-white mb-1">
                    {task.title}
                  </Text>
                  <Text className="text-sm text-gray-400 dark:text-[#919191] font-poppins mb-1">
                    {task.projectName}
                  </Text>
                  <View className="flex-row items-center">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={14}
                      color={dateInfo.color}
                    />
                    <Text
                      className="ml-1 text-xs font-poppinsMedium"
                      style={{ color: dateInfo.color }}
                    >
                      {dateInfo.text}
                    </Text>
                    <View className="ml-3 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] text-indigo-600 dark:text-indigo-300 font-poppinsMedium">
                        {task.type}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 items-center">
            <Text className="text-gray-500 font-poppins">No tasks found</Text>
          </View>
        )}
      </View>

      {/* Calendar Section */}
      <OverviewCalendar setActiveTab={setActiveTab} />
    </View>
  );
};

export default OverviewTab;
