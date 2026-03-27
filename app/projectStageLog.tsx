import api from "@/lib/api";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import GanttChart from "../components/projectStageGanttChart";
import { AuthContext } from "../context/AuthContext";

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
};

const calculateDelay = (originalEnd?: string, end?: string) => {
  if (!originalEnd || !end) return 0;
  const diff = Math.ceil(
    (new Date(end).getTime() - new Date(originalEnd).getTime()) /
      (1000 * 60 * 60 * 24),
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
            (1000 * 60 * 60 * 24),
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
    text: string,
  ) => {
    setStages((prev) => {
      const updated = [...(prev[stageKey] || [])];
      while (updated.length <= index) {
        updated.push({
          revisionNumber: updated.length,
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
          },
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
          }),
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
        },
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
        err?.response?.data?.message || "Something went wrong",
      );
    }
  };

  const isDarkMode = useColorScheme() === "dark";

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-[#F3F4F6]"}`}>
      {/* Header */}
      <View className={`pt-16 pb-4 px-4 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            className={`text-[20px] font-dmSemiBold ml-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            {stage} Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {/* Revision Timeline Card */}
        <View
          className={`rounded-[24px] mb-6 overflow-hidden ${
            isDarkMode ? "bg-[#0D0D0D]" : "bg-white"
          }`}
        >
          <View className="p-5 pb-0 flex-row justify-between items-center">
            <Text
              numberOfLines={1}
              className={`text-[17px] font-dmSemiBold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Revision Timeline
            </Text>
            {stageData[0]?.start && stageData[0]?.end && (
              <View
                className={`px-3 py-1 rounded-[8px] ${
                  isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                }`}
              >
                <Text
                  className={`text-[12px] font-poppins ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  {new Date(stageData[0].start).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  &gt;{" "}
                  {new Date(stageData[0].end).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
          <GanttChart stages={stageData} stage={stage ?? "Stage"} />
        </View>
        {stageData.map((stageItem, index) => (
          <View
            key={index}
            className={`rounded-[24px] mb-5 overflow-hidden ${
              isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
            }`}
          >
            {/* Revision Header */}
            <View className="p-5 flex-row justify-between items-center">
              <Text
                className={`text-[16px] font-dmSemiBold ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Revision {stageItem.revisionNumber || 0}
              </Text>
              <Text
                className={`text-[14px] font-poppins ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Duration {getDuration(stageItem) || 0} days
              </Text>
            </View>

            {/* Dates */}
            <View className="px-5 flex-row justify-between gap-4">
              <View className="flex-1">
                <Text
                  className={`text-[14px] font-poppins mb-2 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Start Date
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setPicker({ show: true, stageId, type: "start", index })
                  }
                  className={`rounded-[12px] px-4 py-3 flex-row items-center justify-between ${
                    isDarkMode ? "bg-[#2D2D2D]" : "bg-[#F0F3F7]"
                  }`}
                >
                  <Text
                    className={`text-[14px] font-poppins ${
                      isDarkMode ? "text-white" : "text-[#4B5563]"
                    }`}
                  >
                    {stageItem.start ? stageItem.start : "DD-MM-YYYY"}
                  </Text>
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={20}
                    color={isDarkMode ? "#fff" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text
                  className={`text-[14px] font-poppins mb-2 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  End Date
                </Text>
                <TouchableOpacity
                  disabled={!stageItem.start}
                  onPress={() =>
                    setPicker({ show: true, stageId, type: "end", index })
                  }
                  className={`rounded-[12px] px-4 py-3 flex-row items-center justify-between ${
                    isDarkMode ? "bg-[#2D2D2D]" : "bg-[#F0F3F7]"
                  }`}
                  style={{ opacity: !stageItem.start ? 0.5 : 1 }}
                >
                  <Text
                    className={`text-[14px] font-poppins ${
                      isDarkMode ? "text-white" : "#4B5563"
                    }`}
                  >
                    {stageItem.end ? stageItem.end : "DD-MM-YYYY"}
                  </Text>
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={20}
                    color={isDarkMode ? "#fff" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remark / Reason and Delay */}
            <View className="p-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className={`text-[14px] font-poppins ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  {stageItem.revisionNumber ? "Reason for Revision" : "Remark"}
                </Text>

                {stageItem.revisionNumber > 0 &&
                  stageItem.delayDays !== undefined &&
                  stageItem.delayDays > 0 && (
                    <Text className="text-[#E11D48] text-[13px] font-poppinsMedium">
                      Delayed by {stageItem.delayDays} days
                    </Text>
                  )}
              </View>

              <TextInput
                editable={!stageItem.saved}
                showSoftInputOnFocus={!stageItem.saved}
                multiline
                value={stageItem.remark || ""}
                onChangeText={(text) =>
                  handleRemarkChange(stageId!, index, text)
                }
                placeholder={stageItem.revisionNumber ? "Reason" : "Remark"}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                textAlignVertical="top"
                className={`rounded-[12px] px-4 py-3 h-20 font-poppins text-[14px] ${
                  isDarkMode
                    ? "bg-[#2D2D2D] text-white"
                    : "bg-[#F0F3F7] text-black"
                }`}
              />
            </View>

            {/* Save Button */}
            {!stageItem.saved && (
              <View className="px-5 pb-5">
                <TouchableOpacity
                  onPress={() => saveStage(index)}
                  disabled={!canSave(stageItem)}
                  className="rounded-[12px] overflow-hidden"
                >
                  <LinearGradient
                    colors={
                      canSave(stageItem)
                        ? ["#5B4CCC", "#6347C2", "#8056D1"]
                        : ["#E5E7EB", "#E5E7EB", "#E5E7EB"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-3 items-center"
                  >
                    <Text className="text-white font-poppinsMedium text-[14px]">
                      Save
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Add Revision Button */}
        {stageData[stageData.length - 1]?.saved && (
          <TouchableOpacity
            onPress={() => addRevision(stageData.length - 1)}
            className="rounded-[12px] overflow-hidden mt-2"
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3 items-center"
            >
              <Text className="text-white font-poppinsMedium text-[14px]">
                Add Revision
              </Text>
            </LinearGradient>
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
