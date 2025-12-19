import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../context/AuthContext";
import GanttChart from "../components/projectStageGanttChart";
import api from "@/lib/api";

type Revision = {
  revisionNumber: number;
  start?: string;
  end?: string;
  originalEnd?: string;
  remark?: string;
  createdBy: string;
  updatedBy?: string;
  updatedAt?: string;
  saved?: boolean;
  delayDays?: number;
  daysDifference?: number; // ✅ new field from backend
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
  const { stageId, projectId, stage } = useLocalSearchParams<{
    stageId: string;
    stage: string;
    projectId: string;
  }>();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = auth?.token;

  // Initialize stages state with a safe default for the current stage
  const [stages, setStages] = useState<Record<string, Revision[]>>(() => ({
    [stageId!]: [
      {
        revisionNumber: 0,
        saved: false,
        createdBy: user?.username || "unknown",
      },
    ],
  }));

  // Picker state
  const [picker, setPicker] = useState<{
    show: boolean;
    type: "start" | "end" | "";
    stageId?: string;
    index?: number;
  }>({ show: false, type: "" });

  const stageData = stages[stageId!] ?? [];

  const getDuration = (data: Revision) => {
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

    if (!picker.stageId || picker.index == null) return;

    const formatted = (selectedDate ?? new Date()).toISOString().split("T")[0];

    setStages((prev) => {
      const updated = [...(prev[picker.stageId!] || [])];

      updated[picker.index!] = {
        ...updated[picker.index!],
        [picker.type]: formatted,
        saved: false,
      };

      return { ...prev, [picker.stageId!]: updated };
    });

    setPicker({ show: false, type: "" });
  };

  const addRevision = (lastIndex: number) => {
    const stageKey = stageId!;

    setStages((prev) => {
      const updated = [...prev[stageKey]];

      // block adding if last not saved
      if (!updated[lastIndex]?.saved) return prev;

      updated.push({
        revisionNumber: updated[lastIndex].revisionNumber + 1,
        saved: false,
        createdBy: user?.username || "unknown",
      });

      return { ...prev, [stageKey]: updated };
    });
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
        });
      }
      updated[index] = {
        ...updated[index],
        remark: text,
        saved: false, // 👈 ADD THIS
        updatedBy: user?.username,
        updatedAt: new Date().toISOString(),
      };

      return { ...prev, [stageKey]: updated };
    });
  };

  const canSave = (item: Revision) => {
    // must have at least something
    if (!item.start && !item.end && !item.remark) return false;

    // revision 1+ → remark is mandatory
    if ((item.revisionNumber ?? 0) > 0) {
      return Boolean(item.remark && item.remark.trim().length > 0);
    }

    // revision 0 → remark optional
    return true;
  };

  useEffect(() => {
    if (!projectId || !stageId || !token) return;

    const fetchRevisions = async () => {
      try {
        const res = await api.get(
          `/stages/${projectId}/stages/${stageId}/revisions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(res.data);
        const revisionsFromBackend: Revision[] = res.data.revisions.map(
          (r: any) => ({
            revisionNumber: r.revisionNumber,
            start: r.start,
            end: r.end,
            remark: r.remark,
            originalEnd: r.originalEnd,
            createdBy: r.createdBy,
            updatedBy: r.updatedBy,
            updatedAt: r.updatedAt,
            saved: true, // mark fetched revisions as saved
            delayDays: r.delayDays, // ✅ include this
          })
        );

        setStages((prev) => ({
          ...prev,
          [stageId!]: revisionsFromBackend.length
            ? revisionsFromBackend
            : prev[stageId!] || [],
        }));
      } catch (err) {
        console.error("Failed to fetch revisions:", err);
      }
    };

    fetchRevisions();
  }, [projectId, stageId, token]);

  // ... rest of your component code (date picker, saveStage, addRevision, etc.) remains the same

  const saveStage = async (index: number) => {
    const stageKey = stageId!;
    const item = stageData[index];

    if (!canSave(item)) return;

    try {
      const payload: any = {
        start: item.start,
        end: item.end,
        remark: item.remark,
      };

      // ONLY send revisionNumber if editing an already-saved revision
      if (item.saved) {
        payload.revisionNumber = item.revisionNumber;
      }

      const res = await api.post(
        `/stages/${projectId}/stages/${stageId}/revisions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const savedRevision = res.data.revision;

      // ✅ Update UI from backend response
      setStages((prev) => {
        const updated = [...prev[stageKey]];

        updated[index] = {
          ...updated[index],
          ...savedRevision,
          saved: true,
        };

        return { ...prev, [stageKey]: updated };
      });
    } catch (err: any) {
      console.error("Save failed:", err);

      Alert.alert(
        "Save failed",
        err?.response?.data?.message || "Something went wrong"
      );
    }
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

      <GanttChart stages={stageData} stage={stage ?? "Stage"} />

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
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
                    setPicker({ show: true, stageId, type: "start", index })
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
                    setPicker({ show: true, stageId, type: "end", index })
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
            {stageItem.revisionNumber > 0 &&
              stageItem.delayDays !== undefined && (
                <View className="px-4 pb-2">
                  <Text
                    className={`text-sm ${
                      stageItem.delayDays > 0
                        ? "text-red-500"
                        : stageItem.delayDays < 0
                        ? "text-green-500"
                        : "text-gray-700"
                    }`}
                  >
                    {stageItem.delayDays > 0
                      ? `Delayed by ${stageItem.delayDays} day(s)`
                      : stageItem.delayDays < 0
                      ? `Completed ${Math.abs(
                          stageItem.delayDays
                        )} day(s) early`
                      : "Completed on time"}
                  </Text>
                </View>
              )}

            {/* Remark / Reason */}
            <View className="px-4 pb-4">
              <Text className="text-gray-600 mb-1 text-sm">
                {stageItem.revisionNumber ? "Reason for Revision" : "Remark"}
              </Text>
              <TextInput
                editable={!stageItem.saved} // 👈 KEY LINE
                showSoftInputOnFocus={!stageItem.saved}
                multiline
                value={stageItem.remark || ""}
                onChangeText={(text) =>
                  handleRemarkChange(stageId!, index, text)
                }
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
      </KeyboardAwareScrollView>
    </View>
  );
};

export default StageDetail;
