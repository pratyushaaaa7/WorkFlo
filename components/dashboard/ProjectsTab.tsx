import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Mock data for project cards
const PROJECTS_DATA = [
  {
    id: 1,
    status: "Active",
    fileNo: "168",
    progress: "79% Done",
    title: "Prepare high-fidelity prototypes",
    description:
      "Present the prototypes to stakeholders for final approval before development.",
    deadline: "31 Dec 2025",
    subTab: "Wal+L",
    team: [
      "https://randomuser.me/api/portraits/men/1.jpg",
      "https://randomuser.me/api/portraits/women/2.jpg",
      "https://randomuser.me/api/portraits/men/3.jpg",
      "https://randomuser.me/api/portraits/women/4.jpg",
    ],
  },
  {
    id: 2,
    status: "Active",
    fileNo: "168",
    progress: "79% Done",
    title: "Prepare high-fidelity prototypes",
    description:
      "Present the prototypes to stakeholders for final approval before development.",
    deadline: "31 Dec 2025",
    subTab: "Wal+L",
    team: [
      "https://randomuser.me/api/portraits/men/5.jpg",
      "https://randomuser.me/api/portraits/women/6.jpg",
      "https://randomuser.me/api/portraits/men/7.jpg",
      "https://randomuser.me/api/portraits/women/8.jpg",
    ],
  },
  {
    id: 3,
    status: "Active",
    fileNo: "168",
    progress: "79% Done",
    title: "Prepare high-fidelity prototypes",
    description: "No Description",
    deadline: "31 Dec 2025",
    subTab: "WP",
    team: [
      "https://randomuser.me/api/portraits/men/9.jpg",
      "https://randomuser.me/api/portraits/women/10.jpg",
      "https://randomuser.me/api/portraits/men/11.jpg",
      "https://randomuser.me/api/portraits/women/12.jpg",
    ],
  },
];

const ProjectCard = ({ project }: { project: (typeof PROJECTS_DATA)[0] }) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 mb-4 border border-gray-100 dark:border-[#252525]">
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full flex-row items-center">
            <View className="w-4 h-4 rounded-full border-2 border-indigo-600 dark:border-[#5B4CCC] items-center justify-center mr-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-[#5B4CCC]" />
            </View>
            <Text className="text-indigo-600 dark:text-[#8E87F1] text-[10px] font-poppinsMedium">
              {project.status}
            </Text>
          </View>
          <View className="bg-gray-100 dark:bg-[#252525] px-3 py-1.5 rounded-full">
            <Text className="text-gray-500 dark:text-[#919191] text-[10px] font-poppinsMedium">
              File No: {project.fileNo}
            </Text>
          </View>
        </View>
        <View className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full">
          <Text className="text-orange-500 dark:text-[#FFB380] text-[10px] font-poppinsMedium">
            {project.progress}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="mb-5">
        <Text className="text-gray-900 dark:text-white text-lg font-poppinsSemiBold mb-2">
          {project.title}
        </Text>
        <Text className="text-gray-500 dark:text-[#919191] text-xs font-poppins leading-5">
          {project.description}
        </Text>
      </View>

      {/* Footer Row */}
      <View className="flex-row items-center justify-between">
        {/* Avatar Stack */}
        <View className="flex-row">
          {project.team.map((avatar, index) => (
            <View
              key={index}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1A1A1A] -mr-3"
            >
              <Image
                source={{ uri: avatar }}
                className="w-full h-full rounded-full"
              />
            </View>
          ))}
        </View>

        {/* Deadline */}
        <View className="flex-row items-center opacity-60">
          <HugeiconsIcon icon={Calendar03Icon} size={14} color="#F87171" />
          <Text className="text-red-400 text-[10px] font-poppinsMedium ml-1.5 mt-0.5">
            {project.deadline}
          </Text>
        </View>
      </View>
    </View>
  );
};

const ProjectsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("Wal+L");
  const isDarkMode = useColorScheme() === "dark";

  const subTabs = ["Wal+L", "WP", "WCorp"];

  const filteredProjects = PROJECTS_DATA.filter(
    (p) => p.subTab === activeSubTab
  );

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

      {/* List Header */}
      <View className="px-5 py-6 flex-row items-center justify-between">
        <Text className="text-2xl font-poppinsSemiBold text-gray-900 dark:text-white">
          Projects{" "}
          <Text className="text-gray-400 dark:text-[#606060] font-poppins">
            ({filteredProjects.length})
          </Text>
        </Text>
        <TouchableOpacity className="bg-indigo-500/10 dark:bg-[#1A1A1A] px-4 py-2 rounded-full border border-indigo-500/20 dark:border-[#27215880] flex-row items-center gap-2">
          <View className="w-5 h-5 rounded-full border-2 border-indigo-500 items-center justify-center">
            <View className="w-2 h-2 rounded-full bg-indigo-500" />
          </View>
          <Text className="text-indigo-600 dark:text-[#5B4CCC] text-xs font-poppinsMedium">
            Active
          </Text>
        </TouchableOpacity>
      </View>

      {/* Project List */}
      <ScrollView className="flex-1 px-5 pb-5">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ScrollView>
    </View>
  );
};

export default ProjectsTab;
