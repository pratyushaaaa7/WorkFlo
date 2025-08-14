import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { Ionicons, AntDesign, Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import Toast from "react-native-toast-message";

type Project = {
  _id: string;
  projectName: string;
  projectCode: string;
  location: string;
  area: string;
  typology: string;
  company: string;
  scopes: string[];
  startDate: string; // ISO string
  assignedUsers: { _id: string; username?: string }[];
};

const ProjectList = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const { company } = useLocalSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  

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


  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
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
      const data = projects.map((proj) => ({
        ProjectName: proj.projectName,
        ProjectCode: proj.projectCode,
        Company: proj.company,
        Location: proj.location,
        Area: proj.area,
        Typology: proj.typology,
        Scopes: proj.scopes.join(", "),
        StartDate: new Date(proj.startDate).toLocaleDateString(),
        TeamLeader: proj.assignedUsers
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
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-lg mx-4 my-2 shadow-sm">
      {/* Project Info */}
      <TouchableOpacity
        className="flex-1 pr-4"
        onPress={() => openProjectModal(item)}
        activeOpacity={0.7}
      >
        <Text className="text-lg font-semibold text-gray-900">
          {item.projectName}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{item.company}</Text>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity onPress={() => handleDelete(item._id)}>
        <Ionicons name="trash" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}

      <View
        className="bg-white pt-16 pb-4 px-6 border-b border-gray-200 shadow-md flex-row items-center justify-between"
        style={{ zIndex: 10 }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.push("/masterProjectList")}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-2">Back</Text>
        </TouchableOpacity>

        {/* Download Icon */}
        <TouchableOpacity
          onPress={exportToExcel}
          className="px-2 rounded-full bg-gray-100 active:bg-gray-200"
        >
          <Feather name="download" size={22} color="#1E293B" />
        </TouchableOpacity>
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
          data={projects}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => router.push("/createProject")}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          backgroundColor: "#2563EB",
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <AntDesign name="plus" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          className="flex-1 justify-center items-center bg-black bg-opacity-60 px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }} // darker translucent black background
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85%] shadow-lg relative">
            {/* Close Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                padding: 12,
                zIndex: 20,
                // Optional: add a transparent background to make tap area visible during debugging
                // backgroundColor: 'rgba(255,0,0,0.2)'
              }}
              android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#374151" />
            </Pressable>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ paddingTop: 8 }}
            >
              <Text className="text-2xl font-bold text-gray-900 mb-6  border-gray-200 pb-3">
                Project Details
              </Text>

              {selectedProject && (
                <>
                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">Company</Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.company}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">
                      Typology
                    </Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.typology}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">
                      Project Name
                    </Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.projectName}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">
                      Project Code
                    </Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.projectCode}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">
                      Location
                    </Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.location}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">Area</Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.area}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">Scopes</Text>
                    <Text className="text-gray-900 text-lg">
                      {selectedProject.scopes.join(", ")}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="font-semibold text-gray-700">
                      Start Date
                    </Text>
                    <Text className="text-gray-900 text-lg">
                      {formatDate(selectedProject.startDate)}
                    </Text>
                  </View>

                  <View className="mb-2">
                    <Text className="font-semibold text-gray-700 mb-1">
                      Team Leaders
                    </Text>
                    {selectedProject.assignedUsers.length > 0 ? (
                      selectedProject.assignedUsers.map((user) => (
                        <Text
                          key={user._id}
                          className="text-gray-800 text-base ml-4 mb-1"
                        >
                          - {user.username ?? user._id}
                        </Text>
                      ))
                    ) : (
                      <Text className="text-gray-500 italic ml-4">
                        No team leaders assigned
                      </Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProjectList;
