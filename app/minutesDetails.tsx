import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";

const MinutesDetail = () => {
  // Get local params from previous screen
  const { meetingId, meetingNumber, meetingDate, meetingTime, meetingVenue } =
    useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/minutes/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeeting(res.data);
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) fetchMeeting();
  }, [meetingId]);

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
        {/* Back Button + Title */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Meeting #{meetingNumber}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="p-2">
        <View className="bg-white rounded-2xl p-4 mb-4 shadow">
          <Text className="text-black text-2xl font-bold">
            Meeting #{meetingNumber}
          </Text>
          <Text className="mt-1">
            {new Date(meetingDate).toLocaleDateString()} | {meetingTime}
          </Text>
          <Text className=" mt-1">{meetingVenue}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meeting ? (
          <>
            {/* Attendees */}
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

            {/* Minutes */}
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
          </>
        ) : (
          <Text className="text-center mt-10 text-gray-500">
            Meeting not found
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default MinutesDetail;
