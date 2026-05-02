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
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { MinusSignIcon } from "@hugeicons/core-free-icons";
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

  const [openDirectoryFor, setOpenDirectoryFor] = useState<number | null>(null);

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

  const [agenda, setAgenda] = useState<
    { subject: string; raisedBy: DirectoryUser | null }[]
  >([{ subject: "", raisedBy: null }]);

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
    value: any
  ) => {
    const updated = [...agenda];
    updated[index][field] = value;
    setAgenda(updated);
  };

  const addAgenda = () =>
    setAgenda((prev) => [...prev, { subject: "", raisedBy: null }]);

  const deleteAgenda = (index: number) => {
    const updated = agenda.filter((_, i) => i !== index);
    setAgenda(updated);
  };


  const handleSubmit = async () => {
    if (!meetingDate || !meetingTime || !meetingVenue) {
      Toast.show({ type: "error", text1: "Please fill meeting details" });
      return;
    }

    if (attendees.length === 0) {
      Toast.show({ type: "error", text1: "Please add at least one attendee" });
      return;
    }

    try {
      const payload = {
        projectId,
        meetingDate,
        meetingTime,
        meetingVenue,
        attendees: attendees.map((a,index) => ({
           sNo: index + 1, // ✅ ensure serial number sent
          userId: a.userId,
          attendeeName: a.attendeeName,
          role: a.role,
          organization: a.organization,
          designation: a.designation,
          email: a.email,
          phone: a.phone,
        })),
        agenda: agenda.map((ag) => ({
          subject: ag.subject,
          raisedBy: ag.raisedBy ? ag.raisedBy.value : null,
        })),
      };

      const res = await api.post("/minutes", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: "success", text1: "Agenda created successfully!",  position:"bottom"});

      // ✅ Updated to match backend response
      // router.push(`/minutesDetails?meetingId=${res.data.meeting._id}`);
      router.back();
    } catch (err: any) {
      console.error("Error creating agenda:", err);
      Toast.show({
        type: "error",
        text1: "Failed to create agenda",
        text2: err.response?.data?.message || err.message,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        style={{
          paddingTop: 64,
          paddingBottom: 24,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
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
            <DateTimePickerModal
              isVisible={showMeetingDatePicker}
              mode="date"
              onConfirm={(selectedDate) => {
                setShowMeetingDatePicker(false);
                setMeetingDate(selectedDate);
              }}
              onCancel={() => setShowMeetingDatePicker(false)}
              date={meetingDate || new Date()}
            />
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
        <View className="bg-white rounded-xl shadow p-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Attendees
          </Text>

          {attendees.map((att, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow  overflow-hidden "
            >
              <List.Accordion
                title={`Attendee ${att.sNo}`}
                titleStyle={{ fontWeight: "600", color: "#0EA5E9" }}
                style={{
                  backgroundColor: "#F0F9FF",
                  borderRadius: 12,
                }}
                expanded={expandedAttendee === index}
                onPress={() =>
                  setExpandedAttendee(expandedAttendee === index ? null : index)
                }
              >
                <Card.Content className="bg-white px-3 py-4 gap-4">
                  {/* Select From Directory Button OR Dropdown */}
                  {openDirectoryFor === index ? (
                    <Dropdown
                      style={{
                        height: 45,
                        borderColor: "#0EA5E9",
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#FFF",
                      }}
                      placeholderStyle={{ fontSize: 14, color: "#0EA5E9" }}
                      selectedTextStyle={{ fontSize: 14, color: "#111827" }}
                      activeColor="#F0F9FF"
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
                        setOpenDirectoryFor(null); // close dropdown after selecting
                      }}
                    />
                  ) : !att.userId ? ( // 👈 hide button if attendee already has userId
                    <TouchableOpacity
                      onPress={() => setOpenDirectoryFor(index)}
                      className="flex-row items-center border w-full border-sky-500 py-2 px-3 rounded-xl justify-center"
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
                  <View className="gap-3">
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={att.attendeeName}
                      onChangeText={(t) =>
                        updateAttendee(index, "attendeeName", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Role"
                      placeholderTextColor="#9CA3AF"
                      value={att.role}
                      onChangeText={(t) => updateAttendee(index, "role", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Organization"
                      placeholderTextColor="#9CA3AF"
                      value={att.organization}
                      onChangeText={(t) =>
                        updateAttendee(index, "organization", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Designation"
                      placeholderTextColor="#9CA3AF"
                      value={att.designation}
                      onChangeText={(t) =>
                        updateAttendee(index, "designation", t)
                      }
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={att.email}
                      onChangeText={(t) => updateAttendee(index, "email", t)}
                      keyboardType="email-address"
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                    <TextInput
                      placeholder="Phone"
                      placeholderTextColor="#9CA3AF"
                      value={att.phone}
                      onChangeText={(t) => updateAttendee(index, "phone", t)}
                      keyboardType="phone-pad"
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />
                  </View>

                  {/* Remove Attendee */}
                  {attendees.length > 1 && (
                    <TouchableOpacity
                      onPress={() => deleteAttendee(index)}
                      className="flex-row items-center justify-end mt-1"
                    >
                      <View className="mb-0.5 h-4 w-4 rounded-full bg-[#EF4444] items-center justify-center mr-1">
                        <HugeiconsIcon
                          icon={MinusSignIcon}
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text className="text-red-500 font-poppinsMedium text-[13px]">
                        Remove
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
            <Card
              key={index}
              className="mb-4  rounded-3xl shadow-sm "
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <Card.Content className="gap-2 ">
                {/* Raised By Dropdown */}
                <Dropdown
                  style={{
                    height: 40,
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: "#FFF",
                  }}
                  placeholderStyle={{ fontSize: 14, color: "#888" }}
                  selectedTextStyle={{ fontSize: 13, color: "#0B0B0B" }}
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
                  value={a.raisedBy ? a.raisedBy.value : null}
                  placeholder="Select raised by"
                  searchPlaceholder="Search..."
                  onChange={(val) => {
                    const user = users.find((u) => u.value === val.value);
                    if (user) {
                      updateAgenda(index, "raisedBy", user); // 👈 update state with full user object
                    }
                  }}
                />

                {/* Issue Subject */}
                <TextInput
                  placeholder={`Issue Subject ${index + 1}`}
                  placeholderTextColor={"#888"}
                  value={a.subject}
                  onChangeText={(t) => updateAgenda(index, "subject", t)}
                  className="border border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-900"
                />

                {/* Remove Agenda */}
                {agenda.length > 1 && (
                  <TouchableOpacity
                    onPress={() => deleteAgenda(index)}
                    className="flex-row items-center justify-end mt-1"
                  >
                    <View className="mb-0.5 h-4 w-4 rounded-full bg-[#EF4444] items-center justify-center mr-1">
                      <HugeiconsIcon
                        icon={MinusSignIcon}
                        size={10}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text className="text-red-500 font-poppinsMedium text-[13px]">
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          ))}

          {/* Add Agenda */}
          <TouchableOpacity
            onPress={addAgenda}
            className="bg-emerald-500 py-3 rounded-2xl items-center my-3"
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
