import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Edit02Icon,
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

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="mb-4">
      <Text className="text-xs font-poppinsMedium text-[#8E8E8E] dark:text-[#8E8E8E] mb-1">
        {label}
      </Text>
      <Text className="text-sm font-poppins text-[#454545] dark:text-[#BBBBBB]">
        {value || "-"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#0D0D0D]">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="px-4 pt-12 pb-3 flex-row items-center">
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
        <Text className="text-xl font-dmBold text-black dark:text-white flex-1">
          Project Details
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <HugeiconsIcon
            icon={Edit02Icon}
            size={20}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Project Image */}
        <View className="relative mx-4 mt-2 rounded-2xl overflow-hidden">
          <Image
            source={require("../assets/images/projectDefaultImage.jpg")}
            className="w-full h-64"
            resizeMode="cover"
          />
          {/* Status Badge Overlay */}
          <View
            className="absolute bottom-3 left-3 flex-row items-center px-3 py-2 rounded-lg"
            style={{
              backgroundColor: isDarkMode ? statusStyle.darkBg : statusStyle.bg,
            }}
          >
            <HugeiconsIcon
              icon={statusStyle.icon}
              size={16}
              color={statusStyle.text}
            />
            <Text
              className="ml-2 text-sm font-poppinsSemiBold"
              style={{ color: statusStyle.text }}
            >
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Project Title & Description */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xl font-dmBold text-black dark:text-white mb-2">
            {project.projectName}
          </Text>
          <Text className="text-sm font-poppins text-[#454545] dark:text-[#919191] leading-5">
            {project.description ||
              "Present the prototypes to stakeholders for final approval before development."}
          </Text>
        </View>

        {/* Project Details Grid */}
        <View className="px-4 pt-4">
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow label="Status" value={statusStyle.label} />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow label="Company" value={project.company || "N/A"} />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow
                label="Project Code"
                value={project.projectCode || "N/A"}
              />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow
                label="Client name"
                value={project.clientName || "N/A"}
              />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow label="Typology" value={project.typology || "N/A"} />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow label="Location" value={project.location || "N/A"} />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow
                label="Start Date"
                value={
                  project.startDate ? formatDate(project.startDate) : "N/A"
                }
              />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow
                label="Serial No"
                value={project.fileNumberNumeric?.toString() || "N/A"}
              />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow label="Site Area" value={project.siteArea || "N/A"} />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow
                label="Designed Area"
                value={project.designedArea || "N/A"}
              />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow
                label="Partner in charge"
                value={project.partnerInCharge || "N/A"}
              />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow
                label="Team Leader"
                value={
                  project.teamLeaders && project.teamLeaders.length > 0
                    ? project.teamLeaders
                        .map((u) => u.fullName || u._id)
                        .join(", ")
                    : "N/A"
                }
              />
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <InfoRow
                label="Team member"
                value={
                  project.teamMembers && project.teamMembers.length > 0
                    ? project.teamMembers
                        .map((u) => u.fullName || u._id)
                        .join(", ")
                    : "N/A"
                }
              />
            </View>
            <View className="flex-1 ml-2">
              <InfoRow
                label="Scopes"
                value={
                  project.scopes && project.scopes.length > 0
                    ? project.scopes.join(", ")
                    : "N/A"
                }
              />
            </View>
          </View>

          <InfoRow label="Web name" value={project.webName || "N/A"} />
        </View>

        {/* Activity Log */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-xl font-dmBold text-black dark:text-white mb-4">
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
                  <View key={act._id} className="mb-4 flex-row">
                    {/* Icon */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
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
                          isNote ? "#1AA45B" : isUpdate ? "#2F76E6" : "#6B7280"
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
        <View className="px-4 pb-6">
          <View
            className="rounded-xl p-3 border"
            style={{
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              borderColor: isDarkMode ? "#333" : "#E0E5EB",
            }}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Write a remark..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className="text-black dark:text-white font-poppins text-sm"
              multiline
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectDetails;
