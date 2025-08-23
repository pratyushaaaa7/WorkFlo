import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Ionicons,
  AntDesign,
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

        {/* Floating + Button */}
        <TouchableOpacity
          onPress={() => router.push("/createProject")}
          className="bg-indigo-600"
          activeOpacity={0.85}
          style={{
            position: "absolute",
            bottom: 30,
            right: 30,
          
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
