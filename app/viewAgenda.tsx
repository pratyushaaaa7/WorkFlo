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
      <ScrollView className="p-3 bg-gray-50">
        {/* Date, Time & Venue Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md border border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#4B5563" />
              <Text className="ml-2 text-gray-800 font-semibold">
                {new Date(
                  Array.isArray(meetingDate) ? meetingDate[0] : meetingDate
                ).toLocaleDateString()}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#4B5563" />
              <Text className="ml-2 text-gray-800 font-semibold">
                {meetingTime}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-gray-200 my-3" />

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-700 font-medium">
              {meetingVenue}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meeting ? (
          <>
            {/* Attendees Section */}
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3 px-1">
                Attendees
              </Text>
              <View className="bg-white rounded-2xl shadow p-3 border border-gray-100">
                {meeting.attendees.map((attendee: any, idx: number) => (
                  <View
                    key={attendee._id || idx}
                    className="flex-row justify-between items-center border-b border-gray-100 py-3"
                  >
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="person-circle-outline"
                        size={22}
                        color="#0369A1"
                      />
                      <View className="ml-2 flex-1">
                        <Text className="font-semibold text-gray-800">
                          {attendee.attendeeName}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {attendee.designation} | {attendee.organization}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm">
                      {attendee.phone}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Agenda Section */}
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3 px-1">
                Agenda
              </Text>
              {meeting.agenda && meeting.agenda.length > 0 ? (
                meeting.agenda.map((item: any, idx: number) => (
                  <View
                    key={item._id || idx}
                    className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="bg-indigo-100 px-2 py-1 rounded-md">
                        <Text className="text-indigo-700 font-bold text-sm">
                          #{item.serialNo}
                        </Text>
                      </View>
                      <Text className="ml-2 text-base font-semibold text-indigo-700 flex-1">
                        {item.issueSubject}
                      </Text>
                    </View>

                    {/* Raised By */}
                    <View className="flex-row items-center  mt-1">
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color="#374151"
                        style={{ marginTop: 2 }}
                      />
                      <Text className="ml-1 text-gray-700 text-sm flex-1">
                        <Text className="font-medium text-gray-800">
                          Raised by:{" "}
                        </Text>
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
                  </View>
                ))
              ) : (
                <View className="bg-gray-100 rounded-xl p-4 items-center">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray-500 mt-2 text-sm">
                    No agenda items added yet.
                  </Text>
                </View>
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
