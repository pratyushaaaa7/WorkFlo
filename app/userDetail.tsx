import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";

const UserDetail = () => {
  const { user } = useLocalSearchParams();
  const router = useRouter();
  const userData = user ? JSON.parse(user as string) : {};

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-bold text-white ml-4">
            User Details
          </Text>
        </TouchableOpacity>

        {/* Download Icon (placeholder for now) */}
        {/* <TouchableOpacity
          onPress={() => console.log("Export to Excel pressed")}
          className="px-2 mr-2 rounded-full bg-white/20 active:bg-white/50"
        >
          <Feather name="download" size={22} color="#fff" />
        </TouchableOpacity> */}
      </LinearGradient>

      {/* Body */}
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl shadow-lg p-6">
          {/* Name + Role */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">
              {userData.individualName || "Unnamed"}
            </Text>
            <View className="bg-indigo-100 px-3 py-1 rounded-full">
              <Text className="text-indigo-700 text-xs font-semibold">
                {userData.role}
              </Text>
            </View>
          </View>

          {/* Firm + Designation */}
          <Text className="text-base text-gray-700 mb-2">
            {userData.designation} @ {userData.firmName}
          </Text>

          {/* Contact Info */}
          {userData.phone && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-700">{userData.phone}</Text>
            </View>
          )}

          {userData.email && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-700">{userData.email}</Text>
            </View>
          )}

          {/* Role Description */}
          {userData.roleDescription && (
            <Text className="text-sm text-gray-500 italic mb-2">
              {userData.roleDescription}
            </Text>
          )}

          {/* Created Date */}
          {userData.createdAt && (
            <Text className="text-xs text-gray-400">
              Added {moment(userData.createdAt).fromNow()}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default UserDetail;
