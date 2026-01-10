import {
  AlertCircleIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ClockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import OverviewCalendar from "./OverviewCalendar";

const OverviewTab = () => {
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
    <View className=" py-5 dark:bg-black">
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

      {/* Calendar Section */}
      <OverviewCalendar />
    </View>
  );
};

export default OverviewTab;
