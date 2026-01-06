import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
  fullName?: string;
  iat: number;
  exp: number;
};

const ProfileScreen = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode<TokenPayload>(token);
          setUsername(decoded.username);
          setFullName(decoded.fullName || decoded.username);

          const nameParts = (decoded.fullName || decoded.username).split(" ");
          const initials = nameParts
            .map((n) => n[0])
            .join("")
            .toUpperCase();
          setInitials(initials);
        } catch (err) {
          console.error("Failed to decode token", err);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    Toast.show({
      type: "success",
      text1: "Logged Out",
      text2: "You have been signed out successfully.",
      position: "bottom",
    });
    router.replace("/login");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Gradient with Avatar */}
      <LinearGradient colors={["#8B5CF6", "#9333EA"]}>
        <View
          className="h-64 justify-center items-center"
          style={{
            borderBottomLeftRadius: 150,
            borderBottomRightRadius: 150,
            overflow: "hidden",
          }}
        >
          <View className="w-28 h-28 bg-white rounded-full justify-center items-center shadow-md">
            <Text className="text-4xl font-bold text-indigo-600">
              {initials}
            </Text>
          </View>
          <Text className="text-white text-2xl font-semibold mt-4">
            {fullName}
          </Text>
        </View>
      </LinearGradient>

      {/* Info Section */}
      <View className="mt-8 px-6">
        <View className="bg-white rounded-2xl shadow-md p-6">
          <Text className="text-xl font-semibold text-gray-800">
            Welcome, {fullName}!
          </Text>
          <Text className="text-gray-500 mt-2">
            Your one stop solution for all your tasks.
          </Text>
        </View>
      </View>

      <View className="mt-10 px-8">
        <Text className="text-gray-400">v - 1.1</Text>
      </View>

      {/* Logout Button */}
      <View className="flex-1 justify-end px-6 mb-14">
        <Pressable
          onPress={handleLogout}
          className="bg-red-500 py-4 rounded-2xl items-center shadow-lg active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white text-lg font-bold">Logout</Text>
        </Pressable>
      </View>


    </View>
  );
}

export default  ProfileScreen
