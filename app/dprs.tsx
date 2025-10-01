import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
// import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md"
      
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {" "}
              {projectName} DPRs
            </Text>
          </TouchableOpacity>

          {/* Download Icon */}
          <TouchableOpacity
            // onPress={handleDownloadExcel}
            className="px-2 mr-2 rounded-full bg-white/20 active:bg-white/50"
          >
            <Feather name="download" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="px-4 pt-5 flex-1">
        <Text className="text-center text-gray-500 mt-10">No DPRs found.</Text>
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/reportForm?projectId=${projectId}&projectName=${projectName}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,

          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ILRs;
