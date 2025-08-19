import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { Project } from "../types/Project";

const { width } = Dimensions.get("window");
const ITEMS_PER_ROW = 3;
const ITEM_MARGIN = 12;
const ITEM_WIDTH = (width - ITEM_MARGIN * (ITEMS_PER_ROW + 1)) / ITEMS_PER_ROW;

const ProjectMain = () => {
  const router = useRouter();
  const { company, projectId } = useLocalSearchParams();
  const { token } = useContext(AuthContext) || {};
  const [modalVisible, setModalVisible] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  // Fetch project details by ID
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(res.data.project);
        // console.log("Project details:", res.data.project);
      } catch (err: any) {
        console.error("Failed to fetch project details:", err.message || err);
      }
    };

    if (projectId && token) {
      fetchProject();
    }
  }, [projectId, token]);

  const menuItems = [
    {
      key: "directory",
      label: "User Directory",
      icon: (
        <MaterialCommunityIcons name="dots-grid" size={50} color="#8B5CF6" />
      ),
      onPress: () => {
        router.push({
          pathname: "/userDirectory",
          params: { company, projectId, projectName: project?.projectName },
        });
      },
    },
    {
      key: "ilr",
      label: "ILR",
      icon: <Ionicons name="clipboard-outline" size={50} color="#F59E0B" />,
      onPress: () => {
        // router.push("/ilr");
      },
    },
    {
      key: "mom",
      label: "Minutes of Meeting",
      icon: <MaterialIcons name="edit-document" size={50} color="#3B82F6" />,
      onPress: () => {
        // router.push("/mom");
      },
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Back button */}
      <View
        className="pt-16 px-4 pb-6 bg-white"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/projects")}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* Project title + More Info button */}
      <View className="flex-row items-center justify-between px-6 mt-6">
        <Text className="text-2xl font-bold text-[#1E293B]">
          {project?.projectName || "Loading project..."}
        </Text>
        <TouchableOpacity
          className="bg-red-300 px-3 py-2 rounded-lg"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-lg text-gray-700 font-medium">More Info</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Grid */}
      <View
        className="flex-row flex-wrap pt-6 px-3 justify-between"
        style={{ gap: ITEM_MARGIN }}
      >
        {menuItems.map(({ key, label, icon, onPress }) => (
          <TouchableOpacity
            key={key}
            onPress={onPress}
            className="items-center mb-6"
            style={{ width: ITEM_WIDTH }}
          >
            <View className="w-20 h-20 rounded-full bg-gray-100 justify-center items-center shadow-md mb-2">
              {icon}
            </View>
            <Text className="text-gray-700 font-semibold text-center text-base">
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Project Info Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-11/12 rounded-2xl p-4 max-h-[80%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xl font-bold mb-4">
                {project?.projectName}
              </Text>

              <Text className="mb-1">📍 Location: {project?.location}</Text>
              <Text className="mb-1">🏢 Company: {project?.company}</Text>
              <Text className="mb-1">📐 Area: {project?.area}</Text>
              <Text className="mb-1">
                🏷️ Project Code: {project?.projectCode}
              </Text>
              <Text className="mb-1">🏡 Typology: {project?.typology}</Text>

              <Text className="mt-2 font-semibold">👥 Assigned Users:</Text>
              {project?.assignedUsers?.map((user) => (
                <Text key={user._id}>- {user.username}</Text>
              ))}

              <Text className="mt-2 font-semibold">📋 Scopes:</Text>
              {project?.scopes?.map((scope, idx) => (
                <Text key={idx}>- {scope}</Text>
              ))}

              {project?.startDate && (
                <Text className="mt-2">
                  📅 Start Date: {new Date(project.startDate).toDateString()}
                </Text>
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-red-500 px-4 py-2 mt-4 rounded-xl"
            >
              <Text className="text-white text-center font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProjectMain;
