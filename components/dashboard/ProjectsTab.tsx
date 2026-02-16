import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Progress03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { Project } from "../../types/Project";
import GlobalAvatar from "../GlobalAvatar";

const ProjectCard = memo(
  function ProjectCard({ project }: { project: Project }) {
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

    const getStatusStyles = (status: string) => {
      const s = status?.toLowerCase();
      switch (s) {
        case "active":
          return {
            bg: isDarkMode ? "#282446" : "#D7DEF2",
            text: isDarkMode ? "#9486FB" : "#5B4CCC",
            icon: DashedLineCircleIcon,
            label: "Active",
          };
        case "bd":
          return {
            bg: isDarkMode ? "#101F40" : "#E8F0FF",
            text: "#2F76E6",
            icon: Progress03Icon,
            label: "B.D",
          };
        case "inactive":
        case "in-active":
          return {
            bg: isDarkMode ? "#3A1E11" : "#FFEFE5",
            text: "#E6762F",
            icon: UnavailableIcon,
            label: "In-Active",
          };
        case "closed":
          return {
            bg: isDarkMode ? "#122E25" : "#E8F9ED",
            text: "#1AA45B",
            icon: CheckmarkCircle02Icon,
            label: "Closed",
          };
        default:
          return {
            bg: isDarkMode ? "#1F1F1F" : "#F3F4F6",
            text: "#6B7280",
            icon: UnavailableIcon,
            label: status || "Unknown",
          };
      }
    };

    const statusStyle = getStatusStyles(project.status || "");
    const team = [
      ...(project.teamLeaders || []),
      ...(project.teamMembers || []),
    ].slice(0, 4);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3 border border-gray-100 dark:border-zinc-800"
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            {/* Status Badge - Updated to match MasterProjectList */}
            <View
              className="flex-row items-center px-2 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <HugeiconsIcon
                icon={statusStyle.icon}
                size={14}
                color={statusStyle.text}
              />
              <Text
                className="text-xs font-poppinsMedium ml-1"
                style={{ color: statusStyle.text }}
              >
                {statusStyle.label}
              </Text>
            </View>

            {/* File Number Badge */}
            <View className="bg-[#EBEFF2] dark:bg-[#2F2F2F] px-2 py-1 rounded-full">
              <Text className="text-[#454545] dark:text-[#BBBBBB] text-xs font-poppinsMedium">
                File No:{" "}
                {project.fileNumber || project.fileNumberNumeric || "—"}
              </Text>
            </View>
          </View>
          {/* Deadline/Start Date */}
          {project.startDate && (
            <View className="flex-row items-center">
              <HugeiconsIcon icon={Calendar03Icon} size={13} color="#DF5B5B" />
              <Text className="text-[#DF5B5B] text-[11px] font-poppins ml-1.5 mt-0.5">
                {new Date(project.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="mb-4">
          <Text className="text-black dark:text-white text-lg font-dmMedium mb-1 leading-6">
            {project.projectName}
          </Text>
          <Text
            className="text-[#454545] dark:text-[#919191] text-sm font-poppins leading-5"
            numberOfLines={2}
          >
            {project.description || "No Description"}
          </Text>
        </View>

        {/* Footer Row */}
        <View className="flex-row items-center justify-between">
          {/* Avatar Stack */}
          <View className="flex-row">
            {team.length > 0 ? (
              team.map((member, index) => (
                <GlobalAvatar
                  key={index}
                  name={member.fullName || ""}
                  index={index}
                  size={36}
                  fontSize={12}
                  className="border-2 border-[#F0F3F7] dark:border-[#1A1A1A] -mr-3"
                />
              ))
            ) : (
              <Text className="text-gray-400 text-xs font-poppins">
                No team assigned
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.project._id === next.project._id &&
    prev.project.status === next.project.status,
);

const ProjectsTab = ({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  const [activeSubTab, setActiveSubTab] = useState("WALL");
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const isDarkMode = useColorScheme() === "dark";

  const subTabs = ["WALL", "WP", "WCORP"];

  // Status filter options with updated styling to match MasterProjectList
  const statusFilters = [
    {
      key: "ALL",
      label: "All",
      icon: null,
      color: "#566FEC",
      bg: "#DAE0FA",
      darkBg: "#1C213A",
    },
    {
      key: "active",
      label: "Active",
      icon: DashedLineCircleIcon,
      color: isDarkMode ? "#9486FB" : "#5B4CCC",
      bg: "#D7DEF2",
      darkBg: "#282446",
    },
    {
      key: "closed",
      label: "Closed",
      icon: CheckmarkCircle02Icon,
      color: "#1AA45B",
      bg: "#E8F9ED",
      darkBg: "#122E25",
    },
    {
      key: "bd",
      label: "B.D",
      icon: Progress03Icon,
      color: "#2F76E6",
      bg: "#E8F0FF",
      darkBg: "#101F40",
    },
    {
      key: "inactive",
      label: "In-Active",
      icon: UnavailableIcon,
      color: "#E6762F",
      bg: "#FFEFE5",
      darkBg: "#3A1E11",
    },
  ];

  // Filter projects by status - Memoized for performance
  const filteredProjects = useMemo(() => {
    if (activeStatusFilter === "ALL") {
      return projects;
    }
    return projects.filter((project) => {
      return project.status?.toLowerCase() === activeStatusFilter;
    });
  }, [projects, activeStatusFilter]);

  const handleStatusPress = (status: string) => {
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
    <ScrollView
      className="flex-1 bg-[#FBFCFD] dark:bg-[#0D0D0D]"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5B4CCC"]}
          tintColor="#5B4CCC"
        />
      }
    >
      {/* Sub-Tab Navigation */}
      <View className="flex-row ">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveSubTab(tab)}
              className={`flex-1 items-center pt-4 pb-3 border-b ${isActive ? "border-[#5B4CCC] dark:border-[#5B4CCC]" : "border-[#E0E5EE] dark:border-[#63615F]"}`}
            >
              <Text
                className={`font-poppinsMedium ${
                  isActive
                    ? "text-[#5B4CCC] dark:text-[#5B4CCC]"
                    : "text-[#454545] dark:text-[#BBBBBB]"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-[20px] font-dmSemiBold text-black dark:text-white">
          Projects{" "}
          <Text className="text-[#8E8E8E] font-poppinsMedium text-[14px]">
            ({filteredProjects.length})
          </Text>
        </Text>
      </View>

      {/* Status Filter Pills - Updated to match MasterProjectList */}
      <View className="py-3">
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive = activeStatusFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => handleStatusPress(item.key)}
                style={{
                  backgroundColor: isActive
                    ? isDarkMode
                      ? item.darkBg
                      : item.bg
                    : isDarkMode
                      ? "#1A1A1A"
                      : "#F0F3F7",
                  borderColor: isActive
                    ? "transparent"
                    : isDarkMode
                      ? "#1A1A1A"
                      : "#E0E5EB",
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginRight: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {item.icon && (
                  <HugeiconsIcon
                    icon={item.icon}
                    size={18}
                    color={item.color}
                  />
                )}
                <Text
                  className="font-poppinsMedium text-sm"
                  style={{
                    color: isActive
                      ? item.color
                      : isDarkMode
                        ? "#FFFFFF"
                        : "#000000",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
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
        <View className="px-4 pb-20">
          {filteredProjects.slice(0, visibleCount).map((project: Project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center mt-14">
          <Image
            source={
              isDarkMode
                ? require("../../assets/images/ghostDarkMode.png")
                : require("../../assets/images/ghostLightMode.png")
            }
            style={{ width: 300, height: 220 }}
            resizeMode="contain"
          />
          <Text className="text-black dark:text-white font-dmSemiBold text-lg">
            No Projects
          </Text>
          <Text className="text-[#454545] font-poppins dark:text-[#919191] mt-2 text-center px-10">
            {activeStatusFilter === "ALL"
              ? `You don't have any project in ${getCompanyValue(activeSubTab)}`
              : `You don't have any ${
                  statusFilters.find((f) => f.key === activeStatusFilter)?.label
                } project in ${getCompanyValue(activeSubTab)}`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default ProjectsTab;
