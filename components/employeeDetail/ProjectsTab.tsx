import { ArrowRight01Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";

interface ProjectsTabProps {
  userData: any;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ userData }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();

  const projects = userData?.projects || [];

  const handleProjectClick = (project: any) => {
    router.push({
      pathname: "/projectDetails",
      params: {
        id: project._id,
        project: JSON.stringify(project),
      },
    });
  };

  return (
    <View className="px-5 pt-8">
      <View className="flex-row items-center mb-6">
        <Text className="text-2xl font-dmBold text-black dark:text-white mr-3">
          Current Project
        </Text>
        <View className="bg-[#1F1F1F] dark:bg-[#333333] px-3 py-1 rounded-lg">
          <Text className="text-white text-sm font-dmBold">
            {projects.length}
          </Text>
        </View>
      </View>

      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project: any, index: number) => (
          <TouchableOpacity
            key={project._id || index}
            onPress={() => handleProjectClick(project)}
            activeOpacity={0.7}
            className="bg-[#F8F9FB] dark:bg-[#1A1A1A] rounded-[24px] p-4 mb-4 flex-row items-center border border-[#EDF1F5] dark:border-[#252525]"
          >
            {/* Project Image Placeholder */}
            <View className="w-16 h-16 rounded-2xl bg-[#EBEFF5] dark:bg-[#2A2A2A] items-center justify-center mr-4">
              <HugeiconsIcon
                icon={File02Icon}
                size={28}
                color={isDarkMode ? "#606060" : "#AAB5C3"}
              />
            </View>

            {/* Project Info */}
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-dmBold text-black dark:text-white mb-0.5"
              >
                {project.projectName || "Unnamed Project"}
              </Text>
              <Text className="text-[#606060] dark:text-[#919191] text-sm font-poppins">
                {project.company || "N/A"}
              </Text>
            </View>

            {/* Chevron */}
            <View className="ml-2">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={24}
                color={isDarkMode ? "#606060" : "#AAB5C3"}
              />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View className="flex-1 items-center justify-center pt-10">
          <Text className="text-[#606060] dark:text-[#919191] font-poppins text-center">
            No projects assigned yet
          </Text>
        </View>
      )}
      <View className="h-20" />
    </View>
  );
};

export default ProjectsTab;
