import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function CentralUserDirectory() {
  const tabs = [
    {
      title: "Client",
      icon: "account-group-outline",
      bgColor: "#E0F2FE", // sky-100
      borderColor: "#7DD3FC", // sky-300
      textColor: "#0C4A6E", // sky-700
      iconColor: "#0C4A6E",
      description: "View and manage clients",
    },
    {
      title: "Vendor",
      icon: "storefront-outline",
      bgColor: "#CCFBF1", // teal-100
      borderColor: "#5EEAD4", // teal-300
      textColor: "#0F766E", // teal-700
      iconColor: "#0F766E",
      description: "All registered vendors",
    },
    {
      title: "Consultant",
      icon: "account-tie",
      bgColor: "#EDE9FE", // violet-100
      borderColor: "#C4B5FD", // violet-300
      textColor: "#6D28D9", // violet-700
      iconColor: "#6D28D9",
      description: "Your consultants directory",
    },
  ];

  return (
    <View className="flex-1 px-4 py-10 bg-gray-50">
      {tabs.map((tab, idx) => (
        <TouchableOpacity
          key={idx}
          activeOpacity={0.8}
          className="mb-5"
          onPress={() => router.push(`/centralUserSpecificDirectory?role=${tab.title.toUpperCase()}`)}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderRadius: 20,
              backgroundColor: tab.bgColor,
              borderWidth: 1.5,
              borderColor: tab.borderColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: tab.bgColor,
                  borderWidth: 1,
                  borderColor: tab.borderColor,
                  padding: 12,
                  borderRadius: 14,
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={28}
                  color={tab.iconColor}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: tab.textColor,
                  }}
                >
                  {tab.title}
                </Text>
                {/* <Text
                  style={{
                    fontSize: 14,
                    color: "#4B5563", // gray-700
                    marginTop: 2,
                  }}
                >
                  {tab.description}
                </Text> */}
              </View>
            </View>
            <Entypo name="chevron-right" size={26} color="#6B7280" />
          </View>
        </TouchableOpacity>
      ))}

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => router.push("/createUser")}
        style={{
          position: "absolute",
          bottom: 44,
          right: 20,
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
}
