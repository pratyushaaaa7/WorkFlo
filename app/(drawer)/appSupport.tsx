import { View, Text, Pressable, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { jwtDecode } from "jwt-decode";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";

const AppSupport = () => {
  const router = useRouter();
  return (
    <View className="flex-1 px-4 py-10 items-center justify-center  bg-gray-50">
      {/* Empty State Icon */}
      <Ionicons name="chatbubble-ellipses-outline" size={90} color="#a3a3a3" />

      {/* Text Section */}
      <Text className="text-gray-700 text-xl font-semibold mt-4">
        No Suggestions Yet
      </Text>
      <Text className="text-gray-500 text-center mt-2 px-8">
        Have an idea or facing an issue?{"\n"}Tap the + button below to share
        your feedback with our tech team.
      </Text>
      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => router.push("/appSupportForm")}
        style={{
          position: "absolute",
          bottom: 50,
          right: 30,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#4F46E5", // indigo-600
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AppSupport;
