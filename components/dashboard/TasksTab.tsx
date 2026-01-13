import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import {
  LayoutAnimation,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Mock data for tasks
const TASKS_DATA = [
  {
    date: "Today Tasks",
    groups: [
      {
        location: "Muthoot Hospital 1B, Dwarka",
        count: 2,
        tasks: [
          {
            id: 1,
            title: "Prepare high-fidelity prototypes",
            description:
              "Present the prototypes to stakeholders for final approval before development.",
            time: "Today",
          },
          {
            id: 2,
            title: "Prepare high-fidelity prototypes",
            description:
              "Present the prototypes to stakeholders for final approval before development.",
            time: "Today",
          },
        ],
      },
      {
        location: "Muthoot Hospital 1B, Dwarka",
        count: 2,
        tasks: [
          {
            id: 3,
            title: "Prepare high-fidelity prototypes",
            description:
              "Present the prototypes to stakeholders for final approval before development.",
            time: "Today",
          },
        ],
      },
    ],
  },
  {
    date: "6 Jan 2025",
    groups: [
      {
        location: "Muthoot Hospital 1B, Dwarka",
        count: 2,
        tasks: [
          {
            id: 4,
            title: "Prepare high-fidelity prototypes",
            description:
              "Present the prototypes to stakeholders for final approval before development.",
            time: "6 Jan 2026",
          },
        ],
      },
    ],
  },
];

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
        <Text className="text-gray-500 dark:text-[#919191] text-xs font-poppins leading-5 mb-2">
          {task.description}
        </Text>
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
              {group.count}
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
          {group.tasks.map((task: any) => (
            <TaskItem key={task.id} task={task} />
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

const TasksTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("MOM Task");
  const isDarkMode = useColorScheme() === "dark";
  const subTabs = ["MOM Task", "Running Notes", "ILR Tasks"];

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
        {TASKS_DATA.map((section, idx) => (
          <TaskSection key={idx} section={section} />
        ))}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
};

export default TasksTab;
