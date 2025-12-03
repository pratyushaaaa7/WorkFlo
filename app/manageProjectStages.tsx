import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const defaultStages = {
  WP: ["Feasibility", "Design Management", "Tender Management", "Contract Management", "Construction Management", "Practice Development", "Closing and Handover", "Defects Liability Stage"],
  WAL: ["Feasibility", "Concept Design", "Schematic Design", "Tender", "Sanction Drawing", "Design Development", "Working Drawing", "During Construction"],
};

export default function ManageStages() {
  const { projectId, company } = useLocalSearchParams();
  const router = useRouter();

  const [stageList, setStageList] = useState<string[]>([]);
  const [newStage, setNewStage] = useState("");

  // Load default stages on mount
  useEffect(() => {
    setStageList(defaultStages[company] || []);
  }, []);

  const toggleStage = (stage: string) => {
    if (stageList.includes(stage)) {
      setStageList(stageList.filter((s) => s !== stage));
    } else {
      setStageList([...stageList, stage]);
    }
  };

  const addCustomStage = () => {
    if (newStage.trim().length === 0) return;
    setStageList([...stageList, newStage.trim()]);
    setNewStage("");
  };

  const saveStages = async () => {
    // TODO: send to backend: POST /projects/:id/stages
    // await api.put(`/projects/${projectId}/stages`, { stages: stageList });

    router.back();
  };

  return (
    <View className="flex-1 bg-white ">
       <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row  items-center shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              Manage Stages
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView>
        {defaultStages[company]?.map((stage:any , idx:any) => (
          <TouchableOpacity
            key={idx}
            onPress={() => toggleStage(stage)}
            className="flex-row items-center p-3 border-b border-gray-200"
          >
            <MaterialCommunityIcons
              name={stageList.includes(stage) ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color="#4F46E5"
            />
            <Text className="ml-3 text-base">{stage}</Text>
          </TouchableOpacity>
        ))}

        {/* Add custom stage */}
        <View className="mt-6 px-2">
          <Text className="font-semibold mb-2">Add Custom Stage</Text>
          <View className="flex-row items-center">
            <TextInput
              value={newStage}
              onChangeText={setNewStage}
              placeholder="Enter stage name"
              className="flex-1 border px-3 py-2 rounded-lg"
            />
            <TouchableOpacity onPress={addCustomStage} className="ml-2 bg-indigo-600 px-3 py-2 rounded-lg">
              <Text className="text-white font-medium">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={saveStages}
        className="bg-indigo-600 p-4 rounded-xl m-4"
      >
        <Text className="text-center text-white font-semibold text-lg">
          Save Stages
        </Text>
      </TouchableOpacity>
    </View>
  );
}
