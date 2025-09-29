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

const downloadAllProjects = async () => {
  console.log("downloadAllProjects called");
  setDownloading(true);

  try {
    const url = `${api.defaults.baseURL}/export/allProjectsExcel`;
    console.log("Download URL:", url);
    console.log("Platform:", Platform.OS);
    console.log("Token:", token);

    if (!token) {
      console.warn("No token found! Download may fail.");
    }

    if (Platform.OS === "web") {
      // --- Web ---
      console.log("Starting web download...");
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetch response status:", response.status);
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      console.log("Blob received. Size:", blob.size);

      if (blob.size === 0) {
        console.warn("Blob is empty!");
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      console.log("Object URL created:", downloadUrl);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "AllProjects.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Web download triggered successfully");

      Toast.show({
        type: "success",
        text1: "Downloaded",
        text2: "All projects Excel downloaded successfully",
      });
    } else {
      // --- Native ---
      console.log("Starting native download...");
      const fileUri = FileSystem.documentDirectory + "AllProjects.xlsx";
      console.log("File URI:", fileUri);

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log("Downloaded file URI:", uri);

      if (!uri) {
        console.warn("Downloaded URI is empty!");
      }

      if (uri && (await Sharing.isAvailableAsync())) {
        console.log("Sharing available. Opening share dialog...");
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({
          type: "success",
          text1: "Downloaded",
          text2: "Excel saved at " + uri,
        });
      }
    }
  } catch (err: any) {
    console.error("Download error:", err);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: err.message,
    });
  } finally {
    console.log("Download process ended");
    setDownloading(false);
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
