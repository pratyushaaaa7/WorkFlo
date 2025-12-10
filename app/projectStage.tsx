

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

// Sample activity data structure
type StageActivity = {
  status: "Not Started" | "Ongoing" | "Completed";
  savedAt: string;
};

const ProjectStage: React.FC = () => {
  const router = useRouter();
  const { company, projectName, projectId } = useLocalSearchParams<{
    company?: string;
    projectName?: string;
    projectId?: string;
  }>();

  const [stages, setStages] = useState<string[]>([]);
  const [activities, setActivities] = useState<Record<string, StageActivity[]>>(
    {
      // Example: stageName: [{status: "Ongoing", savedAt: "..."}]
    }
  );

  const companyStages: Record<string, string[]> = {
    WP: [
      "Feasibility",
      "Design Management",
      "Tender Management",
      "Contract Management",
      "Construction Management",
      "Practice Development",
      "Closing and Handover",
      "Defects Liability Stage",
    ],
    WAL: [
      "Feasibility",
      "Concept Design",
      "Schematic Design",
      "Tender",
      "Sanction Drawing",
      "Design Development",
      "Working Drawing",
      "During Construction",
    ],
  };

  useEffect(() => {
    if (company?.toUpperCase() === "WP") setStages(companyStages.WP);
    else if (company?.toUpperCase() === "WAL") setStages(companyStages.WAL);
    else setStages([]);
  }, [company]);

  // Tailwind-like color mapping for status dots
  const statusColor = {
    "Not Started": "bg-gray-400",
    Ongoing: "bg-blue-500",
    Completed: "bg-green-500",
  };

  return (
    <View className="flex-1 bg-gray-100">
      <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row  items-center shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {projectName} Stages
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/manageProjectStages",
              params: { projectId, company },
            })
          }
          className="flex-row items-center justify-center bg-indigo-600 px-4 py-3 rounded-2xl shadow-md mb-4"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="tune" size={22} color="#fff" />
          <Text className="text-white font-semibold text-base ml-2">
            Manage Stages
          </Text>
        </TouchableOpacity>

        {stages.map((stage, idx) => {
          const stageActivities = activities[stage] || [];
          return (
            <View
              key={idx}
              className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-gray-900 font-semibold">{stage}</Text>
                {/* Activity summary icons */}
                <View className="flex-row mt-1">
                  {stageActivities.slice(-3).map((a, i) => (
                    <View
                      key={i}
                      className={`w-3 h-3 rounded-full mr-1 ${
                        statusColor[a.status]
                      }`}
                    />
                  ))}
                  {stageActivities.length > 3 && (
                    <Text className="text-gray-400 text-xs ml-1">
                      +{stageActivities.length - 3} more
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/projectStageLog",
                    params: { stage, projectId },
                  })
                }
                className="bg-indigo-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-medium">Add/Update</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProjectStage;
