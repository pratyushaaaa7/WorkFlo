import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { List, Card, Divider } from "react-native-paper";
import Collapsible from "react-native-collapsible";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MultiSelect, Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";

type DirectoryUser = {
  label: string;
  value: string;
  attendeeName: string;
  role?: string;
  organization?: string;
  designation?: string;
  email?: string;
  phone?: string;
};

const CreateMinutes = () => {
  const router = useRouter();
  const { meetingId, projectId, projectName, company } = useLocalSearchParams();
  // console.log(meetingId, projectId, projectName, company);

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [expandedMinute, setExpandedMinute] = useState<number | null>(null);

  // ✅ Meeting-level state
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [meetingTime, setMeetingTime] = useState<string>(""); // string for time
  const [meetingVenue, setMeetingVenue] = useState<string>("");

  const [showMeetingDatePicker, setShowMeetingDatePicker] = useState(false);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([
    {
      sNo: 1,
      attendeeName: "",
      role: "",
      organization: "",
      designation: "",
      email: "",
      phone: "",
    },
  ]);

  // Minutes state
  const [minutes, setMinutes] = useState<any[]>([
    {
      serialNo: 1,
      raisedBy: [],
      issueSubject: "",
      issueDescription: "",
      targetDate: null,
      responsibility: [],
      remarks: "",
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  //Users for Raised By dropdown
  // const [raisedBy, setRaisedBy] = useState<{ label: string; value: string }[]>(
  //   []
  // );

  // Users for responsibility dropdown
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const [openDirectoryFor, setOpenDirectoryFor] = useState<number | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        const res = await api.get(`/user-directory/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
          attendeeName: u.individualName,
          role: u.role || "",
          organization: u.firmName || "",
          designation: u.designation || "",
          email: u.email || "",
          phone: u.phone || "",
        }));

        setUsers(formatted);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error fetching users" });
      }
    };
    fetchUsers();
  }, [token, projectId]);

  // Utility functions
  const updateAttendee = (index: number, field: string, value: any) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };
  const addAttendee = () =>
    setAttendees((prev) => [
      ...prev,
      {
        sNo: prev.length + 1,
        attendeeName: "",
        role: "",
        organization: "",
        designation: "",
        email: "",
        phone: "",
      },
    ]);
  const deleteAttendee = (index: number) => {
    const updated = attendees
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, sNo: i + 1 }));
    setAttendees(updated);
  };

  const updateMinute = (index: number, field: string, value: any) => {
    const updated = [...minutes];
    updated[index][field] = value;
    setMinutes(updated);
  };
  const addMinute = () =>
    setMinutes((prev) => [
      ...prev,
      {
        serialNo: prev.length + 1,
        raisedBy: [],
        issueSubject: "",
        issueDescription: "",
        targetDate: null,
        responsibility: [],
        remarks: "",
      },
    ]);
  const deleteMinute = (index: number) => {
    const updated = minutes
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, serialNo: i + 1 }));
    setMinutes(updated);
  };

  const openDatePicker = (index: number) => {
    setDateIndex(index);
    setShowDatePicker(true);
  };
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && dateIndex !== null) {
      updateMinute(dateIndex, "targetDate", selectedDate.toISOString());
      setDateIndex(null);
    }
  };

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        if (!token || !meetingId) return;
        const res = await api.get(`/minutes/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;

        // Prefill meeting info
        if (data.meetingDate) setMeetingDate(new Date(data.meetingDate));
        if (data.meetingTime) setMeetingTime(data.meetingTime);
        if (data.meetingVenue) setMeetingVenue(data.meetingVenue);

        // Prefill attendees if exist
        if (data.attendees && data.attendees.length > 0) {
          setAttendees(data.attendees);
        }

        // Prefill minutes (from agenda if exists)
        if (data.minutes && data.minutes.length > 0) {
          const formattedMinutes = data.minutes.map((m: any, idx: number) => ({
            serialNo: idx + 1,
            raisedBy: m.raisedBy?.map((r: any) => r._id) || [],
            issueSubject: m.issueSubject || "",
            issueDescription: m.description || "",
            targetDate: m.targetDate || null,
            responsibility: m.responsibility?.map((r: any) => r._id) || [],
            remarks: m.remarks || "",
          }));
          setMinutes(formattedMinutes);
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
        Toast.show({ type: "error", text1: "Error loading meeting data" });
      }
    };

    fetchMeetingData();
  }, [token, meetingId]);

  const handleSubmit = async (type: "agenda" | "mom") => {
    try {
      if (!token) return;

      // ✅ Validation
      if (type === "agenda") {
        const invalid = minutes.some(
          (m) => !m.issueSubject || m.raisedBy.length === 0
        );
        if (invalid) {
          return Toast.show({
            type: "error",
            text1: "Issue Subject & Raised By are required for agenda",
            position: "bottom",
          });
        }
      } else {
        if (!meetingDate || !meetingTime || !meetingVenue) {
          return Toast.show({
            type: "error",
            text1: "Meeting info is required",
          });
        }
        if (attendees.length === 0) {
          return Toast.show({
            type: "error",
            text1: "Add at least one attendee",
            position: "bottom",
          });
        }
        const invalid = minutes.some(
          (m) =>
            !m.issueSubject ||
            !m.targetDate ||
            m.raisedBy.length === 0 ||
            m.responsibility.length === 0
        );
        if (invalid) {
          return Toast.show({
            type: "error",
            text1: "All MOM fields are required",
            position: "bottom",
          });
        }
      }

      // ✅ Format attendees
      const formattedAttendees = attendees.map((a) => ({
        sNo: a.sNo,
        attendeeName: a.attendeeName,
        role: a.role,
        organization: a.organization,
        designation: a.designation,
        email: a.email,
        phone: a.phone,
      }));

      // ✅ Format minutes
      const formattedMinutes = minutes.map((m) => ({
        serialNo: m.serialNo,
        issueSubject: m.issueSubject,
        description: m.issueDescription, // backend expects "description"
        raisedBy: Array.isArray(m.raisedBy) ? m.raisedBy : [m.raisedBy],
        responsibility: m.responsibility,
        targetDate: m.targetDate,
        remarks: m.remarks,
      }));

      const payload = {
        projectId,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        meetingTime,
        meetingVenue,
        attendees: formattedAttendees,
        minutes: formattedMinutes,
        actionType: type,
      };

      // ✅ Call API
      if (type === "agenda" || !meetingId) {
        // Create new meeting (agenda or full MOM)
        await api.post(`/minutes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Update existing meeting (after agenda)
        await api.put(`/minutes/${meetingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Toast.show({
        type: "success",
        text1: type === "agenda" ? "Agenda submitted" : "MOM submitted",
        position: "bottom",
      });
      router.back();
    } catch (err) {
      console.error("Submit error:", err);
      Toast.show({
        type: "error",
        text1: "Failed to submit minutes",
        position: "bottom",
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Create {projectName} Minutes
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 80 : 100}
        contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
      >
        {/* <Text className="text-2xl font-bold text-gray-800 text-center my-4">
          {projectName || ""} MOM
        </Text> */}

        {/* ✅ Meeting Info Section */}
        <View className="mb-2 rounded-xl shadow-md overflow-hidden">
          <View className="bg-white px-3 py-4 gap-3">
            <Text className="text-lg font-bold text-gray-700">
              Meeting Info
            </Text>
            {/* Meeting Date */}
            <TouchableOpacity onPress={() => setShowMeetingDatePicker(true)}>
              <TextInput
                placeholder="Meeting Date"
                placeholderTextColor="#888"
                value={
                  meetingDate ? moment(meetingDate).format("DD-MM-YYYY") : ""
                }
                editable={false}
                pointerEvents="none"
                className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
              />
            </TouchableOpacity>
            {showMeetingDatePicker && (
              <DateTimePicker
                value={meetingDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowMeetingDatePicker(false);
                  if (selectedDate) setMeetingDate(selectedDate);
                }}
              />
            )}

            {/* Meeting Time */}
            <TextInput
              placeholder="Meeting Time"
              placeholderTextColor="#888"
              value={meetingTime}
              onChangeText={setMeetingTime}
              className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
            />

            {/* Venue */}
            <TextInput
              placeholder="Venue"
              placeholderTextColor="#888"
              value={meetingVenue}
              onChangeText={setMeetingVenue}
              className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
            />
          </View>
        </View>

        {/* Attendees */}
        <View className="bg-white rounded-xl p-2 shadow-md">
          <Text className="text-lg font-bold text-gray-700 p-2">Attendees</Text>

          {attendees.map((att, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow-sm overflow-hidden"
            >
              <List.Accordion
                title={`Attendee ${att.sNo}`}
                titleStyle={{ fontWeight: "600", fontSize: 16 }}
                style={{
                  backgroundColor: "#F0F9FF",
                  borderRadius: 12,
                }}
                expanded={expandedAttendee === index}
                onPress={() =>
                  setExpandedAttendee(expandedAttendee === index ? null : index)
                }
              >
                <Card.Content className="bg-white px-3 py-4">
                  {/* Directory Select Option */}
                  {openDirectoryFor === index ? (
                    <Dropdown
                      style={{
                        height: 35,
                        borderColor: "#0EA5E9",
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#FFF",
                        marginBottom: 8,
                      }}
                      placeholderStyle={{ fontSize: 14, color: "#0EA5E9" }}
                      selectedTextStyle={{ fontSize: 14, color: "#111827" }}
                      activeColor="#F0F9FF"
                      data={users} // 👈 array of {label, value, attendeeName, role, etc.}
                      labelField="label"
                      valueField="value"
                      value={att.userId}
                      placeholder="Select attendee"
                      search
                      searchPlaceholder="Search..."
                      onChange={(val) => {
                        const user = users.find((u) => u.value === val.value);
                        if (user) {
                          updateAttendee(index, "userId", user.value);
                          updateAttendee(
                            index,
                            "attendeeName",
                            user.attendeeName || ""
                          );
                          updateAttendee(index, "role", user.role || "");
                          updateAttendee(
                            index,
                            "organization",
                            user.organization || ""
                          );
                          updateAttendee(
                            index,
                            "designation",
                            user.designation || ""
                          );
                          updateAttendee(index, "email", user.email || "");
                          updateAttendee(index, "phone", user.phone || "");
                        }
                        setOpenDirectoryFor(null);
                      }}
                    />
                  ) : !att.userId ? (
                    <TouchableOpacity
                      onPress={() => setOpenDirectoryFor(index)}
                      className="flex-row items-center border w-full border-sky-500 py-2 px-3 rounded-xl justify-center mb-3"
                    >
                      <Ionicons
                        name="people-outline"
                        size={18}
                        color="#0EA5E9"
                      />
                      <Text className="ml-2 text-sky-500 font-medium text-sm">
                        Select From Directory
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Manual Fields */}
                  <View className="gap-2">
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#888"
                      value={att.attendeeName}
                      onChangeText={(t) =>
                        updateAttendee(index, "attendeeName", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Role"
                      placeholderTextColor="#888"
                      value={att.role}
                      onChangeText={(t) => updateAttendee(index, "role", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Organization"
                      placeholderTextColor="#888"
                      value={att.organization}
                      onChangeText={(t) =>
                        updateAttendee(index, "organization", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Designation"
                      placeholderTextColor="#888"
                      value={att.designation}
                      onChangeText={(t) =>
                        updateAttendee(index, "designation", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor="#888"
                      value={att.email}
                      onChangeText={(t) => updateAttendee(index, "email", t)}
                      keyboardType="email-address"
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Phone"
                      placeholderTextColor="#888"
                      value={att.phone}
                      onChangeText={(t) => updateAttendee(index, "phone", t)}
                      keyboardType="phone-pad"
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />

                    {/* Remove Attendee */}
                    {attendees.length > 1 && (
                      <TouchableOpacity onPress={() => deleteAttendee(index)}>
                        <Text className="text-red-500 font-psemibold text-right px-4 mt-2">
                          Remove Attendee
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card.Content>
              </List.Accordion>
            </Card>
          ))}

          {/* Add Attendee Button */}
          <TouchableOpacity
            onPress={addAttendee}
            className="bg-sky-500 py-3 rounded-2xl items-center my-3 shadow-md active:opacity-80"
          >
            <Text className="text-white font-pbold">+ Add Attendee</Text>
          </TouchableOpacity>
        </View>

        {/* <Divider style={{ marginVertical: 16 }} /> */}

        {/* Minutes */}
        <View className="bg-white rounded-xl p-2 mt-2 shadow-md">
          <Text className="text-lg font-bold text-gray-700 p-2">Minutes</Text>

          {minutes.map((m, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow-sm overflow-hidden"
            >
              <List.Accordion
                title={`Minute ${m.serialNo}`}
                titleStyle={{
                  fontWeight: "600",
                  fontSize: 16,
                }}
                style={{
                  backgroundColor: "#ECFDF5", // Emerald-50 like light green
                  borderRadius: 12,
                }}
                expanded={expandedMinute === index}
                onPress={() =>
                  setExpandedMinute(expandedMinute === index ? null : index)
                }
              >
                <Card.Content className="bg-white px-3 py-4">
                  <View className="gap-2">
                    {/* Raised By */}
                    <MultiSelect
                      style={{
                        height: 35,
                        borderColor: "#E5E7EB", // gray-200
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#F9FAFB",
                      }}
                      placeholderStyle={{ fontSize: 14, color: "#888" }}
                      selectedTextStyle={{
                        fontSize: 12,
                        color: "#0B0B0B",
                      }}
                      selectedStyle={{
                        borderRadius: 10,
                        backgroundColor: "#D1FADF", // light green (instead of light aqua)
                        padding: 4,
                      }}
                      containerStyle={{
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: "#fff",
                      }}
                      activeColor="#DCFCE7"
                      inputSearchStyle={{ fontSize: 14 }}
                      search
                      labelField="label"
                      valueField="value"
                      data={users}
                      value={m.raisedBy} // bind to minute state
                      placeholder="Issue raised by"
                      searchPlaceholder="Search..."
                      onChange={(val) => updateMinute(index, "raisedBy", val)}
                    />
                    <TextInput
                      placeholder="Issue Subject"
                      placeholderTextColor="#888"
                      value={m.issueSubject}
                      onChangeText={(t) =>
                        updateMinute(index, "issueSubject", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Issue Description"
                      placeholderTextColor="#888"
                      value={m.issueDescription}
                      onChangeText={(t) =>
                        updateMinute(index, "issueDescription", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />

                    {/* Date Picker Field */}
                    <TouchableOpacity onPress={() => openDatePicker(index)}>
                      <TextInput
                        placeholder="Target Date (DD-MM-YYYY)"
                        placeholderTextColor="#888"
                        value={
                          m.targetDate
                            ? moment(m.targetDate).format("DD-MM-YYYY")
                            : ""
                        }
                        editable={false}
                        pointerEvents="none"
                        className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                      />
                    </TouchableOpacity>
                    {showDatePicker && dateIndex === index && (
                      <DateTimePicker
                        value={
                          m.targetDate ? new Date(m.targetDate) : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                      />
                    )}

                    {/* MultiSelect */}
                    <MultiSelect
                      style={{
                        height: 35,
                        borderColor: "#E5E7EB", // gray-200
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#F9FAFB",
                      }}
                      placeholderStyle={{ fontSize: 14, color: "#888" }}
                      selectedTextStyle={{
                        fontSize: 12,
                        color: "#0B0B0B",
                      }}
                      selectedStyle={{
                        borderRadius: 10,
                        backgroundColor: "#D1FADF", // light green (instead of light aqua)
                        padding: 4,
                      }}
                      containerStyle={{
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: "#fff",
                      }}
                      activeColor="#DCFCE7"
                      inputSearchStyle={{ fontSize: 14 }}
                      search
                      labelField="label"
                      valueField="value"
                      data={users}
                      value={m.responsibility} // bind to minute state
                      placeholder="Select responsible users"
                      searchPlaceholder="Search..."
                      onChange={(val) =>
                        updateMinute(index, "responsibility", val)
                      }
                    />
                    <TextInput
                      placeholder="Remarks (if any)"
                      placeholderTextColor="#888"
                      value={m.remarks}
                      onChangeText={(t) => updateMinute(index, "remarks", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />

                    {/* 🗑 Delete Minute */}
                    {minutes.length > 1 && (
                      <TouchableOpacity onPress={() => deleteMinute(index)}>
                        <Text className="text-red-500 font-psemibold text-right px-4 mt-2">
                          Remove Minute
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card.Content>
              </List.Accordion>
            </Card>
          ))}

          <TouchableOpacity
            onPress={addMinute}
            className="bg-emerald-500 py-3 rounded-2xl items-center my-3 shadow-md active:opacity-80"
          >
            <Text className="text-white  font-pbold">+ Add Minute</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}

        <View className="flex-row gap-3 my-10">
          {meetingId ? (
            <TouchableOpacity
              // onPress={downloadAgenda}
              className="flex-1 px-4 py-4 bg-sky-700 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xl">
                Download Agenda
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSubmit("agenda")}
              className="flex-1 px-4 py-4 bg-sky-700 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xl">
                Submit Agenda
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleSubmit("mom")}
            className="flex-1 px-4 py-4 bg-green-700 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-xl">Submit Minutes</Text>
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 rounded-2xl items-center my-4"
        >
          <Text className="text-white font-bold">Submit MOM</Text>
        </TouchableOpacity> */}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateMinutes;
