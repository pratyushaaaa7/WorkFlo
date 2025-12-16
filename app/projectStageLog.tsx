import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AuthContext } from "../context/AuthContext";

type ActivityLog = {
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string;
  user: string;
};

type Revision = {
  revisionNumber: number;
  start?: string;
  end?: string;
  originalEnd?: string;
  remark?: string;
  createdBy: string;
  saved?: boolean;
  delayDays?: number;
  logs?: ActivityLog[];
};

type Props = {
  revisions: Revision[];
  onSave: (index: number) => void;
  onAddRevision: () => void;
  onUpdate: (index: number, field: string, value: string) => void;
};

const calculateDelay = (originalEnd?: string, end?: string) => {
  if (!originalEnd || !end) return 0;
  const diff = Math.ceil(
    (new Date(end).getTime() - new Date(originalEnd).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
};

const StageDetail: React.FC = () => {
  const router = useRouter();
  const { stage } = useLocalSearchParams<{ stage: string }>();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  // Initialize stages state with a safe default for the current stage
  const [stages, setStages] = useState<{ [stageName: string]: StageEntry[] }>(
    () => ({
      [stage!]: [
        {
          saved: false,
          createdBy: user?.username || "unknown",
          logs: [],
        },
      ],
    })
  );

  // Picker state
  const [picker, setPicker] = useState<{
    show: boolean;
    type: "start" | "end" | "";
    stage?: string;
    index?: number;
  }>({ show: false, type: "" });

  // Which saved-card's logs are visible
  const [showLogIndex, setShowLogIndex] = useState<number | null>(null);

  // safe accessor: if stage key missing, ensure empty array
  if (!stages[stage!]) {
    stages[stage!] = [
      {
        saved: false,
        createdBy: user?.username || "unknown",
        logs: [],
      },
    ];
  }

  const stageData = stages[stage!];

  const addLog = (stageName: string, index: number, log: ActivityLog) => {
    setStages((prev) => {
      const updated = [...(prev[stageName] || [])];
      // ensure entry exists
      while (updated.length <= index) {
        updated.push({
          saved: false,
          createdBy: user?.username || "unknown",
          logs: [],
        });
      }
      updated[index].logs = [...(updated[index].logs || []), log];
      return { ...prev, [stageName]: updated };
    });
  };

  const getStatus = (data: StageEntry) => {
    if (!data.start) return "Not Started";
    if (data.start && !data.end) return "Ongoing";
    return "Completed";
  };

  const getDuration = (data: StageEntry) => {
    if (data.start && data.end) {
      return (
        Math.ceil(
          (new Date(data.end).getTime() - new Date(data.start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );
    }
    return undefined;
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if ((event as any).type === "dismissed") {
      setPicker({ show: false, type: "" });
      return;
    }

    const currentDate = selectedDate || new Date();
    const formatted = currentDate.toISOString().split("T")[0];

    const stageKey = picker.stage!;
    const index = picker.index ?? 0;
    const field = picker.type;

    setStages((prev) => {
      const updated = [...(prev[stageKey] || [])];
      while (updated.length <= index) {
        updated.push({
          saved: false,
          createdBy: user?.username || "unknown",
          logs: [],
        });
      }

      const oldValue = (updated[index] as any)[field];

      updated[index] = {
        ...updated[index],
        [field]: formatted,
        updatedBy: user?.username,
        updatedAt: new Date().toISOString(),
      };

      // If actualEnd changes, recalc delay
      if (field === "actualEnd") {
        const delay = calculateDelay(updated[index].plannedEnd, formatted);
        updated[index].delayDays = delay;
      }

      return { ...prev, [stageKey]: updated };
    });

    setPicker({ show: false, type: "" });
  };

  const addRevision = (lastIndex: number) => {
    const stageKey = stage!;
    setStages((prev) => {
      const updated = [...(prev[stageKey] || [])];

      // Add a new revision after the last one
      updated.push({
        saved: false,
        createdBy: user?.username || "unknown",
        logs: [],
        revisionNumber: (updated[lastIndex]?.revisionNumber || 0) + 1,
      });

      return { ...prev, [stageKey]: updated };
    });

    // Optionally scroll to the new revision or open it
  };

  const handleRemarkChange = (
    stageKey: string,
    index: number,
    text: string
  ) => {
    setStages((prev) => {
      const updated = [...(prev[stageKey] || [])];
      while (updated.length <= index) {
        updated.push({
          saved: false,
          createdBy: user?.username || "unknown",
          logs: [],
        });
      }
      const oldValue = updated[index].remark;

      updated[index] = {
        ...updated[index],
        remark: text,
        updatedBy: user?.username,
        updatedAt: new Date().toISOString(),
      };

      return { ...prev, [stageKey]: updated };
    });
  };

  const canSave = (item: StageEntry) => {
    // must have at least something
    if (!item.start && !item.end && !item.remark) return false;

    // revision 1+ → remark is mandatory
    if ((item.revisionNumber ?? 0) > 0) {
      return Boolean(item.remark && item.remark.trim().length > 0);
    }

    // revision 0 → remark optional
    return true;
  };

  const saveStage = (index: number) => {
    const stageKey = stage!;
    const now = new Date().toISOString();

    setStages((prev) => {
      const updated = [...(prev[stageKey] || [])];
      const item = updated[index];

      if (!canSave(item)) return prev;

      const finalizedLogs: ActivityLog[] = [];

      if (item.start) {
        finalizedLogs.push({
          action: "Expected Start Date",
          field: "start",
          newValue: item.start,
          timestamp: now,
          user: user?.username || "unknown",
        });
      }

      if (item.end) {
        finalizedLogs.push({
          action: "Expected End Date",
          field: "end",
          newValue: item.end,
          timestamp: now,
          user: user?.username || "unknown",
        });
      }

      if (item.remark) {
        finalizedLogs.push({
          action: "Remark Added",
          field: "remark",
          newValue: item.remark,
          timestamp: now,
          user: user?.username || "unknown",
        });
      }

      updated[index] = {
        ...item,
        saved: true,
        updatedBy: user?.username,
        updatedAt: now,
        logs: finalizedLogs, // 🔥 ONLY finalized logs
      };

      return { ...prev, [stageKey]: updated };
    });
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {stage} Stage
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {stageData.map((stageItem, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl shadow-md mb-5 border border-gray-100 overflow-hidden"
          >
            {/* Revision Header */}
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-gray-700 font-semibold text-sm">
                Revision {stageItem.revisionNumber || 0}
              </Text>
              <Text className="text-gray-500 text-xs">
                Duration: {getDuration(stageItem)} day(s)
              </Text>
            </View>

            {/* Dates */}
            <View className="p-4 flex-row justify-between gap-3">
              <View className="flex-1">
                <Text className="text-gray-600 mb-1 text-sm">Start Date</Text>
                <TouchableOpacity
                  onPress={() =>
                    setPicker({ show: true, stage, type: "start", index })
                  }
                  className={`border border-gray-200 rounded-xl px-3 py-2 flex-row items-center ${
                    stageItem.start ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="calendar-start"
                    size={20}
                    color="#6B7280"
                  />
                  <Text className="ml-2 text-gray-700 text-sm">
                    {stageItem.start
                      ? new Date(stageItem.start).toDateString()
                      : "Select"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text className="text-gray-600 mb-1 text-sm">End Date</Text>
                <TouchableOpacity
                  disabled={!stageItem.start}
                  onPress={() =>
                    setPicker({ show: true, stage, type: "end", index })
                  }
                  className={`border border-gray-200 rounded-xl px-3 py-2 flex-row items-center ${
                    stageItem.end
                      ? "bg-gray-100"
                      : stageItem.start
                      ? "bg-white"
                      : "bg-gray-100 opacity-50"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="calendar-end"
                    size={20}
                    color="#6B7280"
                  />
                  <Text className="ml-2 text-gray-700 text-sm">
                    {stageItem.end
                      ? new Date(stageItem.end).toDateString()
                      : "Select"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delay Calculation */}
            {stageItem.revisionNumber &&
              stageItem.originalEnd &&
              stageItem.end && (
                <View className="px-4 pb-2">
                  <Text className="text-red-500 text-sm">
                    Delay:{" "}
                    {calculateDelay(stageItem.originalEnd, stageItem.end)}{" "}
                    day(s)
                  </Text>
                </View>
              )}

            {/* Remark / Reason */}
            <View className="px-4 pb-4">
              <Text className="text-gray-600 mb-1 text-sm">
                {stageItem.revisionNumber ? "Reason for Revision" : "Remark"}
              </Text>
              <TextInput
                multiline
                value={stageItem.remark || ""}
                onChangeText={(text) => handleRemarkChange(stage!, index, text)}
                placeholder={
                  stageItem.revisionNumber
                    ? "Why revision happened..."
                    : "Add remark..."
                }
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
              />
            </View>

            {/* Save / Add Revision */}
            <View className="px-4 pb-4 flex-row gap-2">
              {!stageItem.saved && (
                <TouchableOpacity
                  onPress={() => saveStage(index)}
                  disabled={!canSave(stageItem)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    canSave(stageItem) ? "bg-indigo-500" : "bg-gray-300"
                  }`}
                >
                  <Text className="text-white font-semibold text-sm">Save</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Timeline / Activity Log */}
            {stageItem.saved && stageItem.logs && stageItem.logs.length > 0 && (
              <View className="px-4 pb-4">
                <Text className="text-gray-800 font-semibold mb-2 text-sm">
                  Activity Timeline
                </Text>
                <View className="border-l-2 border-indigo-300 pl-4">
                  {stageItem.logs
                    .slice()
                    .reverse()
                    .map((log, i) => (
                      <View key={i} className="mb-5 relative">
                        <View className="w-3 h-3 bg-indigo-500 rounded-full absolute -left-[9px] top-1.5" />
                        <Text className="text-gray-800 font-medium text-sm">
                          {log.action.replace("_", " ")}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">
                          {new Date(log.timestamp).toLocaleString()} —{" "}
                          {log.user}
                        </Text>
                        {(log.oldValue || log.newValue) && (
                          <View className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {log.oldValue && (
                              <Text className="text-gray-700 text-xs">
                                From: {log.oldValue}
                              </Text>
                            )}
                            {log.newValue && (
                              <Text className="text-gray-700 text-xs mt-1">
                                To: {log.newValue}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        ))}
        {/* Add Revision button - only if revision 0 exists and is saved */}
        {stageData[0]?.saved && (
          <TouchableOpacity
            onPress={() => addRevision(stageData.length - 1)}
            className="flex-1 py-3 rounded-xl items-center bg-green-500"
          >
            <Text className="text-white font-semibold text-sm">
              Add Revision
            </Text>
          </TouchableOpacity>
        )}

        {picker.show && (
          <DateTimePicker
            value={
              picker.type === "start"
                ? stageData[picker.index ?? 0]?.start
                  ? new Date(stageData[picker.index ?? 0]!.start!)
                  : new Date()
                : stageData[picker.index ?? 0]?.end
                ? new Date(stageData[picker.index ?? 0]!.end!)
                : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
            minimumDate={
              picker.type === "end" && stageData[picker.index ?? 0]?.start
                ? new Date(stageData[picker.index ?? 0]!.start!)
                : undefined
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

export default StageDetail;
