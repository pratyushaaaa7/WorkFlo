import React, { useState } from "react";
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

type StageDataItem = {
  start?: string;
  end?: string;
  remark?: string;
  saved?: boolean;
};

const StageDetail: React.FC = () => {
  const router = useRouter();
  const { stage } = useLocalSearchParams<{ stage: string }>();

  const [dates, setDates] = useState<{ [stage: string]: StageDataItem[] }>({
    [stage!]: [{}], // start with one entry
  });

  const [picker, setPicker] = useState<{
    show: boolean;
    type: "start" | "end" | "";
    stage?: string;
    index?: number;
  }>({ show: false, type: "" });

  const getStatus = (data: StageDataItem) => {
    if (!data.start) return "Not Started";
    if (data.start && !data.end) return "Ongoing";
    return "Completed";
  };

  const getDuration = (data: StageDataItem) => {
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
    if (event.type === "dismissed") {
      setPicker({ show: false, type: "" });
      return;
    }
    const currentDate = selectedDate || new Date();
    const stageKey = picker.stage!;
    const index = picker.index!;
    setDates((prev) => {
      const updated = [...prev[stageKey]];
      updated[index] = {
        ...updated[index],
        [picker.type]: currentDate.toISOString().split("T")[0],
      };
      return { ...prev, [stageKey]: updated };
    });
    setPicker({ show: false, type: "" });
  };

  const handleRemarkChange = (
    stageKey: string,
    index: number,
    text: string
  ) => {
    setDates((prev) => {
      const updated = [...prev[stageKey]];
      updated[index] = { ...updated[index], remark: text };
      return { ...prev, [stageKey]: updated };
    });
  };

  const canSave = (item: StageDataItem) => {
    if (item.end && !item.remark?.trim()) return false;
    return item.start || item.end || item.remark;
  };

  const stageData = dates[stage!];

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
                  onPress={() =>
                    setDates((prev) => {
                      const updated = [...prev[stage!]];
                      updated[index] = { ...updated[index], saved: true };
                      return { ...prev, [stage!]: updated };
                    })
                  }
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
                    setDates((prev) => {
                      const updated = [...prev[stage!]];
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
              </View>
            )}
          </View>
        ))}

        {/* + Add New Range button appears only if last entry has an end date AND is saved */}
        {stageData[stageData.length - 1]?.end &&
          stageData[stageData.length - 1]?.saved && (
            <TouchableOpacity
              onPress={() =>
                setDates((prev) => ({
                  ...prev,
                  [stage!]: [...prev[stage!], {}],
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
            value={new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default StageDetail;
