import {
  // AlignLeft01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Delete03Icon,
  Edit02Icon,
  MoreHorizontalIcon,
  Note01Icon,
  Progress03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { Project } from "../types/Project";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PROJECT_IMAGES = [
  require("../assets/images/projectDefaultImage.jpg"),
  require("../assets/images/projectImage1.jpg"),
  require("../assets/images/projectImage2.jpg"),
];

const ProjectDetails = () => {
  const { project: projectParam, id } = useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { bottom } = useSafeAreaInsets();

  /*
   * Removed NavigationBar logic to prevent native module crash.
   * Background color space is handled by pure CSS layout now.
   */

  const initialProject: Project = projectParam
    ? JSON.parse(projectParam as string)
    : null;
  const [project, setProject] = useState<Project | null>(initialProject);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const hScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width,
    );
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [150, 250],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [150, 250],
            [-10, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch fresh project
  const fetchProject = async () => {
    try {
      setLoading(true);
      setActivitiesLoading(true);
      const res = await api.get(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.project) {
        setProject(res.data.project);
        setActivities(res.data.project.activities || []);
      }
      console.log(res.data.project.activities);
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };

  // Add Note
  const addNote = async () => {
    if (!note.trim()) return;
    try {
      setLoading(true);
      const res = await api.post(
        `/projects/${id}/notes`,
        { text: note },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProject(res.data);
      setNote("");
      await fetchProject();
      Toast.show({ type: "success", text1: "Note added", position: "bottom" });
    } catch (err) {
      console.error("Error adding note:", err);
      Toast.show({
        type: "error",
        text1: "Failed to add note",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    try {
      setShowDeleteModal(false);
      setLoading(true);
      await api.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({
        type: "success",
        text1: "Project deleted successfully",
        position: "bottom",
      });
      router.replace("/masterProjectList");
    } catch (err) {
      console.error("Error deleting project:", err);
      Toast.show({
        type: "error",
        text1: "Failed to delete project",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProject();
    }, [id]),
  );

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No project found</Text>
      </View>
    );
  }

  // Helper for Status Styles
  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return {
          bg: "#D7DEF2",
          darkBg: "#282446",
          text: "#5B4CCC",
          icon: DashedLineCircleIcon,
          label: "Active",
        };
      case "bd":
        return {
          bg: "#E8F0FF",
          darkBg: "#101F40",
          text: "#2F76E6",
          icon: Progress03Icon,
          label: "B.D",
        };
      case "inactive":
        return {
          bg: "#FFEFE5",
          darkBg: "#3A1E11",
          text: "#E6762F",
          icon: UnavailableIcon,
          label: "In-Active",
        };
      case "closed":
        return {
          bg: "#E8F9ED",
          darkBg: "#122E25",
          text: "#1AA45B",
          icon: CheckmarkCircle02Icon,
          label: "Closed",
        };
      default:
        return {
          bg: "#F3F4F6",
          darkBg: "#1F1F1F",
          text: "#6B7280",
          icon: UnavailableIcon,
          label: status || "Unknown",
        };
    }
  };

  const statusStyle = getStatusStyles(project.status);

  const ModernDataRow = ({
    leftLabel,
    leftValue,
    leftIcon,
    leftStyle,
    rightLabel,
    rightValue,
    rightStyle,
    isRightBold,
    leftValues,
    rightValues,
  }: {
    leftLabel: string;
    leftValue?: string;
    leftIcon?: any;
    leftStyle?: any;
    rightLabel: string;
    rightValue?: string;
    rightStyle?: any;
    isRightBold?: boolean;
    leftValues?: string[];
    rightValues?: string[];
  }) => (
    <View>
      <View className="flex-row justify-between py-[14px]">
        <View className="flex-1">
          <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
            {leftLabel}
          </Text>
          {Array.isArray(leftValues) ? (
            leftValues.map((v, i) => (
              <Text
                key={i}
                className="text-[14px] font-poppinsMedium text-black dark:text-white"
              >
                {v}
              </Text>
            ))
          ) : (
            <View className="flex-row items-center">
              {leftIcon && <View className="mr-2">{leftIcon}</View>}
              <Text
                className="text-[14px] font-poppinsMedium text-black dark:text-white"
                style={[{ color: isDarkMode ? "#FFF" : "#000" }, leftStyle]}
              >
                {leftValue || "-"}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1 items-end">
          <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
            {rightLabel}
          </Text>
          {Array.isArray(rightValues) ? (
            rightValues.map((v, i) => (
              <Text
                key={i}
                className="text-[14px] font-poppinsMedium text-black dark:text-white text-right"
              >
                {v}
              </Text>
            ))
          ) : (
            <Text
              className={`text-[14px] font-poppinsMedium text-black dark:text-white text-right`}
              style={rightStyle}
            >
              {rightValue || "-"}
            </Text>
          )}
        </View>
      </View>
      <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#413E47]" />
    </View>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000000]">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* STICKY HEADER (SPOTIFY STYLE) */}
      <Animated.View
        className="absolute  top-0 left-0 right-0 z-50 pt-14 pb-3 px-4 pr-5 flex-row items-center justify-between "
        style={[
          {
            backgroundColor: isDarkMode ? "#0D0D0D" : "#FBFCFD",
            // borderColor: isDarkMode ? "#1A1A1A" : "#E0E5EB",
          },
          headerAnimatedStyle,
        ]}
      >
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text
            className="text-lg font-dmSemiBold text-black dark:text-white flex-1"
            numberOfLines={1}
          >
            {project.projectName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          className="ml-4"
        >
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* FAST MENU OVERLAY */}
      {menuVisible && (
        <View
          className="absolute top-8 left-0 right-0 bottom-0 z-[100]"
          pointerEvents="box-none"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setMenuVisible(false)}
          />
          <View
            className="absolute top-16 right-3 bg-white dark:bg-[#1A1A1A] border border-[transparent] dark:border-[#2A2A2A] rounded-2xl p-2"
            style={{
              elevation: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              minWidth: 170,
            }}
          >
            {/* Triangle Pointer */}
            <View
              className="absolute rounded-md right-4 -top-1.5 w-4 h-4 bg-white dark:bg-[#1A1A1A] rotate-45"
              style={{ zIndex: -1 }}
            />

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                router.push({
                  pathname: "/createProject",
                  params: { projectId: id },
                });
              }}
              className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
            >
              <HugeiconsIcon
                icon={Edit02Icon}
                size={20}
                color={isDarkMode ? "#FFF" : "#000"}
              />
              <Text className="ml-3 text-base font-dmMedium text-black dark:text-white">
                Edit
              </Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#F2F2F2] dark:bg-[#2A2A2A] mx-2" />

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                setShowDeleteModal(true);
              }}
              className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
            >
              <HugeiconsIcon icon={Delete03Icon} size={20} color="#DF5B5B" />
              <Text className="ml-3 text-base font-dmBold text-[#DF5B5B]">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center px-4">
          <View className="absolute inset-0 bg-black/50" />

          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          />

          <View
            className="w-full bg-white dark:bg-[#111111] rounded-[32px] p-4 shadow-2xl"
            style={{ elevation: 20 }}
          >
            {/* Red Icon Header */}
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: isDarkMode ? "#3D1A1A" : "#FEE2E2" }}
            >
              <HugeiconsIcon icon={Delete03Icon} size={24} color="#EF4444" />
            </View>

            <Text className="text-[18px] font-dmSemiBold text-black dark:text-white mb-2">
              Delete this Project
            </Text>
            <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#919191] mb-5 leading-6">
              Are you sure you want to delete this project?{"\n"}This action is
              final.
            </Text>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 h-[56px] items-center justify-center rounded-2xl border border-[#E5E7EB] dark:border-[#333333]"
              >
                <Text className="text-lg font-dmBold text-black dark:text-white">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteProject}
                className="flex-1 h-[56px] items-center justify-center rounded-2xl bg-[#DF5B5B]"
              >
                <Text className="text-lg font-dmBold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAwareScrollView
        bottomOffset={10}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Project Image Header Carousel */}
        <View className="relative w-full h-[340px]">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={hScrollHandler}
            scrollEventThrottle={16}
          >
            {(project.projectImages && project.projectImages.length > 0
              ? project.projectImages
              : PROJECT_IMAGES
            ).map((img, index) => (
              <Image
                key={index}
                source={typeof img === "string" ? { uri: img } : img}
                style={{ width: SCREEN_WIDTH, height: 340 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Indicator Dots */}
          <View className="absolute bottom-14 w-full flex-row justify-center space-x-2 gap-2">
            {(project.projectImages && project.projectImages.length > 0
              ? project.projectImages
              : PROJECT_IMAGES
            ).map((_, index) => (
              <View
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === activeImageIndex
                    ? isDarkMode
                      ? "bg-black"
                      : "bg-white"
                    : "bg-[#9CA3AF]"
                }`}
              />
            ))}
          </View>

          {/* Overlay Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            activeOpacity={0.8}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            className="absolute top-12 right-4 w-11 h-11 rounded-full z-50 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content Card */}
        <View
          className="-mt-10 flex-1 bg-[#F0F3F7] dark:bg-[#0D0D0D] rounded-t-[16px] px-4 pt-6"
          // style={{
          //   shadowColor: "#000",
          //   shadowOffset: { width: 0, height: -4 },
          //   shadowOpacity: 0.1,
          //   shadowRadius: 10,
          //   elevation: 10,
          // }}
        >
          {/* Title and More */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[20px] font-dmSemiBold text-black dark:text-white flex-1 mr-4">
              {project.projectName}
            </Text>
          </View>

          {project.projectDescription && (
            <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#F5F5F5] ">
              {project.projectDescription}
            </Text>
          )}

          {/* Divider */}
          <View className="h-[1px] mt-2 bg-[#E0E5EB] dark:bg-[#413E47]" />

          {/* Project Details Grid */}
          <View>
            <ModernDataRow
              leftLabel="Status"
              leftValue={statusStyle.label}
              leftIcon={
                <HugeiconsIcon
                  icon={statusStyle.icon}
                  size={16}
                  color={statusStyle.text}
                />
              }
              leftStyle={{ color: statusStyle.text }}
              rightLabel="Company"
              rightValue={project.company || "N/A"}
              isRightBold
            />

            <ModernDataRow
              leftLabel="Project Code"
              leftValue={project.projectCode || "N/A"}
              rightLabel="Client Name"
              rightValue={project.clientName || "N/A"}
            />

            <ModernDataRow
              leftLabel="Typology"
              leftValue={project.typology || "N/A"}
              rightLabel="Location"
              rightValue={project.location || "N/A"}
            />

            <ModernDataRow
              leftLabel="Start Date"
              leftValue={
                project.startDate ? formatDate(project.startDate) : "N/A"
              }
              rightLabel="Company Serial No."
              rightValue={project.companySerialNumber || "N/A"}
            />

            <ModernDataRow
              leftLabel="Serial No. (Numeric)"
              leftValue={project.fileNumberNumeric?.toString() || "N/A"}
              rightLabel="Web Name"
              rightValue={project.webName || "N/A"}
            />

            <ModernDataRow
              leftLabel="Site Area"
              leftValue={project.siteArea || "N/A"}
              rightLabel="Design Area"
              rightValue={project.designedArea || "N/A"}
            />

            <ModernDataRow
              leftLabel="Partner In charge"
              leftValues={
                project.partnerInCharge && project.partnerInCharge.length > 0
                  ? project.partnerInCharge.map((p) => p.fullName || "N/A")
                  : ["N/A"]
              }
              rightLabel="Team Leader"
              rightValue={
                project.teamLeaders && project.teamLeaders.length > 0
                  ? project.teamLeaders[0].fullName
                  : "N/A"
              }
            />

            <ModernDataRow
              leftLabel="Team member"
              leftValues={
                project.teamMembers && project.teamMembers.length > 0
                  ? project.teamMembers.map((u) => u.fullName || "")
                  : ["N/A"]
              }
              rightLabel="Scopes"
              rightValues={
                project.scopes && project.scopes.length > 0
                  ? project.scopes
                  : ["N/A"]
              }
            />

            <View className="py-4">
              <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#919191] mb-1">
                Project Description
              </Text>
              <Text className="text-[14px] font-poppinsMedium text-black dark:text-white">
                {project.projectDescription || "-"}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-[#FBFCFD] dark:bg-[#000000] px-4">
          {/* Activity Log */}
          <View className="pt-8 pb-12 ">
            <Text className="text-xl font-dmBold text-black dark:text-white mb-6">
              Activity Log
            </Text>

            {activitiesLoading ? (
              <ActivityIndicator size="large" color="#5B4CCC" />
            ) : !Array.isArray(activities) || activities.length === 0 ? (
              <Text className="text-[#8E8E8E] text-sm font-poppins">
                No activities yet.
              </Text>
            ) : (
              <View>
                {activities.map((act) => {
                  if (!act) return null;
                  const isNote = act.fieldChanged === "note";

                  // Themed colors based on action type
                  const cardBg = isNote
                    ? isDarkMode
                      ? "#0A4230"
                      : "#E3F8EB"
                    : isDarkMode
                      ? "#09225A"
                      : "#E9F1FF";
                  const textColor = isDarkMode
                    ? isNote
                      ? "#CAF5DF"
                      : "#BFD6FF"
                    : isNote
                      ? "#454545"
                      : "#000000";
                  const labelColor = textColor;
                  const themeColor = isNote ? "#239F62" : "#6D9EFF";

                  const renderValue = (val: any) => {
                    if (val === undefined || val === null) return "-";
                    if (Array.isArray(val)) return val.join(", ");
                    if (typeof val === "object") return JSON.stringify(val);
                    return String(val);
                  };

                  return (
                    <View
                      key={act._id}
                      className="mb-2 p-3 rounded-2xl flex-row items-start"
                      style={{ backgroundColor: cardBg }}
                    >
                      {/* Icon */}
                      <View className="mr-3 ">
                        <HugeiconsIcon
                          icon={isNote ? Note01Icon : Edit02Icon}
                          size={20}
                          color={themeColor}
                        />
                      </View>

                      {/* Content Area */}
                      <View className="flex-1">
                        <Text
                          className="text-[14px] font-poppinsMedium"
                          style={{
                            color: isDarkMode ? "#FFFFFF" : "#000000",
                          }}
                        >
                          {isNote
                            ? "Note Added"
                            : `${act.fieldChanged || "Detail"} Update`}
                        </Text>

                        {/* Note/Update Content */}
                        {isNote ? (
                          <Text
                            className="text-[14px] font-poppins mb-2"
                            style={{ color: labelColor }}
                          >
                            <Text className="font-poppins">Note : </Text>
                            {renderValue(act.newValue)}
                          </Text>
                        ) : (
                          <View className="mb-2">
                            {act.previousValue !== undefined && (
                              <Text
                                className="text-[12px] font-poppins "
                                style={{ color: labelColor }}
                              >
                                <Text className="font-poppins">From : </Text>
                                {renderValue(act.previousValue)}
                              </Text>
                            )}
                            <Text
                              className="text-[12px] font-poppins"
                              style={{ color: labelColor }}
                            >
                              <Text className="font-poppins">To : </Text>
                              {renderValue(act.newValue)}
                            </Text>
                          </View>
                        )}

                        {/* Metadata */}
                        <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#CCCCCC]">
                          By {act.performedBy?.fullName || "Unknown"} •{" "}
                          {formatDate(act.createdAt)} -{" "}
                          {new Date(act.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Add Note Section - Direct WhatsApp style */}
      </KeyboardAwareScrollView>

      {/* Add Note Section - KeyboardStickyView */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }} // adjust if needed
      >
        <View
          className="px-3 py-2 rounded-t-[24px] border-x border-t flex-row items-end bg-white dark:bg-[#1A1A1A]"
          style={{
            borderTopColor: isDarkMode ? "#222" : "#E0E5EB",
            paddingBottom: bottom > 0 ? bottom : 0,
          }}
        >
          <View className="flex-1 rounded-2xl flex-row items-end   bg-[#F0F3F7] dark:bg-[#1A1A1A]">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Write a Note..."
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              className="flex-1 text-black dark:text-white font-poppins text-[15px]  max-h-[120px]"
              multiline
              style={{ paddingBottom: Platform.OS === "ios" ? 4 : 0 }}
            />
          </View>

          <TouchableOpacity
            onPress={addNote}
            disabled={!note.trim() || loading}
            className={`ml-3 w-11 h-11 rounded-full items-center justify-center shadow-lg ${
              note.trim() ? "bg-[#5B4CCC]" : "bg-[#9CA3AF]"
            }`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
      {/* </KeyboardAvoidingView> was removed */}
    </View>
  );
};

export default ProjectDetails;
