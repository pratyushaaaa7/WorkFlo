import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext"; // adjust path
import api from "../lib/api"; // axios instance with baseURL

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
      } catch (err) {
        console.error("Failed to fetch meetings", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchMeetings();
  }, [projectId]);
  return (
    <View className="flex-1 bg-gray-50">
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
        {/* Back Button + Title */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Minutes of Meeting
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className="p-4">
        <View>
          <View className="bg-white p-4 rounded-2xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              Project Name
            </Text>
            <Text className="text-gray-500 mt-1">{projectName}</Text>
          </View>

          <View className="bg-white p-4 rounded-2xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800">Company</Text>
            <Text className="text-gray-500 mt-1">{company}</Text>
          </View>

          <View className="bg-white p-4 rounded-2xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              Project ID
            </Text>
            <Text className="text-gray-500 mt-1">{projectId}</Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : meetings.length === 0 ? (
          <Text className="text-gray-500 text-center mt-10">
            No meetings found
          </Text>
        ) : (
          meetings.map((meeting) => (
            <TouchableOpacity
              key={meeting._id}
              className="bg-white rounded-2xl shadow p-4 mb-4"
              onPress={() =>
                router.push(
                  `/minutesDetails?meetingId=${meeting._id}&meetingNumber=${meeting.meetingNumber}&meetingDate=${meeting.meetingDate}&meetingTime=${meeting.meetingTime}&meetingVenue=${meeting.meetingVenue}`
                )
              }
            >
              <Text className="text-lg font-bold text-indigo-600 mb-1">
                Meeting #{meeting.meetingNumber}
              </Text>
              <Text className="text-gray-700">
                {new Date(meeting.meetingDate).toLocaleDateString()} |{" "}
                {meeting.meetingTime}
              </Text>
              <Text className="text-gray-500">{meeting.meetingVenue}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/createMinutes?projectId=${projectId}&projectName=${projectName}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 36,
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
