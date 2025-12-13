import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext"; // adjust path
import api from "../lib/api"; // axios instance with baseURL
import CircleProgress from "@/components/CircleProgress";
import Toast from "react-native-toast-message";

const Minutes = () => {
  const { projectId, projectName, company } = useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // console.log(JSON.stringify(meetings, null, 2));

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/minutes/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetings(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Failed to fetch meetings", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchMeetings();
  }, [projectId, token]);

  const handleDeleteMeeting = (meetingId) => {
    Alert.alert(
      "Delete Meeting",
      "This meeting will be permanently deleted. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/minutes/${meetingId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              // remove from UI
              setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
              // ✅ SHOW TOAST
              Toast.show({
                type: "success",
                text1: "Meeting deleted",
                text2: "The meeting was removed successfully",
                position: "bottom",
                visibilityTime: 2000,
              });
            } catch (err: any) {
              console.error("Delete failed", err);
              if (err.response?.status === 418) {
                // Not authorized
                Toast.show({
                  type: "error",
                  text1: "Not Authorized",
                  text2: "Please contact Team leader or admin ",
                  position: "bottom",
                });
              } else {
                // Generic error
                Toast.show({
                  type: "error",
                  text1: "Delete failed",
                  text2: "Please try again",
                  position: "bottom",
                });
              }
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1  bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
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
          {/* Back Button + Title */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {projectName} Minutes of Meeting
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="p-4  bg-gray-100"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meetings.length === 0 ? (
          <Text className="text-gray-500 text-center mt-10">
            No meetings found
          </Text>
        ) : (
          meetings.map((meeting) => (
            <Pressable
              key={meeting._id}
              className="bg-white rounded-2xl shadow-lg mb-5  overflow-hidden border-l-4"
              onPress={() =>
                meeting.meetingStage !== "mom_submitted"
                  ? router.push(
                      `/createMeeting?meetingId=${meeting._id}&projectName=${projectName}&company=${company}&projectId=${projectId}`
                    )
                  : router.push(
                      `/meetingDetail?meetingId=${meeting._id}&meetingNumber=${meeting.meetingNumber}&meetingDate=${meeting.meetingDate}&meetingTime=${meeting.meetingTime}&meetingVenue=${meeting.meetingVenue}&projectName=${projectName}&company=${company}`
                    )
              }
              style={{
                borderLeftColor:
                  meeting.meetingStage === "mom_submitted"
                    ? "#16A34A" // green
                    : "#0284C7", // sky
              }}
            >
              {/* Meeting Header */}
              <View className="px-4 py-3 bg-gradient-to-r from-sky-50 to-sky-100 flex-row justify-between items-center">
                {/* LEFT TEXT SECTION */}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#0369A1"
                    />
                    <Text className="ml-2 text-lg font-bold text-sky-800">
                      Meeting #{meeting.meetingNumber}
                    </Text>
                  </View>

                  <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={16} color="#475569" />
                    <Text className="ml-1 text-gray-700 text-sm">
                      {new Date(meeting.meetingDate).toLocaleDateString()} •{" "}
                      {meeting.meetingTime}
                    </Text>
                  </View>

                  <View className="flex-row items-center mt-1">
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#94A3B8"
                    />
                    <Text className="ml-1 text-gray-500 text-sm">
                      {meeting.meetingVenue}
                    </Text>
                  </View>
                </View>

                {/* RIGHT PIE GRAPH */}
                <View className="items-center ml-3">
                  <CircleProgress
                    percentage={parseFloat(meeting.openPercentage)}
                    size={55}
                    label={`${meeting.openCount}/${meeting.totalMinutes}`}
                  />

                  <Text className="text-xs mt-1 text-gray-700 font-semibold">
                    {meeting.openPercentage}% Open
                  </Text>
                </View>
              </View>

              <View className="flex-row  justify-between">
                {/* Status Chips */}
                <View className="flex-row flex-wrap px-4 py-2 gap-2">
                  {meeting.agendaSubmitted && (
                    <View className="bg-sky-100 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="checkmark" size={14} color="#0369A1" />
                      <Text className="text-sky-700 text-xs font-semibold ml-1">
                        Agenda Submitted
                      </Text>
                    </View>
                  )}

                  {meeting.meetingStage === "mom_submitted" && (
                    <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons
                        name="checkmark-done"
                        size={14}
                        color="#15803D"
                      />
                      <Text className="text-green-700 text-xs font-semibold ml-1">
                        Minutes Published
                      </Text>
                    </View>
                  )}
                </View>
                {/* DELETE ICON */}
                <TouchableOpacity
                  onPress={() => handleDeleteMeeting(meeting._id)}
                  className="p-2"
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View className="flex-row px-4 py-3 border-t border-gray-200 gap-3">
                {/* View Agenda */}
                {/* <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/viewAgenda?meetingId=${meeting._id}&meetingNumber=${meeting.meetingNumber}&meetingDate=${meeting.meetingDate}&meetingTime=${meeting.meetingTime}&meetingVenue=${meeting.meetingVenue}&projectName=${projectName}&company=${company}`
                    )
                  }
                  className="flex-1 bg-sky-500 flex-row justify-center items-center py-2.5 rounded-xl active:opacity-80 shadow"
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="white"
                  />
                  <Text className="ml-2 text-white font-medium">
                    View Agenda
                  </Text>
                </TouchableOpacity> */}
                {meeting.meetingStage === "draft" && (
                  <View className="bg-yellow-100 px-3 py-1 rounded-full flex-row items-center">
                    <Ionicons name="save-outline" size={14} color="#CA8A04" />
                    <Text className="text-yellow-700 text-xs font-semibold ml-1">
                      Draft Saved
                    </Text>
                  </View>
                )}

                {/* Publish / View Minutes */}
                {meeting.meetingStage !== "mom_submitted" ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/createMeeting?meetingId=${meeting._id}&projectName=${projectName}&company=${company}&projectId=${projectId}`
                      )
                    }
                    className="flex-1 bg-sky-700 flex-row justify-center items-center py-2.5 rounded-xl active:opacity-80 shadow"
                  >
                    <Ionicons name="pencil-outline" size={18} color="white" />
                    <Text className="ml-2 text-white font-medium">
                      Continue Minutes
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/meetingDetail?meetingId=${meeting._id}&meetingNumber=${meeting.meetingNumber}&meetingDate=${meeting.meetingDate}&meetingTime=${meeting.meetingTime}&meetingVenue=${meeting.meetingVenue}&projectName=${projectName}&company=${company}`
                      )
                    }
                    className="flex-1 bg-green-600 flex-row justify-center items-center py-2.5 rounded-xl active:opacity-80 shadow"
                  >
                    <Ionicons name="eye-outline" size={18} color="white" />
                    <Text className="ml-2 text-white font-medium">
                      View Minutes
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/createMeeting?projectId=${projectId}&projectName=${projectName}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 44,
          right: 20,

          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Minutes;
