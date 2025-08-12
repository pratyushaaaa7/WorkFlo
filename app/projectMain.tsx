import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const ITEMS_PER_ROW = 3;
const ITEM_MARGIN = 12;
const ITEM_WIDTH = (width - ITEM_MARGIN * (ITEMS_PER_ROW + 1)) / ITEMS_PER_ROW;

const ProjectMain = () => {
  const router = useRouter();
  const { company, projectId } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [projectName, setProjectName] = useState("");

  // Fetch project name by ID
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjectName(res.data.project.projectName);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Failed to fetch project name", err.message);
        } else {
          console.error("Failed to fetch project name", err);
        }
      }
    };

    if (projectId && token) {
      fetchProject();
    }
  }, [projectId, token]);

  // console.log("Company:", company);
  // console.log("Project ID:", projectId);
  // console.log("Project Name:", projectName);

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
          params: { company, projectId, projectName },
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
      {/* Back button container with shadow */}
      <View
        className="pt-16 px-4 pb-6 bg-white "
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
          onPress={() => router.push("/projects")}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            {/* {projectName || "Loading project..."} */}
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text className=" px-6 mt-6 text-2xl font-bold text-[#1E293B]">
          {projectName || "Loading project..."}
        </Text>
      </View>

      {/* Grid container */}
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
    </View>
  );
};

export default ProjectMain;
