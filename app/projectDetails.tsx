import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Edit02Icon,
  MoreHorizontalIcon,
  Progress03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { Project } from "../types/Project";

const ProjectDetails = () => {
  const { project: projectParam, id } = useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const initialProject: Project = JSON.parse(projectParam as string);
  const [project, setProject] = useState<Project>(initialProject);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

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
      setProject(res.data.project);
      setActivities(res.data.project.activities || []);
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
      Toast.show({ type: "success", text1: "Note added" });
    } catch (err) {
      console.error("Error adding note:", err);
      Toast.show({ type: "error", text1: "Failed to add note" });
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
      <View className="flex-row justify-between py-4">
        <View className="flex-1">
          <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
            {leftLabel}
          </Text>
          {leftValues ? (
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
          {rightValues ? (
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
              className={`text-[14px] ${isRightBold ? "font-poppinsBold" : "font-poppinsSemiBold"} text-black dark:text-white text-right`}
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
    <View className="flex-1 bg-white dark:bg-[#0D0D0D]">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Project Image Header */}
        <View className="relative w-full h-[380px]">
          <Image
            source={require("../assets/images/projectDefaultImage.jpg")}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Overlay Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-5 w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            activeOpacity={0.8}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Main Content Card */}
        <View
          className="-mt-10 flex-1 bg-white dark:bg-[#121212] rounded-t-[16px] px-4 pt-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {/* Title and More */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[20px] font-dmSemiBold text-black dark:text-white flex-1 mr-4">
              {project.projectName}
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
              />
            </TouchableOpacity>
          </View>

          {project.description && (
            <Text className="text-[14px] font-poppins text-[#454545] dark:text-[#F5F5F5]  mb-2">
              {project.description}
            </Text>
          )}

          {/* Divider */}
          <View className="h-[1px] bg-[#F2F2F2] dark:bg-[#2A2A2A]" />

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
              rightLabel="Serial No."
              rightValue={project.fileNumberNumeric?.toString() || "N/A"}
            />

            <ModernDataRow
              leftLabel="Site Area"
              leftValue={project.siteArea || "N/A"}
              rightLabel="Design Area"
              rightValue={project.designedArea || "N/A"}
            />

            <ModernDataRow
              leftLabel="Partner In charge"
              leftValue={project.partnerInCharge || "N/A"}
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
                Web Name
              </Text>
              <Text className="text-[14px] font-poppinsMedium text-black dark:text-white">
                {project.webName || "-"}
              </Text>
            </View>
          </View>

          {/* Activity Log */}
          <View className="pt-8 pb-4">
            <Text className="text-xl font-dmBold text-black dark:text-white mb-6">
              Activity Log
            </Text>

            {activitiesLoading ? (
              <ActivityIndicator size="large" color="#5B4CCC" />
            ) : activities.length === 0 ? (
              <Text className="text-[#8E8E8E] text-sm font-poppins">
                No activities yet.
              </Text>
            ) : (
              <View>
                {activities.map((act) => {
                  const isNote = act.fieldChanged === "note";
                  const isUpdate = act.action === "updated";

                  return (
                    <View key={act._id} className="mb-6 flex-row">
                      {/* Icon */}
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-4"
                        style={{
                          backgroundColor: isNote
                            ? isDarkMode
                              ? "#122E25"
                              : "#E8F9ED"
                            : isUpdate
                              ? isDarkMode
                                ? "#101F40"
                                : "#E8F0FF"
                              : isDarkMode
                                ? "#1F1F1F"
                                : "#F3F4F6",
                        }}
                      >
                        <HugeiconsIcon
                          icon={
                            isNote
                              ? Edit02Icon
                              : isUpdate
                                ? Progress03Icon
                                : CheckmarkCircle02Icon
                          }
                          size={20}
                          color={
                            isNote
                              ? "#1AA45B"
                              : isUpdate
                                ? "#2F76E6"
                                : "#6B7280"
                          }
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <Text className="text-sm font-poppinsSemiBold text-black dark:text-white mb-1">
                          {isNote
                            ? "Note Added"
                            : `${act.fieldChanged} ${act.action}`}
                        </Text>

                        {/* Note content */}
                        {isNote && (
                          <Text className="text-sm font-poppins text-[#454545] dark:text-[#919191] mb-2">
                            {act.newValue}
                          </Text>
                        )}

                        {/* Update details */}
                        {!isNote &&
                          act.previousValue !== undefined &&
                          act.newValue !== undefined && (
                            <Text className="text-xs font-poppins text-[#8E8E8E] dark:text-[#8E8E8E] mb-2">
                              From:{" "}
                              <Text className="font-poppinsMedium">
                                {Array.isArray(act.previousValue)
                                  ? act.previousValue.join(", ")
                                  : act.previousValue || "-"}
                              </Text>
                              {" → To: "}
                              <Text className="font-poppinsMedium">
                                {Array.isArray(act.newValue)
                                  ? act.newValue.join(", ")
                                  : act.newValue || "-"}
                              </Text>
                            </Text>
                          )}

                        {/* Metadata */}
                        <Text className="text-xs font-poppins text-[#8E8E8E] dark:text-[#8E8E8E]">
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

          {/* Add Note Section */}
          <View className="pb-12">
            <View
              className="rounded-2xl p-4 border"
              style={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F7F8FA",
                borderColor: isDarkMode ? "#333" : "#E8EAED",
              }}
            >
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Write a remark..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                className="text-black dark:text-white font-poppins text-sm min-h-[50px]"
                multiline
                textAlignVertical="top"
              />
              {note.trim() ? (
                <TouchableOpacity
                  onPress={addNote}
                  className="mt-2 self-end bg-[#5B4CCC] px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-poppinsSemiBold text-xs">
                    Post Remark
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectDetails;
