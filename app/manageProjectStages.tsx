import React, { useEffect, useState, useContext, memo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Modal from "react-native-modal";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import uuid from "react-native-uuid";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Default stages
const defaultStages: Record<string, string[]> = {
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
  uiId: string;
  _id?: string;
  name: string;
  order: number;
  selected: boolean;
};

// ------------------- Header -------------------
const Header = ({
  title,
  onBack,
  count,
}: {
  title: string;
  onBack: () => void;
  count: number;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  return (
    <View className={`pt-16 pb-4 px-4 flex-row items-center justify-between`}>
      <TouchableOpacity onPress={onBack} className="flex-row items-center">
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          size={24}
          color={isDarkMode ? "#fff" : "#000"}
        />
        <Text
          className={`text-[20px] font-dmSemiBold ml-4 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          {title}
        </Text>
      </TouchableOpacity>
      <Text
        className={`text-[14px] font-poppinsMedium ${
          isDarkMode ? "text-[#E6E6E6]" : "text-[#454545]"
        }`}
      >
        Unhide : {count}
      </Text>
    </View>
  );
};

// ------------------- Stage Item -------------------
const StageItem = memo(
  ({ item, index, toggleStage, drag, isActive, isDarkMode }: any) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          delayLongPress={150}
          className={`flex-row items-center p-4 my-2 rounded-[16px] ${
            isDarkMode ? "bg-[#1C1C1E]" : "bg-[#F4F6F8]" // matching screenshot grey
          }`}
        >
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${
              isDarkMode ? "bg-[#28243D]" : "bg-[#E0E7FF]"
            }`}
          >
            <Text
              className={`text-[14px] font-poppinsMedium ${
                isDarkMode ? "text-[#8B5CF6]" : "text-[#5B4CCC]"
              }`}
            >
              {index + 1}
            </Text>
          </View>

          <Text
            className={`text-[16px] font-poppins flex-1 ${
              isDarkMode ? "text-[#F9FAFB]" : "text-[#111827]"
            }`}
          >
            {item.name}
          </Text>

          <Switch
            value={item.selected}
            onValueChange={() => toggleStage(item.uiId)}
            trackColor={{
              false: isDarkMode ? "#3f3f46" : "#D1D5DB",
              true: "#10B981",
            }}
            thumbColor="#FFF"
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }
);
StageItem.displayName = "StageItem";

// ------------------- Add Stage Modal -------------------
const AddStageModal = ({
  visible,
  onClose,
  newStage,
  setNewStage,
  addStage,
}: any) => {
  const isDarkMode = useColorScheme() === "dark";
  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onBackdropPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      style={{ justifyContent: "flex-end", margin: 0 }}
      useNativeDriver
      hideModalContentWhileAnimating
      avoidKeyboard={false}
      statusBarTranslucent={true}
    >
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          className={`rounded-t-[28px] px-5 pt-5 pb-8 shadow-md ${
            isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
          }`}
        >
          <View className="items-center mb-4">
            <View className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-4" />
            <Text
              className={`text-[20px] font-dmSemiBold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Add Stage
            </Text>
          </View>

          <View className={`h-[1px] w-full mb-6 ${isDarkMode ? "bg-[#333]" : "bg-gray-200"}`} />

          <Text className={`text-[14px] font-dmSemiBold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>
            Enter stage name
          </Text>

          <TextInput
            value={newStage}
            onChangeText={setNewStage}
            placeholder="Revision"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={`rounded-[12px] p-4 mb-8 font-poppins text-[15px] ${
              isDarkMode
                ? "bg-[#0D0D0D] text-white"
                : "bg-[#F4F6F8] text-black"
            }`}
          />

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 mr-2 rounded-[12px] py-4 items-center justify-center  border-[1px] ${
                isDarkMode ? "border-white bg-transparent" : "border-black bg-transparent"
              }`}
            >
              <Text
                className={`font-poppins text-[16px] ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={addStage}
              className="flex-1 ml-2 rounded-[12px] overflow-hidden"
            >
              <LinearGradient
                colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
              >
                <Text className="text-white font-poppins text-[16px]">Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardStickyView>
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
  const [tab, setTab] = useState<"unhide" | "hide">("unhide");

  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const isDarkMode = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!projectId) return;

    const loadStages = async () => {
      try {
        const response = await api.get(`/stages/${projectId}/stages?all=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dbStages = response.data?.stages || [];

        if (dbStages.length > 0) {
          const mapped = dbStages.map((stage: any) => ({
            uiId: uuid.v4().toString(),
            _id: stage._id,
            name: stage.title,
            order: stage.order,
            selected: stage.selected ?? true,
          }));

          setStageList(mapped.sort((a: Stage, b: Stage) => a.order - b.order));
          return;
        }

        if (company && typeof company === "string") {
          const defaults = (defaultStages[company] || []).map((s, i) => ({
            uiId: uuid.v4().toString(),
            name: s,
            order: i,
            selected: true,
          }));

          setStageList(defaults);
        }
      } catch (error) {
        console.error("Error fetching stages:", error);
      }
    };

    loadStages();
  }, [projectId, company, token]);

  const toggleStage = useCallback((uiId: string) => {
    setStageList((prev) =>
      prev.map((s) => (s.uiId === uiId ? { ...s, selected: !s.selected } : s))
    );
  }, []);

  const addCustomStage = () => {
    if (!newStage.trim()) return;

    setStageList((prev) => [
      ...prev,
      {
        uiId: uuid.v4().toString(),
        name: newStage.trim(),
        order: prev.length,
        selected: true, // Auto-select when adding
      },
    ]);

    // Force tab to unhide to show the new stage
    setTab("unhide");
    setNewStage("");
    setModalVisible(false);
  };

  const saveStages = async () => {
    const selectedStages = stageList
      .filter((s) => s.selected)
      .map((s, index) => ({
        _id: s._id,
        title: s.name,
        order: index,
      }));

    try {
      await api.post(
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
      router.back();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredStages = stageList
    .filter((s) => (tab === "unhide" ? s.selected : !s.selected))
    .sort((a, b) => a.order - b.order);

  const unhideCount = stageList.filter((s) => s.selected).length;

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-[#FAFAFA]"}`}>
      <Header title="Manage Stage" onBack={() => router.back()} count={unhideCount} />

      {/* Segmented Control UI */}
      <View
        className={`flex-row mx-4 mt-2 mb-4 p-1 rounded-[8px] ${
          isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
        }`}
      >
        <TouchableOpacity
          onPress={() => setTab("unhide")}
          className={`flex-1 py-3 rounded-[5px] items-center ${
            tab === "unhide"
              ? isDarkMode
                ? "bg-[#000]"
                : "bg-white"
              : "bg-transparent"
          }`}
        >
          <Text
            className={`text-[15px] ${
              tab === "unhide" ? "font-poppinsMedium" : "font-poppins"
            } ${
              tab === "unhide"
                ? isDarkMode
                  ? "text-white"
                  : "text-black"
                : isDarkMode
                ? "text-[#BBBBBB]"
                : "text-[#454545]"
            }`}
          >
            Unhide
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("hide")}
          className={`flex-1 py-3 rounded-[5px] items-center ${
            tab === "hide"
              ? isDarkMode
                ? "bg-[#000]"
                : "bg-white"
              : "bg-transparent"
          }`}
        >
          <Text
            className={`text-[15px] ${
              tab === "hide" ? "font-poppinsMedium" : "font-poppins"
            } ${
              tab === "hide"
                ? isDarkMode
                  ? "text-white"
                  : "text-black"
                : isDarkMode
                ? "text-[#BBBBBB]"
                : "text-[#454545]"
            }`}
          >
            Hide
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4">
        <DraggableFlatList
          data={filteredStages}
          keyExtractor={(item: Stage) => item.uiId}
          onDragEnd={({ data }) => {
            const updatedFiltered = data.map((item, i) => ({ ...item, order: i }));
            setStageList((prev) => {
              const others = prev.filter((p) =>
                tab === "unhide" ? !p.selected : p.selected
              );
              return [...updatedFiltered, ...others].sort(
                (a, b) => a.order - b.order
              );
            });
          }}
          renderItem={({ item, getIndex, drag, isActive }) => {
            const index = getIndex() ?? 0;
            return (
              <StageItem
                item={item}
                index={index}
                toggleStage={toggleStage}
                drag={drag}
                isActive={isActive}
                isDarkMode={isDarkMode}
              />
            );
          }}
        />
      </View>

      {/* Bottom Actions */}
      <View
        className={`flex-row px-4 pt-4 ${
          isDarkMode
            ? "bg-black border-[#1A1A1A]"
            : "bg-[#FAFAFA] border-[#F0F3F7]"
        }`}
        style={{ paddingBottom: Math.max(insets.bottom, 15) }}
      >
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className={`flex-1 mr-2 flex-row justify-center items-center py-4 rounded-[12px] ${
            isDarkMode ? "bg-[#1C1C1E]" : "bg-[#F0F3F7]"
          }`}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            className={`ml-2 font-dm text-[16px] ${
              isDarkMode ? "text-white" : "text-black"
          }`}
          >
            Add Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveStages}
          className="flex-1 ml-2 rounded-[12px] overflow-hidden"
        >
          <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center justify-center"
          >
            <Text className="text-white font-dm text-[16px]">
              Save
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
