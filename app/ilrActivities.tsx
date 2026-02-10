import GlobalAvatar from "@/components/GlobalAvatar";
import Activity from "@/types/ILRActivity";
import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeftIcon,
  ArrowRight01Icon,
  Calendar02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  DashedLineCircleIcon,
  Delete03Icon,
  Menu05Icon,
  Note03Icon,
  UserCircleIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

type Responsibility = {
  _id: string;
  individualName: string;
  designation: string;
  firmName: string;
  name: string;
};

// Start: Helper types/functions
const getDaysLeft = (targetDate: string) => {
  if (!targetDate) return { count: 0, isOverdue: false, label: "No Date" };
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    count: Math.abs(diffDays),
    isOverdue: diffDays < 0,
    label: diffDays < 0 ? "Overdue" : "Days Left",
  };
};

const IlrActivities = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const token = auth?.token;
  const { bottom } = useSafeAreaInsets();

  // ILR data from params
  const [ilr, setIlr] = useState({
    _id: params.ilrId as string,
    description: params.description as string,
    targetDate: params.targetDate as string,
    remarks: params.remarks as string,
    responsibility: JSON.parse(
      (params.responsibility as string) || "[]",
    ) as Responsibility[],
    status: params.status as "Open" | "Closed",
    ilrCreatedBy: params.createdBy as string,
    ilrCreatedAt: params.createdAt as string,
    ilrNumber: params.ilrNumber as string,
    attachments: params.attachments
      ? JSON.parse(params.attachments as string)
      : [],
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [newRemark, setNewRemark] = useState(ilr.remarks);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const mapActivityType = (
    action: string | undefined,
  ): Activity["type"] | "assignee" => {
    if (!action) return "note";
    const a = action.toLowerCase();
    if (a.includes("status")) return "status";
    if (a.includes("remark") || a.includes("description")) return "remark";
    if (a.includes("date")) return "date";
    if (a.includes("assignee") || a.includes("responsibility"))
      return "assignee";
    return "note";
  };

  const formatDateSafe = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB");
  };

  const fetchILRDetails = async () => {
    if (!token || !params.ilrId) return;
    setActivitiesLoading(true);
    try {
      const res = await api.get(`/ilrs/details/${params.ilrId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ilrData = res.data;
      setIlr({
        _id: ilrData._id,
        description: ilrData.description,
        targetDate: ilrData.targetDate,
        remarks: ilrData.remarks,
        responsibility: ilrData.responsibility || [],
        status: ilrData.status,
        ilrCreatedBy: ilrData.createdBy?.fullName || "Unknown",
        ilrCreatedAt: ilrData.createdAt,
        ilrNumber: ilrData.ilrNumber,
        attachments: ilrData.attachments || [],
      });

      const mappedActivities = (ilrData.activities || [])
        .map((act: any) => {
          const isDateChange =
            act.action?.toLowerCase().includes("date") ||
            act.title?.toLowerCase().includes("date");
          return {
            _id: act._id,
            title: act.action || act.title,
            createdBy: act.createdBy?.fullName || "Unknown",
            createdAt: act.createdAt,
            oldValue: isDateChange
              ? formatDateSafe(act.oldValue)
              : act.oldValue,
            newValue: isDateChange
              ? formatDateSafe(act.newValue)
              : act.newValue,
            type: mapActivityType(act.action),
            note: act.note || "",
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setActivities(mappedActivities);
      setNotes(ilrData.notes || []);
    } catch (err) {
      console.error("Failed to fetch ILR:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchILRDetails();
  }, [params.ilrId, token]);

  const onDateChange = async (selectedDate?: Date) => {
    if (!selectedDate) return;
    const updatedDate = selectedDate.toISOString();
    setIlr((prev) => ({ ...prev, targetDate: updatedDate }));
    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { targetDate: updatedDate, note: newNote },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewNote("");
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update target date:", err);
    }
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteModalVisible(false);
    try {
      await api.delete(`/ilrs/${ilr._id}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      Toast.show({
        type: "success",
        text1: "ILR deleted",
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: err?.response?.data?.message,
      });
    }
  };

  const saveRemark = async () => {
    setShowRemarkInput(false);
    setIlr((prev) => ({ ...prev, remarks: newRemark }));
    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { remarks: newRemark },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update remark:", err);
    }
  };

  const toggleStatus = async () => {
    const newStatus = ilr.status === "Open" ? "Closed" : "Open";
    setIlr((prev) => ({ ...prev, status: newStatus }));
    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      await api.post(
        `/ilrs/${ilr._id}/notes`,
        { text: newNote },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewNote("");
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  // UI Helpers
  const daysLeft = getDaysLeft(ilr.targetDate);

  // Activity Colors & Icons
  const getActivityStyles = (type: Activity["type"]) => {
    switch (type) {
      case "date":
        return {
          bg: isDark ? "bg-[#420A0A]" : "bg-[#FFEBEB]",
          text: isDark ? "text-white" : "text-black",
          iconColor: isDark ? "#DC2626" : "#DC2626",
          icon: Calendar03Icon,
          title: "Target Date Change",
        };
      case "status":
        return {
          bg: isDark ? "bg-[#1A1A1A]" : "bg-[#F5F5F5]",
          text: isDark ? "text-white" : "text-black",
          iconColor: isDark ? "#D2D2D2" : "#7F7F7F",
          icon: CircleIcon,
          title: "Status Updated",
        };
      case "remark":
        return {
          bg: isDark ? "bg-[#09225A]" : "bg-[#E9F1FF]",
          text: isDark ? "text-white" : "text-black",
          iconColor: isDark ? "#6D9EFF" : "#335EB3",
          icon: Menu05Icon,
          title: "Description Updated",
        };
      case "assignee":
        return {
          bg: isDark ? "bg-[#5A2209]" : "bg-[#FFECE3]",
          text: isDark ? "text-white" : "text-black",
          iconColor: isDark ? "#F97316" : "#EA580C",
          icon: UserIcon,
          title: "Assignee Updated",
        };
      case "note":
      default:
        return {
          bg: isDark ? "bg-[#0A4230]" : "bg-[#E3F8EB]",
          text: isDark ? "text-white" : "text-black",
          iconColor: isDark ? "#2DC77B" : "#239F62",
          icon: Note03Icon,
          title: "Note Added",
        };
    }
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-[#FBFCFD]"}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-2">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-1"
          >
            <HugeiconsIcon
              icon={ArrowLeftIcon}
              size={22}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text
            className={`text-[18px] font-dmSemiBold ${isDark ? "text-white" : "text-black"}`}
          >
            ILR Activities
          </Text>
        </View>

        {auth?.user?.role === "admin" && (
          <TouchableOpacity onPress={handleDelete} className="p-2 -mr-2">
            <HugeiconsIcon
              icon={Delete03Icon}
              size={22}
              color={isDark ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1">
        <ScrollView
          className="px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Top Info */}
          <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.7}
            className="flex-row justify-between items-start mt-2 border-b border-gray-200 dark:border-gray-800 pb-2 -mx-4 px-4"
          >
            <Text
              className={`text-sm font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
            >
              ILR ID :{" "}
              <Text
                className={`${isDark ? "text-[#919191]" : "text-[#454545]"} font-poppins`}
              >
                {ilr.ilrNumber}
              </Text>
            </Text>
            <View className="flex-row items-center">
              <Text
                className={`text-xs ${isDark ? "text-[#919191]" : "text-[#454545]"} mr-1 font-poppinsMedium`}
              >
                Created by {ilr.ilrCreatedBy} -{" "}
                {new Date(ilr.ilrCreatedAt).toLocaleDateString()}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={isDark ? "#919191" : "#454545"}
              />
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View>
              {/* Title */}
              <Text
                className={`text-xl font-dmMedium mt-4 mb-2 ${isDark ? "text-white" : "text-black"}`}
              >
                {ilr.description}
              </Text>

              {/* Status Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleStatus}
                className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4"
              >
                <View className="p-2 rounded-full mr-3">
                  {ilr.status === "Closed" ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={20}
                      color="#1AA45B"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={DashedLineCircleIcon}
                      size={20}
                      color="#DF5B5B"
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-poppins ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Status
                  </Text>
                  <Text
                    className={`text-sm font-poppinsMedium ${
                      ilr.status === "Closed"
                        ? "text-[#1AA45B]"
                        : "text-[#DF5B5B]"
                    }`}
                  >
                    {ilr.status}
                  </Text>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Assignee Row */}
              <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4">
                <View className="p-2 rounded-full mr-3">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={20}
                    color={isDark ? "#919191" : "#454545"}
                  />
                </View>
                <View className="flex-1 flex-row justify-between items-center pr-2">
                  <Text
                    className={`text-sm font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                  >
                    Assignee
                  </Text>
                  <View className="flex-row">
                    {ilr.responsibility.length > 0 ? (
                      ilr.responsibility
                        .slice(0, 3)
                        .map((r, i) => (
                          <GlobalAvatar
                            key={r._id || i}
                            name={r.name}
                            size={32}
                            className="-ml-2 border-2 border-white dark:border-black"
                          />
                        ))
                    ) : (
                      <Text className="text-xs text-gray-400">Unassigned</Text>
                    )}
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Target Date Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center py-3 -mx-4 px-4"
              >
                <View className="p-2 rounded-full mr-3">
                  <HugeiconsIcon
                    icon={Calendar02Icon}
                    size={20}
                    color={isDark ? "#919191" : "#454545"}
                  />
                </View>
                <View className="flex-1 flex-row justify-between items-center pr-2">
                  <View>
                    <Text
                      className={`text-xs font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                    >
                      Target date
                    </Text>
                    <Text
                      className={`text-sm font-poppinsMedium ${isDark ? "text-white" : "text-black"}`}
                    >
                      {ilr.targetDate
                        ? new Date(ilr.targetDate).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Set Date"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-xs font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                    >
                      {daysLeft.label}
                    </Text>
                    <Text
                      className={`text-sm font-poppinsMedium ${daysLeft.isOverdue ? "text-red-500" : "text-green-500"}`}
                    >
                      {daysLeft.count}
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Description Row */}
              <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4 " />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowRemarkInput(!showRemarkInput)}
                className="flex-row items-center justify-between pt-4 pb-2"
              >
                <Text
                  className={`text-base font-poppinsMedium ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                >
                  Description
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {showRemarkInput ? (
                <View className="mb-4">
                  <TextInput
                    value={newRemark}
                    onChangeText={setNewRemark}
                    multiline
                    className={`p-3 rounded-lg font-poppinsRegular border ${isDark ? "text-white border-gray-700 bg-gray-900" : "text-black border-gray-300 bg-gray-50"}`}
                    placeholder="Update description..."
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={saveRemark}
                    className="mt-2 bg-blue-600 p-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-medium">
                      Save Description
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text
                  className={`text-[14px] font-poppins mb-4 ${isDark ? "text-white" : "text-black"}`}
                >
                  {ilr.remarks || "No additional description."}
                </Text>
              )}

              <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />

              {/* Attachments Section */}
              {ilr.attachments && ilr.attachments.length > 0 && (
                <>
                  <View className="my-4">
                    <Text
                      className={`text-base font-poppinsMedium mb-3 ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                    >
                      Attachments
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row"
                    >
                      {ilr.attachments.map((item: any, index: number) => (
                        <View
                          key={index}
                          className={`mr-3 rounded-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                          style={{ width: 140 }}
                        >
                          <View className="h-24 bg-gray-300 w-full items-center justify-center">
                            <Ionicons
                              name="image-outline"
                              size={30}
                              color="#6B7280"
                            />
                          </View>
                          <View className="p-2">
                            <Text
                              className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}
                              numberOfLines={1}
                            >
                              {item.name || `Attachment ${index + 1}`}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {item.date
                                ? new Date(item.date).toLocaleDateString()
                                : "No Date"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                  <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />
                </>
              )}
            </View>
          )}

          {/* Activity Log */}
          <Text
            className={`text-lg font-dmSemiBold my-4 ${isDark ? "text-white" : "text-black"}`}
          >
            Activity Log
          </Text>

          {activitiesLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <View>
              {activities.map((act) => {
                const style = getActivityStyles(act.type);
                return (
                  <View key={act._id} className="mb-3">
                    {/* Activity Card */}
                    <View className={`px-4 py-3 rounded-2xl ${style.bg}`}>
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-0.5">
                          <HugeiconsIcon
                            icon={style.icon}
                            size={20}
                            color={style.iconColor}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-poppinsMedium text-[14px] ${style.text} `}
                          >
                            {style.title}
                          </Text>

                          {/* Details */}
                          {act.type === "status" && act.newValue && (
                            <View className="flex-row items-center mt-1 mb-2">
                              <View className="bg-[#DBEAFE] rounded-md px-2.5 py-1 mr-2">
                                <Text className="text-[#1E40AF] text-xs font-poppinsMedium">
                                  {act.oldValue || "Open"}
                                </Text>
                              </View>
                              <Ionicons
                                name="arrow-forward"
                                size={14}
                                color={isDark ? "#9CA3AF" : "#6B7280"}
                              />
                              <View className="bg-[#D1FAE5] rounded-md px-2.5 py-1 ml-2">
                                <Text className="text-[#065F46] text-xs font-poppinsMedium">
                                  {act.newValue}
                                </Text>
                              </View>
                            </View>
                          )}

                          {act.type === "date" && act.newValue && (
                            <Text
                              className={`text-[13px] font-poppins mt-1 mb-1 ${isDark ? "text-[#F5CACA]" : "text-[#454545]"}`}
                            >
                              From : {act.oldValue} - To : {act.newValue}
                            </Text>
                          )}

                          {act.type === "remark" && (
                            <View className="mt-1 mb-2">
                              <Text
                                className={`text-[13px] font-poppins ${isDark ? "text-[#BFD6FF]" : "text-black"}`}
                              >
                                From : {act.oldValue || "No description"}
                              </Text>
                              <Text
                                className={`text-[13px] font-poppins mt-1 ${isDark ? "text-[#BFD6FF]" : "text-[#000]"}`}
                              >
                                To : {act.newValue || "No description"}
                              </Text>
                            </View>
                          )}

                          {act.type === "assignee" && (
                            <Text
                              className={`text-[13px] font-poppins mt-1 mb-1 ${isDark ? "text-[#FFD6BF]" : "text-[#454545]"}`}
                            >
                              From : {act.oldValue} - To : {act.newValue}
                            </Text>
                          )}

                          {act.type === "note" && act.note && (
                            <Text
                              className={`text-[13px] font-poppins mt-1 mb-1 ${isDark ? "text-[#CAF5DF]" : "text-[#454545]"}`}
                            >
                              Note : {act.note}
                            </Text>
                          )}

                          {/* Footer */}
                          <Text
                            className={`text-[12px] font-poppins ${isDark ? "text-[#CCCCCC]" : "text-[#454545]"}`}
                          >
                            By {act.createdBy} •{" "}
                            {new Date(act.createdAt).toLocaleDateString(
                              "en-GB",
                            )}{" "}
                            -{" "}
                            {new Date(act.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }} // adjust if needed
      >
        <View
          className="px-3 py-2 rounded-t-[20px] border-x border-t flex-row items-end bg-white dark:bg-[#1A1A1A]"
          style={{
            borderTopColor: isDark ? "#222" : "#E0E5EB",
            paddingBottom: bottom > 0 ? bottom : 0,
          }}
        >
          <View className="flex-1 pb-4 flex-row items-end   ">
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Write a Note..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className="flex-1 text-black dark:text-white font-poppins text-[15px]  max-h-[120px]"
              multiline
              style={{ paddingBottom: Platform.OS === "ios" ? 4 : 0 }}
            />
          </View>

          <TouchableOpacity
            onPress={addNote}
            disabled={!newNote.trim()}
            className={`ml-3 w-11 h-11 mb-2 rounded-full items-center justify-center shadow-lg ${
              newNote.trim() ? "bg-[#5B4CCC]" : "bg-[#9CA3AF]"
            }`}
            activeOpacity={0.8}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={ilr.targetDate ? new Date(ilr.targetDate) : new Date()}
        onConfirm={(date) => {
          onDateChange(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50 px-4"
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable
            className={`w-full max-w-sm p-6 rounded-3xl ${isDark ? "bg-[#000000]" : "bg-white"}`}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${isDark ? "bg-[#5E1010]" : "bg-[#FDE6E6]"}`}
            >
              <HugeiconsIcon icon={Delete03Icon} size={24} color="#DF5B5B" />
            </View>

            {/* Content */}
            <Text
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}
            >
              Delete this item
            </Text>
            <Text
              className={`text-[14px] font-poppins mb-6 ${isDark ? "#919191" : "#454545"}`}
            >
              Are you sure you want to delete this element? This action is
              final.
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className={`flex-1 py-3 rounded-xl border ${isDark ? "border-white" : "border-black"}`}
              >
                <Text
                  className={`text-center text-lg font-poppins ${isDark ? "text-white" : "text-black"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-[#DF5B5B]"
              >
                <Text className="text-center text-lg font-poppins text-white">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default IlrActivities;
