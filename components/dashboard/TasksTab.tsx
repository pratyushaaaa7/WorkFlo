import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isToday } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface TasksTabProps {
  loading: boolean;
  myILRs: any[];
  myMeetings: any[];
  myRunningNotes: any[];
}

const TaskItem = ({ task }: { task: any }) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View className="flex-row py-4 border-b border-gray-50 dark:border-[#252525]">
      {/* Split Status Icon */}
      <View className="w-5 h-5 rounded-full border-2 border-indigo-600 dark:border-[#5B4CCC] items-center justify-center mr-3 mt-1 overflow-hidden">
        <View className="w-full h-full flex-row">
          <View className="w-1/2 h-full bg-indigo-600 dark:bg-[#5B4CCC]" />
          <View className="w-1/2 h-full bg-transparent" />
        </View>
      </View>

      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-base font-poppinsSemiBold mb-1">
          {task.title}
        </Text>
        {task.description && (
          <Text className="text-gray-500 dark:text-[#919191] text-xs font-poppins leading-5 mb-2">
            {task.description}
          </Text>
        )}
        <View className="flex-row items-center opacity-70">
          <HugeiconsIcon icon={Calendar03Icon} size={14} color="#6366F1" />
          <Text className="text-indigo-600 dark:text-[#5B4CCC] text-[10px] font-poppinsMedium ml-1.5 pt-0.5">
            {task.time}
          </Text>
        </View>
      </View>
    </View>
  );
};

const TaskGroup = ({ group }: { group: any }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isDarkMode = useColorScheme() === "dark";

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-2">
      <TouchableOpacity
        onPress={toggleExpand}
        className="flex-row items-center justify-between py-3"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-1 h-6 bg-[#2563EB] rounded-full mr-3" />
          <Text
            className="text-gray-900 dark:text-white text-base font-poppinsMedium flex-1 mr-2"
            numberOfLines={1}
          >
            {group.location}
          </Text>
          <View className="bg-gray-200 dark:bg-[#252525] px-2 py-0.5 rounded-md">
            <Text className="text-gray-600 dark:text-[#919191] text-xs font-poppinsBold">
              {group.tasks.length}
            </Text>
          </View>
        </View>
        <HugeiconsIcon
          icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={20}
          color={isDarkMode ? "#919191" : "#6B7280"}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="pl-4">
          {group.tasks.map((task: any, idx: number) => (
            <TaskItem key={idx} task={task} />
          ))}
        </View>
      )}
    </View>
  );
};

const TaskSection = ({ section }: { section: any }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isDarkMode = useColorScheme() === "dark";

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={toggleExpand}
        className="flex-row items-center justify-between py-2 mb-2"
      >
        <Text className="text-gray-900 dark:text-white text-xl font-poppinsBold">
          {section.date}
        </Text>
        <HugeiconsIcon
          icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={24}
          color={isDarkMode ? "#919191" : "#6B7280"}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View>
          {section.groups.map((group: any, idx: number) => (
            <TaskGroup key={idx} group={group} />
          ))}
        </View>
      )}
    </View>
  );
};

const TasksTab = ({
  loading,
  myILRs,
  myMeetings,
  myRunningNotes,
}: TasksTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState("MOM Task");
  const isDarkMode = useColorScheme() === "dark";
  const subTabs = ["MOM Task", "Running Notes", "ILR Tasks"];

  const transformedData = useMemo(() => {
    let sourceData: any[] = [];
    if (activeSubTab === "MOM Task") {
      myMeetings.forEach((m) => {
        m.minutes.forEach((min: any) => {
          sourceData.push({
            id: min._id,
            title: min.issueSubject,
            description: min.remarks,
            date: min.targetDate,
            location: m.projectId?.name || "No Project",
          });
        });
      });
    } else if (activeSubTab === "Running Notes") {
      myRunningNotes.forEach((n) => {
        sourceData.push({
          id: n._id,
          title: n.text,
          description: "",
          date: n.targetDate,
          location: n.project?.name || "No Project",
        });
      });
    } else if (activeSubTab === "ILR Tasks") {
      myILRs.forEach((i) => {
        sourceData.push({
          id: i._id,
          title: i.description,
          description: i.remarks,
          date: i.targetDate,
          location: i.projectId?.name || "No Project",
        });
      });
    }

    // Group by Date
    const dateGroups: { [key: string]: any } = {};

    sourceData.forEach((task) => {
      let dateKey = "No Date";
      let timeStr = "No Date";
      if (task.date) {
        const d = new Date(task.date);
        dateKey = isToday(d) ? "Today Tasks" : format(d, "d MMM yyyy");
        timeStr = format(d, "d MMM yyyy");
      }

      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: dateKey,
          groupsMap: {},
        };
      }

      if (!dateGroups[dateKey].groupsMap[task.location]) {
        dateGroups[dateKey].groupsMap[task.location] = {
          location: task.location,
          tasks: [],
        };
      }

      dateGroups[dateKey].groupsMap[task.location].tasks.push({
        ...task,
        time: timeStr,
      });
    });

    // Convert map to array and sort
    return Object.values(dateGroups).map((section: any) => ({
      date: section.date,
      groups: Object.values(section.groupsMap),
    }));
  }, [activeSubTab, myILRs, myMeetings, myRunningNotes]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* Sub-Tab Navigation */}
      <View className="flex-row border-b border-gray-100 dark:border-[#252525] px-2">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveSubTab(tab)}
              className="flex-1 items-center pt-4 pb-3"
              style={
                isActive
                  ? { borderBottomWidth: 2, borderBottomColor: "#5B4CCC" }
                  : {}
              }
            >
              <Text
                className={`text-sm tracking-wide font-poppinsMedium ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-[#606060]"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-5">
        {transformedData.length > 0 ? (
          transformedData.map((section, idx) => (
            <TaskSection key={idx} section={section} />
          ))
        ) : (
          <View className="items-center py-10">
            <Text className="text-gray-500 font-poppins">No tasks found</Text>
          </View>
        )}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
};

export default TasksTab;
