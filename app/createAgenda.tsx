import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { List, Card } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import { MultiSelect, Dropdown } from "react-native-element-dropdown";

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

const CreateAgenda = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [showMeetingDatePicker, setShowMeetingDatePicker] = useState(false);

  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const [openDirectoryFor, setOpenDirectoryFor] = useState<string | null>(null);

  // Attendees
  const [attendees, setAttendees] = useState<any[]>([
    {
      sNo: 1,
      type: "custom", // "directory" | "custom"
      userId: null, // for directory selection
      attendeeName: "",
      role: "",
      organization: "",
      designation: "",
      email: "",
      phone: "",
    },
  ]);

  // Agenda points
  const [agenda, setAgenda] = useState<{ subject: string; raisedBy: string }[]>(
    [{ subject: "", raisedBy: "" }]
  );

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
          role: u.role,
          organization: u.firmName, // map firmName → organization
          designation: u.designation,
          email: u.email,
          phone: u.phone,
        }));
        setUsers(formatted);
        // console.log("kuch bhi ", formatted);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error fetching users" });
      }
    };
    fetchUsers();
  }, [token, projectId]);

  // === Utility functions ===
  const updateAttendee = (index: number, field: string, value: any) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };
  const addAttendee = (type: "directory" | "custom") => {
    setAttendees((prev) => [
      ...prev,
      {
        sNo: prev.length + 1,
        type,
        userId: null,
        attendeeName: "",
        role: "",
        organization: "",
        designation: "",
        email: "",
        phone: "",
      },
    ]);
  };

  const deleteAttendee = (index: number) => {
    const updated = attendees
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, sNo: i + 1 }));
    setAttendees(updated);
  };

  const updateAgenda = (
    index: number,
    field: "subject" | "raisedBy",
    value: string
  ) => {
    const updated = [...agenda];
    updated[index][field] = value;
    setAgenda(updated);
  };

  const addAgenda = () =>
    setAgenda((prev) => [...prev, { subject: "", raisedBy: "" }]);

  const deleteAgenda = (index: number) => {
    const updated = agenda.filter((_, i) => i !== index);
    setAgenda(updated);
  };

  // === Submit ===
  const handleSubmit = async () => {
    try {
      if (!token) return;

      const formattedAttendees = attendees.map((a) => ({
        sNo: a.sNo,
        attendeeName: a.attendeeName,
        role: a.role,
        organization: a.organization,
        designation: a.designation,
        email: a.email,
        phone: a.phone,
      }));

      const payload = {
        projectId,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        meetingTime,
        meetingVenue,
        attendees: formattedAttendees,
        agenda: agenda.filter((a) => a.subject.trim() !== ""),
      };

      await api.post("/minutes", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "Agenda created successfully",
        position: "bottom",
      });
      router.back();
    } catch (err) {
      console.error("Agenda submit error:", err);
      Toast.show({
        type: "error",
        text1: "Failed to create agenda",
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
            Create {projectName} Agenda
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 80 : 100}
        contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
      >
        {/* Meeting Info */}
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
            <Card key={index} className="mb-4 rounded-3xl shadow-sm">
              <List.Accordion
                title={`Attendee ${att.sNo}`}
                expanded={expandedAttendee === index}
                onPress={() =>
                  setExpandedAttendee(expandedAttendee === index ? null : index)
                }
              >
                <Card.Content className="bg-white px-3 py-4 gap-3">
                  {/* Small button to pick from directory */}
                  <TouchableOpacity
                    onPress={() => setOpenDirectoryFor(index)} // <-- open dropdown for that attendee
                    className="bg-indigo-500 py-2 px-4 rounded-xl items-center self-start mb-2"
                  >
                    <Text className="text-white text-sm font-medium">
                      Select From Directory
                    </Text>
                  </TouchableOpacity>

                  {/* Directory dropdown (only open for selected attendee) */}
                  {openDirectoryFor === index && (
                    <Dropdown
                      style={{
                        height: 40,
                        borderColor: "#E5E7EB",
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#F9FAFB",
                        marginBottom: 8,
                      }}
                      placeholderStyle={{ fontSize: 14, color: "#888" }}
                      selectedTextStyle={{ fontSize: 13, color: "#0B0B0B" }}
                      data={users}
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
                  )}

                  {/* Manual fields (always shown) */}
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
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                      keyboardType="email-address"
                    />
                    <TextInput
                      placeholder="Phone"
                      placeholderTextColor="#888"
                      value={att.phone}
                      onChangeText={(t) => updateAttendee(index, "phone", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Remove Attendee */}
                  {attendees.length > 1 && (
                    <TouchableOpacity onPress={() => deleteAttendee(index)}>
                      <Text className="text-red-500 text-right px-4 mt-2">
                        Remove Attendee
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card.Content>
              </List.Accordion>
            </Card>
          ))}

          {/* Add Attendee */}
          <TouchableOpacity
            onPress={() => addAttendee("custom")}
            className="bg-sky-500 py-3 rounded-2xl items-center mt-2"
          >
            <Text className="text-white font-semibold">+ Add Attendee</Text>
          </TouchableOpacity>
        </View>

        {/* Agenda */}
        <View className="bg-white rounded-xl p-2 mt-2 shadow-md">
          <Text className="text-lg font-bold text-gray-700 p-2">Agenda</Text>

          {agenda.map((a, index) => (
            <Card key={index} className="mb-4 rounded-3xl shadow-sm">
              <Card.Content className="gap-2">
                {/* Raised By Dropdown */}
                <Dropdown
                  style={{
                    height: 40,
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: "#F9FAFB",
                  }}
                  placeholderStyle={{ fontSize: 14, color: "#888" }}
                  selectedTextStyle={{
                    fontSize: 13,
                    color: "#0B0B0B",
                  }}
                  containerStyle={{
                    borderRadius: 12,
                    backgroundColor: "#fff",
                  }}
                  activeColor="#DCFCE7"
                  inputSearchStyle={{ fontSize: 14 }}
                  search
                  labelField="label"
                  valueField="value"
                  data={users}
                  value={a.raisedBy}
                  placeholder="Select raised by"
                  searchPlaceholder="Search..."
                  onChange={(val) => updateAgenda(index, "raisedBy", val.value)}
                />

                {/* Issue Subject */}
                <TextInput
                  placeholder={`Issue Subject ${index + 1}`}
                  placeholderTextColor={"#888"}
                  value={a.subject}
                  onChangeText={(t) => updateAgenda(index, "subject", t)}
                  className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                />

                {/* Remove Agenda */}
                {agenda.length > 1 && (
                  <TouchableOpacity onPress={() => deleteAgenda(index)}>
                    <Text className="text-red-500 text-right px-4 mt-2">
                      Remove Agenda
                    </Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          ))}

          {/* Add Agenda */}
          <TouchableOpacity
            onPress={addAgenda}
            className="bg-indigo-500 py-3 rounded-2xl items-center my-3"
          >
            <Text className="text-white font-semibold">+ Add Agenda</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 rounded-2xl items-center my-4"
        >
          <Text className="text-white font-bold">Submit Agenda</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateAgenda;
