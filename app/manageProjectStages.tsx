import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";

const defaultStages = {
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

export default function ManageStages() {
  const { projectId, company } = useLocalSearchParams();
  const router = useRouter();
  console.log(company, "company");

  const [stageList, setStageList] = useState<string[]>([]);
  const [newStage, setNewStage] = useState("");

  // Load default stages
  useEffect(() => {
    if (company) {
      setStageList(defaultStages[company] || []);
    }
  }, [company]);


  useEffect(() => {
  console.log("Company →", company);
  console.log("Loaded stages →", defaultStages[company]);
}, [company]);

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
    // TODO: send to backend
    // await api.put(`/projects/${projectId}/stages`, { stages: stageList });
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center shadow-md">
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

      {/* Draggable List */}
      <DraggableFlatList
        data={stageList}
        keyExtractor={(item, index) => index.toString()}
        onDragEnd={({ data }) => setStageList(data)}
        renderItem={({ item, index, drag, isActive }) => (
          <ScaleDecorator>
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              className="flex-row items-center p-3 border-b border-gray-200"
            >
              <MaterialCommunityIcons
                name="drag"
                size={24}
                color="#9CA3AF"
                style={{ marginRight: 10 }}
              />

              <MaterialCommunityIcons
                name="checkbox-marked"
                size={24}
                color="#4F46E5"
                style={{ marginRight: 10 }}
              />

              {/* Numbering */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text className="text-indigo-600 font-semibold">
                  {index + 1}
                </Text>
              </View>

              <Text className="text-base flex-1">{item}</Text>
            </TouchableOpacity>
          </ScaleDecorator>
        )}
      />

      {/* Add custom stage */}
      <View className="px-3 py-4 border-t border-gray-200">
        <Text className="font-semibold mb-2">Add Custom Stage</Text>
        <View className="flex-row items-center">
          <TextInput
            value={newStage}
            onChangeText={setNewStage}
            placeholder="Enter stage name"
            className="flex-1 border px-3 py-2 rounded-lg"
          />
          <TouchableOpacity
            onPress={addCustomStage}
            className="ml-2 bg-indigo-600 px-3 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

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
