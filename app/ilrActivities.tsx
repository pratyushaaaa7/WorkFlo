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

type Responsibility = {
  _id: string;
  individualName: string;
  designation: string;
};
type Activity = {
  _id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  oldValue?: any;
  newValue?: any;
  type: "note" | "date" | "remark" | "status"; // <-- add this
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
  }); // stores current ILR details

  const [activities, setActivities] = useState<Activity[]>([]); // activity logs (who changed what)
  const [activitiesLoading, setActivitiesLoading] = useState(false); // loading spinner

  const [notes, setNotes] = useState<any[]>([]); // list of notes
  const [newNote, setNewNote] = useState(""); // for typing a new note

  const [showDatePicker, setShowDatePicker] = useState(false); // controls date picker popup

  const [showRemarkInput, setShowRemarkInput] = useState(false); // controls remark modal
  const [newRemark, setNewRemark] = useState(ilr.remarks); // holds remark text

  const mapActivityType = (action: string | undefined): Activity["type"] => {
    if (!action) return "note";
    const a = action.toLowerCase();
    if (a.includes("status")) return "status";
    if (a.includes("remark")) return "remark";
    if (a.includes("date")) return "date";
    return "note";
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
      });

      // Map + sort activities
      const mappedActivities = (ilrData.activities || [])
        .map((act: any) => ({
          _id: act._id,
          title: act.action || act.title,
          createdBy: act.createdBy?.username || "Unknown",
          createdAt: act.createdAt,
          oldValue: act.oldValue,
          newValue: act.newValue,
          type: mapActivityType(act.action),
        }))
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

  const openDatePicker = () => setShowDatePicker(true);

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
        { targetDate: updatedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Re-fetch ILR + activities + notes
      fetchILRDetails();
    } catch (err) {
      console.error("Failed to update target date:", err);
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

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-4 flex-row items-center shadow-md">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-3">
            ILR Details
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4 ">
        {/* ILR Card */}
        <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
          <View className="flex-row justify-between items-start">
            <Text className="font-semibold text-lg text-gray-900 flex-1">
              {ilr.description}
            </Text>

            {/* Toggle-style Status Badge with Gradient */}
            <TouchableOpacity
              onPress={toggleStatus}
              activeOpacity={0.9}
              className="w-20 h-8 rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={
                  ilr.status === "Open"
                    ? ["#FF4D4D", "#B91C1C"] // Bright red → deep red for Open
                    : ["#4B5563", "#D1D5DB"] // Dark gray → light gray for Closed
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-1 h-full rounded-full relative"
              >
                {/* Circle */}
                <View
                  className="w-6 h-6 rounded-full  bg-white shadow absolute top-1"
                  style={{
                    left: ilr.status === "Open" ? 1 : undefined,
                    right: ilr.status === "Closed" ? 1 : undefined,
                  }}
                />

                {/* Text opposite to the circle */}
                <View
                  className="absolute w-full h-full justify-center px-2"
                  style={{
                    alignItems:
                      ilr.status === "Open" ? "flex-end" : "flex-start",
                  }}
                >
                  <Text className="text-white text-xs font-medium">
                    {ilr.status === "Open" ? "Open" : "Closed"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Target Date */}
          <View className="mt-3 flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Target Date:{" "}
              <Text className="font-medium">
                {new Date(ilr.targetDate).toLocaleDateString()}
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

          {/* Remarks */}
          <View className="mt-1 flex-row items-center gap-2">
            <Ionicons name="document-text-outline" size={16} color="#4B5563" />
            <Text className="text-gray-600 text-sm">
              Remarks:{" "}
              <Text
                className={ilr.remarks ? "font-medium" : "italic text-gray-400"}
              >
                {ilr.remarks || "No remarks"}
              </Text>
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
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            className="flex-1 mx-1 rounded-xl shadow overflow-hidden"
            onPress={openDatePicker}
          >
            <LinearGradient
              colors={["#A5B4FC", "#4338CA"]} // Indigo gradient: light → dark
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="py-3 rounded-xl"
            >
              <Text className="text-center text-white font-medium text-sm">
                Change Date
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 mx-1 rounded-xl shadow overflow-hidden"
            onPress={openRemarkModal}
          >
            <LinearGradient
              colors={["#67E8F9", "#0284C7"]} // Cyan gradient: light → dark
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3 rounded-xl"
            >
              <Text className="text-center text-white font-medium text-sm">
                Edit Remark
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Remark Input */}
        {showRemarkInput && (
          <View className="p-3 bg-white rounded-xl shadow mb-6">
            <TextInput
              value={newRemark}
              onChangeText={setNewRemark}
              placeholder="Enter remark..."
              className="border border-gray-300 rounded-lg px-3 py-2 mb-2"
            />
            <TouchableOpacity
              className="bg-cyan-500 py-2 rounded-lg"
              onPress={saveRemark}
            >
              <Text className="text-center text-white font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
          <Text className="font-semibold text-gray-800 text-lg mb-4">
            Notes
          </Text>

          {/* Input Row */}
          <View className="flex-row items-center mb-4">
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add a note..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
            />
            <TouchableOpacity
              className="ml-3 rounded-lg shadow-md overflow-hidden"
              onPress={addNote}
            >
              <LinearGradient
                colors={["#34D399", "#059669"]} // Emerald green gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Notes List */}
          {notes.length === 0 ? (
            <Text className="text-gray-400 text-sm">No notes yet.</Text>
          ) : (
            <View className="">
              {notes.map((note, idx) => (
                <View
                  key={idx}
                  className="bg-emerald-50 mb-2 rounded-xl p-3 shadow-sm"
                >
                  <Text className="text-gray-800 text-sm">{note.text}</Text>
                  <Text className="text-xs text-gray-700 mt-1">
                    By {note.createdBy?.username || "Unknown"} •{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
