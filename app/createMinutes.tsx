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
import { MultiSelect } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";

const CreateMinutes = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [expandedMinute, setExpandedMinute] = useState<number | null>(null);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([
    {
      sno: 1,
      name: "",
      role: "",
      company: "",
      designation: "",
      email: "",
      phone: "",
    },
  ]);

  // Minutes state
  const [minutes, setMinutes] = useState<any[]>([
    {
      serialNo: 1,
      description: "",
      targetDate: null,
      responsibility: [],
      remarks: "",
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  // Users for responsibility dropdown
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);

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
        sno: prev.length + 1,
        name: "",
        role: "",
        company: "",
        designation: "",
        email: "",
        phone: "",
      },
    ]);
  const deleteAttendee = (index: number) => {
    const updated = attendees
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, sno: i + 1 }));
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
        description: "",
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

        <List.Section>
          <List.Subheader className="text-lg font-bold text-gray-700">
            Attendees
          </List.Subheader>

          {attendees.map((att, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow-md overflow-hidden"
            >
              <List.Accordion
                title={`Attendee ${att.sno}`}
                titleStyle={{
                  fontWeight: "600",
                  fontSize: 16,
                }}
                style={{
                  backgroundColor: "#F0F9FF", // Fuchsia-50
                  borderRadius: 12,
                }}
                expanded={expandedAttendee === index}
                onPress={() =>
                  setExpandedAttendee(expandedAttendee === index ? null : index)
                }
              >
                <Card.Content className="bg-white px-3 py-4">
                  <View className="gap-3">
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#888"
                      value={att.name}
                      onChangeText={(t) => updateAttendee(index, "name", t)}
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
                      placeholder="Company"
                      placeholderTextColor="#888"
                      value={att.company}
                      onChangeText={(t) => updateAttendee(index, "company", t)}
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
                    {/* 🗑 Delete button */}
                    <TouchableOpacity
                      onPress={() => {
                        setAttendees((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <Text className="text-red-500 font-semibold text-right px-4 mt-2">
                        Remove Attendee
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </List.Accordion>
            </Card>
          ))}

          <TouchableOpacity
            onPress={addAttendee}
            className="bg-sky-500 py-3 rounded-2xl items-center my-3 shadow-md active:opacity-80"
          >
            <Text className="text-white font-semibold">+ Add Attendee</Text>
          </TouchableOpacity>
        </List.Section>

        <Divider style={{ marginVertical: 16 }} />

        {/* Minutes */}
        <List.Section>
          <List.Subheader className="text-lg font-bold text-gray-700">
            Minutes
          </List.Subheader>

          {minutes.map((m, index) => (
            <Card
              key={index}
              className="mb-4 rounded-3xl shadow-md overflow-hidden"
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
                  <View className="gap-3">
                    <TextInput
                      placeholder="Issue Title"
                      placeholderTextColor="#888"
                      value={m.description}
                      onChangeText={(t) =>
                        updateMinute(index, "description", t)
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
                    {showDatePicker && (
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
                        padding: 5,
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
                      onChange={(items) =>
                        updateMinute(index, "responsibility", items)
                      } // save array
                    />

                    <TextInput
                      placeholder="Remarks"
                      placeholderTextColor="#999"
                      value={m.remarks}
                      onChangeText={(t) => updateMinute(index, "remarks", t)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                    />

                    {/* 🗑 Delete Minute */}
                    {minutes.length > 1 && (
                      <TouchableOpacity onPress={() => deleteMinute(index)}>
                        <Text className="text-red-500 font-semibold text-right px-4 mt-2">
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
            <Text className="text-white font-semibold">+ Add Minute</Text>
          </TouchableOpacity>
        </List.Section>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={() => console.log({ attendees, minutes })}
          className="bg-indigo-600 py-4 rounded-2xl items-center my-4"
        >
          <Text className="text-white font-bold">Submit MOM</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateMinutes;
