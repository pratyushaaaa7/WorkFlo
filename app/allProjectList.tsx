import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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
    try {
      setLoading(true);
      const res = await api.get("/projects/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.projects);
      //   console.log(JSON.stringify(res.data, null , 2));
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const [downloading, setDownloading] = useState(false);

  // --- Web download ---
  const downloadAllProjectsWeb = async () => {
    try {
      setDownloading(true);

      const response = await fetch(
        `${api.defaults.baseURL}/export/allProjectsExcel`,
        {
          method: "GET", // ✅ changed to GET
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "AllProjects.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      Toast.show({
        type: "success",
        text1: "Downloaded",
        text2: "All projects Excel downloaded successfully",
      });
    } catch (error) {
      console.error("Excel download error (web):", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to download Excel",
      });
    } finally {
      setDownloading(false);
    }
  };

  // --- Native download ---
  const downloadAllProjectsNative = async () => {
    try {
      setDownloading(true);

      const url = `${api.defaults.baseURL}/export/allProjectsExcel`;
      const fileUri = FileSystem.documentDirectory + "AllProjects.xlsx";

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({
          type: "success",
          text1: "Downloaded",
          text2: "Excel saved at " + uri,
        });
      }
    } catch (error) {
      console.error("Excel download error (native):", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to download Excel",
      });
    } finally {
      setDownloading(false);
    }
  };

  // --- Unified function ---
  const downloadAllProjects = async () => {
    if (Platform.OS === "web") {
      return downloadAllProjectsWeb();
    }
    return downloadAllProjectsNative();
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
        // activeOpacity={0.7}
      >
        <Text className="text-lg font-semibold text-gray-900">
          {item.projectName}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{item.company}</Text>
      </TouchableOpacity>
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
              All Projects
            </Text>
          </TouchableOpacity>

          {/* Download Icon */}
          <TouchableOpacity
            onPress={downloadAllProjects}
            disabled={downloading}
            className="px-2 mr-2 rounded-full bg-white/20 active:bg-white/50 flex-row items-center justify-center"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="download" size={22} color="#fff" />
            )}
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
            No projects found
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
