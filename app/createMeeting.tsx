import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { List, Card } from "react-native-paper";
// import Collapsible from "react-native-collapsible";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MultiSelect, Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
// import { exportAgendaWithAttendees } from "../utils/agendaExcel";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";

const handleDownloadAgenda = async (
  meeting: any,
  projectName: any,
  accountName: any,
  company: any,
  token: any
) => {
  try {
    const payload = {
      meeting,
      projectName,
      accountName,
      company,
    };

    const response = await api.post("/minutes/export/agenda", payload, {
      responseType: "blob", // important for binary files
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fileName = `Meeting_${meeting.meetingNumber}_Agenda.xlsx`;

    if (Platform.OS === "web") {
      // Web: download via anchor tag
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Mobile: write to cache and share
      const blobToBase64 = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(reader.result?.toString().split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      const base64data = await blobToBase64(response.data);

      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Meeting Agenda",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("Failed to download agenda:", err);
    alert("Failed to download agenda");
  }
};

type DirectoryUser = {
  label: string;
  value: string;
  attendeeName: string;
  role?: string;
  organization?: string;
  designation?: string;
  email?: string;
  phone?: string;
  contactNumbers?: any;
};

const CreateMinutes = () => {
  const router = useRouter();
  const { meetingId, projectId, projectName, company } = useLocalSearchParams();
  // console.log(meetingId, projectId, projectName, company);

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const STORAGE_KEY = `minutes_draft_${projectId || "new"}`;

  const [isAgendaSubmitting, setIsAgendaSubmitting] = useState(false);
  const [isMomSubmitting, setIsMomSubmitting] = useState(false);

  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [expandedMinute, setExpandedMinute] = useState<number | null>(null);
  const [isAgendaDownloading, setIsAgendaDownloading] = useState(false);

  // ✅ Meeting-level state
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [meetingTime, setMeetingTime] = useState<string>(""); // string for time
  const [meetingVenue, setMeetingVenue] = useState<string>("");

  const [showMeetingDatePicker, setShowMeetingDatePicker] = useState(false);
  const [showMeetingTimePicker, setShowMeetingTimePicker] = useState(false);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([
    {
      sNo: 1,
      attendeeName: "",
      // role: "",
      organization: "",
      designation: "",
      email: "",
      contactNumbers: [""], // first number only
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
      targetDateForInfo: false, // ✅ new
      responsibilityForInfo: false, // ✅ new
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  // Users for responsibility dropdown
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const [openDirectoryFor, setOpenDirectoryFor] = useState<number | null>(null);
  const [meetingNumber, setMeetingNumber] = useState<number | null>(null);

  const [forwardedModalVisible, setForwardedModalVisible] = useState(false);
  const [forwardedMinutes, setForwardedMinutes] = useState<any[]>([]);

  //to store the minutes data even after the app is closed
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue) {
          const savedData = JSON.parse(jsonValue);
          setMeetingDate(
            savedData.meetingDate ? new Date(savedData.meetingDate) : null
          );
          setMeetingTime(savedData.meetingTime || "");
          setMeetingVenue(savedData.meetingVenue || "");
          setAttendees(savedData.attendees || []);
          setMinutes(savedData.minutes || []);
        }
      } catch (err) {
        console.log("Error loading stored data:", err);
      }
    };
    loadStoredData();
  }, [projectId]);

  //Save data automatically whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = {
          meetingDate,
          meetingTime,
          meetingVenue,
          attendees,
          minutes,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        // console.log("Data saved locally");
      } catch (err) {
        console.log("Error saving to AsyncStorage:", err);
      }
    };
    // Avoid saving immediately on mount before data loads
    if (meetingDate || attendees.length > 1 || minutes.length > 1) {
      saveData();
    }
  }, [meetingDate, meetingTime, meetingVenue, attendees, minutes]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
          attendeeName: u.individualName,
          // role: u.role || "",
          organization: u.firmName || "",
          designation: u.designation || "",
          email: u.email || "",
          contactNumbers: u.contactNumbers?.length ? u.contactNumbers : [""], // ✅ use existing array
        }));

        setUsers(formatted);
        // console.log(formatted);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error fetching users" });
        console.log(err);
      }
    };
    fetchUsers();
  }, [token, projectId]);

  const fetchForwardedMinutes = async () => {
    try {
      if (!token || !projectId) return;
      const res = await api.get(`/minutes/forwarded/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForwardedMinutes(res.data); // array of forwarded minutes
      // console.log(res.data);
      // console.log(JSON.stringify(res.data, null, 2));
      setForwardedModalVisible(true);
    } catch (err) {
      Toast.show({ type: "error", text1: "Error fetching forwarded minutes" });
      console.log(err);
    }
  };

  // Utility functions
  const updateAttendee = (index: number, field: string, value: any) => {
    const updated = [...attendees];

    if (field === "phone") {
      // ensure contactNumbers array exists
      if (!updated[index].contactNumbers) updated[index].contactNumbers = [""];
      updated[index].contactNumbers[0] = value; // only first number
    } else {
      updated[index][field] = value;
    }

    setAttendees(updated);
  };

  const addAttendee = () =>
    setAttendees((prev) => [
      ...prev,
      {
        sNo: prev.length + 1,
        attendeeName: "",
        // role: "",
        organization: "",
        designation: "",
        email: "",
        contactNumbers: [""], // first number
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
        // console.log (data)
        console.log("Meeting data:", JSON.stringify(data, null, 2));

        // Prefill meeting info
        if (data.meetingDate) setMeetingDate(new Date(data.meetingDate));
        if (data.meetingTime) setMeetingTime(data.meetingTime);
        if (data.meetingVenue) setMeetingVenue(data.meetingVenue);
        if (data.meetingNumber) setMeetingNumber(data.meetingNumber);

        // ✅ Normalize attendees
        if (data.attendees && data.attendees.length > 0) {
          setAttendees(
            data.attendees.map((a: any, idx: number) => ({
              sNo: a.sNo || idx + 1,
              attendeeName: a.attendeeName || "",
              // role: a.role || "",
              organization: a.organization || "",
              designation: a.designation || "",
              email: a.email || "",
              status: a.status || "",
              userId: a.userId || null,
              contactNumbers: a.contactNumbers || [""], // 👈 prevent crash
            }))
          );
        }

        // Prefill minutes (from agenda if exists)
        if (data.minutes && data.minutes.length > 0) {
          const formattedMinutes = data.minutes.map((m: any, idx: number) => ({
            serialNo: idx + 1,
            issueSubject: m.issueSubject || "",
            issueDescription: m.description || "",
            targetDate: m.targetDate || null,
            remarks: m.remarks || "",
            raisedBy: Array.isArray(m.raisedBy)
              ? m.raisedBy.map((r: any) => ({
                  value: r._id,
                  label: r.name,
                }))
              : [],
            responsibility: Array.isArray(m.responsibility)
              ? m.responsibility.map((r: any) => ({
                  value: r._id,
                  label: r.name,
                }))
              : [],

            targetDateForInfo: m.targetDateForInfo,
            responsibilityForInfo: m.responsibilityForInfo,
            fromForwardedId: m.fromForwardedId || null,
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

      // Start loading based on type
      if (type === "agenda") setIsAgendaSubmitting(true);
      else setIsMomSubmitting(true);

      // ✅ Validation
      if (type === "agenda") {
        const invalid = minutes.some(
          (m) => !m.issueSubject || m.raisedBy.length === 0
        );
        if (invalid) {
          Toast.show({
            type: "error",
            text1: "Issue Subject & Raised By are required for agenda",
            position: "bottom",
          });
          return;
        }
      } else {
        if (!meetingDate || !meetingTime || !meetingVenue) {
          Toast.show({
            type: "error",
            text1: "Meeting info is required",
            position: "bottom",
          });
          return;
        }
        if (attendees.length === 0) {
          Toast.show({
            type: "error",
            text1: "Add at least one attendee",
            position: "bottom",
          });
          return;
        }
        const invalid = minutes.some(
          (m) =>
            !m.issueSubject ||
            m.raisedBy.length === 0 ||
            (!m.targetDate && !m.targetDateForInfo) ||
            (m.responsibility.length === 0 && !m.responsibilityForInfo)
        );
        if (invalid) {
          Toast.show({
            type: "error",
            text1: "All MOM fields are required",
            position: "bottom",
          });
          return;
        }
      }

      // ✅ Format attendees
      const formattedAttendees = attendees.map((a) => ({
        sNo: a.sNo,
        attendeeName: a.attendeeName,
        organization: a.organization,
        designation: a.designation,
        email: a.email,
        contactNumbers: a.contactNumbers || [""],
      }));

      // ✅ Format minutes
      const formattedMinutes = minutes.map((m, i) => ({
        serialNo: m.serialNo ?? i + 1,
        issueSubject: m.issueSubject,
        description: m.issueDescription || "",
        raisedBy: m.raisedBy.map((r: any) => ({
          _id: r.value,
          name: r.label,
        })),
        responsibility: m.responsibility.map((r: any) => ({
          _id: r.value,
          name: r.label,
        })),
        targetDate: m.targetDateForInfo ? null : m.targetDate,
        remarks: m.remarks || "",
        targetDateForInfo: !!m.targetDateForInfo,
        responsibilityForInfo: !!m.responsibilityForInfo,
        fromForwardedId: m.fromForwardedId || null,
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
        await api.post(`/minutes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.put(`/minutes/${meetingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Toast.show({
        type: "success",
        text1: type === "agenda" ? "Agenda submitted" : "MOM submitted",
        position: "bottom",
      });
      await AsyncStorage.removeItem(STORAGE_KEY); // clear local draft
      router.back();
    } catch (err: any) {
      console.error("Submit error:", err?.response?.data || err.message);

      // Extract message from backend response
      const errorMsg =
        err?.response?.data?.message || // backend returned validation message
        err?.response?.data?.error || // fallback if error object
        "Failed to submit minutes"; // ultimate fallback

      Toast.show({
        type: "error",
        text1: errorMsg, // <-- show exact backend message
        position: "bottom",
      });
    } finally {
      // Stop loading
      setIsAgendaSubmitting(false);
      setIsMomSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              Create {projectName} Minutes
            </Text>
          </TouchableOpacity>
        </View>
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
            {/* ✅ Meeting Time */}
            <TouchableOpacity onPress={() => setShowMeetingTimePicker(true)}>
              <TextInput
                placeholder="Meeting Time"
                placeholderTextColor="#888"
                value={meetingTime} // 👈 directly use string
                editable={false} // prevent typing
                pointerEvents="none"
                className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
              />
            </TouchableOpacity>

            {showMeetingTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time" // important for time picker
                display="default"
                is24Hour={false} // set true if you want 24-hour format
                onChange={(_, selectedTime) => {
                  setShowMeetingTimePicker(false);
                  if (selectedTime) {
                    // format and store as text like “01:19 PM”
                    const formattedTime =
                      moment(selectedTime).format("hh:mm A");
                    setMeetingTime(formattedTime);
                  }
                }}
              />
            )}

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
                title={
                  <View>
                    <Text className="font-semibold text-gray-700 text-lg">
                      Attendee {att.sNo}
                    </Text>
                    {att.attendeeName ? (
                      <Text className=" text-sm text-gray-500">
                        {att.attendeeName}
                      </Text>
                    ) : null}
                  </View>
                }
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
                          // updateAttendee(index, "role", user.role || "");
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
                          updateAttendee(
                            index,
                            "contactNumbers",
                            user.contactNumbers || [""]
                          );
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
                    {/* <TextInput
                      placeholder="Role"
                      placeholderTextColor="#888"
                      value={att.role}
                      onChangeText={(t) => updateAttendee(index, "role", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    /> */}
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
                      value={att.contactNumbers[0] || ""}
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
          {/* <Text className="text-lg font-bold text-gray-700 p-2">Minutes</Text> */}
          <View className="flex-row justify-between items-center p-2">
            <Text className="text-lg font-bold text-gray-700">Minutes</Text>
            <TouchableOpacity
              onPress={fetchForwardedMinutes}
              className="bg-yellow-500 px-3 py-1 rounded-xl"
            >
              <Text className="text-white text-sm font-semibold">
                Fill from Forwarded
              </Text>
            </TouchableOpacity>
          </View>

          {minutes.map((m, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow-sm overflow-hidden"
            >
              <List.Accordion
                title={
                  <View>
                    <Text className="font-semibold text-gray-700 text-lg">
                      Minute {m.serialNo}
                    </Text>
                    {m.issueSubject ? (
                      <Text className="text-sm text-gray-500">
                        {m.issueSubject}
                      </Text>
                    ) : null}
                  </View>
                }
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
                      value={m.raisedBy.map((r: any) => r.value)} // ✅ use .value
                      placeholder="Issue raised by"
                      searchPlaceholder="Search..."
                      // Raised By
                      onChange={(selectedIds: string[]) => {
                        const selectedUsers = users
                          .filter((u) => selectedIds.includes(u.value))
                          .map((u) => ({
                            value: u.value,
                            label: u.label,
                          }));
                        updateMinute(index, "raisedBy", selectedUsers);
                      }}
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
                      placeholder="Issue Description (if any)"
                      placeholderTextColor="#888"
                      value={m.issueDescription}
                      onChangeText={(t) =>
                        updateMinute(index, "issueDescription", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />

                    {/* Date Picker Field */}
                    {/* <TouchableOpacity onPress={() => openDatePicker(index)}>
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
                    </TouchableOpacity> */}
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
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => openDatePicker(index)}
                        style={{
                          flex: 1,
                          opacity: m.targetDateForInfo ? 0.5 : 1,
                        }} // 🔹 decrease opacity
                        disabled={m.targetDateForInfo}
                      >
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
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-700"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          if (m.targetDateForInfo) {
                            // 🔹 If already "For Info", just toggle off
                            updateMinute(index, "targetDateForInfo", false);
                          } else {
                            // 🔹 If turning ON "For Info", clear the date
                            updateMinute(index, "targetDate", null);
                            updateMinute(index, "targetDateForInfo", true);
                          }
                        }}
                        className={`ml-2 px-3 py-2 rounded-xl ${
                          m.targetDateForInfo ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      >
                        <Text className="text-white text-xs font-bold">
                          {m.targetDateForInfo ? "For Info ✓" : "For Info"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* MultiSelect */}
                    <View className="flex-row items-center">
                      <View
                        style={{
                          flex: 1,
                          opacity: m.responsibilityForInfo ? 0.5 : 1,
                        }}
                      >
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
                          selectedTextStyle={{ fontSize: 12, color: "#0B0B0B" }}
                          selectedStyle={{
                            borderRadius: 10,
                            backgroundColor: "#D1FADF",
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
                          // value={m.responsibility}
                          value={m.responsibility.map((r: any) => r.value)}
                          placeholder="Select responsible users"
                          searchPlaceholder="Search..."
                          // onChange={(val) =>
                          //   updateMinute(index, "responsibility", val)
                          // }
                          // Raised By
                          onChange={(selectedIds: string[]) => {
                            const selectedUsers = users
                              .filter((u) => selectedIds.includes(u.value))
                              .map((u) => ({
                                value: u.value,
                                label: u.label,
                              }));
                            updateMinute(
                              index,
                              "responsibility",
                              selectedUsers
                            );
                          }}
                          disable={m.responsibilityForInfo} // 🔹 disable MultiSelect when For Info is active
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          if (m.responsibilityForInfo) {
                            // 🔹 If already "For Info", just toggle off
                            updateMinute(index, "responsibilityForInfo", false);
                          } else {
                            // 🔹 If turning ON "For Info", clear selected responsibility
                            updateMinute(index, "responsibility", []);
                            updateMinute(index, "responsibilityForInfo", true);
                          }
                        }}
                        className={`ml-2 px-3 py-2 rounded-xl ${
                          m.responsibilityForInfo
                            ? "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      >
                        <Text className="text-white text-xs font-bold">
                          {m.responsibilityForInfo ? "For Info ✓" : "For Info"}
                        </Text>
                      </TouchableOpacity>
                    </View>

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

        <Modal
          visible={forwardedModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setForwardedModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white w-11/12 rounded-2xl p-5 max-h-[70%] shadow-lg">
              {/* Header with title + close button */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-center flex-1">
                  Select Forwarded Issue
                </Text>
                <TouchableOpacity
                  onPress={() => setForwardedModalVisible(false)}
                  className="ml-2 p-1"
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* List or Empty State */}
              {!forwardedMinutes || forwardedMinutes.length === 0 ? (
                <View className="justify-center items-center py-10">
                  <Ionicons
                    name="document-text-outline"
                    size={70}
                    color="#c0c0c0"
                  />
                  <Text className="text-gray-400 text-center mt-4 text-base">
                    No forwarded issues available.
                  </Text>
                  <Text className="text-gray-400 text-center mt-1 text-sm">
                    Forwarded issues will appear here once available.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={forwardedMinutes}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="p-2 px-3 mb-2 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
                      onPress={() => {
                        setMinutes((prev) => [
                          ...prev,
                          {
                            serialNo: prev.length + 1,
                            raisedBy:
                              item.raisedBy?.map((r: any) => ({
                                label: r.individualName || r.name || "",
                                value: r._id || "",
                              })) || [],
                            issueSubject: item.issueSubject || "",
                            issueDescription: item.description || "",
                            targetDate: item.targetDate || null,
                            responsibility:
                              item.responsibility?.map((r: any) => ({
                                label: r.individualName || r.name || "",
                                value: r._id || "",
                              })) || [],
                            remarks: item.remarks || "",
                            targetDateForInfo: item.targetDateForInfo || false,
                            responsibilityForInfo:
                              item.responsibilityForInfo || false,
                            fromForwardedId: item._id,
                          },
                        ]);
                        setForwardedModalVisible(false);
                      }}
                    >
                      <Text className="font-semibold text-gray-900 text-base">
                        {item.issueSubject || "Untitled Issue"}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Submit Button */}
        {/* Submit Button */}
        <View className="flex-row gap-3 my-10">
          {meetingId ? (
            <TouchableOpacity
              disabled={isAgendaDownloading}
              onPress={async () => {
                setIsAgendaDownloading(true);
                try {
                  await handleDownloadAgenda(
                    {
                      meetingDate,
                      meetingTime,
                      meetingVenue,
                      meetingNumber,
                      attendees,
                      minutes,
                    },
                    projectName,
                    auth?.user?.fullName ?? "Unknown",
                    company,
                    auth?.token
                  );
                } finally {
                  setIsAgendaDownloading(false);
                }
              }}
              className={`flex-1 px-4 py-4 rounded-xl items-center ${
                isAgendaDownloading ? "bg-gray-400" : "bg-sky-700"
              }`}
            >
              {isAgendaDownloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-xl">
                  Download Agenda
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSubmit("agenda")}
              disabled={isAgendaSubmitting}
              className={`flex-1 px-4 py-4 rounded-xl items-center ${
                isAgendaSubmitting ? "bg-gray-400" : "bg-sky-700"
              }`}
            >
              {isAgendaSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-xl">
                  Submit Agenda
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleSubmit("mom")}
            disabled={isMomSubmitting}
            className={`flex-1 px-4 py-4 rounded-xl items-center ${
              isMomSubmitting ? "bg-gray-400" : "bg-green-700"
            }`}
          >
            {isMomSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-xl">
                Submit Minutes
              </Text>
            )}
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
