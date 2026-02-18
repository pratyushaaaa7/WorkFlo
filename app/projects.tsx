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
import { Skeleton } from "moti/skeleton";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const TABS = ["ALL", "WP", "WALL", "WCORP"];

const ProjectSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-4 border border-gray-100 dark:border-zinc-800 mx-4"
    style={{ opacity: 0.6 }}
  >
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center gap-2">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={60}
          height={20}
          radius="round"
        />
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={80}
          height={20}
          radius="round"
        />
      </View>
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={70}
        height={16}
        radius={4}
      />
    </View>
    <View className="mb-2">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="70%"
        height={24}
        radius={8}
      />
    </View>
    <View className="mb-4">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="100%"
        height={16}
        radius={4}
      />
      <View className="mt-1">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width="60%"
          height={16}
          radius={4}
        />
      </View>
    </View>
    <View className="flex-row items-center">
      <View className="flex-row">
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ marginLeft: i > 1 ? -12 : 0 }}>
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width={34}
              height={34}
              radius="round"
            />
          </View>
        ))}
      </View>
    </View>
  </View>
);

const ProjectsScreen = () => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const navigation = useNavigation();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const { width: screenWidth } = useWindowDimensions();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const scrollViewRef = useRef<ScrollView>(null);

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

      // console.log("My projects data:", res.data);
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
      // Pre-select tab based on user company from stored user object
      const userCompany = auth?.user?.company?.toUpperCase();
      if (userCompany === "WP" || userCompany === "WProjects") {
        setActiveTab("WP");
      } else if (userCompany === "WAL+L" || userCompany === "WALL") {
        setActiveTab("WALL");
      } else if (userCompany === "WCORP" || userCompany === "WCorp") {
        setActiveTab("WCORP");
      } else if (userCompany && TABS.includes(userCompany)) {
        setActiveTab(userCompany);
      }
    }
  }, [token, auth?.user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedProjects();
  };

  // Handle tab press - scroll to the corresponding tab
  const handleTabPress = (tab: string) => {
    const tabIndex = TABS.indexOf(tab);
    if (tabIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: tabIndex * screenWidth,
        animated: true,
      });
    }
    setActiveTab(tab);
  };

  // Handle scroll event - update active tab based on scroll position
  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(scrollX / screenWidth);
    if (tabIndex >= 0 && tabIndex < TABS.length) {
      setActiveTab(TABS[tabIndex]);
    }
  };

  const filteredProjects = useMemo(() => {
    let list = projects;

    // Filter by Company Tab
    if (activeTab !== "ALL") {
      list = list.filter((p) => {
        const pCompany = p.company?.toUpperCase();
        if (activeTab === "WALL") {
          return (
            pCompany === "WALL" || pCompany === "WAL+L" || pCompany === "WAL"
          );
        }
        if (activeTab === "WP") {
          return pCompany === "WP" || pCompany === "WPROJECTS";
        }
        return pCompany === activeTab;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const nameMatch = p.projectName?.toLowerCase().includes(query);
        const fileMatch = String(p.fileNumber || "")
          .toLowerCase()
          .includes(query);
        const descMatch = (p.description || p.projectDescription || "")
          .toLowerCase()
          .includes(query);
        return nameMatch || fileMatch || descMatch;
      });
    }

    return list;
  }, [projects, searchQuery, activeTab]);

  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return {
          bg: isDarkMode ? "bg-[#282446]" : "bg-[#D7DEF2]",
          text: isDarkMode ? "text-[#9486FB]" : "text-[#5B4CCC]",
          iconColor: isDarkMode ? "#9486FB" : "#5B4CCC",
          icon: DashedLineCircleIcon,
          label: "Active",
        };
      case "bd":
        return {
          bg: isDarkMode ? "bg-[#101F40]" : "bg-[#E8F0FF]",
          text: "text-[#2F76E6]",
          iconColor: "#2F76E6",
          icon: Progress03Icon,
          label: "B.D",
        };
      case "inactive":
      case "in-active":
        return {
          bg: isDarkMode ? "bg-[#3A1E11]" : "bg-[#FFEFE5]",
          text: "text-[#E6762F]",
          iconColor: "#E6762F",
          icon: UnavailableIcon,
          label: "In-Active",
        };
      case "closed":
        return {
          bg: isDarkMode ? "bg-[#122E25]" : "bg-[#E8F9ED]",
          text: "text-[#1AA45B]",
          iconColor: "#1AA45B",
          icon: CheckmarkCircle02Icon,
          label: "Closed",
        };
      default:
        return {
          bg: isDarkMode ? "bg-[#1F1F1F]" : "bg-[#F3F4F6]",
          text: "text-[#6B7280]",
          iconColor: "#6B7280",
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
        className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-4 border border-gray-100 dark:border-zinc-800 mx-4"
      >
        {/* Card Header: Badges & Date */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
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
                className={`text-[11px] font-poppinsMedium ml-1 uppercase ${statusStyle.text}`}
              >
                {statusStyle.label}
              </Text>
            </View>

            {/* File Number Badge */}
            <View className="bg-[#EBEFF2] dark:bg-[#2F2F2F] px-2 py-1 rounded-full">
              <Text className="text-[#454545] dark:text-[#BBBBBB] text-[11px] font-poppinsMedium">
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
        <Text className="text-black dark:text-white text-lg font-dmMedium mb-1 leading-6">
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
              className={`border-2 border-[#F0F3F7] dark:border-[#1A1A1A] ${
                index > 0 ? "-ml-3" : ""
              }`}
            />
          ))}
          {item.teamLeaders?.length + item.teamMembers?.length > 6 && (
            <View className="bg-gray-100 dark:bg-zinc-800 rounded-full w-[34px] h-[34px] items-center justify-center border-2 border-[#F0F3F7] dark:border-[#1A1A1A] -ml-3">
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
      <View className="flex-row items-center justify-between px-4 pb-3 pt-16 bg-[#FBFCFD] dark:bg-[#0D0D0D]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
            <HugeiconsIcon
              icon={Menu02Icon}
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#000000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmBold text-black dark:text-white ml-4">
            My Projects
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <HugeiconsIcon
            icon={showSearch ? Cancel01Icon : Search01Icon}
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
      </View>

      {/* ANIMATED SEARCH BAR */}
      <AnimatePresence>
        {showSearch && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-4 pb-2"
          >
            <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#E0E5EB] dark:border-[#333] ">
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

      {/* COMPANY TABS */}
      <View className="flex-row items-center pt-1 justify-between pb-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(tab)}
              className={`py-2 px-2 border-b flex-1 items-center ${
                isActive
                  ? "border-[#5B4CCC] dark:border-[#5B4CCC]"
                  : "border-[#E0E5EE] dark:border-[#63615F]"
              }`}
            >
              <Text
                className={`font-poppinsMedium  ${
                  isActive
                    ? "text-[#5B4CCC]"
                    : isDarkMode
                      ? "text-[#BBBBBB]"
                      : "text-[#454545]"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Swipeable Content Area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {TABS.map((tab) => {
          // Filter projects for this specific tab
          let tabProjects = projects;
          if (tab !== "ALL") {
            tabProjects = projects.filter((p) => {
              const pCompany = p.company?.toUpperCase();
              if (tab === "WALL") {
                return (
                  pCompany === "WALL" ||
                  pCompany === "WAL+L" ||
                  pCompany === "WAL"
                );
              }
              if (tab === "WP") {
                return pCompany === "WP" || pCompany === "WPROJECTS";
              }
              return pCompany === tab;
            });
          }

          // Apply search filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            tabProjects = tabProjects.filter((p) => {
              const nameMatch = p.projectName?.toLowerCase().includes(query);
              const fileMatch = String(p.fileNumber || "")
                .toLowerCase()
                .includes(query);
              const descMatch = (p.description || p.projectDescription || "")
                .toLowerCase()
                .includes(query);
              return nameMatch || fileMatch || descMatch;
            });
          }

          return (
            <View key={tab} style={{ width: screenWidth }}>
              {/* Project Count */}
              <View className="px-4 pt-4 pb-2">
                <Text className="text-[20px] font-dmSemiBold text-black dark:text-white">
                  Projects{" "}
                  <Text className="text-[#8E8E8E] font-poppinsMedium text-[14px]">
                    ({tabProjects.length})
                  </Text>
                </Text>
              </View>

              <FlatList
                data={tabProjects}
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
                          : `You don't have any assigned projects yet in ${tab}`}
                      </Text>
                    </View>
                  ) : (
                    <View className="pt-2">
                      {[1, 2, 3].map((i) => (
                        <ProjectSkeleton key={i} isDarkMode={isDarkMode} />
                      ))}
                    </View>
                  )
                }
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProjectsScreen;
