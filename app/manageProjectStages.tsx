import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  Animated,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

const CustomToggle = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const [internalValue, setInternalValue] = useState(value);
  
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const animatedValue = useRef(new Animated.Value(internalValue ? 1 : 0)).current;
  const stretchValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: internalValue ? 1 : 0,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, [internalValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const scaleX = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const stretchOffset = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const sideModifier = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1],
  });

  const finalTranslateX = Animated.add(
    translateX,
    Animated.multiply(stretchOffset, sideModifier),
  );

  const greenOpacity = animatedValue;

  const handlePressIn = () => {
    Animated.spring(stretchValue, {
      toValue: 1,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(stretchValue, {
      toValue: 0,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
    
    const newValue = !internalValue;
    setInternalValue(newValue);
    
    setTimeout(() => {
      onValueChange(newValue);
    }, 500);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: isDarkMode ? "#333" : "#D1D5DB",
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#10B981",
            opacity: greenOpacity,
          }}
        />

        <Animated.View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#FFF",
            transform: [{ translateX: finalTranslateX }, { scaleX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
};

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

          <CustomToggle
            value={item.selected}
            onValueChange={() => toggleStage(item.uiId)}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  },
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

          <View
            className={`h-[1px] w-full mb-6 ${isDarkMode ? "bg-[#333]" : "bg-gray-200"}`}
          />

          <Text
            className={`text-[14px] font-dmSemiBold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Enter stage name
          </Text>

          <TextInput
            value={newStage}
            onChangeText={setNewStage}
            placeholder="Revision"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={`rounded-[12px] p-4 mb-8 font-poppins text-[15px] ${
              isDarkMode ? "bg-[#0D0D0D] text-white" : "bg-[#F4F6F8] text-black"
            }`}
          />

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 mr-2 rounded-[12px] py-4 items-center justify-center  border-[1px] ${
                isDarkMode
                  ? "border-white bg-transparent"
                  : "border-black bg-transparent"
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
                <Text className="text-white font-poppins text-[16px]">
                  Save
                </Text>
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
      prev.map((s) => (s.uiId === uiId ? { ...s, selected: !s.selected } : s)),
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
        },
      );
      router.back();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredStages = useMemo(() => {
    return stageList
      .filter((s) => (tab === "unhide" ? s.selected : !s.selected))
      .sort((a, b) => a.order - b.order);
  }, [stageList, tab]);

  const unhideCount = useMemo(() => {
    return stageList.filter((s) => s.selected).length;
  }, [stageList]);

  const renderStageItem = useCallback(
    ({ item, getIndex, drag, isActive }: any) => {
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
    },
    [toggleStage, isDarkMode]
  );

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-[#FAFAFA]"}`}>
      <Header
        title="Manage Stage"
        onBack={() => router.back()}
        count={unhideCount}
      />

      {/* Segmented Control UI */}
      <View
        className={`flex-row mx-4 mt-2 mb-4 p-1 rounded-[8px] ${
          isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
        }`}
      >
        <TouchableOpacity
          onPress={() => setTab("unhide")}
          className={`flex-1 py-2 rounded-[5px] items-center ${
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
          className={`flex-1 py-2 rounded-[5px] items-center ${
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
          containerStyle={{ flex: 1 }}
          animationConfig={{ damping: 20, mass: 0.2, stiffness: 100, overshootClamping: false, restSpeedThreshold: 0.2, restDisplacementThreshold: 0.2 }}
          windowSize={10}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          removeClippedSubviews={false}
          onDragEnd={({ data }) => {
            const updatedFiltered = data.map((item, i) => ({
              ...item,
              order: i,
            }));
            setStageList((prev) => {
              const others = prev.filter((p) =>
                tab === "unhide" ? !p.selected : p.selected,
              );
              return [...updatedFiltered, ...others].sort(
                (a, b) => a.order - b.order,
              );
            });
          }}
          renderItem={renderStageItem}
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
            <Text className="text-white font-dm text-[16px]">Save</Text>
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
