import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { Project } from "../../types/Project";

const ProjectCard = memo(
  function ProjectCard({ project }: { project: Project }) {
    const isDarkMode = useColorScheme() === "dark";
    const router = useRouter();

    // Avatar color palette
    const avatarColors = [
      {
        bg: "bg-indigo-100 dark:bg-indigo-900/50",
        text: "text-indigo-600 dark:text-indigo-300",
      },
      {
        bg: "bg-emerald-100 dark:bg-emerald-900/50",
        text: "text-emerald-600 dark:text-emerald-300",
      },
      {
        bg: "bg-orange-100 dark:bg-orange-900/50",
        text: "text-orange-600 dark:text-orange-300",
      },
      {
        bg: "bg-pink-100 dark:bg-pink-900/50",
        text: "text-pink-600 dark:text-pink-300",
      },
      {
        bg: "bg-cyan-100 dark:bg-cyan-900/50",
        text: "text-cyan-600 dark:text-cyan-300",
      },
      {
        bg: "bg-amber-100 dark:bg-amber-900/50",
        text: "text-amber-600 dark:text-amber-300",
      },
      {
        bg: "bg-violet-100 dark:bg-violet-900/50",
        text: "text-violet-600 dark:text-violet-300",
      },
      {
        bg: "bg-rose-100 dark:bg-rose-900/50",
        text: "text-rose-600 dark:text-rose-300",
      },
    ];

    const getAvatarColor = (name: string, index: number) => {
      // Generate a consistent color based on the name
      const hash =
        name?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) ||
        index;
      return avatarColors[hash % avatarColors.length];
    };

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
            bg: "bg-blue-50 dark:bg-[#06163D]",
            text: "text-blue-500 dark:text-[#3B82F6]",
            border: "border-blue-500 dark:border-[#3B82F6]",
            dot: "bg-blue-500 dark:bg-[#3B82F6]",
          };
        case "closed":
          return {
            bg: "bg-green-50 dark:bg-[#062B1F]",
            text: "text-green-500 dark:text-[#F5F5F5]",
            border: "border-green-500 dark:border-[#22C55E]",
            dot: "bg-green-500 dark:bg-[#22C55E]",
          };
        case "inactive":
        case "in-active":
          return {
            bg: "bg-amber-50 dark:bg-[#422D0A]",
            text: "text-amber-500 dark:text-[#F59E0B]",
            border: "border-amber-500 dark:border-[#F59E0B]",
            dot: "bg-amber-500 dark:bg-[#F59E0B]",
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
                className={`w-4 h-4 rounded-full border-2 ${colors.border} items-center justify-center mr-1.5 overflow-hidden flex-row`}
              >
                {project.status?.toLowerCase() === "active" ? (
                  <>
                    <View className={`flex-1 h-full ${colors.dot}`} />
                    <View className="flex-1 h-full bg-transparent" />
                  </>
                ) : (
                  <View className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                )}
              </View>
              <Text
                className={`${colors.text} text-[10px] font-poppinsMedium capitalize`}
              >
                {project.status || "N/A"}
              </Text>
            </View>
            <View className="bg-gray-100 dark:bg-[#252525] px-3 py-1.5 rounded-full">
              <Text className="text-gray-500 dark:text-[#919191] text-[10px] font-poppinsMedium">
                File No:{" "}
                {project.fileNumber || project.fileNumberNumeric || "—"}
              </Text>
            </View>
          </View>
          <View className="bg-indigo-50 dark:bg-[#252525] px-3 py-1.5 rounded-full">
            <Text className="text-indigo-500 dark:text-[#8E87F1] text-[10px] font-poppinsMedium">
              {project.projectCode || "No Codee"}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="mb-5">
          <Text className="text-gray-900 dark:text-white text-lg font-poppinsSemiBold mb-2">
            {project.projectName}
          </Text>
          <Text className="text-gray-500 dark:text-[#919191] text-xs font-poppins leading-5">
            {project.description || "No Description"}
          </Text>
        </View>

        {/* Footer Row */}
        <View className="flex-row items-center justify-between">
          {/* Avatar Stack */}
          <View className="flex-row">
            {team.length > 0 ? (
              team.map((member, index) => {
                const avatarColor = getAvatarColor(
                  member.fullName || "",
                  index
                );
                return (
                  <View
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#1A1A1A] ${avatarColor.bg} items-center justify-center -mr-3`}
                  >
                    <Text
                      className={`text-[10px] font-poppinsBold ${avatarColor.text}`}
                    >
                      {member.fullName?.substring(0, 2).toUpperCase() || "??"}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-gray-400 text-[10px] font-poppins">
                No team assigned
              </Text>
            )}
          </View>

          {/* Deadline/Start Date */}
          <View className="flex-row items-center ">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={14}
              color={colors.text}
            />
            <Text
              className={`${colors.text} text-[10px] font-poppinsMedium ml-1.5 mt-0.5`}
            >
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : "No Date"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.project._id === next.project._id &&
    prev.project.status === next.project.status
);

const ProjectsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("WALL");
  const [activeStatusFilter, setActiveStatusFilter] = useState("active");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const isDarkMode = useColorScheme() === "dark";

  const subTabs = ["WALL", "WP", "WCORP"];

  // Status filter options with colors
  const statusFilters = [
    {
      key: "active",
      label: "Active",
      color: "#6366F1",
      borderColor: "#6366F1",
    },
    {
      key: "closed",
      label: "Closed",
      color: "#22C55E",
      borderColor: "#22C55E",
    },
    { key: "bd", label: "B.D", color: "#3B82F6", borderColor: "#3B82F6" },
    {
      key: "inactive",
      label: "In-Active",
      color: "#F59E0B",
      borderColor: "#F59E0B",
    },
  ];

  // Filter projects by status - Memoized for performance
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      return project.status?.toLowerCase() === activeStatusFilter;
    });
  }, [projects, activeStatusFilter]);

  const handleStatusPress = (status: string) => {
    if (status === activeStatusFilter) return;
    setVisibleCount(5);
    setActiveStatusFilter(status);
  };

  const getCompanyValue = (tab: string) => {
    switch (tab) {
      case "WALL":
        return "WAL";
      case "WP":
        return "WP";
      case "WCORP":
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

  // Progressive Rendering Effect (Initial load and Tab Switch)
  useEffect(() => {
    setVisibleCount(5);
  }, [activeSubTab]);

  useEffect(() => {
    if (filteredProjects.length > 0 && visibleCount < filteredProjects.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 5);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, filteredProjects]);

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* Sub-Tab Navigation */}
      <View className="flex-row border-b border-gray-100 dark:border-[#252525]  ">
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
                className={`text-sm  font-poppinsMedium ${
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
      <View className="px-5 pt-5 pb-3">
        <Text className="text-2xl font-poppinsSemiBold text-gray-900 dark:text-white">
          Projects{" "}
          <Text className="text-gray-400 dark:text-[#606060] font-poppins">
            ({filteredProjects.length})
          </Text>
        </Text>
      </View>

      {/* Status Filter Pills */}
      <View className="flex-row px-5 pb-4 gap-2 flex-wrap">
        {statusFilters.map((filter) => {
          const isActive = activeStatusFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => handleStatusPress(filter.key)}
              className={`px-2 py-2 rounded-full flex-row items-center gap-2 border ${
                isActive ? "bg-white dark:bg-[#1A1A1A]" : "bg-transparent"
              }`}
              style={{
                borderColor: isActive
                  ? filter.borderColor
                  : isDarkMode
                  ? "#252525"
                  : "#E5E7EB",
              }}
            >
              <View
                className="w-4 h-4 rounded-full border-2 items-center justify-center overflow-hidden flex-row"
                style={{ borderColor: filter.color }}
              >
                {isActive &&
                  (filter.key === "active" ? (
                    <>
                      <View
                        className="flex-1 h-full"
                        style={{ backgroundColor: filter.color }}
                      />
                      <View className="flex-1 h-full bg-transparent" />
                    </>
                  ) : (
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: filter.color }}
                    />
                  ))}
              </View>
              <Text
                className="text-xs font-poppinsMedium"
                style={{
                  color: isActive
                    ? filter.color
                    : isDarkMode
                    ? "#919191"
                    : "#6B7280",
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Project List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#5B4CCC" />
          <Text className="mt-4 text-gray-500 font-poppinsMedium">
            Loading projects...
          </Text>
        </View>
      ) : filteredProjects.length > 0 ? (
        <View className="px-5 pb-20">
          {filteredProjects.slice(0, visibleCount).map((project: Project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center pt-20">
          <Text className="text-gray-400 font-poppinsMedium">
            No {activeStatusFilter} projects found for {activeSubTab}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProjectsTab;
