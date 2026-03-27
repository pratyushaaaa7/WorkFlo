import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useEffect,
  useState,
  useContext,
  memo,
  useCallback,
  useRef,
  useMemo,
} from "react";
import * as Haptics from "expo-haptics";
import Modal from "react-native-modal";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import uuid from "react-native-uuid";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ------------------- Custom Toggle -------------------
const CustomToggle = memo(
  ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => {
    const isDarkMode = useColorScheme() === "dark";
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
    const scaleY = useRef(new Animated.Value(1)).current;
    const scaleX = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.spring(animatedValue, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 22],
    });

    const greenOpacity = animatedValue;

    const handlePressIn = () => {
      Animated.spring(scaleX, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
      Animated.spring(scaleY, {
        toValue: 0.8,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleX, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 15,
      }).start();
      Animated.spring(scaleY, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 15,
      }).start();
      onValueChange(!value);
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
              transform: [{ translateX }, { scaleX }, { scaleY }],
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
  }
);
CustomToggle.displayName = "CustomToggle";

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
const Header = memo(
  ({
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
  }
);
Header.displayName = "Header";

// ------------------- Stage Item -------------------
const StageItem = memo(
  ({ item, index, toggleStage, drag, isActive }: any) => {
    const isDarkMode = useColorScheme() === "dark";
    const handleToggle = useCallback(
      (val: boolean) => toggleStage(item.uiId),
      [item.uiId, toggleStage]
    );
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          delayLongPress={150}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            marginVertical: 4,
            borderRadius: 16,
            backgroundColor: isDarkMode ? "#1C1C1E" : "#F4F6F8",
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              backgroundColor: isDarkMode ? "#28243D" : "#E0E7FF",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Poppins-Medium",
                color: isDarkMode ? "#8B5CF6" : "#5B4CCC",
              }}
            >
              {index + 1}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins-Regular",
              flex: 1,
              color: isDarkMode ? "#F9FAFB" : "#111827",
            }}
          >
            {item.name}
          </Text>

          <CustomToggle value={item.selected} onValueChange={handleToggle} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }
);
StageItem.displayName = "StageItem";

// ------------------- Add Stage Modal -------------------
const AddStageModal = memo(
  ({
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
              className={`h-[1px] w-full mb-6 ${
                isDarkMode ? "bg-[#333]" : "bg-gray-200"
              }`}
            />

            <Text
              className={`text-[14px] font-dmSemiBold mb-3 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
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
                className={`flex-1 mr-2 rounded-[12px] py-4 items-center justify-center border-[1px] ${
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
  }
);
AddStageModal.displayName = "AddStageModal";

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

  const addCustomStage = useCallback(() => {
    if (!newStage.trim()) return;
    setStageList((prev) => [
      ...prev,
      {
        uiId: uuid.v4().toString(),
        name: newStage.trim(),
        order: prev.length,
        selected: true,
      },
    ]);
    setTab("unhide");
    setNewStage("");
    setModalVisible(false);
  }, [newStage]);

  const saveStages = useCallback(async () => {
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
        { projectId, stages: selectedStages },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.back();
    } catch (error) {
      console.error("Error:", error);
    }
  }, [stageList, projectId, token]);

  const handleDragEnd = useCallback(
    ({ data }: { data: Stage[] }) => {
      const updatedFiltered = data.map((item, i) => ({ ...item, order: i }));
      setStageList((prev) => {
        const others = prev.filter((p) =>
          tab === "unhide" ? !p.selected : p.selected
        );
        return [...updatedFiltered, ...others];
      });
    },
    [tab]
  );

  // Memoize expensive filter+sort
  const filteredStages = useMemo(
    () =>
      stageList
        .filter((s) => (tab === "unhide" ? s.selected : !s.selected))
        .sort((a, b) => a.order - b.order),
    [stageList, tab]
  );

  const unhideCount = useMemo(
    () => stageList.filter((s) => s.selected).length,
    [stageList]
  );

  const handleCloseModal = useCallback(() => setModalVisible(false), []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#000" : "#FAFAFA",
      }}
    >
      <Header
        title="Manage Stage"
        onBack={() => router.back()}
        count={unhideCount}
      />

      {/* Segmented Control */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 16,
          padding: 4,
          borderRadius: 8,
          backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
        }}
      >
        {(["unhide", "hide"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderRadius: 5,
              backgroundColor:
                tab === t
                  ? isDarkMode
                    ? "#000"
                    : "#FFF"
                  : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily:
                  tab === t ? "Poppins-Medium" : "Poppins-Regular",
                color:
                  tab === t
                    ? isDarkMode
                      ? "#FFF"
                      : "#000"
                    : isDarkMode
                    ? "#BBBBBB"
                    : "#454545",
              }}
            >
              {t === "unhide" ? "Unhide" : "Hide"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <DraggableFlatList
          data={filteredStages}
          keyExtractor={(item: Stage) => item.uiId}
          onDragEnd={handleDragEnd}
          activationDistance={10}
          renderItem={({ item, getIndex, drag, isActive }) => (
            <StageItem
              item={item}
              index={getIndex() ?? 0}
              toggleStage={toggleStage}
              drag={drag}
              isActive={isActive}
            />
          )}
        />
      </View>

      {/* Bottom Actions */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 15),
          backgroundColor: isDarkMode ? "#000" : "#FAFAFA",
        }}
      >
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            flex: 1,
            marginRight: 8,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 16,
            borderRadius: 12,
            backgroundColor: isDarkMode ? "#1C1C1E" : "#F0F3F7",
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            style={{
              marginLeft: 8,
              fontFamily: "DM-Regular",
              fontSize: 16,
              color: isDarkMode ? "#FFF" : "#000",
            }}
          >
            Add Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveStages}
          style={{
            flex: 1,
            marginLeft: 8,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, alignItems: "center" }}
          >
            <Text
              style={{
                color: "#FFF",
                fontFamily: "DM-Regular",
                fontSize: 16,
              }}
            >
              Save
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddStageModal
        visible={modalVisible}
        onClose={handleCloseModal}
        newStage={newStage}
        setNewStage={setNewStage}
        addStage={addCustomStage}
      />
    </View>
  );
}
