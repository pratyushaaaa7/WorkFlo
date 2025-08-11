import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const ProjectMain = () => {
  const router = useRouter();
  const { projectId, company } = useLocalSearchParams();

  // console.log("Project ID:", projectId);
  // console.log("Company:", company);

  return (
    <View className="flex-1 bg-white">
      {/* 🔙 Back Button Container with shadow */}
      <View
        className="pt-10 px-5 pb-6 bg-white"
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
          <Text className="ml-2 text-lg font-semibold text-[#1E293B]">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-5 pt-5">
        {/* 🟪 Project Directory Button */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg mb-4"
          // onPress={() => router.push("/project-directory")}
        >
          <View className="flex-row items-center space-x-4">
            <MaterialCommunityIcons name="dots-grid" size={24} color="#8B5CF6" />
            <Text className="pl-2 text-base font-medium text-gray-800">
              Project Directory
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* 🟨 ILR Button */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg mb-4"
          // onPress={() => router.push("/ilr")}
        >
          <View className="flex-row items-center space-x-4">
            <Ionicons name="clipboard-outline" size={24} color="#F59E0B" />
            <Text className="pl-2 text-base font-medium text-gray-800">ILR</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* 🟦 Minutes of Meeting Button */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg"
          // onPress={() => router.push("/mom")}
        >
          <View className="flex-row items-center space-x-4">
            <MaterialIcons name="edit-document" size={24} color="#3B82F6" />
            <Text className="pl-2 text-base font-medium text-gray-800">
              Minutes of Meeting
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProjectMain;
