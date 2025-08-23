import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Animated,
  
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { Project } from "../types/Project";

const { width } = Dimensions.get("window");
const ITEMS_PER_ROW = 2; // fewer items per row for larger, card-like buttons
const ITEM_MARGIN = 16;
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
        console.log("Fetched project:", res.data.project);
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
        <MaterialCommunityIcons
          name="account-group"
          size={40}
          color="#6366F1"
        />
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
      icon: <Ionicons name="clipboard-outline" size={40} color="#F59E0B" />,
      onPress: () => {
        router.push({
          pathname: "/ilrs",
          params: { company, projectId, projectName: project?.projectName },
        });
      },
    },
    {
      key: "mom",
      label: "Meetings",
      icon: <MaterialIcons name="event-note" size={40} color="#10B981" />,
      onPress: () => {
        // router.push("/mom");
      },
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Gradient Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="rounded-b-3xl px-6 pt-14 pb-10"
      >
        <TouchableOpacity
          onPress={() => router.push("/projects")}
          className="bg-white/20 p-2 rounded-full w-10 h-10 items-center justify-center mb-6"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white">
          {project?.projectName || "Loading..."}
        </Text>
        <Text className="text-white/80 mt-1">{project?.company}</Text>
      </LinearGradient>

      {/* Menu Grid */}
      <View
        className="flex-row flex-wrap px-4 mt-6 justify-between"
        style={{ gap: ITEM_MARGIN }}
      >
        {menuItems.map(({ key, label, icon, onPress }) => (
          <TouchableOpacity
            key={key}
            onPress={onPress}
            className="bg-white rounded-2xl p-6 items-center shadow-md active:scale-95"
            style={{ width: ITEM_WIDTH }}
          >
            <View className="mb-3">{icon}</View>
            <Text className="text-gray-800 font-semibold text-sm text-center">
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Project Info Modal (Bottom Sheet Style) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <Animated.View
            className="bg-white rounded-t-3xl p-6 max-h-[85%] shadow-2xl"
            style={{ elevation: 10 }}
          >
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="space-y-6"
            >
              {/* Project Name */}
              <Text className="text-2xl font-bold text-gray-900 text-center">
                {project?.projectName}
              </Text>

              {/* Info Section */}
              <View className="bg-gray-50 rounded-xl p-4 gap-3">
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#6366F1" />
                  <Text className="ml-2 text-gray-700">
                    {project?.location}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="business-outline" size={20} color="#10B981" />
                  <Text className="ml-2 text-gray-700">{project?.company}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="resize-outline" size={20} color="#F59E0B" />
                  <Text className="ml-2 text-gray-700">{project?.area}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="code" size={20} color="#EF4444" />
                  <Text className="ml-2 text-gray-700">
                    {project?.projectCode}
                  </Text>
                </View>

                {/* Start Date */}
                {project?.startDate && (
                  <View className="flex-row items-center  mt-2">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#4B5563"
                    />
                    <Text className="ml-2 text-gray-700">
                      Start Date: {new Date(project.startDate).toDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Team Leaders */}
              <View className="pt-4">
                <View className="flex-row items-center ">
                  <Ionicons name="person-outline" size={20} color="#2563EB" />
                  <Text className="ml-2 font-semibold text-gray-800 text-lg">
                    Team Leader(s)
                  </Text>
                </View>
                {project?.teamLeaders?.map((user) => (
                  <Text key={user._id} className="ml-4 text-gray-600">
                    • {user.username}
                  </Text>
                ))}
              </View>

              {/* Team Members */}
              <View className="pt-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people-outline" size={20} color="#9333EA" />
                  <Text className="ml-2 font-semibold text-gray-800 text-lg">
                    Team Member(s)
                  </Text>
                </View>
                {project?.teamMembers?.map((user) => (
                  <Text key={user._id} className="ml-4 text-gray-600">
                    • {user.username}
                  </Text>
                ))}
              </View>

              {/* Scopes */}
              <View className="pt-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="list-outline" size={20} color="#F59E0B" />
                  <Text className="ml-2 font-semibold text-gray-800 text-lg">
                    Scopes
                  </Text>
                </View>
                {project?.scopes?.map((scope, idx) => (
                  <Text key={idx} className="ml-4 text-gray-600">
                    • {scope}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-indigo-600 px-5 py-3 mt-6 rounded-xl shadow-md"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Floating More Info Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-8 right-8 bg-indigo-600 p-4 rounded-full shadow-lg"
      >
        <Ionicons name="information-circle" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProjectMain;
