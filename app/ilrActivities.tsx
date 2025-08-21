import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

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
};

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
      <View className="bg-white pt-16 pb-4 px-4 flex-row items-center shadow-md">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
          <Text className="text-lg font-semibold text-gray-900 ml-3">
            ILR Details
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* ILR Card */}
        <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
          <View className="flex-row justify-between items-start">
            <Text className="font-semibold text-lg text-gray-900 flex-1">
              {ilr.description}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${
                ilr.status === "Open" ? "bg-blue-500" : "bg-green-500"
              }`}
            >
              <Text className="text-white text-xs font-medium">
                {ilr.status}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 text-sm mt-3">
            🎯 Target Date:{" "}
            <Text className="font-medium">
              {new Date(ilr.targetDate).toLocaleDateString()}
            </Text>
          </Text>

          <Text className="text-gray-600 text-sm mt-1">
            👥 Responsibility:{" "}
            <Text className="font-medium">
              {ilr.responsibility
                .map((u) => `${u.individualName} (${u.designation})`)
                .join(", ")}
            </Text>
          </Text>

          <Text className="text-gray-600 text-sm mt-1">
            📝 Remarks:{" "}
            <Text
              className={ilr.remarks ? "font-medium" : "italic text-gray-400"}
            >
              {ilr.remarks || "No remarks"}
            </Text>
          </Text>
        </View>

        <Text className="text-gray-500 text-xs mt-2">
          Added by {ilr.ilrCreatedBy} on{" "}
          {ilr.ilrCreatedAt
            ? new Date(ilr.ilrCreatedAt).toLocaleDateString()
            : "N/A"}
        </Text>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            className="flex-1 bg-blue-600 mx-1 py-3 rounded-xl shadow"
            onPress={openDatePicker}
          >
            <Text className="text-center text-white font-medium text-sm">
              Change Date
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={ilr.targetDate ? new Date(ilr.targetDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity
            className="flex-1 bg-yellow-500 mx-1 py-3 rounded-xl shadow"
            onPress={openRemarkModal}
          >
            <Text className="text-center text-white font-medium text-sm">
              Edit Remark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 mx-1 py-3 rounded-xl shadow ${
              ilr.status === "Open" ? "bg-green-600" : "bg-red-500"
            }`}
            onPress={toggleStatus}
          >
            <Text className="text-center text-white font-medium text-sm">
              {ilr.status === "Open" ? "Close" : "Reopen"}
            </Text>
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
              className="bg-blue-600 py-2 rounded-lg"
              onPress={saveRemark}
            >
              <Text className="text-center text-white font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <Text className="font-semibold text-gray-800 text-base mb-2">
          Notes
        </Text>
        <View className="mb-3 flex-row items-center">
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a note..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
          <TouchableOpacity
            className="ml-2 bg-blue-600 px-4 py-2 rounded-lg shadow"
            onPress={addNote}
          >
            <Text className="text-white font-medium">Add</Text>
          </TouchableOpacity>
        </View>
        {notes.length === 0 ? (
          <Text className="text-gray-500">No notes yet.</Text>
        ) : (
          notes.map((note, idx) => (
            <View key={idx} className="bg-white rounded-xl p-3 mb-2 shadow">
              <Text className="text-gray-800 text-sm">{note.text}</Text>
              <Text className="text-xs text-gray-500 mt-1">
                By {note.createdBy?.username || "Unknown"} •{" "}
                {new Date(note.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        {/* Activity Log */}
        <Text className="font-semibold text-gray-800 text-base mt-6 mb-2">
          Activity Log
        </Text>
        {activitiesLoading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : activities.length === 0 ? (
          <Text className="text-gray-500">No activities yet.</Text>
        ) : (
          activities.map((act) => (
            <View key={act._id} className="bg-white rounded-xl p-3 mb-2 shadow">
              <Text className="text-sm text-gray-800 font-medium">
                {act.title}
              </Text>
              {act.oldValue !== undefined && act.newValue !== undefined && (
                <Text className="text-xs text-gray-500 mt-1">
                  From: <Text className="">{act.oldValue}</Text> →To:{" "}
                  <Text className="font-medium">{act.newValue}</Text>
                </Text>
              )}
              <Text className="text-xs text-gray-500 mt-1">
                By {act.createdBy} • {new Date(act.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default IlrActivities;
