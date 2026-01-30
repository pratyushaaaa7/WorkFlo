import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";

interface ProjectsTabProps {
  userData: any;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ userData }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const { user } = useContext(AuthContext) || {};

  const projects = userData?.projects || [];

  const handleProjectClick = (project: any) => {
    if (user?.role !== "admin") return;
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
        <View className="bg-[#E0E5EB] dark:bg-[#2F2F2F] px-3 py-1 rounded-lg">
          <Text className="text-black dark:text-white text-sm font-dmBold">
            {projects.length}
          </Text>
        </View>
      </View>

      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project: any, index: number) => (
          <TouchableOpacity
            key={project._id || index}
            onPress={() => handleProjectClick(project)}
            activeOpacity={user?.role === "admin" ? 0.7 : 1}
            className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[12px] p-2 mb-4 flex-row items-center"
          >
            {/* Project Image Placeholder */}
            <View className="mr-4">
              <Image
                source={
                  isDarkMode
                    ? require("../../assets/images/ProjectImageDark.jpg")
                    : require("../../assets/images/ProjectImageLight.jpg")
                }
                className=" rounded-[12px]"
                style={{ width: 56, height: 56 }}
                resizeMode="cover"
              />
            </View>

            {/* Project Info */}
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-poppinsMedium text-black dark:text-white mb-0.5"
              >
                {project.projectName || "Unnamed Project"}
              </Text>
              <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
                {project.company || "N/A"}
              </Text>
            </View>

            {/* Chevron (Admin Only) */}
            {user?.role === "admin" && (
              <View className="ml-2">
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={24}
                  color={isDarkMode ? "#919191" : "#454545"}
                />
              </View>
            )}
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
