import React, { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import Modal from "react-native-modal";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import uuid from 'react-native-uuid';

const uiId = uuid.v4().toString();

// Default stages
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

type Stage = {
  uiId: string; // always exists (uuid or timestamp)
  _id?: string; // MongoDB id (only if saved)
  name: string;
  order: number;
  selected: boolean;
};

// ------------------- Header -------------------
const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
    <View className="pt-16 pb-6 px-4 flex-row items-center shadow-md">
      <TouchableOpacity onPress={onBack} className="flex-row items-center">
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text className="text-xl font-semibold text-white ml-4">{title}</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

// ------------------- Stage Item -------------------
const StageItem = ({ item, number, toggleStage, drag, isActive }: any) => (
  <ScaleDecorator>
    <TouchableOpacity
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        drag();
      }}
      disabled={isActive}
      delayLongPress={120} // 👈 Reduced long press duration
      className={`flex-row items-center p-3 my-2 rounded-xl border ${
        isActive ? "bg-purple-100" : "bg-white"
      } border-gray-200 shadow-sm`}
    >
      <MaterialCommunityIcons
        name="drag"
        size={24}
        color="#9CA3AF"
        className="mr-3"
      />

      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          toggleStage(item.uiId);
        }}
      >
        <MaterialCommunityIcons
          name={item.selected ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={item.selected ? "#4F46E5" : "#9CA3AF"}
          className="mr-3"
        />
      </TouchableOpacity>

      <View className="w-7 h-7 rounded-full bg-indigo-500 items-center justify-center mr-3">
        <Text className="text-white font-semibold">{number ?? "-"}</Text>
      </View>

      <Text className="text-base flex-1">{item.name}</Text>
    </TouchableOpacity>
  </ScaleDecorator>
);

// ------------------- Draggable Stage List -------------------
const DraggableStageList = ({ stageList, setStageList, toggleStage }: any) => {
  // ALWAYS sort before rendering
  const sorted = [...stageList].sort((a, b) => {
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;
    return a.order - b.order;
  });

  return (
    <DraggableFlatList
      data={sorted}
      keyExtractor={(item: Stage) => item.uiId}
      onDragEnd={({ data }) => {
        // assign new order then sort again
        const reordered = data.map((item, i) => ({ ...item, order: i + 1 }));
        setStageList(reordered);
      }}
      renderItem={({ item, drag, isActive }) => {
        const selectedStages = sorted.filter((s: Stage) => s.selected);
        const number = item.selected
          ? selectedStages.findIndex((s) => s.uiId === item.uiId) + 1
          : null;

        return (
          <StageItem
            item={item}
            number={number}
            toggleStage={toggleStage}
            drag={drag}
            isActive={isActive}
          />
        );
      }}
    />
  );
};

// ------------------- Add Stage Modal -------------------
const AddStageModal = ({
  visible,
  onClose,
  newStage,
  setNewStage,
  addStage,
}: any) => {
  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onBackdropPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      style={{ justifyContent: "flex-end", margin: 0 }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        {/* Header */}
        <View className="items-center mb-5">
          <View className="w-14 h-1.5 bg-gray-300 rounded-full mb-4" />
          <Text className="text-lg font-semibold text-gray-800">
            Add Custom Stage
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Enter a new stage name to add it.
          </Text>
        </View>

        {/* Input */}
        <TextInput
          value={newStage}
          onChangeText={setNewStage}
          placeholder="Enter stage name"
          placeholderTextColor={"#888"}
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#FAFAFA",
            marginBottom: 20,
            fontSize: 15,
          }}
        />

        {/* Buttons */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 mr-2 bg-gray-100 rounded-xl py-3 items-center justify-center"
          >
            <Text className="text-gray-700 font-semibold">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={addStage}
            className="flex-1 ml-2 bg-indigo-600 rounded-xl py-3 items-center justify-center"
            style={{
              shadowColor: "#6366F1",
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text className="text-white font-semibold">Add Stage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ------------------- Main Component -------------------
export default function ManageStages() {
  const { company, projectId } = useLocalSearchParams();
  const router = useRouter();

  const [stageList, setStageList] = useState<Stage[]>([]);
  const [newStage, setNewStage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  // sorting function
  const sortStages = (list: Stage[]) =>
    [...list].sort((a, b) => {
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;
      return a.order - b.order;
    });

  useEffect(() => {
    if (!projectId) return;

    const loadStages = async () => {
      try {
        const response = await api.get(`/stages/${projectId}/stages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dbStages = response.data?.stages || [];

        // If DB already has saved stages → use them
        if (dbStages.length > 0) {
          const mapped = dbStages.map((stage: any) => ({
             uiId: uuid.v4().toString(), // ← updated
            _id: stage._id, // 🔐 protected
            name: stage.title,
            order: stage.order,
            selected: true,
          }));

          setStageList(sortStages(mapped));
          return;
        }

        // If DB has no stages → load defaults based on company
        if (company) {
          const defaults = (defaultStages[company] || []).map((s, i) => ({
            uiId: uuid.v4().toString(), // ← updated
            name: s,
            order: i,
            selected: true,
          }));

          setStageList(sortStages(defaults));
        }
      } catch (error) {
        console.error("Error fetching stages:", error);
      }
    };

    loadStages();
  }, [projectId, company, token]);

  const toggleStage = (uiId: string) => {
    setStageList((prev) =>
      prev.map((s) => (s.uiId === uiId ? { ...s, selected: !s.selected } : s))
    );
  };

  const addCustomStage = () => {
    if (!newStage.trim()) return;

    setStageList((prev) => [
      ...prev,
      {
        uiId: uuid.v4().toString(), // ← updated
        name: newStage.trim(),
        order: prev.length,
        selected: true,
      },
    ]);

    setNewStage("");
    setModalVisible(false);
  };

  const saveStages = async () => {
    const selectedStages = stageList
      .filter((s) => s.selected)
      .map((s, index) => ({
        _id: s._id, // only DB stages have this
        title: s.name,
        order: index,
      }));

    try {
      const response = await api.post(
        `/stages/${projectId}/stages`,
        {
          projectId,
          stages: selectedStages,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Stages saved:", response.data);

      router.back(); // go back
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Manage Stages" onBack={() => router.back()} />

      <View className="flex-1 p-4">
        <DraggableStageList
          stageList={stageList}
          setStageList={setStageList}
          toggleStage={toggleStage}
        />
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="m-4 bg-emerald-500 py-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Add Custom Stage
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={saveStages}
        className="mx-4 mb-4 bg-indigo-600 py-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold text-lg">Save Stages</Text>
      </TouchableOpacity>

      <AddStageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        newStage={newStage}
        setNewStage={setNewStage}
        addStage={addCustomStage}
      />
    </View>
  );
}
