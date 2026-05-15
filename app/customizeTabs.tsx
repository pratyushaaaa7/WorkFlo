import {
  ArrowLeft01Icon,
  DragDropVerticalIcon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface TabItem {
  id: string;
  label: string;
  locked?: boolean;
}

interface TabSections {
  dashboard: TabItem[];
  project: TabItem[];
  task: TabItem[];
}

// ─────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────
const DEFAULT_TABS: TabSections = {
  dashboard: [
    { id: "overview", label: "Overview", locked: true },
    { id: "projects", label: "Projects" },
    { id: "tasks", label: "Tasks" },
    { id: "calendar", label: "Calendar" },
    { id: "notes", label: "Notes" },
  ],
  project: [
    { id: "wp", label: "WP" },
    { id: "wall", label: "WALL" },
    { id: "wcorp", label: "WCorp" },
  ],
  task: [
    { id: "ilr", label: "ILR" },
    { id: "mom", label: "MOM" },
    { id: "running_notes", label: "Running Notes" },
  ],
};

// ─────────────────────────────────────────────────────────────────
// Single row — no ScaleDecorator here; it lives in renderItem only
// ─────────────────────────────────────────────────────────────────
interface RowProps {
  item: TabItem;
  drag: () => void;
  isActive: boolean;
  isDarkMode: boolean;
}

const DraggableRow = ({ item, drag, isActive, isDarkMode }: RowProps) => (
  <TouchableOpacity
    onLongPress={() => {
      if (!item.locked) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        drag();
      }
    }}
    delayLongPress={180}
    activeOpacity={item.locked ? 1 : 0.85}
    className={`flex-row items-center justify-between px-5 py-[18px] border-b ${
      isDarkMode
        ? isActive
          ? "bg-[#2A2A2A] border-b-[#2A2A2A]"
          : "bg-[#1A1A1A] border-b-[#000]"
        : isActive
          ? "bg-[#EEF2FF] border-b-[#F0F2F5]"
          : "bg-[#F0F3F7] border-b-[#FBFCFD]"
    }`}
  >
    <Text
      className={`text-base ${isDarkMode ? "text-white" : "text-[#000]"}`}
      style={{ fontFamily: "DMSans_500Medium" }}
    >
      {item.label}
    </Text>

    {item.locked ? (
      <HugeiconsIcon icon={SquareLock01Icon} size={24} color="#DF5B5B" />
    ) : (
      <HugeiconsIcon
        icon={DragDropVerticalIcon}
        strokeWidth={3}
        size={24}
        color={isActive ? "#6C63FF" : isDarkMode ? "#D2D2D2" : "#454545"}
      />
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  items: TabItem[];
  isDarkMode: boolean;
  onReorder: (newItems: TabItem[]) => void;
}

const ReorderableSection = ({
  title,
  items,
  isDarkMode,
  onReorder,
}: SectionProps) => {
  const lockedItems = items.filter((i) => i.locked);
  const unlockedItems = items.filter((i) => !i.locked);

  // ScaleDecorator MUST be in renderItem so it has CellProvider context
  const renderItem = ({ item, drag, isActive }: RenderItemParams<TabItem>) => (
    <ScaleDecorator activeScale={1.04}>
      <DraggableRow
        item={item}
        drag={drag}
        isActive={isActive}
        isDarkMode={isDarkMode}
      />
    </ScaleDecorator>
  );

  return (
    <View className="mb-8">
      {/* Section title */}
      <Text
        className={`px-5 mb-3 text-[16px] ${
          isDarkMode ? "text-[#BBBBBB]" : "text-[#454545]"
        }`}
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        {title}
      </Text>

      {/* Card container */}
      <View className="mx-4 rounded-[20px] overflow-hidden">
        {/* Static locked items at top — no ScaleDecorator, no CellProvider needed */}
        {lockedItems.map((item) => (
          <DraggableRow
            key={item.id}
            item={item}
            drag={() => {}}
            isActive={false}
            isDarkMode={isDarkMode}
          />
        ))}

        {/* Draggable unlocked items */}
        <NestableDraggableFlatList
          data={unlockedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => onReorder([...lockedItems, ...data])}
        />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────
const CustomizeTabs = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [tabs, setTabs] = useState<TabSections>(DEFAULT_TABS);

  useEffect(() => {
    loadTabs();
  }, []);

  const loadTabs = async () => {
    try {
      const raw = await AsyncStorage.getItem("custom_tabs_order");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setTabs({
          dashboard: Array.isArray(parsed.dashboard)
            ? parsed.dashboard
            : DEFAULT_TABS.dashboard,
          project: Array.isArray(parsed.project)
            ? parsed.project
            : DEFAULT_TABS.project,
          task: Array.isArray(parsed.task) ? parsed.task : DEFAULT_TABS.task,
        });
      }
    } catch (e) {
      console.error("[CustomizeTabs] loadTabs error:", e);
    }
  };

  const saveTabs = async (updated: TabSections) => {
    try {
      await AsyncStorage.setItem("custom_tabs_order", JSON.stringify(updated));
    } catch (e) {
      console.error("[CustomizeTabs] saveTabs error:", e);
    }
  };

  const updateSection = (key: keyof TabSections, newItems: TabItem[]) => {
    // Enforce locked items stay at the top
    const locked = newItems.filter((i) => i.locked);
    const unlocked = newItems.filter((i) => !i.locked);
    const ordered = [...locked, ...unlocked];

    const updated = { ...tabs, [key]: ordered };
    setTabs(updated);
    saveTabs(updated);
  };

  const handleReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTabs(DEFAULT_TABS);
    await AsyncStorage.removeItem("custom_tabs_order");
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView
        className={`flex-1 ${isDarkMode ? "bg-[#000]" : "bg-[#FBFCFD]"}`}
      >
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* ── Header ── */}
        <View
          className={`flex-row items-center px-4 pt-[52px] pb-5 ${
            isDarkMode ? "bg-black" : "bg-[#FBFCFD]"
          }`}
        >
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#1A1A1A"}
            />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center justify-between">
            <Text
              className={`ml-1 text-[20px] font-dmSemiBold ${
                isDarkMode ? "text-white" : "text-[#1A1A1A]"
              }`}
            >
              Customize Tabs
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-[14px] font-dmMedium text-[#DF5B5B]">
                Reset to default
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sections ──
            NestableScrollContainer replaces ScrollView.
            It coordinates gesture priority between the outer scroll
            and each inner NestableDraggableFlatList. */}
        <NestableScrollContainer
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <ReorderableSection
            title="Dashboard Tab"
            items={tabs.dashboard}
            isDarkMode={isDarkMode}
            onReorder={(items) => updateSection("dashboard", items)}
          />
          <ReorderableSection
            title="Project Tab"
            items={tabs.project}
            isDarkMode={isDarkMode}
            onReorder={(items) => updateSection("project", items)}
          />
          <ReorderableSection
            title="Task Tab"
            items={tabs.task}
            isDarkMode={isDarkMode}
            onReorder={(items) => updateSection("task", items)}
          />
        </NestableScrollContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default CustomizeTabs;
