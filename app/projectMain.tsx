import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Animated,
  Image,
  Alert,
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
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");
const ITEMS_PER_ROW = 2;
const ITEM_MARGIN = 16;
const ITEM_WIDTH = (width - ITEM_MARGIN * (ITEMS_PER_ROW + 1)) / ITEMS_PER_ROW;

const ProjectMain = () => {
  const router = useRouter();
  const { projectId, company, projectName } = useLocalSearchParams();

  console.log(projectId);
  const { token } = useContext(AuthContext) || {};
  const [modalVisible, setModalVisible] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // ✅ Fetch Project Details + Project Images
  useEffect(() => {
    if (projectId && token) {
      const fetchData = async () => {
        try {
          // Fetch project details
          const res = await api.get(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProject(res.data.project);

          // Fetch project images from unified upload API
          setLoadingImages(true);
          const imgRes = await api.get(`/upload/project-images`, {
            params: { projectId }, // only this
            headers: { Authorization: `Bearer ${token}` },
          });

          // Extract URLs from response
          setImages(imgRes.data.map((f: any) => f.url));
        } catch (err: any) {
          console.error(
            "Failed to fetch project data/images:",
            err.message || err
          );
        } finally {
          setLoadingImages(false);
        }
      };
      fetchData();
    }
  }, [projectId, token]);

  // ✅ Pick an Image from Device
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;
    const file = result.assets[0];
    uploadImage(file);
  };

  // ✅ Upload Image to Backend
  const uploadImage = async (file: any) => {
    if (!token || !projectId) return;

    const formData = new FormData();
    formData.append(
      "file",
      {
        uri: file.uri,
        name: file.fileName || `image_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any // Cast to any to satisfy TypeScript
    );
    formData.append("module", "projectImage"); // important
    formData.append("referenceId", String(projectId));
    formData.append("fileType", "image");

    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setImages((prev) => [...prev, res.data.file.url]); // update with new image
    } catch (err: any) {
      console.error("Upload failed:", err.response?.data || err.message);
      Alert.alert("Error", "Image upload failed. Please try again.");
    }
  };

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
      onPress: () =>
        router.push({
          pathname: "/userDirectory",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
    {
      key: "ilr",
      label: "ILR",
      icon: <Ionicons name="clipboard-outline" size={40} color="#F59E0B" />,
      onPress: () =>
        router.push({
          pathname: "/ilrs",
          params: { company, projectId, projectName: project?.projectName },
        }),
    },
    {
      key: "mom",
      label: "Minutes",
      icon: <MaterialIcons name="event-note" size={40} color="#10B981" />,
      onPress: () =>
        router.push({
          pathname: "/minutes",
          params: { company, projectId, projectName },
        }),
    },
    {
      key: "dpr",
      label: "Reports",
      icon: (
        <MaterialCommunityIcons
          name="file-image-outline"
          size={40}
          color="#EF4444"
        />
      ),
      onPress: () =>
        router.push({
          pathname: "/dprLaborForm",
          params: {
            company,
            projectId,
            projectName,
            teamLeaders: JSON.stringify(project?.teamLeaders || []),
            teamMembers: JSON.stringify(project?.teamMembers || []),
          },
        }),
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="rounded-b-3xl px-6 pt-14 pb-10">
          <TouchableOpacity
            onPress={() => router.push("/projects")}
            className="bg-white/20 p-2 rounded-full w-10 h-10 items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-white">
            {projectName || "Loading..."}
          </Text>
          <Text className="text-white/80 mt-1">{company}</Text>
        </View>
      </LinearGradient>

      {/* ✅ Project Images */}
      <View className="pt-4 px-4">
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="photo-library" size={20} color="#EF4444" />
          <Text className="ml-2 font-semibold text-gray-800 text-lg">
            Project Images
          </Text>
          <TouchableOpacity
            onPress={pickImage}
            className="ml-auto bg-indigo-500 px-3 py-1 rounded"
          >
            <Text className="text-white text-sm">Upload</Text>
          </TouchableOpacity>
        </View>

        {loadingImages && <Text>Loading images...</Text>}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
        >
          {images.length === 0 && !loadingImages && (
            <Text className="text-gray-500">No images yet.</Text>
          )}
          {images.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={{
                width: 120,
                height: 120,
                marginRight: 10,
                borderRadius: 10,
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* ✅ Menu Grid */}
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
            <View className="items-center mb-2">
              {/* <View className="w-12 h-1.5 bg-gray-300 rounded-full" /> */}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="space-y-6"
            >
              {/* Project Name */}
              <Text className="text-2xl mb-2 font-bold text-gray-900 text-center">
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
                  <Ionicons name="code" size={20} color="#EF4444" />
                  <Text className="ml-2 text-gray-700">
                    {project?.projectCode}
                  </Text>
                </View>

                {/* ✅ New Fields */}
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={20} color="#2563EB" />
                  <Text className="ml-2 text-gray-700">
                    Client: {project?.clientName}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={20} color="#9333EA" />
                  <Text className="ml-2 text-gray-700">
                    Designed Area: {project?.designedArea}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="home-outline" size={20} color="#14B8A6" />
                  <Text className="ml-2 text-gray-700">
                    Site Area: {project?.siteArea}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="pulse-outline" size={20} color="#F97316" />
                  <Text className="ml-2 text-gray-700">
                    Status: {project?.status}
                  </Text>
                </View>

                {/* Start Date */}
                {project?.startDate && (
                  <View className="flex-row items-center">
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
                    • {user.fullName}
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
                    • {user.fullName}
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
