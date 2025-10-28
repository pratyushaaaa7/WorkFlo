import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ProjectStage = () => {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(2); // Change between 0–4 to simulate progress

  const stages = [
    { key: 0, title: "Planning", icon: "lightbulb-on-outline" },
    { key: 1, title: "Design", icon: "pencil-ruler" },
    { key: 2, title: "Execution", icon: "hammer-wrench" },
    { key: 3, title: "Review", icon: "magnify" },
    { key: 4, title: "Completed", icon: "check-circle-outline" },
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
        paddingVertical: 40,
      }}
    >
      <Text className="text-2xl font-semibold text-gray-800 mb-10">
        Project Stage Tracker
      </Text>

      {/* Progress Line + Stages */}
      <View style={{ width: "90%", alignItems: "center" }}>
        {/* Horizontal progress line */}
        <View
          style={{
            position: "absolute",
            top: 32,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#E5E7EB",
            borderRadius: 4,
          }}
        />
        {/* Active progress line */}
        <View
          style={{
            position: "absolute",
            top: 32,
            left: 0,
            height: 4,
            width: `${(activeStage / (stages.length - 1)) * 100}%`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#4F46E5", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Stage Circles */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {stages.map((stage, index) => {
            const isActive = index <= activeStage;
            return (
              <TouchableOpacity
                key={stage.key}
                onPress={() => setActiveStage(index)}
                style={{ alignItems: "center" }}
              >
                <LinearGradient
                  colors={
                    isActive
                      ? ["#4F46E5", "#6366F1"]
                      : ["#E5E7EB", "#E5E7EB"]
                  }
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name={stage.icon}
                    size={28}
                    color={isActive ? "white" : "#9CA3AF"}
                  />
                </LinearGradient>
                <Text
                  style={{
                    fontSize: 13,
                    color: isActive ? "#4F46E5" : "#9CA3AF",
                    fontWeight: "600",
                  }}
                >
                  {stage.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Floating + Button for Support */}
      <TouchableOpacity
        onPress={() => router.push("/appSupportForm")}
        style={{
          position: "absolute",
          bottom: 50,
          right: 30,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#4F46E5",
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }}
      >
        <Ionicons name="help-circle-outline" size={28} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProjectStage;
