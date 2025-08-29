import { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { Project } from "../types/Project";
import { LinearGradient } from "expo-linear-gradient";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import { Dropdown } from "react-native-element-dropdown";

const ProjectDetails = () => {
  const { project: projectParam, id } = useLocalSearchParams();
  // console.log("ProjectDetails params:", { projectParam, id });
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const itemColor = (status: string) => {
    switch (status) {
      case "active":
        return "#15803d"; // green
      case "hold":
        return "#a16207"; // amber
      case "closed":
        return "#b91c1c"; // red
      default:
        return "#6B7280"; // gray fallback
    }
  };

  // Parse project from params (initial view)
  const initialProject: Project = JSON.parse(projectParam as string);
  const [project, setProject] = useState<Project>(initialProject);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(project.status || null);

  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch fresh project
  const fetchProject = async () => {
    try {
      setLoading(true);
      setActivitiesLoading(true); // ✅ show spinner
      const res = await api.get(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(res.data.project);
      setActivities(res.data.project.activities || []); // ✅ load activities
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };

  // ✅ Update status
  const updateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      const res = await api.put(
        `/projects/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject(res.data);
      // 🔑 instead of only updating project locally, fetch fresh data
      await fetchProject();

      Toast.show({ type: "success", text1: `Status updated to ${newStatus}` });
    } catch (err) {
      console.error("Error updating status:", err);
      Toast.show({ type: "error", text1: "Failed to update status" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Note
  const addNote = async () => {
    if (!note.trim()) return;
    try {
      setLoading(true);
      const res = await api.post(
        `/projects/${id}/notes`,
        { text: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject(res.data);
      setNote("");
      // 🔑 refetch to reload activities and project data
      await fetchProject();
      Toast.show({ type: "success", text1: "Note added" });
    } catch (err) {
      console.error("Error adding note:", err);
      Toast.show({ type: "error", text1: "Failed to add note" });
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProject();
    }, [id])
  );

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No project found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Project Details
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className="p-3">
        {/* Project Info Card */}
        <View className="bg-white rounded-2xl shadow-md p-5 mb-3">
          {/* Project Name + Status */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-semibold text-gray-900">
              {project.projectName}
            </Text>
            <Dropdown
              data={[
                { label: "Active", value: "active", color: "#15803d" },
                { label: "Hold", value: "hold", color: "#a16207" },
                { label: "Closed", value: "closed", color: "#b91c1c" },
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Status"
              value={status}
              onChange={(item) => {
                setStatus(item.value);
                updateStatus(item.value);
              }}
              style={{
                height: 40,
                width: 120, // set a compact width
                borderRadius: 12,
                paddingHorizontal: 12,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: itemColor(status),
                alignSelf: "flex-start", // prevents stretching
              }}
              placeholderStyle={{
                fontSize: 14,
                color: itemColor(status),
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontWeight: "600",
                color: itemColor(status),
              }}
              containerStyle={{
                borderRadius: 12,
                elevation: 4,
              }}
              activeColor="#E0E7FF"
              renderLeftIcon={() => (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: itemColor(status),
                    marginRight: 8,
                  }}
                />
              )}
            />
          </View>

          {/* Info grouped into pairs */}
          {[
            { label: "Company", value: project.company ?? "" },
            { label: "Project Code", value: project.projectCode ?? "" },
            {
              label: "Client Name",
              value: project.clientName ?? "Not specified",
            },
            { label: "Typology", value: project.typology ?? "" },
            { label: "Location", value: project.location ?? "" },
            {
              label: "Start Date",
              value: project.startDate ? formatDate(project.startDate) : "N/A",
            },
            { label: "Site Area", value: project.siteArea ?? "N/A" },
            { label: "Designed Area", value: project.designedArea ?? "N/A" },
            {
              label: "Team Leaders",
              value:
                project.teamLeaders && project.teamLeaders.length > 0
                  ? project.teamLeaders
                      .map((u) => `• ${u.fullName ?? u._id}`)
                      .join("\n")
                  : "No team leaders",
            },
            {
              label: "Team Members",
              value:
                project.teamMembers && project.teamMembers.length > 0
                  ? project.teamMembers
                      .map((u) => `• ${u.fullName ?? u._id}`)
                      .join("\n")
                  : "No team members",
            },
          ]
            .reduce((rows, item, index, arr) => {
              if (index % 2 === 0) rows.push(arr.slice(index, index + 2));
              return rows;
            }, [] as { label: string; value: string }[][])
            .map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row justify-between mb-3">
                {row.map((item, i) => (
                  <View key={i} className="flex-1 mr-2">
                    <Text className="text-gray-500 text-xs font-medium mb-1">
                      {item.label}
                    </Text>
                    <Text className="text-gray-900 text-sm whitespace-pre-line">
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

          {/* Scopes */}
          <View>
            <Text className="text-gray-500 text-xs font-medium mb-1">
              Scopes
            </Text>
            {project.scopes?.length > 0 ? (
              project.scopes.map((scope, index) => (
                <Text key={index} className="text-gray-900 text-sm ml-2 mb-1">
                  • {scope}
                </Text>
              ))
            ) : (
              <Text className="text-gray-400 italic text-sm ml-2">
                No scopes defined
              </Text>
            )}
          </View>
        </View>

        {/* ✅ Add Note */}
        <View className="bg-white rounded-2xl shadow-md p-4 mb-3">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={"#9CA3AF"}
            className="border border-gray-300 rounded-xl px-3 py-2 mb-2"
          />
          <TouchableOpacity
            className="rounded-xl px-2 overflow-hidden"
            onPress={addNote}
          >
            <LinearGradient
              colors={["#34D399", "#059669"]} // Green gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full py-2 items-center"
              style={{ borderRadius: 12 }} // ✅ Apply radius here
            >
              <Text className="text-white font-medium">Add Note</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ✅ Activity Logs */}
        <View className="bg-white rounded-2xl p-3 shadow-md mb-6">
          <Text className="font-semibold text-gray-800 text-lg mb-4">
            Activity Log
          </Text>

          {activitiesLoading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : activities.length === 0 ? (
            <Text className="text-gray-400 text-sm">No activities yet.</Text>
          ) : (
            <View>
              {activities.map((act) => {
                // pick a background color by action type
                const bgColor =
                  act.action === "added"
                    ? "#DCFCE7" // green for added
                    : act.action === "updated"
                    ? "#DBEAFE" // blue for updated
                    : "#F3F4F6"; // default gray

                return (
                  <View
                    key={act._id}
                    className="rounded-xl p-3 mb-2 shadow-sm"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Text className="text-gray-800 text-sm font-medium">
                      {act.fieldChanged === "note"
                        ? "Note Added"
                        : `${act.fieldChanged} ${act.action}`}
                    </Text>

                    {/* Show old → new values if they exist */}
                    {act.previousValue !== undefined &&
                      act.newValue !== undefined &&
                      act.fieldChanged !== "note" && (
                        <Text className="text-xs text-gray-600 mt-1">
                          From:{" "}
                          <Text className="font-normal">
                            {Array.isArray(act.previousValue)
                              ? act.previousValue.join(", ")
                              : act.previousValue || "-"}
                          </Text>{" "}
                          → To:{" "}
                          <Text className="font-medium">
                            {Array.isArray(act.newValue)
                              ? act.newValue.join(", ")
                              : act.newValue || "-"}
                          </Text>
                        </Text>
                      )}

                    {/* Special case for notes */}
                    {act.fieldChanged === "note" && (
                      <Text className="text-xs text-gray-700 italic mt-1">
                        {act.newValue}
                      </Text>
                    )}

                    <Text className="text-xs text-gray-500 mt-1">
                      By {act.performedBy?.fullName || "Unknown"} •{" "}
                      {new Date(act.createdAt).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectDetails;
