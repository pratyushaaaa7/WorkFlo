import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";


export default function CentralUserDirectory() {
  return (
    <View className="flex-1 px-4 py-10 justify-start">
      {/* Vendor Tab */}
      <TouchableOpacity activeOpacity={0.7} className="mb-4 rounded-2xl">
        <LinearGradient
          colors={["#A78BFA", "#7C3AED"]}
          start={[0, 0]}
          end={[1, 0]}
          className="flex-row items-center justify-between px-5 py-5 shadow-lg"
        >
          <View className="flex-row items-center space-x-4">
            <MaterialCommunityIcons
              name="storefront-outline"
              size={28}
              color="#FFF"
            />
            <Text className="text-white text-lg font-semibold">Vendor</Text>
          </View>
          <Entypo name="chevron-right" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Client Tab */}
      <TouchableOpacity activeOpacity={0.7} className="mb-4">
        <LinearGradient
          colors={["#60A5FA", "#2563EB"]}
          start={[0, 0]}
          end={[1, 0]}
          className="flex-row items-center justify-between px-5 py-5 rounded-2xl shadow-lg"
        >
          <View className="flex-row items-center space-x-4">
            <MaterialCommunityIcons
              name="account-group-outline"
              size={28}
              color="#FFF"
            />
            <Text className="text-white text-lg font-semibold">Client</Text>
          </View>
          <Entypo name="chevron-right" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Contractor Tab */}
      <TouchableOpacity activeOpacity={0.7}>
        <LinearGradient
          colors={["#34D399", "#16A34A"]}
          start={[0, 0]}
          end={[1, 0]}
          className="flex-row items-center justify-between px-5 py-5 rounded-2xl shadow-lg"
        >
          <View className="flex-row items-center space-x-4">
            <MaterialCommunityIcons
              name="hammer-wrench"
              size={28}
              color="#FFF"
            />
            <Text className="text-white text-lg font-semibold">Contractor</Text>
          </View>
          <Entypo name="chevron-right" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Floating + Button */}
      <TouchableOpacity
        className="bg-indigo-600"
        onPress={() => router.push("/createUser")}
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
}
