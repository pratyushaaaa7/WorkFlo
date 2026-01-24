import React from "react";
import { ScrollView, Text, View, useColorScheme } from "react-native";

interface ProjectsTabProps {
  userData: any;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ userData }) => {
  const isDarkMode = useColorScheme() === "dark";

  // Placeholder for projects - you'll connect this to your backend
  const projects = userData?.projects || [];

  return (
    <ScrollView
      className="flex-1 px-5 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {projects.length > 0 ? (
        projects.map((project: any, index: number) => (
          <View
            key={index}
            className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-4"
          >
            <Text className="text-lg font-dmBold text-black dark:text-white mb-2">
              {project.projectName || "Unnamed Project"}
            </Text>
            <Text className="text-[#606060] dark:text-[#919191] text-sm font-poppins mb-2">
              {project.description || "No description available"}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full mr-2">
                <Text className="text-indigo-600 dark:text-[#8E87F1] text-xs font-poppinsMedium">
                  {project.status || "Active"}
                </Text>
              </View>
              {project.role && (
                <View className="bg-[#EBEFF2] dark:bg-[#252525] px-3 py-1.5 rounded-full">
                  <Text className="text-[#454545] dark:text-[#919191] text-xs font-poppinsMedium">
                    {project.role}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <View className="flex-1 items-center justify-center pt-20">
          <Text className="text-[#606060] dark:text-[#919191] font-poppins text-center">
            No projects assigned yet
          </Text>
        </View>
      )}
      <View className="h-20" />
    </ScrollView>
  );
};

export default ProjectsTab;
