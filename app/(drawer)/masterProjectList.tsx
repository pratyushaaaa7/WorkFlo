import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ProjectMain = () => {
  const router = useRouter();

  return (
    <>
      <View className="flex-1 bg-white px-5 pt-5">
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg mb-4"
          onPress={() =>
            router.push({ pathname: "/projectList", params: { company: "WP" } })
          }
        >
          <View className="flex-row items-center space-x-4">
            <Text className="text-base font-medium text-gray-800">
              Projects of WP
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg mb-4"
          onPress={() =>
            router.push({
              pathname: "/projectList",
              params: { company: "WAL" },
            })
          }
        >
          <View className="flex-row items-center space-x-4">
            <Text className="text-base font-medium text-gray-800">
              Projects of WAL+L
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* ➕ Create Project Button */}
        {/* <TouchableOpacity
          onPress={() => router.push("/(drawer)/createProject")}
          className="flex-row items-center justify-center bg-indigo-600 px-4 py-4 rounded-lg mt-10"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text className="ml-2 text-white font-semibold text-base">
            Create New Project
          </Text>
        </TouchableOpacity> */}
      </View>
    </>
  );
};

export default ProjectMain;
