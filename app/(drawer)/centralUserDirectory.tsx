import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function CentralUserDirectory() {
  const tabs = [
    {
      title: "Client",
      icon: "account-group-outline",
      bgColor: "#E0F2FE", // sky-100
      borderColor: "#7DD3FC", // sky-300
      textColor: "#0369A1", // sky-700
      iconColor: "#0369A1",
      description: "View and manage clients",
    },
    {
      title: "Vendor",
      icon: "storefront-outline",
      bgColor: "#CCFBF1", // teal-100
      borderColor: "#5EEAD4", // teal-300
      textColor: "#0D9488", // teal-700
      iconColor: "#0D9488",
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
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}
      >
        
        {tabs.map((tab, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() =>
              router.push(`/centralUserSpecificDirectory?role=${tab.title.toUpperCase()}`)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 18,
              borderRadius: 20,
              backgroundColor: tab.bgColor,
              borderWidth: 1.4,
              borderColor: tab.borderColor,
              marginBottom: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: tab.borderColor,
                  padding: 10,
                  borderRadius: 14,
                  marginRight: 14,
                }}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={26}
                  color={tab.iconColor}
                />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: tab.textColor,
                    marginBottom: 2,
                  }}
                >
                  {tab.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#4B5563", // gray-700
                  }}
                >
                  {tab.description}
                </Text>
              </View>
            </View>
            <Entypo name="chevron-right" size={26} color="#6B7280" />
          </TouchableOpacity>

          
        ))}

         {/* 🔹 VIEW ALL USERS */}
        {/* 🔥 VIEW ALL USERS (PRIMARY ACTION) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/masterUserDirectory")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 22,
            borderRadius: 24,
            backgroundColor: "#0F172A", // slate-900
            marginBottom: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <View
            style={{
              backgroundColor: "#1E293B",
              padding: 14,
              borderRadius: 18,
              marginRight: 16,
            }}
          >
            <MaterialCommunityIcons
              name="account-multiple-outline"
              size={30}
              color="#E5E7EB"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              View All
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#CBD5E1",
              }}
            >
              Browse complete central directory
            </Text>
          </View>

          <Entypo name="chevron-right" size={26} color="#E5E7EB" />
        </TouchableOpacity>

      </ScrollView>

      

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/createUser")}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 40 : 30,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#4F46E5", // indigo-600
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
