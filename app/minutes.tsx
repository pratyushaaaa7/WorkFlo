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

      {/* Content */}
      <ScrollView className="flex-1 bg-gray-100 p-4">
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : meetings.length === 0 ? (
          <Text className="text-gray-500 text-center mt-10">
            No meetings found
          </Text>
        ) : (
          meetings.map((meeting) => (
            <View key={meeting._id} className="mb-6">
              {/* Header */}
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                className="rounded-2xl p-4 mb-4"
              >
                <Text className="text-white text-2xl font-bold">
                  Meeting #{meeting.meetingNumber}
                </Text>
                <Text className="text-white mt-1">
                  {new Date(meeting.meetingDate).toLocaleDateString()} |{" "}
                  {meeting.meetingTime}
                </Text>
                <Text className="text-white mt-1">{meeting.meetingVenue}</Text>
              </LinearGradient>

              <View className="bg-white p-4 rounded-2xl shadow mb-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Project Name
                </Text>
                <Text className="text-gray-500 mt-1">{projectName}</Text>
              </View>

              <View className="bg-white p-4 rounded-2xl shadow mb-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Company
                </Text>
                <Text className="text-gray-500 mt-1">{company}</Text>
              </View>

              <View className="bg-white p-4 rounded-2xl shadow mb-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Project ID
                </Text>
                <Text className="text-gray-500 mt-1">{projectId}</Text>
              </View>

              {/* Attendees Section */}
              <View className="bg-white p-4 rounded-2xl shadow mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Attendees
                </Text>
                {meeting.attendees.map((attendee) => (
                  <View
                    key={attendee._id}
                    className="border-b border-gray-200 py-2 flex-row justify-between"
                  >
                    <View>
                      <Text className="font-medium text-gray-700">
                        {attendee.attendeeName}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {attendee.designation} | {attendee.organization}
                      </Text>
                    </View>
                    <Text className="text-gray-400">{attendee.phone}</Text>
                  </View>
                ))}
              </View>

              {/* Minutes Section */}
              <View className="bg-white p-4 rounded-2xl shadow mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Minutes of Meeting
                </Text>
                {meeting.minutes.map((minute) => (
                  <View
                    key={minute._id}
                    className="border border-gray-200 rounded-xl p-3 mb-3"
                  >
                    <Text className="font-bold text-indigo-600 mb-1">
                      {minute.serialNo}. {minute.issueSubject}
                    </Text>
                    <Text className="text-gray-700 mb-1">
                      {minute.issueDescription}
                    </Text>

                    <Text className="text-gray-500 text-sm">
                      Raised By:{" "}
                      {minute.raisedBy.map((r) => r.individualName).join(", ")}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Responsible:{" "}
                      {minute.responsibility
                        .map((r) => r.individualName)
                        .join(", ")}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Target Date:{" "}
                      {new Date(minute.targetDate).toLocaleDateString()}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Status:{" "}
                      <Text
                        className={`${
                          minute.status === "open"
                            ? "text-red-500"
                            : "text-green-500"
                        } font-semibold`}
                      >
                        {minute.status.toUpperCase()}
                      </Text>
                    </Text>
                    {minute.remarks ? (
                      <Text className="text-gray-500 text-sm mt-1">
                        Remarks: {minute.remarks}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
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
