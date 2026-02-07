import { Ionicons } from "@expo/vector-icons";
import {
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Menu02Icon,
  Progress03Icon,
  Search01Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const ProjectsScreen = () => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const fetchAssignedProjects = async () => {
    try {
      const res = await api.get("/projects/my-assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Based on provided sample: {"projects": [...]}
      if (res.data && res.data.projects) {
        setProjects(res.data.projects);
      } else if (res.data.success && res.data.projects) {
        setProjects(res.data.projects);
      }

      console.log("My projects data:", res.data);
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssignedProjects();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedProjects();
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => {
      const nameMatch = p.projectName?.toLowerCase().includes(query);
      const fileMatch = String(p.fileNumber || "")
        .toLowerCase()
        .includes(query);
      return nameMatch || fileMatch;
    });
  }, [projects, searchQuery]);

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

  const renderProjectItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusStyles(item.status);
    const team = [
      ...(item.teamLeaders || []),
      ...(item.teamMembers || []),
    ].slice(0, 6);

    const formattedDate = item.startDate
      ? new Date(item.startDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/projectMain",
            params: {
              projectId: item._id,
              company: item.company,
              projectName: item.projectName,
            },
          })
        }
        activeOpacity={0.7}
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-3 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800 mx-4"
      >
        {/* Card Header: Badges & Date */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            {/* Status Badge */}
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
                className="text-[10px] font-poppinsMedium ml-1 uppercase"
                style={{ color: statusStyle.text }}
              >
                {statusStyle.label}
              </Text>
            </View>

            {/* File Number Badge */}
            <View className="bg-[#EBEFF2] dark:bg-[#2F2F2F] px-2 py-1 rounded-full">
              <Text className="text-[#454545] dark:text-[#BBBBBB] text-[10px] font-poppinsMedium">
                File No: {item.fileNumber || "—"}
              </Text>
            </View>
          </View>

          {/* Date */}
          {formattedDate && (
            <View className="flex-row items-center">
              <HugeiconsIcon icon={Calendar03Icon} size={14} color="#DF5B5B" />
              <Text className="text-[#DF5B5B] text-[11px] font-poppins ml-1.5 mt-0.5">
                {formattedDate}
              </Text>
            </View>
          )}
        </View>

        {/* Project Name & Description */}
        <Text className="text-black dark:text-white text-lg font-poppinsSemiBold mb-1 leading-6">
          {item.projectName}
        </Text>
        <Text
          className="text-[#454545] dark:text-[#919191] text-sm font-poppins leading-5 mb-4"
          numberOfLines={2}
        >
          {item.description ||
            item.projectDescription ||
            "No description available for this project."}
        </Text>

        {/* Team Avatars */}
        <View className="flex-row items-center">
          {team.map((member, index) => (
            <GlobalAvatar
              key={index}
              name={member.fullName || member.username || "User"}
              index={index}
              size={34}
              fontSize={11}
              className={`border-2 border-white dark:border-[#1A1A1A] ${
                index > 0 ? "-ml-3" : ""
              }`}
            />
          ))}
          {item.teamLeaders?.length + item.teamMembers?.length > 6 && (
            <View className="bg-gray-100 dark:bg-zinc-800 rounded-full w-[34px] h-[34px] items-center justify-center border-2 border-white dark:border-[#1A1A1A] -ml-3">
              <Text className="text-[10px] text-gray-500 font-poppinsMedium">
                +
                {(item.teamLeaders?.length || 0) +
                  (item.teamMembers?.length || 0) -
                  6}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#0D0D0D]">
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* FIXED TOP HEADER */}
      <View className="pt-16 px-4 pb-4 bg-[#FBFCFD] dark:bg-[#0D0D0D]">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
              <HugeiconsIcon
                icon={Menu02Icon}
                size={24}
                color={isDarkMode ? "#FFFFFF" : "#454545"}
              />
            </TouchableOpacity>
            <Text className="text-gray-900 dark:text-white text-xl font-bold ml-4">
              My Projects{" "}
              <Text className="text-[#8E8E8E] font-poppinsMedium text-[14px]">
                ({projects.length})
              </Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <HugeiconsIcon
              icon={showSearch ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#454545"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ANIMATED SEARCH BAR */}
      <AnimatePresence>
        {showSearch && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-4 pb-4"
          >
            <View className="flex-row items-center bg-white dark:bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#E0E5EB] dark:border-[#333] ">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={isDarkMode ? "#A1A1A1" : "#6B7280"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search projects by name, file no..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                className="flex-1 ml-2 text-black dark:text-white text-sm font-poppins"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      <FlatList
        data={filteredProjects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5B4CCC"
          />
        }
        // ListHeaderComponent={() => (
        //   <View className="px-4 mb-4">
        //     <Text className="text-[20px] font-dmSemiBold text-black dark:text-white">
        //       Projects{" "}
        //       <Text className="text-[#8E8E8E] font-poppinsMedium text-[14px]">
        //         ({filteredProjects.length})
        //       </Text>
        //     </Text>
        //   </View>
        // )}
        ListEmptyComponent={() =>
          !loading ? (
            <View className="flex-1 items-center justify-center pt-20">
              <Image
                source={
                  isDarkMode
                    ? require("../assets/images/ghostDarkMode.png")
                    : require("../assets/images/ghostLightMode.png")
                }
                style={{ width: 300, height: 220 }}
                resizeMode="contain"
              />
              <Text className="text-black dark:text-white font-dmSemiBold text-lg">
                No Projects
              </Text>
              <Text className="text-gray-500 font-poppins text-center px-10 mt-2">
                {searchQuery
                  ? `No results found for "${searchQuery}"`
                  : "You don't have any strictly assigned projects yet."}
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center pt-20">
              <ActivityIndicator size="large" color="#5B4CCC" />
              <Text className="mt-4 text-gray-500 font-poppinsMedium">
                Loading projects...
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default ProjectsScreen;
