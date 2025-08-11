import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const ITEMS_PER_ROW = 3;
const ITEM_MARGIN = 12;
const ITEM_WIDTH = (width - ITEM_MARGIN * (ITEMS_PER_ROW + 1)) / ITEMS_PER_ROW;

const ProjectMain = () => {
  const router = useRouter();

  const menuItems = [
    {
      key: "directory",
      label: "Project Directory",
      icon: <MaterialCommunityIcons name="dots-grid" size={50} color="#8B5CF6" />,
      onPress: () => {
        // router.push("/project-directory");
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
      <View className="pt-16 px-4 pb-6 bg-white shadow-md">
        <TouchableOpacity
          onPress={() => router.push("/projects")}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">Back</Text>
        </TouchableOpacity>
      </View>

      {/* Grid container */}
      <View
        className="flex-row flex-wrap pt-5 px-3 justify-between"
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
