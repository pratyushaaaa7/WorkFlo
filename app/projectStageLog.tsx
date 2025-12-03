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
  action: "start_set" | "end_set" | "remark_added" | "saved" | "edited";
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string;
  user: string;
};

type StageEntry = {
  start?: string;
  end?: string;
  remark?: string;
  saved: boolean;
  createdBy: string;
  updatedBy?: string;
  updatedAt?: string;
  logs?: ActivityLog[];
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
    // DateTimePicker on Android returns event.type === 'dismissed' when canceled
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
      // ensure entry exists
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

      return { ...prev, [stageKey]: updated };
    });

    addLog(stageKey, index, {
      action: field === "start" ? "start_set" : "end_set",
      field,
      oldValue: undefined,
      newValue: formatted,
      timestamp: new Date().toISOString(),
      user: user?.username || "unknown",
    });

    setPicker({ show: false, type: "" });
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

    addLog(stageKey, index, {
      action: "remark_added",
      field: "remark",
      oldValue: undefined,
      newValue: text,
      timestamp: new Date().toISOString(),
      user: user?.username || "unknown",
    });
  };

  const canSave = (item: StageEntry) => {
    if (item.end && !item.remark?.trim()) return false;
    return Boolean(item.start || item.end || item.remark);
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

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {stageData.map((stageItem, index) => (
          <View
            key={index}
            className="bg-white p-4 rounded-xl shadow mb-4 border border-gray-200"
          >
            {!stageItem.saved ? (
              <>
                <View className="flex-row justify-between mt-3 gap-3">
                  {/* Start Date */}
                  <View className="flex-1">
                    <Text>Start Date</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setPicker({ show: true, stage, type: "start", index })
                      }
                      className={`border border-gray-200 rounded-xl px-3 py-3 flex-row items-center ${
                        stageItem.start ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name="calendar-start"
                        size={18}
                        color="#6B7280"
                      />
                      <Text className="ml-2 text-gray-700 text-sm flex-shrink">
                        {stageItem.start
                          ? new Date(stageItem.start).toDateString()
                          : "Start Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* End Date */}
                  <View className="flex-1">
                    <Text>End Date</Text>
                    <TouchableOpacity
                      disabled={!stageItem.start}
                      onPress={() =>
                        setPicker({ show: true, stage, type: "end", index })
                      }
                      className={`border border-gray-200 rounded-xl px-3 py-3 flex-row items-center ${
                        stageItem.end
                          ? "bg-gray-100"
                          : stageItem.start
                          ? "bg-white"
                          : "bg-gray-100 opacity-50"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name="calendar-end"
                        size={18}
                        color="#6B7280"
                      />
                      <Text className="ml-2 text-gray-700 text-sm flex-shrink">
                        {stageItem.end
                          ? new Date(stageItem.end).toDateString()
                          : "End Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remark */}
                {stageItem.start && (
                  <View className="mt-3">
                    <Text className="text-gray-700 text-sm mb-1 font-medium">
                      Remark
                    </Text>
                    <TextInput
                      multiline
                      editable
                      value={stageItem.remark || ""}
                      onChangeText={(text) =>
                        handleRemarkChange(stage!, index, text)
                      }
                      placeholder="Add remark..."
                      placeholderTextColor="#9CA3AF"
                      textAlignVertical="top"
                      className="border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 text-gray-900"
                    />
                  </View>
                )}

                {/* Save Button */}
                <TouchableOpacity
                  onPress={() => {
                    setStages((prev) => {
                      const updated = [...(prev[stage!] || [])];
                      while (updated.length <= index) {
                        updated.push({
                          saved: false,
                          createdBy: user?.username || "unknown",
                          logs: [],
                        });
                      }
                      updated[index] = {
                        ...updated[index],
                        saved: true,
                        updatedBy: user?.username,
                        updatedAt: new Date().toISOString(),
                      };
                      return { ...prev, [stage!]: updated };
                    });

                    addLog(stage!, index, {
                      action: "saved",
                      timestamp: new Date().toISOString(),
                      user: user?.username || "unknown",
                    });
                  }}
                  disabled={!canSave(stageItem)}
                  className={`mt-4 py-3 rounded-xl ${
                    !canSave(stageItem) ? "bg-gray-300" : "bg-indigo-500"
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    Save Stage
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                {/* Edit */}
                <TouchableOpacity
                  onPress={() =>
                    setStages((prev) => {
                      const updated = [...(prev[stage!] || [])];
                      while (updated.length <= index) {
                        updated.push({
                          saved: false,
                          createdBy: user?.username || "unknown",
                          logs: [],
                        });
                      }
                      updated[index] = { ...updated[index], saved: false };
                      return { ...prev, [stage!]: updated };
                    })
                  }
                  className="absolute top-2 right-2 p-2 rounded-full bg-indigo-50"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color="#4F46E5"
                  />
                </TouchableOpacity>

                {stageItem.start && (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="calendar-start"
                      size={18}
                      color="#2563EB"
                    />
                    <Text className="text-gray-800 font-medium ml-2">
                      Start: {new Date(stageItem.start).toDateString()}
                    </Text>
                  </View>
                )}

                {stageItem.end && (
                  <View className="flex-row items-center mt-2">
                    <MaterialCommunityIcons
                      name="calendar-check"
                      size={18}
                      color="#16A34A"
                    />
                    <Text className="text-gray-800 font-medium ml-2">
                      End: {new Date(stageItem.end).toDateString()}
                    </Text>
                  </View>
                )}

                {stageItem.remark && (
                  <View className="flex-row items-start mt-2">
                    <MaterialCommunityIcons
                      name="comment-text-outline"
                      size={18}
                      color="#6B7280"
                    />
                    <Text className="text-gray-600 ml-2 flex-1">
                      {stageItem.remark}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center mt-2">
                  <Text className="text-gray-700 font-medium">
                    Status: {getStatus(stageItem)}
                  </Text>
                  {getDuration(stageItem) && (
                    <Text className="text-gray-700 font-medium ml-4">
                      Duration: {getDuration(stageItem)} day(s)
                    </Text>
                  )}
                </View>

                {/* Activity log toggle */}
                {stageItem.logs && stageItem.logs.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={() =>
                        setShowLogIndex(showLogIndex === index ? null : index)
                      }
                      className="mt-3"
                    >
                      <Text className="text-indigo-500 font-semibold">
                        {showLogIndex === index
                          ? "Hide Activity Log"
                          : "View Activity Log"}
                      </Text>
                    </TouchableOpacity>

                    {showLogIndex === index && (
                      <View className="mt-2 bg-white p-3 rounded-xl border border-gray-200">
                        {stageItem.logs
                          .slice()
                          .reverse()
                          .map((log, i) => (
                            <View key={i} className="mb-2">
                              <Text className="text-gray-600 text-sm">
                                • {new Date(log.timestamp).toLocaleString()} —{" "}
                                <Text className="font-medium">{log.user}</Text>{" "}
                                {log.action.replace("_", " ")}
                                {log.field ? ` (${log.field})` : ""}
                              </Text>
                              {log.oldValue || log.newValue ? (
                                <Text className="text-gray-500 text-xs mt-1">
                                  {log.oldValue ? `From: ${log.oldValue}` : ""}
                                  {log.oldValue && log.newValue ? " — " : ""}
                                  {log.newValue ? `To: ${log.newValue}` : ""}
                                </Text>
                              ) : null}
                            </View>
                          ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        ))}

        {/* + Add New Range button appears only if last entry has an end date AND is saved */}
        {stageData[stageData.length - 1]?.end &&
          stageData[stageData.length - 1]?.saved && (
            <TouchableOpacity
              onPress={() =>
                setStages((prev) => ({
                  ...prev,
                  [stage!]: [
                    ...(prev[stage!] || []),
                    {
                      saved: false,
                      createdBy: user?.username || "unknown",
                      logs: [],
                    },
                  ],
                }))
              }
              className="flex-row items-center justify-center mt-2 mb-6 py-3 bg-green-500 rounded-xl"
            >
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                Add New Range
              </Text>
            </TouchableOpacity>
          )}

        {picker.show && (
          <DateTimePicker
            value={
              // if a start exists for this picker, use it; else fallback to today
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
            // For end date, you could add a minimum date to prevent selecting before start:
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
