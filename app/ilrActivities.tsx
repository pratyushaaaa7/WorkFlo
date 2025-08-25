import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import Activity from "@/types/ILRActivity";

type Responsibility = {
  _id: string;
  individualName: string;
  designation: string;
};

// --- Define color map outside the component ---
const ACTIVITY_BG_COLORS: Record<Activity["type"], string> = {
  note: "#DDFCE7", // lighter green
  date: "#E0E7FF", // lighter indigo
  remark: "#E0F7FA", // lighter cyan
  status: "#FEE2E2", // lighter red
};
const DEFAULT_BG_COLOR = "#F3F4F6"; // fallback gray

const IlrActivities = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useContext(AuthContext);

  const token = auth?.token;
  // const user = auth?.user; // user info for activity logs
  // useEffect(() => {
  //   console.log('Token in context:', auth?.token);
  //   console.log('User in context:', auth?.user);
  // }, [auth]);

  // ILR data from params
  const [ilr, setIlr] = useState({
    _id: params.ilrId as string,
    description: params.description as string,
    targetDate: params.targetDate as string,
    remarks: params.remarks as string,
    responsibility: JSON.parse(
      params.responsibility as string
    ) as Responsibility[],
    status: params.status as "Open" | "Closed",
    ilrCreatedBy: params.createdBy as string,
    ilrCreatedAt: params.createdAt as string,
    ilrNumber: params.ilrNumber as string,
  }); // stores current ILR details

  const [activities, setActivities] = useState<Activity[]>([]); // activity logs (who changed what)
  const [activitiesLoading, setActivitiesLoading] = useState(false); // loading spinner

  const [notes, setNotes] = useState<any[]>([]); // list of notes
  const [newNote, setNewNote] = useState(""); // for typing a new note

  // const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false); // controls date picker popup

  const [showRemarkInput, setShowRemarkInput] = useState(false); // controls remark modal
  const [newRemark, setNewRemark] = useState(ilr.remarks); // holds remark text

  const mapActivityType = (action: string | undefined): Activity["type"] => {
    if (!action) return "note";
    const a = action.toLowerCase();
    if (a.includes("status")) return "status";
    if (a.includes("remark") || a.includes("description")) return "remark";
    if (a.includes("date")) return "date";
    return "note";
  };

  const formatDateSafe = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  // --- Fetch ILR Details (outside useEffect so it can be reused) ---
  const fetchILRDetails = async () => {
    if (!token || !params.ilrId) return;

    setActivitiesLoading(true);
    try {
      const res = await api.get(`/ilrs/details/${params.ilrId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ilrData = res.data;

      // Update ILR details
      setIlr({
        _id: ilrData._id,
        description: ilrData.description,
        targetDate: ilrData.targetDate,
        remarks: ilrData.remarks,
        responsibility: ilrData.responsibility || [],
        status: ilrData.status,
        ilrCreatedBy: ilrData.createdBy?.username || "Unknown",
        ilrCreatedAt: ilrData.createdAt,
        ilrNumber: ilrData.ilrNumber, // 👈 add this
      });

      // Map + sort activities
      const mappedActivities = (ilrData.activities || [])
        .map((act: any) => {
          // ✅ scoped here
          const isDateChange =
            act.action?.toLowerCase().includes("date") ||
            act.title?.toLowerCase().includes("date");

          return {
            _id: act._id,
            title: act.action || act.title,
            createdBy: act.createdBy?.username || "Unknown",
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
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setActivities(mappedActivities);
      setNotes(ilrData.notes || []);
    } catch (err) {
      console.error("Failed to fetch ILR:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // --- useEffect just calls it once on mount / param change ---
  useEffect(() => {
    fetchILRDetails();
  }, [params.ilrId, token]);

  // --- Handlers ---

  // const openDatePicker = () => setShowDatePicker(true);

  const onDateChange = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    const updatedDate = selectedDate.toISOString();

    // Update locally
    setIlr((prev) => ({ ...prev, targetDate: updatedDate }));

    // Update backend
    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { targetDate: updatedDate, note: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewNote(""); // clear input after saving
      // Re-fetch ILR + activities + notes
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update target date:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ilrs/${id}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });

      Toast.show({
        type: "success",
        text1: "ILR deleted",
        text2: "The ILR was removed successfully",
        position: "bottom",
      });

      router.back();
    } catch (err: any) {
      console.error("Delete ILR error:", err?.response?.data || err.message);

      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: err?.response?.data?.message || "Unable to delete ILR",
        position: "bottom",
      });
    }
  };

  const openRemarkModal = () => setShowRemarkInput(true);

  const saveRemark = async () => {
    setShowRemarkInput(false);

    setIlr((prev) => ({ ...prev, remarks: newRemark }));

    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { remarks: newRemark },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ No manual log here
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ No manual activity, backend logs it
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const res = await api.post(
        `/ilrs/${ilr._id}/notes`,
        { text: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotes(res.data.notes); // backend returns updated ILR with notes
      setNewNote(""); // clear input
      fetchILRDetails(); // refresh activities since note creation also logs activity
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  // console.log("Current ILR:", activities);

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            {" "}
            ILR Activities
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className="flex-1 px-3 py-3">
        {/* ILR Card */}
        <View className="bg-white rounded-2xl p-4 shadow-md mb-2">
          <View className="flex-col">
            {/* Top row: ILR number + status toggle */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="font-semibold text-lg text-gray-900">
                ILR ID: {ilr.ilrNumber}
              </Text>

              <View className="flex-row items-center gap-4 ">
                {/* Delete Button */}
                {auth?.user?.role === "admin" && (
                  <TouchableOpacity
                    onPress={() => handleDelete(ilr._id)}
                    className="ml-2 p-2 bg-black rounded-full"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="white" />
                  </TouchableOpacity>
                )}

                {/* Toggle-style Status Badge with Gradient */}
                <TouchableOpacity
                  onPress={toggleStatus}
                  activeOpacity={0.9}
                  className="w-20 h-8 rounded-full overflow-hidden"
                >
                  <LinearGradient
                    colors={
                      ilr.status === "Open"
                        ? ["#FF4D4D", "#B91C1C"] // Open colors
                        : ["#4B5563", "#D1D5DB"] // Closed colors
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-1 h-full rounded-full relative"
                  >
                    {/* Circle */}
                    <View
                      className="w-6 h-6 rounded-full bg-white shadow absolute top-1"
                      style={{
                        left: ilr.status === "Open" ? 1 : undefined,
                        right: ilr.status === "Closed" ? 1 : undefined,
                      }}
                    />

                    {/* Text */}
                    <View
                      className="absolute w-full h-full justify-center px-2"
                      style={{
                        alignItems:
                          ilr.status === "Open" ? "flex-end" : "flex-start",
                      }}
                    >
                      <Text className="text-white text-xs font-medium">
                        {ilr.status}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description below so it never clashes */}
            <Text className="text-gray-700 text-lg font-semibold">
              {ilr.description}
            </Text>
          </View>

          {/* Added by */}
          <View className="mt-2 flex-row items-center gap-2">
            <Ionicons name="person-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Added by <Text className="font-medium">{ilr.ilrCreatedBy}</Text>{" "}
              on{" "}
              {ilr.ilrCreatedAt
                ? new Date(ilr.ilrCreatedAt).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>

          {/* Remarks */}
          <View className="mt-1 flex-row items-center gap-2">
            <Ionicons name="document-text-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Description:{" "}
              <Text
                className={ilr.remarks ? "font-medium" : "italic text-gray-400"}
              >
                {ilr.remarks || "No Description"}
              </Text>
            </Text>
          </View>

          {/* Responsibility */}
          <View className="mt-1 flex-row items-center gap-2">
            <Ionicons name="people-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Responsibility:{" "}
              <Text className="font-medium">
                {ilr.responsibility
                  .map((u) => `${u.individualName} (${u.designation})`)
                  .join(", ")}
              </Text>
            </Text>
          </View>

          {/* Target Date */}
          <View className="mt-1 flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Target Date:{" "}
              <Text className="font-medium">
                {new Date(ilr.targetDate).toLocaleDateString()}
              </Text>
            </Text>
          </View>

          {/* Edit Remark Button */}
          {/* <View className=" items-end"> */}
          {!showRemarkInput && (
            <TouchableOpacity
              className="flex-1 mx-1 mt-2 rounded-xl shadow overflow-hidden"
              onPress={openRemarkModal}
            >
              <LinearGradient
                colors={["#93C5FD", "#3B82F6"]} // Blue gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-2 rounded-xl"
              >
                <Text className="text-center text-white font-medium text-sm">
                  Edit Description
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {/* </View> */}
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between ">
          {/* <TouchableOpacity
            className="flex-1 mx-1 rounded-xl shadow overflow-hidden"
            onPress={openDatePicker}
          >
            <LinearGradient
              colors={["#C084FC", "#7C3AED"]} // Purple gradient
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="py-3 rounded-xl"
            >
              <Text className="text-center text-white font-medium text-sm">
                Change Date
              </Text>
            </LinearGradient>
          </TouchableOpacity> */}
        </View>

        {/* Remark Input */}
        {showRemarkInput && (
          <View className="p-3 bg-white rounded-xl shadow mb-3">
            <TextInput
              value={newRemark}
              onChangeText={setNewRemark}
              placeholder="Enter remark..."
              placeholderTextColor={"#999"}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-2"
            />
            <TouchableOpacity
              className="rounded-lg shadow-md overflow-hidden"
              onPress={saveRemark}
            >
              <LinearGradient
                colors={["#93C5FD", "#3B82F6"]} // Blue gradient (matches Edit Remark)
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-2 rounded-lg"
              >
                <Text className="text-center text-white font-medium">Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}

        <View className="bg-white rounded-2xl p-4 shadow-md mb-3">
          {/* <Text className="font-semibold text-gray-800 text-lg mb-4">
            Notes & Change Date
          </Text> */}

          {/* Text Input Row */}
          <View className="mb-3">
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add a note ..."
              placeholderTextColor="#9CA3AF"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
            />
          </View>

          {/* Buttons Row */}
          <View className="flex-row justify-between gap-3">
            {/* Add Note Button */}
            <TouchableOpacity
              className={`flex-1 rounded-lg shadow-md overflow-hidden ${
                newNote.trim() ? "" : "opacity-50"
              }`}
              disabled={!newNote.trim()}
              onPress={addNote}
            >
              <LinearGradient
                colors={["#34D399", "#059669"]} // Green gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-2 rounded-lg items-center"
              >
                <Text className="text-white font-medium">Add Note</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Change Date Button */}
            <TouchableOpacity
              className={`flex-1 rounded-lg shadow-md overflow-hidden ${
                newNote.trim() ? "" : "opacity-50"
              }`}
              disabled={!newNote.trim()}
              onPress={() => setShowDatePicker(true)}
            >
              <LinearGradient
                colors={["#C084FC", "#7C3AED"]} // Purple gradient
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="w-full py-2 rounded-lg items-center"
              >
                <Text className="text-white font-medium">Change Date</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Log */}
        <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
          <Text className="font-semibold text-gray-800 text-lg mb-4">
            Activity Log
          </Text>

          {activitiesLoading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : activities.length === 0 ? (
            <Text className="text-gray-400 text-sm">No activities yet.</Text>
          ) : (
            <View>
              {activities.map((act) => {
                // get bgColor from the mapping
                const bgColor =
                  ACTIVITY_BG_COLORS[act.type] || DEFAULT_BG_COLOR;

                return (
                  <View
                    key={act._id}
                    className="rounded-xl p-3 mb-2 shadow-sm"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Text className="text-gray-800 text-sm font-medium">
                      {act.title}
                    </Text>

                    {act.oldValue !== undefined &&
                      act.newValue !== undefined && (
                        <Text className="text-xs text-gray-600 mt-1">
                          From:{" "}
                          <Text className="font-normal">{act.oldValue}</Text> →
                          To:{" "}
                          <Text className="font-medium">{act.newValue}</Text>
                        </Text>
                      )}

                    {/* 👇 For standalone notes or notes attached to changes */}
                    {act.note && (
                      <Text className="text-xs text-gray-700 italic mt-1">
                        Note: {act.note}
                      </Text>
                    )}

                    <Text className="text-xs text-gray-500 mt-1">
                      By {act.createdBy} •{" "}
                      {new Date(act.createdAt).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={ilr.targetDate ? new Date(ilr.targetDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

export default IlrActivities;
