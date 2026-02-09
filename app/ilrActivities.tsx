import Activity from "@/types/ILRActivity";
import { Ionicons } from "@expo/vector-icons";
import { Delete03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
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
          bg: isDark ? "bg-red-900/40" : "bg-red-50",
          text: isDark ? "text-red-300" : "text-red-900", // Darker text for readability
          iconColor: isDark ? "#FCA5A5" : "#DC2626",
          icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
          title: "Target Date Change",
        };
      case "status":
        return {
          bg: isDark ? "bg-gray-800" : "bg-white border border-gray-200",
          text: isDark ? "text-gray-300" : "text-gray-800",
          iconColor: isDark ? "#D1D5DB" : "#4B5563",
          icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
          title: "Status Update",
        };
      case "remark":
        return {
          bg: isDark ? "bg-blue-900/40" : "bg-blue-50",
          text: isDark ? "text-blue-300" : "text-blue-900",
          iconColor: isDark ? "#93C5FD" : "#2563EB",
          icon: "document-text-outline" as keyof typeof Ionicons.glyphMap,
          title: "Description Update",
        };
      case "assignee":
        return {
          bg: isDark ? "bg-orange-900/40" : "bg-orange-50",
          text: isDark ? "text-orange-300" : "text-orange-900",
          iconColor: isDark ? "#FDBA74" : "#EA580C",
          icon: "person-outline" as keyof typeof Ionicons.glyphMap,
          title: "Assignee Change",
        };
      case "note":
      default:
        return {
          bg: isDark ? "bg-green-900/40" : "bg-green-50",
          text: isDark ? "text-green-300" : "text-green-900",
          iconColor: isDark ? "#86EFAC" : "#16A34A",
          icon: "chatbubble-ellipses-outline" as keyof typeof Ionicons.glyphMap,
          title: "Note Added",
        };
    }
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "white" : "black"}
          />
        </TouchableOpacity>
        <Text
          className={`text-lg text-left font-dmSemiBold ${isDark ? "text-white" : "text-black"}`}
        >
          ILR Activities
        </Text>
        {auth?.user?.role === "admin" ? (
          <TouchableOpacity onPress={handleDelete} className="p-2 -mr-2">
            <HugeiconsIcon icon={Delete03Icon} size={22} color="#DF5B5B" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Top Info */}
          <View className="flex-row justify-between items-start mt-2 border-b border-gray-200 dark:border-gray-800 pb-4">
            <Text
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              IRL ID :{" "}
              <Text className={isDark ? "text-white" : "text-black"}>
                {ilr.ilrNumber}
              </Text>
            </Text>
            <View className="flex-row items-center">
              <Text
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mr-1`}
              >
                Created by {ilr.ilrCreatedBy} -{" "}
                {new Date(ilr.ilrCreatedAt).toLocaleDateString()}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </View>
          </View>

          {/* Title */}
          <Text
            className={`text-xl font-semibold mt-4 mb-6 ${isDark ? "text-white" : "text-black"}`}
          >
            {ilr.description}
          </Text>

          {/* Status Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleStatus}
            className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800"
          >
            <View className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#16A34A"
              />
            </View>
            <View className="flex-1">
              <Text
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Status & Type
              </Text>
              <Text
                className={`text-sm font-medium ${ilr.status === "Closed" ? (isDark ? "text-green-400" : "text-green-600") : isDark ? "text-red-400" : "text-red-600"}`}
              >
                {ilr.status}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </TouchableOpacity>

          {/* Assignee Row */}
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800">
            <View className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mr-3">
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#D1D5DB" : "#374151"}
              />
            </View>
            <View className="flex-1 flex-row justify-between items-center pr-2">
              <Text
                className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Assignee
              </Text>
              <View className="flex-row">
                {ilr.responsibility.length > 0 ? (
                  ilr.responsibility.slice(0, 3).map((r, i) => (
                    <View
                      key={r._id || i}
                      className={`w-8 h-8 rounded-full justify-center items-center -ml-2 border-2 ${isDark ? "border-black" : "border-white"}`}
                      style={{
                        backgroundColor: ["#3B82F6", "#F97316", "#10B981"][
                          i % 3
                        ],
                      }}
                    >
                      <Text className="text-white text-xs font-bold">
                        {r.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-xs text-gray-400">Unassigned</Text>
                )}
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </TouchableOpacity>

          {/* Target Date Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800"
          >
            <View className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mr-3">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={isDark ? "#D1D5DB" : "#374151"}
              />
            </View>
            <View className="flex-1 flex-row justify-between items-center pr-2">
              <View>
                <Text
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Target date
                </Text>
                <Text
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
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
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {daysLeft.label}
                </Text>
                <Text
                  className={`text-sm font-bold ${daysLeft.isOverdue ? "text-red-500" : "text-green-500"}`}
                >
                  {daysLeft.count}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </TouchableOpacity>

          {/* Description Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowRemarkInput(!showRemarkInput)}
            className="flex-row items-center justify-between py-4"
          >
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}
            >
              Description
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </TouchableOpacity>

          {showRemarkInput ? (
            <View className="mb-4">
              <TextInput
                value={newRemark}
                onChangeText={setNewRemark}
                multiline
                className={`p-3 rounded-lg border ${isDark ? "text-white border-gray-700 bg-gray-900" : "text-black border-gray-300 bg-gray-50"}`}
                placeholder="Update description..."
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={saveRemark}
                className="mt-2 bg-blue-600 p-2 rounded-lg items-center"
              >
                <Text className="text-white font-medium">Save Description</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text
              className={`text-sm leading-5 mb-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              {ilr.remarks || "No additional description."}
            </Text>
          )}

          {/* Attachments Section */}
          <View className="mb-6">
            <Text
              className={`text-base font-medium mb-3 ${isDark ? "text-white" : "text-black"}`}
            >
              Attachments
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {/* Mock Attachments */}
              {[1, 2, 3].map((item) => (
                <View
                  key={item}
                  className={`mr-3 rounded-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                  style={{ width: 140 }}
                >
                  <View className="h-24 bg-gray-300 w-full items-center justify-center">
                    <Ionicons name="image-outline" size={30} color="#6B7280" />
                  </View>
                  <View className="p-2">
                    <Text
                      className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}
                    >
                      image-1254785
                    </Text>
                    <Text className="text-xs text-gray-500">Jan 24</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Note Input Area */}
          <View className="flex-row items-center mb-6">
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add a activity note..."
              placeholderTextColor="#9CA3AF"
              className={`flex-1 p-3 rounded-xl mr-2 border ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-black"}`}
            />
            <TouchableOpacity
              onPress={addNote}
              disabled={!newNote.trim()}
              className={`p-3 rounded-xl justify-center items-center ${newNote.trim() ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
            >
              <Ionicons name="paper-plane-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Activity Log */}
          <Text
            className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}
          >
            Activity Log
          </Text>

          {activitiesLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <View className="pl-4 border-l border-gray-200 dark:border-gray-800 ml-2">
              {activities.map((act) => {
                const style = getActivityStyles(act.type);
                return (
                  <View key={act._id} className="mb-6 relative pl-4">
                    {/* Timeline Dot/Icon */}
                    <View className="absolute -left-7 top-0 bg-white dark:bg-black p-1">
                      {/* Can use custom icon or simple dot. Image shows specific icons but mostly clean. */}
                      <View
                        className={`w-3 h-3 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`}
                      />
                    </View>

                    {/* Activity Card */}
                    <View
                      className={`p-4 rounded-xl ${style.bg} ${act.type === "status" ? (isDark ? "border border-gray-700" : "border border-gray-100 shadow-sm") : ""}`}
                    >
                      <View className="flex-row items-start mb-1">
                        <Ionicons
                          name={style.icon}
                          size={18}
                          color={style.iconColor}
                          style={{ marginTop: 2, marginRight: 8 }}
                        />
                        <View className="flex-1">
                          <Text className={`font-bold text-sm ${style.text}`}>
                            {style.title}
                          </Text>

                          {/* Details */}
                          {act.type === "status" && act.newValue && (
                            <View className="flex-row items-center mt-1">
                              <View className="bg-blue-100 rounded px-2 py-0.5 mr-2">
                                <Text className="text-blue-700 text-xs">
                                  {act.oldValue || "Open"}
                                </Text>
                              </View>
                              <Ionicons
                                name="arrow-forward"
                                size={12}
                                color={isDark ? "gray" : "gray"}
                              />
                              <View className="bg-green-100 rounded px-2 py-0.5 ml-2">
                                <Text className="text-green-700 text-xs">
                                  {act.newValue}
                                </Text>
                              </View>
                            </View>
                          )}

                          {act.type === "date" && act.newValue && (
                            <Text
                              className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              From : {act.oldValue} - To : {act.newValue}
                            </Text>
                          )}

                          {act.type === "remark" && (
                            <View className="mt-1">
                              <Text
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Updated description content.
                              </Text>
                              {isDark ? null : (
                                <Text
                                  className="text-xs text-gray-500 italic mt-1 line-clamp-2"
                                  numberOfLines={2}
                                >
                                  {act.newValue}
                                </Text>
                              )}
                            </View>
                          )}

                          {act.type === "note" && act.note && (
                            <Text
                              className={`text-sm mt-1 italic ${isDark ? "text-gray-300" : "text-gray-700"}`}
                            >
                              "{act.note}"
                            </Text>
                          )}

                          {/* Footer */}
                          <Text
                            className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            By {act.createdBy} •{" "}
                            {new Date(act.createdAt).toLocaleString()}
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
      </KeyboardAvoidingView>

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
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View
            className={`w-full max-w-sm p-6 rounded-3xl ${isDark ? "bg-[#000000]" : "bg-white"}`}
          >
            {/* Icon */}
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${isDark ? "bg-red-900/30" : "bg-red-50"}`}
            >
              <HugeiconsIcon icon={Delete03Icon} size={24} color="#EF4444" />
            </View>

            {/* Content */}
            <Text
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}
            >
              Delete this item
            </Text>
            <Text
              className={`text-base mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Are you sure you want to delete this element? This action is final
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className={`flex-1 py-3 rounded-xl border ${isDark ? "border-gray-600" : "border-gray-300"}`}
              >
                <Text
                  className={`text-center font-semibold ${isDark ? "text-white" : "text-black"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500"
              >
                <Text className="text-center font-semibold text-white">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>  
    </View>
  );
};

export default IlrActivities;
