import React, { useContext } from "react";

import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";

const ProjectMain = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  // const isAdmin = user?.role === "admin";

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

        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 px-4 py-4 rounded-lg mb-4"
          onPress={() =>
            router.push({
              pathname: "/projectList",
              params: { company: "WCorp" },
            })
          }
        >
          <View className="flex-row items-center space-x-4">
            <Text className="text-base font-medium text-gray-800">
              Projects of WCorp
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        {user?.role === "admin" && (
          <TouchableOpacity
            className="bg-indigo-500 mt-10 p-4 rounded-lg"
            onPress={() =>
              router.push({
                pathname: "/allProjectList",
              })
            }
          >
            <Text className="font-bold text-white text-center">
              View all Projects
            </Text>
          </TouchableOpacity>
        )}

        {/* Create Floating + Button */}
        {user?.role === "admin" && (
          <TouchableOpacity
            onPress={() => router.push("/createProject")}
            className="bg-indigo-600"
            activeOpacity={0.85}
            style={{
              position: "absolute",
              bottom: 44,
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
        )}

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
