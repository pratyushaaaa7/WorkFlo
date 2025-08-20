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

type Responsibility = { _id: string; individualName: string; designation: string };
type Activity = { _id: string; title: string; createdBy: string; createdAt: string };

const IlrActivities = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useContext(AuthContext);

  const token = auth?.token;
  const user = auth?.user; // user info for activity logs
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
    responsibility: JSON.parse(params.responsibility as string) as Responsibility[],
    status: params.status as "Open" | "Closed",

  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Local UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [newRemark, setNewRemark] = useState(ilr.remarks);

  // Fetch activities from backend (optional)
//   useEffect(() => {
//     const fetchActivities = async () => {
//       setActivitiesLoading(true);
//       try {
//         const res = await api.get(`/ilrs/${ilr._id}/activities`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setActivities(res.data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setActivitiesLoading(false);
//       }
//     };
//     fetchActivities();
//   }, [ilr._id, token]);

  // --- Handlers ---

  const openDatePicker = () => setShowDatePicker(true);

  const onDateChange = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    const updatedDate = selectedDate.toISOString();

    // Update locally
    setIlr(prev => ({ ...prev, targetDate: updatedDate }));

    // Update backend
    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { targetDate: updatedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Add activity log locally
      setActivities(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          title: `Target date changed to ${selectedDate.toLocaleDateString()}`,
          createdBy: user.username,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to update target date:", err);
    }
  };

  const openRemarkModal = () => setShowRemarkInput(true);

  const saveRemark = async () => {
    setShowRemarkInput(false);
    setIlr(prev => ({ ...prev, remarks: newRemark }));

    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { remarks: newRemark },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          title: `Remark added/changed`,
          createdBy: user.username,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to update remark:", err);
    }
  };

  const toggleStatus = async () => {
    const newStatus = ilr.status === "Open" ? "Closed" : "Open";
    setIlr(prev => ({ ...prev, status: newStatus }));

    try {
      await api.patch(
        `/ilrs/${ilr._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          title: `Status changed to ${newStatus}`,
          createdBy: user.username,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const statusClasses = ilr.status === "Open" ? "bg-blue-600" : "bg-green-500";

//     if (!user || !token) {
//   return (
//     <View className="flex-1 justify-center items-center">
//       <ActivityIndicator size="large" color="#2563EB" />
//     </View>
//   );
// }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-4">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* ILR Details */}
        <View className="bg-white rounded-xl p-4 shadow-md mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-semibold text-gray-900 text-base flex-1 mr-2">{ilr.description}</Text>
            <View className={`px-3 py-1 rounded-full ${statusClasses}`}>
              <Text className="text-white text-xs font-semibold">{ilr.status}</Text>
            </View>
          </View>

          <Text className="text-gray-500 text-sm mt-2">
            Target Date: {new Date(ilr.targetDate).toLocaleDateString()}
          </Text>

          <Text className="text-gray-500 text-sm mt-1">
            Responsibility: {ilr.responsibility.map(u => `${u.individualName} (${u.designation})`).join(", ")}
          </Text>

          <Text className={`text-gray-500 text-sm mt-1 ${ilr.remarks ? "" : "italic"}`}>
            Remarks: {ilr.remarks ? ilr.remarks : "No remarks"}
          </Text>

         
        </View>

         {/* Action Buttons */}
          <View className="flex-row justify-between mt-4 space-x-2">
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded" onPress={openDatePicker}>
              <Text className="text-white">Change Target Date</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-yellow-500 px-4 py-2 rounded" onPress={openRemarkModal}>
              <Text className="text-white">Edit Remark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded ${ilr.status === "Open" ? "bg-green-500" : "bg-red-500"}`}
              onPress={toggleStatus}
            >
              <Text className="text-white">{ilr.status === "Open" ? "Close Issue" : "Reopen Issue"}</Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={new Date(ilr.targetDate)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          {/* Remark Input */}
          {showRemarkInput && (
            <View className="mt-2 p-2 bg-white rounded shadow">
              <TextInput
                value={newRemark}
                onChangeText={setNewRemark}
                placeholder="Enter remark..."
                className="border border-gray-300 rounded p-2"
              />
              <TouchableOpacity className="bg-blue-500 mt-2 p-2 rounded" onPress={saveRemark}>
                <Text className="text-white text-center">Save Remark</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Activity Log */}
        <View className="mt-6">
          <Text className="font-semibold text-gray-700 mb-2">Activity Log:</Text>
          {activitiesLoading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : activities.length === 0 ? (
            <Text className="text-gray-500">No activities yet.</Text>
          ) : (
            activities.map(act => (
              <View key={act._id} className="bg-white rounded p-2 mb-2 shadow">
                <Text className="text-sm text-gray-800">{act.title}</Text>
                <Text className="text-xs text-gray-500">
                  By {act.createdBy} at {new Date(act.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default IlrActivities;
