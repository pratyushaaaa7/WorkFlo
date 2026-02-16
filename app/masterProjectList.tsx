import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Download01Icon,
  Menu02Icon,
  Progress03Icon,
  Search01Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { Project } from "../types/Project";

const TABS = ["ALL", "WP", "WALL", "WCORP"];

const MasterProjectList = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;
  const isAdmin = user?.role === "admin";

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // Company filter
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // Status filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all projects initially
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      // Toast.show({
      //   type: "error",
      //   text1: "Error",
      //   text2: "Failed to fetch projects",
      // });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, []);

  // Handle Delete
  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Toast.show({
                type: "success",
                text1: "Project Deleted",
                position: "bottom",
              });
              fetchProjects();
            } catch (error) {
              console.error(error);
              Toast.show({
                type: "error",
                text1: "Delete Failed",
                position: "bottom",
              });
            }
          },
        },
      ],
    );
  };

  // Export Logic
  const exportToExcel = async () => {
    try {
      if (filteredProjects.length === 0) {
        Toast.show({
          type: "info",
          text1: "No Projects",
          text2: "There are no projects to export in the current view.",
          position: "bottom",
        });
        return;
      }
      setDownloading(true);

      const data = filteredProjects.map((proj, index) => ({
        SNo: index + 1,
        ProjectName: proj.projectName,
        ProjectCode: proj.projectCode,
        Company: proj.company,
        Status: proj.status,
        FileNumber: proj.fileNumber,
        Description: proj.projectDescription,
        Location: proj.location,
        Area: proj.area,
        Typology: proj.typology,
        Scopes: proj.scopes ? proj.scopes.join(", ") : "",
        StartDate: proj.startDate
          ? new Date(proj.startDate).toLocaleDateString()
          : "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projects");

      if (Platform.OS === "web") {
        const wbout = XLSX.write(wb, { type: "binary", bookType: "xlsx" });
        Toast.show({
          type: "info",
          text1: "Download not implemented for web in this view logic yet",
        });
      } else {
        const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        const uri = FileSystem.cacheDirectory + "projects_export.xlsx";
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Share Projects Excel",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (error) {
      console.error("Export failed", error);
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: "An error occurred while exporting.",
        position: "bottom",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Filter Logic
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Company Filter
    if (activeTab !== "ALL") {
      const companyMap: Record<string, string> = {
        WP: "WP",
        WALL: "WAL",
        WCORP: "WCorp",
      };

      const targetCompany = companyMap[activeTab];
      if (targetCompany) {
        result = result.filter(
          (p) =>
            p.company?.includes(targetCompany) ||
            p.company === activeTab ||
            (activeTab === "WALL" && p.company?.toUpperCase() === "WAL"),
        );
      }
    }

    // Status Filter
    if (selectedStatus !== "ALL") {
      const statusMap: Record<string, string> = {
        ACTIVE: "active",
        CLOSED: "closed",
        BD: "bd",
        INACTIVE: "inactive",
      };

      const targetStatus = statusMap[selectedStatus];
      if (targetStatus) {
        result = result.filter((p) => p.status?.toLowerCase() === targetStatus);
      }
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.projectName.toLowerCase().includes(query) ||
          p.fileNumber?.toLowerCase().includes(query) ||
          p.projectDescription?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [projects, activeTab, selectedStatus, searchQuery]);

  // Helper for Status Styles
  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return {
          bg: "bg-[#D7DEF2] dark:bg-[#282446]",
          text: "text-[#5B4CCC] dark:text-[#9486FB]",
          iconColor: isDarkMode ? "#9486FB" : "#5B4CCC",
          icon: DashedLineCircleIcon,
          label: "Active",
        };
      case "bd":
        return {
          bg: "bg-[#E8F0FF] dark:bg-[#101F40]",
          text: "text-[#2F76E6] dark:text-[#2F76E6]",
          iconColor: "#2F76E6",
          icon: Progress03Icon,
          label: "B.D",
        };
      case "inactive":
        return {
          bg: "bg-[#FFEFE5] dark:bg-[#3A1E11]",
          text: "text-[#E6762F] dark:text-[#E6762F]",
          iconColor: "#E6762F",
          icon: UnavailableIcon,
          label: "In-Active",
        };
      case "closed":
        return {
          bg: "bg-[#E8F9ED] dark:bg-[#122E25]",
          text: "text-[#1AA45B] dark:text-[#1AA45B]",
          iconColor: "#1AA45B",
          icon: CheckmarkCircle02Icon,
          label: "Closed",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-600 dark:text-gray-400",
          iconColor: "#4B5563",
          icon: UnavailableIcon, // Fallback
          label: status || "Unknown",
        };
    }
  };

  const renderItem = ({ item }: { item: Project }) => {
    const statusStyle = getStatusStyles(item.status);

    return (
      <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl mx-4 mb-3 p-4  border border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/projectDetails",
              params: {
                id: item._id,
                project: JSON.stringify(item),
              },
            })
          }
        >
          {/* Header Row: Badge | FileNo | Menu */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center space-x-2 gap-2">
              {/* Status Badge */}
              <View
                className={`flex-row items-center px-2 py-1 rounded-full ${statusStyle.bg}`}
              >
                <HugeiconsIcon
                  icon={statusStyle.icon}
                  size={14}
                  color={statusStyle.iconColor}
                />
                <Text
                  className={`text-xs font-poppinsMedium ml-1 ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </Text>
              </View>

              {/* File No Badge */}
              {item.fileNumber && (
                <View className="bg-[#EBEFF2] dark:bg-[#2F2F2F] px-2 py-1 rounded-full">
                  <Text className="text-xs text-[#454545] dark:text-[#BBBBBB] font-poppinsMedium">
                    File No: {item.fileNumber}
                  </Text>
                </View>
              )}
            </View>

            {/* Menu Option */}
            {/* {isAdmin && (
              <TouchableOpacity onPress={() => handleDelete(item._id)}>
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )} */}
          </View>

          {/* Project Title */}
          <Text className="text-lg font-dmMedium text-black dark:text-white mb-1 leading-6">
            {item.projectName}
          </Text>

          {/* Description / Subtitle */}
          <Text
            className="text-sm font-poppins text-[#454545] dark:text-[#919191] leading-5"
            numberOfLines={2}
          >
            {item.projectDescription || "No description."}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#0D0D0D]">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 CUSTOM HEADER */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-16">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="mr-3"
          >
            <HugeiconsIcon
              icon={Menu02Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmBold text-black dark:text-white">
            Project List
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <HugeiconsIcon
              icon={showSearch ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={exportToExcel} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator size="small" color="#5B4CCC" />
            ) : (
              <HugeiconsIcon
                icon={Download01Icon}
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 ANIMATED SEARCH BAR */}
      <AnimatePresence>
        {showSearch && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-4 pb-2"
          >
            <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#E0E5EB] dark:border-[#333]">
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

      {/* Tabs */}
      <View className="flex-row items-center pt-1 justify-between pb-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`py-2 px-2 border-b flex-1 items-center ${isActive ? "border-[#5B4CCC] dark:border-[#5B4CCC]" : "border-[#E0E5EE] dark:border-[#63615F]"}`}
            >
              <Text
                className={` font-poppinsMedium  ${isActive ? "text-[#5B4CCC] dark:text-[#5B4CCC]" : "text-[#454545] dark:text-[#BBBBBB]"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Project Count */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-[20px] font-dmSemiBold text-black dark:text-white">
          Projects{" "}
          <Text className="text-[#8E8E8E] font-poppinsMedium text-[14px]">
            ({filteredProjects.length})
          </Text>
        </Text>
      </View>

      {/* 🔹 STATUS FILTERS */}
      <View className="py-3">
        <FlatList
          horizontal
          data={[
            {
              key: "all",
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
              // color: "#5B4CCC",
              bg: "#D7DEF2",
              darkBg: "#282446",
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
            {
              key: "closed",
              label: "Closed",
              icon: CheckmarkCircle02Icon,
              color: "#1AA45B",
              bg: "#E8F9ED",
              darkBg: "#122E25",
            },
          ]}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive =
              item.key === "all"
                ? selectedStatus === "ALL"
                : item.key === selectedStatus.toLowerCase();

            return (
              <TouchableOpacity
                onPress={() => {
                  if (item.key === "all") {
                    setSelectedStatus("ALL");
                  } else {
                    setSelectedStatus(
                      item.key.toUpperCase() === "BD"
                        ? "BD"
                        : item.key === "inactive"
                          ? "INACTIVE"
                          : item.key.toUpperCase(),
                    );
                  }
                }}
                style={{
                  backgroundColor: isActive
                    ? isDarkMode
                      ? item.darkBg
                      : item.bg
                    : isDarkMode
                      ? "#1A1A1A"
                      : "#F0F3F7",
                  borderColor: isActive
                    ? // ? item.color
                      "transparent"
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

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B4CCC"]}
              tintColor="#5B4CCC"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20 px-8">
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
              <Text className="text-[#454545] font-poppins dark:text-[#919191] mt-2 text-center mt-2">
                {selectedStatus === "ALL"
                  ? `You don't have any project in ${
                      activeTab === "ALL"
                        ? "any company"
                        : activeTab === "WP"
                          ? "WP"
                          : activeTab === "WALL"
                            ? "WAL"
                            : "WCorp"
                    }`
                  : `You don't have any ${
                      selectedStatus === "BD"
                        ? "B.D"
                        : selectedStatus === "INACTIVE"
                          ? "In-Active"
                          : selectedStatus.charAt(0).toUpperCase() +
                            selectedStatus.slice(1).toLowerCase()
                    } project in ${
                      activeTab === "ALL"
                        ? "any company"
                        : activeTab === "WP"
                          ? "WP"
                          : activeTab === "WALL"
                            ? "WALL"
                            : "WCorp"
                    }`}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {isAdmin && (
        <TouchableOpacity
          onPress={() => router.push("/createProject")}
          activeOpacity={0.9}
          style={{
            position: "absolute",
            bottom: 45,
            right: 24,
            width: 50,
            height: 50,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#5B4CCC",
            shadowColor: "#5B4CCC",
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MasterProjectList;
