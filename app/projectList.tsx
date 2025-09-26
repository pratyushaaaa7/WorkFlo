import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import Toast from "react-native-toast-message";
import { Project } from "../types/Project";
import { LinearGradient } from "expo-linear-gradient";

const ProjectList = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;
  const { company } = useLocalSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!token || !company) return;

    try {
      setLoading(true);
      const res = await api.get("/projects", {
        headers: { Authorization: `Bearer ${token}` },
        params: { company },
      });
      setProjects(res.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
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
      ]
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

  const renderItem = ({ item }: { item: Project }) => (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl mx-4 my-2 shadow-md ">
      {/* Project Info */}
      <TouchableOpacity
        className="flex-1 pr-4"
        onPress={() =>
          router.push({
            pathname: "/projectDetails", // ✅ new page
            params: {
              id: item._id,
              project: JSON.stringify(item),
            },
          })
        }
        activeOpacity={0.7}
      >
        <Text className="text-lg font-semibold text-gray-900">
          {item.projectName}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{item.company}</Text>
      </TouchableOpacity>

      {/* Action Buttons (Edit/ Delete) only for admin */}
      {user?.role === "admin" && (
        <View className="flex-row items-center gap-3">
          {/* Edit Button */}
          <TouchableOpacity
            className="p-2 rounded-full bg-blue-50"
            // onPress={() => console.log("Edit pressed")}
            onPress={() =>
              router.push({
                pathname: "/createProject",
                params: { project: JSON.stringify(item) }, // ✅ pass single project
              })
            }
          >
            <Ionicons name="pencil" size={20} color="blue" />
          </TouchableOpacity>

          {/* Delete Button */}
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
            onPress={() => router.push("/(drawer)/masterProjectList")}
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
          data={projects}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ProjectList;
