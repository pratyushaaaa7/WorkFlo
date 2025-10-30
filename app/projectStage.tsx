import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";

type StageDate = {
  start?: string;
  end?: string;
  remark?: string;
};

type PickerState = {
  show: boolean;
  stage: string;
  type: "start" | "end" | "";
};

const ProjectStage: React.FC = () => {
  const router = useRouter();
  const { company, projectId, projectName } = useLocalSearchParams<{
    company?: string;
    projectId?: string;
    projectName?: string;
  }>();

  const [stages, setStages] = useState<string[]>([]);
  const [dates, setDates] = useState<Record<string, StageDate>>({});
  const [picker, setPicker] = useState<PickerState>({
    show: false,
    stage: "",
    type: "",
  });
  const [savedStages, setSavedStages] = useState<Record<string, boolean>>({});

  // 🎯 Stage data
  const companyStages: Record<string, string[]> = {
    WP: [
      "Feasibility",
      "Design Management",
      "Tender Management",
      "Contract Management",
      "Construction Management",
      //   "During Construction",
      "Practice Development",
      //   "Billing Management",
      "Closing and Handover",
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

  // 🎨 Icons
  const stageIcons: Record<string, string> = {
    Feasibility: "lightbulb-on-outline",
    "Construction Management": "hard-hat",
    "During Construction": "hammer-wrench",
    "Design Management": "hammer-wrench",
    "Contract Management": "file-sign",
    "Practice Development": "chart-bar",
    "Tender Management": "file-document-outline",
    "Billing Management": "cash-multiple",
    "Close Out": "lock-check-outline",
    "Concept Design": "pencil-outline",
    "Schematic Design": "vector-line",
    Tender: "file-document-edit-outline",
    "Sanction Drawing": "drawing-box",
    "Design Development": "palette-outline",
    "Working Drawing": "ruler-square",
  };

  useEffect(() => {
    if (company?.toUpperCase() === "WP") setStages(companyStages.WP);
    else if (company?.toUpperCase() === "WAL") setStages(companyStages.WAL);
    else setStages([]);
  }, [company]);

  // 🔹 Stage status
  const getStageStatus = (start?: string, end?: string): string => {
    // if (!start || !end) return "Not Started";
    // const today = new Date();
    // const s = new Date(start);
    // const e = new Date(end);
    if (!start) return "Not Started";
    if (start && !end) return "Ongoing";
    return "Completed";
  };

  // 🔹 Status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Not Started":
        return { color: "#9CA3AF", bg: "#F3F4F6", icon: "clock-outline" };
      case "Ongoing":
        return { color: "#2563EB", bg: "#DBEAFE", icon: "progress-clock" };
      case "Completed":
        return {
          color: "#16A34A",
          bg: "#DCFCE7",
          icon: "check-circle-outline",
        };
      default:
        return {
          color: "#6B7280",
          bg: "#F9FAFB",
          icon: "calendar-blank-outline",
        };
    }
  };

  // 📅 Date handling
  const onChangeDate = (
    event: DateTimePickerEvent,
    selectedDate?: Date | undefined
  ) => {
    if (event.type === "dismissed") {
      setPicker({ show: false, stage: "", type: "" });
      return;
    }
    const currentDate = selectedDate || new Date();
    const { stage, type } = picker;
    setDates((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [type]: currentDate.toISOString().split("T")[0],
      },
    }));
    setPicker({ show: false, stage: "", type: "" });
  };

  // 📝 Remark handling
  const handleRemarkChange = (stage: string, remark: string) => {
    setDates((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        remark,
      },
    }));
  };

  // 💾 Save handling
  const handleSaveStage = (stage: string) => {
    setSavedStages((prev) => ({ ...prev, [stage]: true }));
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {projectName} Project Stage
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Project Info */}
      {/* <View className="py-5 px-6 bg-white border-b border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-800">
          {projectName || "Project"}
        </Text>
        <Text className="text-gray-500 mt-1 text-sm">
          Company: {company?.toUpperCase()}
        </Text>
      </View> */}

      {/* Timeline */}
      <ScrollView
        contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {stages.map((stage, index) => {
          const stageData = dates[stage] || {};
          const start = stageData.start;
          const end = stageData.end;
          const remark = stageData.remark || "";
          const status = getStageStatus(start, end);
          const style = getStatusStyle(status);
          const isLast = index === stages.length - 1;
          const isSaved = savedStages[stage];

          return (
            <View key={index} className="flex-row items-start mb-4">
              {/* Connector Line */}
              <View className="items-center mr-2 ">
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: style.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={style.icon}
                    size={18}
                    color={style.color}
                  />
                </View>
                {!isLast && (
                  <View
                    style={{
                      width: 3,
                      flex: 1,
                      //   backgroundColor: "#E5E7EB",
                      backgroundColor: style.bg,

                      marginTop: 4,
                    }}
                  />
                )}
              </View>

              {/* Stage Card */}
              <View className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name={stageIcons[stage]}
                      size={22}
                      color={style.color}
                    />
                    <Text className="ml-2 text-lg font-semibold text-gray-900">
                      {stage}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: style.bg,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name={style.icon}
                      size={14}
                      color={style.color}
                    />
                    <Text
                      style={{
                        color: style.color,
                        fontSize: 12,
                        marginLeft: 4,
                        fontWeight: "600",
                      }}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                {/* 📅 Editable or Saved */}
                {!stageData.saved ? (
                  <>
                    {/* 📅 Start & End Date Row */}
                    <View className="flex-row justify-between mt-3 gap-3">
                      {/* Start Date */}
                      <TouchableOpacity
                        disabled={!!start}
                        onPress={() =>
                          setPicker({ show: true, stage, type: "start" })
                        }
                        className={`flex-1 border border-gray-200 rounded-xl px-3 py-3 flex-row items-center ${
                          start ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <MaterialCommunityIcons
                          name="calendar-start"
                          size={18}
                          color="#6B7280"
                        />
                        <Text className="ml-2 text-gray-700 text-sm flex-shrink">
                          {start
                            ? new Date(start).toDateString()
                            : "Start Date"}
                        </Text>
                      </TouchableOpacity>

                      {/* End Date */}
                      <TouchableOpacity
                        disabled={!start || !!end}
                        onPress={() =>
                          setPicker({ show: true, stage, type: "end" })
                        }
                        className={`flex-1 border border-gray-200 rounded-xl px-3 py-3 flex-row items-center ${
                          end
                            ? "bg-gray-100"
                            : start
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
                          {end ? new Date(end).toDateString() : "End Date"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 📝 Remark */}
                    {start && (
                      <View className="mt-3">
                        <Text className="text-gray-700 text-sm mb-1 font-medium">
                          Remark
                        </Text>
                        <TextInput
                          multiline
                          editable
                          value={remark}
                          onChangeText={(text) =>
                            handleRemarkChange(stage, text)
                          }
                          placeholder="Add remark..."
                          placeholderTextColor="#9CA3AF"
                          textAlignVertical="top"
                          className="border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 text-gray-900"
                        />
                      </View>
                    )}

                    {/* 💾 Save Button */}
                    {(start || end || remark) && (
                      <TouchableOpacity
                        onPress={() =>
                          setDates((prev) => ({
                            ...prev,
                            [stage]: { ...prev[stage], saved: true },
                          }))
                        }
                        className="mt-4 bg-indigo-500  py-3 rounded-xl  active:opacity-90"
                      >
                        <Text className="text-white text-center font-semibold">
                          Save Stage
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  // 🌟 Saved view with Edit option
                  <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                    {/* ✏️ Edit Icon (top-right corner) */}
                    <TouchableOpacity
                      onPress={() =>
                        setDates((prev) => ({
                          ...prev,
                          [stage]: { ...prev[stage], saved: false },
                        }))
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

                    {/* Start Date */}
                    <View className="flex-row items-center ">
                      <MaterialCommunityIcons
                        name="calendar-start"
                        size={18}
                        color="#2563EB"
                      />
                      <Text className="text-gray-800 font-medium ml-2">
                        Start: {new Date(start!).toDateString()}
                      </Text>
                    </View>

                    {/* End Date */}
                    {end && (
                      <View className="flex-row items-center mt-2 ">
                        <MaterialCommunityIcons
                          name="calendar-check"
                          size={18}
                          color="#16A34A"
                        />
                        <Text className="text-gray-800 font-medium ml-2">
                          End: {new Date(end!).toDateString()}
                        </Text>
                      </View>
                    )}

                    {/* Remark */}
                    {remark ? (
                      <View className="flex-row items-start mt-2 ">
                        <MaterialCommunityIcons
                          name="comment-text-outline"
                          size={18}
                          color="#6B7280"
                        />
                        <Text className="text-gray-600  ml-2 flex-1">
                          {remark}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Date Picker */}
      {picker.show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
        />
      )}
    </View>
  );
};

export default ProjectStage;
