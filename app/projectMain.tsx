import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Progress03Icon,
  UnavailableIcon,
  MoreHorizontalIcon,
  Edit02Icon,
  Delete03Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Modal, Alert } from "react-native";
import { ProjectInfoModal } from "../components/ProjectInfoModal";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { Skeleton } from "moti/skeleton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { Project } from "../types/Project";

const { width, height } = Dimensions.get("window");
const ITEMS_PER_ROW = 2;
const ITEM_MARGIN = 12;
const ITEM_WIDTH = (width - ITEM_MARGIN * 3) / 2;

const PROJECT_IMAGES = [
  require("../assets/images/projectImage1.jpg"),
  require("../assets/images/projectImage2.jpg"),
  require("../assets/images/projectDefaultImage.jpg"),
];

const sanitizeImages = (data: any): any[] => {
  if (!data) return [];
  if (typeof data === "number") return [data];

  if (typeof data === "string") {
    if (data.startsWith("[")) {
      try {
        const parsed = JSON.parse(data);
        return sanitizeImages(parsed);
      } catch (e) {
        return [];
      }
    }
    if (
      data.startsWith("http") ||
      data.includes("file://") ||
      data.startsWith("data:")
    ) {
      let uri = data.startsWith("file://") ? data.replace("file://", "") : data;
      return [{ uri }];
    }
    return [];
  }

  if (Array.isArray(data)) {
    const flat = data.flatMap((item) => sanitizeImages(item));
    const unique = [];
    const seen = new Set();
    for (const item of flat) {
      const val = typeof item === "number" ? item : item.uri;
      if (!seen.has(val)) {
        seen.add(val);
        unique.push(item);
      }
    }
    return unique;
  }

  if (data && typeof data === "object" && (data.uri || data.url)) {
    return [{ uri: data.uri || data.url }];
  }

  return [];
};

const ProjectMain = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { projectId, company, projectName } = useLocalSearchParams();

  // Theme-based colors
  const colors = {
    background: isDarkMode ? "#000000" : "#F6F8FA",
    containerBg: isDarkMode ? "#121212" : "#FFFFFF",
    cardBg: isDarkMode ? "#1A1A1A" : "#FFFFFF",
    textPrimary: isDarkMode ? "#FFFFFF" : "#000000",
    textSecondary: isDarkMode ? "#9BA1A6" : "#6B7280",
    iconGray: isDarkMode ? "#9BA1A6" : "#6B7280",
    borderColor: isDarkMode ? "#2D2D2D" : "#E5E7EB",
    shadowColor: isDarkMode ? "#FFFFFF" : "#000000",
  };

  console.log(projectId);
  const { token } = useContext(AuthContext) || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("directory");

  const hScrollHandler = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width,
    );
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return {
          bg: "#D7DEF2",
          darkBg: "#282446",
          text: "#5B4CCC",
          icon: null,
          useMatIcons: true,
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
  }: any) => (
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
        {rightLabel !== undefined && (
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
        )}
      </View>
      <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#413E47]" />
    </View>
  );
  // const [images, setImages] = useState<string[]>([]);
  // const [loadingImages, setLoadingImages] = useState(false);

  // ✅ Fetch Project Details + Project Images
  useEffect(() => {
    if (projectId && token) {
      const fetchData = async () => {
        try {
          // Fetch project details
          const res = await api.get(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProject(res.data.project);

          // Fetch project images from unified upload API
          // setLoadingImages(true);
          // const imgRes = await api.get(`/upload/project-images`, {
          //   params: { projectId }, // only this
          //   headers: { Authorization: `Bearer ${token}` },
          // });

          // Extract URLs from response
          // setImages(imgRes.data.map((f: any) => f.url));
        } catch (err: any) {
          console.error(
            "Failed to fetch project data/images:",
            err.message || err,
          );
        } finally {
          // setLoadingImages(false);
        }
      };
      fetchData();
    }
  }, [projectId, token]);

  // Handle Delete Project
  const handleDeleteProject = async () => {
    try {
      if (!projectId || !token) return;
      setShowDeleteModal(false);
      await api.delete(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // ✅ Pick an Image from Device
  // const pickImage = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     quality: 1,
  //   });

  //   if (result.canceled) return;
  //   const file = result.assets[0];
  //   uploadImage(file);
  // };

  // ✅ Upload Image to Backend
  // const uploadImage = async (file: any) => {
  //   if (!token || !projectId) return;

  //   const formData = new FormData();
  //   formData.append(
  //     "file",
  //     {
  //       uri: file.uri,
  //       name: file.fileName || `image_${Date.now()}.jpg`,
  //       type: "image/jpeg",
  //     } as any // Cast to any to satisfy TypeScript
  //   );
  //   formData.append("module", "projectImage"); // important
  //   formData.append("referenceId", String(projectId));
  //   formData.append("fileType", "image");

  //   try {
  //     const res = await api.post("/upload", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     setImages((prev) => [...prev, res.data.file.url]); // update with new image
  //   } catch (err: any) {
  //     console.error("Upload failed:", err.response?.data || err.message);
  //     Alert.alert("Error", "Image upload failed. Please try again.");
  //   }
  const menuItems = [
    {
      key: "directory",
      label: "User directory",
      image: require("../assets/images/projectTabs/userDirectory.png"),
      onPress: () =>
        router.push({
          pathname: "/userDirectory",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
    {
      key: "ilr",
      label: "ILR",
      image: require("../assets/images/projectTabs/ilr.png"),
      onPress: () =>
        router.push({
          pathname: "/ilrs",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
    {
      key: "dpr",
      label: "Reports",
      image: require("../assets/images/projectTabs/dpr.png"),
      onPress: () =>
        router.push({
          pathname: "/dprs",
          params: {
            company,
            projectId,
            projectName,
            teamLeaders: JSON.stringify(project?.teamLeaders || []),
            teamMembers: JSON.stringify(project?.teamMembers || []),
          },
        }),
    },
    {
      key: "svr",
      label: "SVR",
      image: require("../assets/images/projectTabs/svr.png"),
      onPress: () =>
        router.push({
          pathname: "/svrs",
          params: {
            company,
            projectId,
            projectName,
            teamLeaders: JSON.stringify(project?.teamLeaders || []),
            teamMembers: JSON.stringify(project?.teamMembers || []),
          },
        }),
    },
    {
      key: "mom",
      label: "Minutes",
      image: require("../assets/images/projectTabs/minutes.png"),
      onPress: () =>
        router.push({
          pathname: "/minutes",
          params: { company, projectId, projectName },
        }),
    },
    {
      key: "runningNotes",
      label: "Running Notes",
      image: require("../assets/images/projectTabs/runningNotes.png"),
      onPress: () =>
        router.push({
          pathname: "/runningNotes",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
    {
      key: "projectStage",
      label: "Project Stage",
      image: require("../assets/images/projectTabs/projectStage.png"),
      onPress: () =>
        router.push({
          pathname: "/projectStage",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Project Image Background - Carousel */}
        <View style={{ height: height * 0.45, width: "100%" }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={hScrollHandler}
            scrollEventThrottle={16}
          >
            {(() => {
              const sanitized = sanitizeImages(project?.projectImages);
              const displayImages =
                sanitized.length > 0 ? sanitized : PROJECT_IMAGES;
              return displayImages.map((img, index) => (
                <View
                  key={index}
                  style={{ width: width, height: height * 0.45 }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <Skeleton
                      colorMode={isDarkMode ? "dark" : "light"}
                      width={width}
                      height={height * 0.45}
                    />
                  </View>
                  <Image
                    key={index}
                    source={typeof img === "number" ? img : { uri: img.uri }}
                    style={{ width: width, height: height * 0.45 }}
                    contentFit="cover"
                    transition={500}
                  />
                </View>
              ));
            })()}
          </ScrollView>

          {/* Header Overlay Buttons */}
          <View className="absolute top-14 left-6 right-6 flex-row justify-between items-center z-100" style={{ elevation: 10 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center shadow-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              activeOpacity={0.8}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Indicator Dots - Matched with projectDetails */}
          <View
            className="absolute bottom-16 self-center flex-row justify-center items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              zIndex: 60,
            }}
          >
            {(() => {
              const sanitized = sanitizeImages(project?.projectImages);
              const displayImages =
                sanitized.length > 0 ? sanitized : PROJECT_IMAGES;
              return displayImages.map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeImageIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ));
            })()}
          </View>
        </View>

        {/* Content Container */}
        <View
          className="flex-1 -mt-10 rounded-t-[40px] px-4 pt-8"
          style={{
            backgroundColor: colors.containerBg,
            minHeight: height * 0.6,
          }}
        >
          {/* Project Title Area */}
          <View className="w-full flex-row justify-between items-center mb-2">
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              className="flex-row items-center flex-1"
            >
              <Text
                className="text-xl font-dmSemiBold mr-2 flex-1"
                style={{ color: colors.textPrimary }}
                // numberOfLines={1}
              >
                {projectName || project?.projectName || "Loading..."}
              </Text>
              <HugeiconsIcon
                icon={isExpanded ? ArrowUp01Icon : InformationCircleIcon}
                size={22}
                color={isDarkMode ? "#454545" : "#919191"}
              />
            </TouchableOpacity>
          </View>

          {/* Associated Project */}
          {/* {project?.associatedProject && (
            <Text
              className="text-sm font-poppinsMedium text-[#454545] dark:text-[#919191] mt-1"
            >
              Associated Project:{" "}
              {typeof project.associatedProject === "object"
                ? project.associatedProject.projectName || "N/A"
                : project.associatedProject || "N/A"}
            </Text>
          )} */}

          {/* Project Description */}
          {project?.projectDescription && (
            <Text
              className="text-base  leading-6 mt-2 pb-2 border-[#E0E5EB] dark:border-[#413E47]  font-poppins text-[#454545] dark:text-[#919191]"
              style={{ color: colors.textSecondary }}
            >
              {project?.projectDescription}
            </Text>
          )}

          {/* Collapsible Project Info Section */}
          <AnimatePresence>
            {isExpanded && project && (
              <MotiView
                from={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "timing", duration: 300 }}
                className="overflow-hidden"
              >
                <View className="mb-2 mt-2">
                  {/* Divider Top */}
                  <View className="h-[1px] mb-2 bg-[#E0E5EB] dark:bg-[#413E47]" />

                  {/* Project Details Grid (Matched with ProjectDetails.tsx) */}
                  <View>
                    <ModernDataRow
                      leftLabel="Status"
                      leftValue={getStatusStyles(project.status).label}
                      leftIcon={
                        (getStatusStyles(project.status) as any).useMatIcons ? (
                          <MaterialIcons
                            name="radio-button-checked"
                            size={16}
                            color={getStatusStyles(project.status).text}
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={getStatusStyles(project.status).icon}
                            size={16}
                            color={getStatusStyles(project.status).text}
                          />
                        )
                      }
                      leftStyle={{
                        color: getStatusStyles(project.status).text,
                      }}
                      rightLabel="Company"
                      rightValue={project.company || "N/A"}
                      isRightBold
                    />

                    {project.associatedProject && (
                      <ModernDataRow
                        leftLabel="Associated Project"
                        leftValue={
                          typeof project.associatedProject === "object"
                            ? project.associatedProject.projectName || "N/A"
                            : project.associatedProject || "N/A"
                        }
                      />
                    )}

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
                        project.startDate
                          ? formatDate(project.startDate)
                          : "N/A"
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
                        project.partnerInCharge &&
                        project.partnerInCharge.length > 0
                          ? project.partnerInCharge.map(
                              (p: any) => p.fullName || "N/A",
                            )
                          : ["N/A"]
                      }
                      rightLabel="Team Leader"
                      rightValues={
                        project.teamLeaders && project.teamLeaders.length > 0
                          ? project.teamLeaders.map(
                              (u: any) => u.fullName || "N/A",
                            )
                          : ["N/A"]
                      }
                    />

                    <ModernDataRow
                      leftLabel="Team member"
                      leftValues={
                        project.teamMembers && project.teamMembers.length > 0
                          ? project.teamMembers.map(
                              (u: any) => u.fullName || "",
                            )
                          : ["N/A"]
                      }
                      rightLabel="Scopes"
                      rightValues={
                        project.scopes && project.scopes.length > 0
                          ? project.scopes
                          : ["N/A"]
                      }
                    />
                  </View>
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Tabs Grid */}
          <View className="flex-row flex-wrap justify-between   pt-4 pb-10">
            {menuItems.map((item) => (
              <TabCard
                key={item.key}
                label={item.label}
                image={item.image}
                onPress={item.onPress}
                onPressInfo={() => {
                  setActiveInfoTab(item.key);
                  setIsInfoModalVisible(true);
                }}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* PROJECT INFO MODAL */}
      <ProjectInfoModal
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        initialTab={activeInfoTab}
        isDarkMode={isDarkMode}
      />

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
                  params: { projectId: projectId },
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
                router.push({
                  pathname: "/projectDetails",
                  params: { id: projectId, project: JSON.stringify(project) },
                });
              }}
              className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
            >
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={20}
                color={isDarkMode ? "#FFF" : "#000"}
              />
              <Text className="ml-3 text-base font-dmMedium text-black dark:text-white">
                Project Details
              </Text>
            </TouchableOpacity>

            {/* <View className="h-[1px] bg-[#F2F2F2] dark:bg-[#2A2A2A] mx-2" />

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
            </TouchableOpacity> */}
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
            className="w-full bg-white dark:bg-[#111111] rounded-[24px] p-4 shadow-2xl"
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
              Are you sure you want to delete this project?
            </Text>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 h-[56px] items-center justify-center rounded-xl border border-[#E5E7EB] dark:border-[#333333]"
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
    </View>
  );
};

export default ProjectMain;

// --- Performance Optimized Sub-Components ---

const TabCard = React.memo(
  ({ label, image, onPress, onPressInfo, colors, isDarkMode }: any) => {
    return (
      <View
        style={{
          width: ITEM_WIDTH,
          height: ITEM_WIDTH * 0.7,
          marginBottom: 12,
          // Wrapper Shadow (Soft Glow)
          borderRadius: 20,
          shadowColor: "#fff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDarkMode ? 0.08 : 0.02,
          shadowRadius: 25,
          elevation: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.cardBg,
            borderRadius: 20,
            // Card Shadow (Strong Bottom Shadow)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDarkMode ? 0.3 : 0.15,
            shadowRadius: 15,
            elevation: 20,
          }}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
              flex: 1,
              borderRadius: 20,
              padding: 16,
              overflow: "hidden",
            }}
          >
            <View className="flex-row justify-between items-start z-10">
              <Text
                className=" text-[14px] flex-1 mr-2 font-poppinsMedium"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {label}
              </Text>
              <TouchableOpacity onPress={onPressInfo}>
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  color={isDarkMode ? "#919191" : "#454545"}
                />
              </TouchableOpacity>
            </View>

            {/* Improved Large Resource Rendering with expo-image */}
            <View
              className="absolute -bottom-3 -right-6 w-[100%] h-[100%]"
              pointerEvents="none"
            >
              <Image
                source={image}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                transition={300}
                cachePolicy="memory-disk"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
