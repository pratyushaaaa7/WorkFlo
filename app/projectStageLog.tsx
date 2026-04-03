import api from "@/lib/api";
import {
  ArrowLeft01Icon,
  Calendar04Icon,
  MoreHorizontalIcon,
  Delete02Icon,
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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

const formatDateToDDMMYYYY = (dateStr?: string) => {
  if (!dateStr) return "DD-MM-YYYY";
  const date = new Date(dateStr);
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
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

  const handleRemove = (index: number) => {
    setStages((prev) => {
      const updated = [...(prev[stageId!] || [])];
      // remove the item at index
      updated.splice(index, 1);
      return { ...prev, [stageId!]: updated };
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

        setStages((prev) => {
          const existing = prev[stageId!] || [];

          if (revisionsFromBackend.length > 0) {
            return { ...prev, [stageId!]: revisionsFromBackend };
          }

          if (existing.length > 0) {
            return { ...prev, [stageId!]: existing };
          }

          // Fallback to inserting Revision 0 if it somehow went missing
          return {
            ...prev,
            [stageId!]: [
              {
                revisionNumber: 0,
                saved: false,
                createdBy: user?.username || "unknown",
              },
            ],
          };
        });
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

  const insets = useSafeAreaInsets();
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
            className={`text-[18px] font-dmSemiBold ml-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            {stage} Stage
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity>
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity> */}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 300 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Revision Timeline Card - Only show if there are saved revisions */}
          {stageData.some((r) => r.saved) && (
            <View
              className={`rounded-[24px] mb-6 overflow-hidden ${
                isDarkMode ? "bg-[#0D0D0D]" : "bg-white"
              }`}
            >
              <View className="p-4 pb-0 flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text
                    numberOfLines={1}
                    className={`text-[17px] font-dmSemiBold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Timeline
                  </Text>
                </View>
                {stageData[0]?.start && stageData[0]?.end && (
                  <View
                    className={`px-3 py-1 rounded-[8px] flex-shrink-0 ${
                      isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-poppins ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      {new Date(stageData[0].start).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
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
          )}
          {stageData.map((stageItem, index) => (
            <View
              key={index}
              className={`rounded-[24px] mb-5 overflow-hidden ${
                isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
              }`}
            >
              {/* Revision Header */}
              <View className="pt-4 mb-3 px-4 pb-3 flex-row justify-between border-b dark:border-[#2D2D2D] border-[#E0E5EB] items-center">
                <Text
                  className={`text-[15px] font-poppins ${
                    isDarkMode ? "text-[#E0E0E0]" : "text-[#454545]"
                  }`}
                >
                  Revision {stageItem.revisionNumber || 0}
                </Text>
                {getDuration(stageItem) !== undefined && (
                  <Text
                    className={`text-[13px] font-poppins ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Duration {getDuration(stageItem)} days
                  </Text>
                )}
              </View>

              {/* Dates */}
              <View className="px-4 flex-row justify-between gap-4">
                <View className="flex-1">
                  <Text
                    className={`text-[14px] font-dmMedium mb-2 ${
                      isDarkMode ? "text-[#FFFFFF]" : "text-black"
                    }`}
                  >
                    Start Date
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setPicker({ show: true, stageId, type: "start", index })
                    }
                    className={`rounded-[12px] px-4 py-3 flex-row items-center justify-between ${
                      isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-poppins ${
                        isDarkMode ? "text-white" : "text-[#4B5563]"
                      }`}
                    >
                      {formatDateToDDMMYYYY(stageItem.start)}
                    </Text>
                    <HugeiconsIcon
                      icon={Calendar04Icon}
                      size={20}
                      color={isDarkMode ? "#bbb" : "#454545"}
                    />
                    {picker.show &&
                      picker.index === index &&
                      picker.type === "start" && (
                        <DateTimePicker
                          value={
                            stageData[index]?.start
                              ? new Date(stageData[index]!.start!)
                              : new Date()
                          }
                          mode="date"
                          display="default"
                          onChange={onChangeDate}
                        />
                      )}
                  </TouchableOpacity>
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-[14px] font-dmMedium mb-2 ${
                      isDarkMode ? "#FFFFFF" : "text-black"
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
                      isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                    }`}
                    style={{ opacity: !stageItem.start ? 0.5 : 1 }}
                  >
                    <Text
                      className={`text-[14px] font-poppins ${
                        isDarkMode ? "text-white" : "#4B5563"
                      }`}
                    >
                      {formatDateToDDMMYYYY(stageItem.end)}
                    </Text>
                    <HugeiconsIcon
                      icon={Calendar04Icon}
                      size={20}
                      color={isDarkMode ? "#bbb" : "#454545"}
                    />
                  </TouchableOpacity>
                  {picker.show &&
                    picker.index === index &&
                    picker.type === "end" && (
                      <DateTimePicker
                        value={
                          stageData[index]?.end
                            ? new Date(stageData[index]!.end!)
                            : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        minimumDate={
                          stageData[index]?.start
                            ? new Date(stageData[index]!.start!)
                            : undefined
                        }
                      />
                    )}
                </View>
              </View>

              {/* Remark / Reason and Delay */}
              <View className="px-4 py-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className={`text-[14px] font-dmMedium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Reason for Revision
                  </Text>

                  {stageItem.delayDays !== undefined &&
                    stageItem.delayDays !== 0 && (
                      <Text
                        className={`${
                          stageItem.delayDays > 0
                            ? "text-[#E11D48]"
                            : "text-[#10B981]"
                        } text-[13px] font-poppins`}
                      >
                        {stageItem.delayDays > 0
                          ? `Delayed by ${stageItem.delayDays} days`
                          : `${Math.abs(stageItem.delayDays)} days early`}
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
                  placeholder="Revision"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  textAlignVertical="top"
                  className={`rounded-[12px] px-4 py-3 h-[70px] font-poppins text-[14px] ${
                    isDarkMode
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#F0F3F7] text-black"
                  }`}
                />
              </View>

              {/* Save & Remove Buttons */}
              {!stageItem.saved && (
                <View
                  className={`px-4 pb-4 flex-row items-center justify-end ${
                    stageItem.revisionNumber > 0 ? "justify-between" : ""
                  }`}
                >
                  {stageItem.revisionNumber > 0 && (
                    <TouchableOpacity
                      onPress={() => handleRemove(index)}
                      className="px-0 py-3 flex-row items-center bg-transparent"
                    >
                      <Ionicons
                        name="remove-circle"
                        size={20}
                        color={isDarkMode ? "#FF6B6B" : "#EF4444"}
                      />
                      <Text
                        className={`ml-2 text-[14px] font-poppins ${
                          isDarkMode ? "text-[#FF6B6B]" : "text-[#EF4444]"
                        }`}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => saveStage(index)}
                    disabled={!canSave(stageItem)}
                    className={`rounded-[14px] px-10 py-3 ${
                      canSave(stageItem)
                        ? isDarkMode
                          ? "bg-[#050505]"
                          : "bg-[#111111]"
                        : isDarkMode
                          ? "bg-[#333]"
                          : "bg-[#D1D5DB]"
                    }`}
                  >
                    <Text className="text-white font-poppinsMedium text-[14px]">
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Revision Button - Sticky at bottom */}
      {stageData[stageData.length - 1]?.saved && (
        <View
          className={`px-4 pb-2 pt-2  ${
            isDarkMode
              ? "bg-[#0D0D0D] border-[#1A1A1A]"
              : "bg-white border-[#F0F3F7]"
          }`}
          style={{ paddingBottom: Math.max(insets.bottom, 15) }}
        >
          <TouchableOpacity
            onPress={() => addRevision(stageData.length - 1)}
            className="rounded-[12px] overflow-hidden"
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text className="text-white font-dm text-[16px]">
                Add Revision
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default StageDetail;
