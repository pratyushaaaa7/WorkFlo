import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

const cardItems = [
  {
    title: "Hobfit Activation",
    icon: <MaterialCommunityIcons name="dots-grid" size={28} color="#E754E3" />,
  },
  {
    title: "Pending Approval",
    icon: <Ionicons name="notifications-outline" size={28} color="#F59E0B" />,
  },
  {
    title: "My Activation",
    icon: <MaterialIcons name="edit-document" size={28} color="#3B82F6" />,
  },
  {
    title: "Hobit Activation",
    icon: <MaterialCommunityIcons name="dots-grid" size={28} color="#6366F1" />,
  },
];

const projectMain = () => {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      {cardItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-4 shadow-sm"
          onPress={() => console.log(`${item.title} tapped`)}
        >
          <View className="flex-row items-center space-x-4">
            <View className="bg-gray-100 p-2 rounded-full">{item.icon}</View>
            <Text className="text-base font-semibold text-gray-800">{item.title}</Text>
          </View>

          <View className="bg-pink-100 p-2 rounded-full">
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default projectMain;
