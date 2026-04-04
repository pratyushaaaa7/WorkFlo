import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isValid } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { MotiView } from "moti";
import {
  ActivityIndicator,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

// Enable LayoutAnimation for Android
// Note: setLayoutAnimationEnabledExperimental is a no-op in the New Architecture

interface CalendarTabProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  responsibleItems: any[];
  searchQuery?: string;
}

const ProgressCircle = ({
  percentage,
  size = 40,
  strokeWidth = 3,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View
      className="items-center justify-center p-1 rounded-full bg-[#F0F3F7] dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800"
      style={{ width: size + 6, height: size + 6 }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDarkMode ? "#252525" : "#F3F4F6"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute bg-transparent items-center justify-center">
        <Text
          className="text-[9px] font-poppinsBold text-gray-800 dark:text-gray-200"
          style={{ marginTop: 1 }}
        >
          {Math.round(percentage)}
        </Text>
      </View>
    </View>
  );
};

const TaskItem = ({ task }: { task: any }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();

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
            targetDate: task.date,
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
            targetDate: task.date,
            remarks: task.remarks,
            status: task.status,
            ilrNumber: task.ilrNumber,
            responsibility: JSON.stringify(task.responsibility || []),
            createdBy: task.createdBy,
            createdAt: task.createdAt,
          },
        });
        break;
    }
  };

  const getBackgroundColor = () => {
    switch (task.type) {
      case "MOM":
        return "#B8D4FF";
      case "Running Notes":
        return "#BFF2D0";
      case "ILR":
        return "#FFD1B8";
      default:
        return "#E5E5E5";
    }
  };

  const getTextColor = () => {
    switch (task.type) {
      case "MOM":
        return "#0073CB";
      case "Running Notes":
        return "#17825A";
      case "ILR":
        return "#A24613";
      case "Notes":
        return "#7F7F7F";
      default:
        return isDarkMode ? "#E5E7EB" : "#374151";
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="mb-4 mx-4 p-4 rounded-2xl"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Text className="text-[15px] font-poppinsMedium text-black mb-2 leading-tight">
        {task.title}
      </Text>

      {task.projectName && (
        <View className="flex-row items-center">
          <Text
            className="text-xs font-poppins"
            style={{ color: getTextColor() }}
          >
            {task.projectName} ({task.type})
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DateSection = ({ group }: { group: any }) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [isExpanded, setIsExpanded] = useState(group.date === today);
  const isDarkMode = useColorScheme() === "dark";

  const rotation = useSharedValue(isExpanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0);
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const dateObj = new Date(group.date);
  const dayName = format(dateObj, "EEEE");
  const monthName = format(dateObj, "MMM");
  const dayNumber = format(dateObj, "d");

  return (
    <View className="mb-2 bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-lg mx-1 ">
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-3"
      >
        <View className="flex-row items-center mr-4 w-12 border-r border-gray-200 dark:border-[#2B2B2B] pr-4">
          <View className="items-center">
            <Text className="text-[10px] font-poppins text-[#454545] dark:text-[#919191] uppercase leading-none mb-1">
              {monthName}
            </Text>
            <Text className="text-[20px] font-dmSemiBold text-gray-900 dark:text-white leading-tight">
              {dayNumber}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="text-xl font-dmSemiBold text-gray-900 dark:text-white">
            {dayName}
          </Text>
        </View>

        <View className="ml-4">
          <Animated.View style={animatedStyle}>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={20}
              color={isDarkMode ? "#BBBBBB" : "#919191"}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="pt-2 pb-2">
          {group.tasks.map((task: any, index: number) => (
            <TaskItem key={index} task={task} />
          ))}
        </View>
      )}
    </View>
  );
};

const CalendarTab = ({
  loading,
  refreshing,
  onRefresh,
  responsibleItems,
  searchQuery = "",
}: CalendarTabProps) => {
  const isDark = useColorScheme() === "dark";
  const transformedData = useMemo(() => {
    if (!responsibleItems) return [];

    const dateGroups: { [key: string]: any[] } = {};

    responsibleItems.forEach((item) => {
      const dateKey =
        item.targetDate && isValid(new Date(item.targetDate))
          ? format(new Date(item.targetDate), "yyyy-MM-dd")
          : "No Date";
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }

      let timeStr = "";
      if (item.targetDate && isValid(new Date(item.targetDate))) {
        const d = new Date(item.targetDate);
        if (d.getHours() !== 0 || d.getMinutes() !== 0) {
          timeStr = format(d, "hh:mm a");
        }
      }

      dateGroups[dateKey].push({
        ...item,
        time: timeStr,
        date: item.targetDate,
      });
    });

    return Object.keys(dateGroups)
      .filter((key) => key !== "No Date")
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date,
        tasks: dateGroups[date].sort((a, b) => {
          if (a.time && b.time) return a.time.localeCompare(b.time);
          if (a.time) return -1;
          if (b.time) return 1;
          return 0;
        }),
      }));
  }, [responsibleItems]);

  // Filter groups by searchQuery — hide date groups with no matching tasks
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return transformedData;
    const q = searchQuery.toLowerCase();
    return transformedData
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter(
          (task: any) =>
            task.title?.toLowerCase().includes(q) ||
            task.description?.toLowerCase().includes(q) ||
            task.projectName?.toLowerCase().includes(q) ||
            task.type?.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.tasks.length > 0);
  }, [transformedData, searchQuery]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      <ScrollView
        className="flex-1 pt-4 pb-20"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B4CCC"]}
            tintColor="#5B4CCC"
          />
        }
      >
        {filteredData.length > 0 ? (
          filteredData.map((group, index) => (
            <DateSection key={index} group={group} />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20 px-6">
            {searchQuery.trim() ? (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 300 }}
              >
                <Text
                  className={`text-base font-poppins text-center ${
                    isDark ? "text-[#BBBBBB]" : "text-[#454545]"
                  }`}
                >
                  No calendar tasks found for{" "}
                  <Text className="font-poppinsMedium text-black dark:text-white">
                    "{searchQuery}"
                  </Text>
                </Text>
              </MotiView>
            ) : (
              <Text className="text-gray-500 dark:text-[#BBBBBB] text-base font-poppinsMedium text-center">
                No tasks found in your calendar
              </Text>
            )}
          </View>
        )}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
};

export default CalendarTab;
