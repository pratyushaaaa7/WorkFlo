import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="bg-white pt-16 pb-6 px-4  flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-4">Back</Text>
        </TouchableOpacity>

        {/* Download Icon */}
        {/* <TouchableOpacity
          onPress={handleDownloadExcel}
          className="px-2 mr-2 rounded-full bg-gray-100 active:bg-gray-200"
        >
          <Feather name="download" size={22} color="#1E293B" />
        </TouchableOpacity> */}
      </View>

      <View className="px-4 pt-5 flex-1">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          {projectName}'s   Issue Log Register
        </Text>
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/ilrForm?projectId=${projectId}&projectName=${projectName}`
          )
        }
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,
          backgroundColor: "#2563EB",
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
