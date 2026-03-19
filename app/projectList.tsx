import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { Project } from "../types/Project";

const ProjectList = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;
  const { company } = useLocalSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 New state

  const fetchProjects = async () => {
    if (!token || !company) return;

    try {
      setLoading(true);
      const res = await api.get("/projects", {
        headers: { Authorization: `Bearer ${token}` },
        params: { company },
      });
      setProjects(res.data.projects);
      // console.log (res.data.projects)
    } catch (err) {
      console.error("Failed to fetch projects", err);
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
    fetchProjects();
  }, [token, company]);

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
                text2: "The project has been deleted successfully.",
                position: "bottom",
              });

              fetchProjects();
            } catch (error) {
              console.error(error);
              Toast.show({
                type: "error",
                text1: "Delete Failed",
                text2: "Unable to delete the project.",
                position: "bottom",
              });
            }
          },
        },
      ],
    );
  };

  const exportToExcel = async () => {
    try {
      if (projects.length === 0) {
        Toast.show({
          type: "info",
          text1: "No Projects",
          text2: "There are no projects to export.",
          position: "bottom",
        });
        return;
      }

      // Convert your data into a flat format (avoid nested objects)
      const data = projects.map((proj, index) => ({
        SNo: index + 1,
        ProjectName: proj.projectName,
        ProjectCode: proj.projectCode,
        Company: proj.company,
        Location: proj.location,
        Area: proj.area,
        Typology: proj.typology,
        Scopes: proj.scopes.join(", "),
        StartDate: proj.startDate
          ? new Date(proj.startDate).toLocaleDateString()
          : "",
        TeamLeaders: proj.teamLeaders
          .map((u) => u.username ?? u._id)
          .join(", "),
        TeamMembers: proj.teamMembers
          .map((u) => u.username ?? u._id)
          .join(", "),
      }));

      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projects");

      // Write file to temporary path
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const uri = FileSystem.cacheDirectory + "projects.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Projects Excel",
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  // ✅ Filtered projects using useMemo (case-insensitive)
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) => p.projectName?.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const renderItem = ({ item }: { item: Project }) => (
    <View className="bg-white rounded-2xl mx-4 my-2 p-4 shadow-md flex-row justify-between items-center">
      {/* Left: Project Info */}
      <TouchableOpacity
        className="flex-1 pr-3"
        onPress={() =>
          router.push({
            pathname: "/projectDetails",
            params: {
              id: item._id,
              project: JSON.stringify(item),
            },
          })
        }
        activeOpacity={0.7}
      >
        {/* Project Name */}
        <Text className="text-base font-semibold text-gray-900 mb-2">
          {item.projectName}
        </Text>

        {/* Row with File Number, Status, Company */}
        <View className="flex-row items-center justify-start gap-4">
          {/* File Number */}
          <View className="flex-1">
            <Text className="text-sm text-gray-500 truncate">
              #{item.fileNumber || "—"}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            className={`px-2 py-0.5 rounded-full ${
              item.status === "active"
                ? "bg-green-100"
                : item.status === "BD"
                  ? "bg-yellow-100"
                  : item.status === "inactive"
                    ? "bg-gray-200"
                    : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                item.status === "active"
                  ? "text-green-700"
                  : item.status === "BD"
                    ? "text-yellow-800"
                    : item.status === "inactive"
                      ? "text-gray-700"
                      : "text-red-700"
              }`}
            >
              {item.status?.toUpperCase() || "—"}
            </Text>
          </View>

          {/* Company */}
          <View className="flex-1">
            <Text className="text-sm text-gray-500 truncate">
              {item.company}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right: Action Buttons (Edit/Delete) */}
      {user?.role === "admin" && (
        <View className="flex-row items-center gap-2 ml-2">
          <TouchableOpacity
            className="p-2 rounded-full bg-blue-50"
            onPress={() =>
              router.push({
                pathname: "/createProject",
                // params: { project: JSON.stringify(item) },
                params: { projectId: item._id },
              })
            }
          >
            <Ionicons name="pencil" size={20} color="blue" />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-2 rounded-full bg-red-50"
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={20} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}

      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push("/masterProjectList")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-bold text-white ml-4">
              Project List
            </Text>
          </TouchableOpacity>

          {/* Download Icon */}
          <TouchableOpacity
            onPress={exportToExcel}
            className="px-2 mr-2 rounded-full bg-white/20 active:bg-white/50"
          >
            <Feather name="download" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* 🔍 Search Bar */}
      <View className="flex-row items-center bg-white rounded-full px-3 py-2 shadow-sm">
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-2 text-gray-700"
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : projects.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          {/* Optional: Add illustration here for a friendlier empty state */}
          <Ionicons name="folder-open" size={48} color="#94A3B8" />
          <Text className="text-gray-500 text-lg mt-3 text-center">
            No projects found for{" "}
            <Text className="font-semibold text-gray-700">{company}</Text>
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
        />
      )}
    </View>
  );
};

export default ProjectList;
