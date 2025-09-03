import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { exportAgendaWithAttendees } from "../utils/agendaExcel";

const MinutesDetail = () => {
  // Get local params from previous screen
  const {
    meetingId,
    meetingNumber,
    meetingDate,
    meetingTime,
    meetingVenue,
    projectName,
    company,
  } = useLocalSearchParams();
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

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
            {projectName} Meeting #{meetingNumber}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className=" px-2 mr-2 rounded-full bg-white/20 active:bg-white/50"
          // onPress={() => meeting && exportMinutesToExcel(meeting, projectName, company, auth?.user?.fullName ?? "Unknown")}
          onPress={() =>
            meeting &&
            exportAgendaWithAttendees(
              meeting,
              auth?.user?.fullName ?? "Unknown", // accountName
              projectName, // projectName
              company // company
            )
          }
          activeOpacity={0.7}
        >
          <Feather name="download" size={22} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="p-2">
        {/* Date & Time */}
        <View className="bg-white rounded-2xl p-5 mb-3 shadow-md border border-gray-100">
          {/* Date & Time Row */}
          <View className="flex-row justify-between items-center">
            {/* Date */}
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#1F2937" />
              <Text className="ml-2 text-gray-800 font-medium">
                {new Date(
                  Array.isArray(meetingDate) ? meetingDate[0] : meetingDate
                ).toLocaleDateString()}
              </Text>
            </View>

            {/* Time */}
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#1F2937" />
              <Text className="ml-2 text-gray-800 font-medium">
                {meetingTime}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-200 my-3" />

          {/* Venue */}
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#1F2937" />
            <Text className="ml-2 text-gray-700">{meetingVenue}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meeting ? (
          <>
            {/* Attendees */}
            <View className="bg-white p-4 rounded-2xl shadow mb-2">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Attendees
              </Text>
              {meeting.attendees.map((attendee: any) => (
                <View
                  key={attendee._id}
                  className="border-t border-gray-200 py-2 flex-row justify-between"
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
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Agenda
              </Text>

              {meeting.agenda && meeting.agenda.length > 0 ? (
                meeting.agenda.map((item: any) => (
                  <View
                    key={item._id}
                    className="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50"
                  >
                    {/* Serial No + Subject */}
                    <Text className="text-base font-semibold text-indigo-700 mb-2">
                      {item.serialNo}. {item.issueSubject}
                    </Text>

                    {/* Raised By */}
                    <Text className="text-gray-800">
                      {item.raisedBy && item.raisedBy.length > 0
                        ? item.raisedBy
                            .map(
                              (r: any) =>
                                `${r.individualName} (${
                                  r.firmName || r.designation || ""
                                })`
                            )
                            .join(", ")
                        : "N/A"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500 text-sm">
                  No agenda items added yet.
                </Text>
              )}
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
