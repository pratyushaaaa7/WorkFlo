import {
  AlertCircleIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ClockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isToday } from "date-fns";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
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
    <View className=" py-5 dark:bg-black">
      {/* Project Summary */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Project Summary
          </Text>
          <TouchableOpacity onPress={() => setActiveTab("Projects")}>
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
                <HugeiconsIcon icon={stat.icon} size={24} color={stat.color} />
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
          <TouchableOpacity onPress={() => setActiveTab("Tasks")}>
            <Text className="text-indigo-600 dark:text-[#5B4CCC] text-sm font-poppinsMedium">
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
                className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3 flex-row"
              >
                <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3 mt-1">
                  <View className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-[#5B4CCC]" />
                </View>

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
