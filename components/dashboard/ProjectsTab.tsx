import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { Project } from "../../types/Project";

const ProjectCard = ({ project }: { project: Project }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/projectMain",
      params: {
        projectId: project._id,
        company: project.company,
        projectName: project.projectName,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return {
          bg: "bg-indigo-100 dark:bg-indigo-900/30",
          text: "text-indigo-600 dark:text-[#8E87F1]",
          border: "border-indigo-600 dark:border-[#5B4CCC]",
          dot: "bg-indigo-600 dark:bg-[#5B4CCC]",
        };
      case "bd":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          text: "text-orange-500 dark:text-[#FFB380]",
          border: "border-orange-500 dark:border-[#FFB380]",
          dot: "bg-orange-500 dark:bg-[#FFB380]",
        };
      case "closed":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "text-red-500 dark:text-[#F87171]",
          border: "border-red-500 dark:border-[#F87171]",
          dot: "bg-red-500 dark:bg-[#F87171]",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-[#252525]",
          text: "text-gray-500 dark:text-[#919191]",
          border: "border-gray-400 dark:border-[#606060]",
          dot: "bg-gray-400 dark:bg-[#606060]",
        };
    }
  };

  const colors = getStatusColor(project.status || "");
  const team = [
    ...(project.teamLeaders || []),
    ...(project.teamMembers || []),
  ].slice(0, 4);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 mb-4 border border-gray-100 dark:border-[#252525]"
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View
            className={`${colors.bg} px-3 py-1.5 rounded-full flex-row items-center`}
          >
            <View
              className={`w-4 h-4 rounded-full border-2 ${colors.border} items-center justify-center mr-1.5`}
            >
              <View className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            </View>
            <Text
              className={`${colors.text} text-[10px] font-poppinsMedium capitalize`}
            >
              {project.status || "N/A"}
            </Text>
          </View>
          <View className="bg-gray-100 dark:bg-[#252525] px-3 py-1.5 rounded-full">
            <Text className="text-gray-500 dark:text-[#919191] text-[10px] font-poppinsMedium">
              File No: {project.fileNumber || project.fileNumberNumeric || "—"}
            </Text>
          </View>
        </View>
        <View className="bg-indigo-50 dark:bg-[#252525] px-3 py-1.5 rounded-full">
          <Text className="text-indigo-500 dark:text-[#8E87F1] text-[10px] font-poppinsMedium">
            {project.projectCode || "No Code"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="mb-5">
        <Text className="text-gray-900 dark:text-white text-lg font-poppinsSemiBold mb-2">
          {project.projectName}
        </Text>
        <Text className="text-gray-500 dark:text-[#919191] text-xs font-poppins leading-5">
          {project.location || "No Location Specified"} •{" "}
          {project.typology || "No Typology"}
        </Text>
      </View>

      {/* Footer Row */}
      <View className="flex-row items-center justify-between">
        {/* Avatar Stack */}
        <View className="flex-row">
          {team.length > 0 ? (
            team.map((member, index) => (
              <View
                key={index}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1A1A1A] bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center -mr-3"
              >
                <Text className="text-[10px] font-poppinsBold text-indigo-600 dark:text-indigo-300">
                  {member.fullName?.substring(0, 2).toUpperCase() || "??"}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 text-[10px] font-poppins">
              No team assigned
            </Text>
          )}
        </View>

        {/* Deadline/Start Date */}
        <View className="flex-row items-center opacity-60">
          <HugeiconsIcon icon={Calendar03Icon} size={14} color="#F87171" />
          <Text className="text-red-400 text-[10px] font-poppinsMedium ml-1.5 mt-0.5">
            {project.startDate
              ? new Date(project.startDate).toLocaleDateString()
              : "No Date"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProjectsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("Wal+L");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const auth = useContext(AuthContext);
  const token = auth?.token;
  const isDarkMode = useColorScheme() === "dark";

  const subTabs = ["Wal+L", "WP", "WCorp"];

  const getCompanyValue = (tab: string) => {
    switch (tab) {
      case "Wal+L":
        return "WAL";
      case "WP":
        return "WP";
      case "WCorp":
        return "WCorp";
      default:
        return tab;
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
          params: { company: getCompanyValue(activeSubTab) },
        });
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects for tab:", activeSubTab, err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token, activeSubTab]);

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
            ({projects.length})
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
      <ScrollView
        className="flex-1 px-5 pb-5"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#5B4CCC" />
            <Text className="mt-4 text-gray-500 font-poppinsMedium">
              Loading projects...
            </Text>
          </View>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))
        ) : (
          <View className="py-20 items-center justify-center">
            <Text className="text-gray-400 font-poppinsMedium">
              No projects found for {activeSubTab}
            </Text>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
};

export default ProjectsTab;
