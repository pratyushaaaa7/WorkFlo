import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState, useContext } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { MultiSelect } from "react-native-element-dropdown";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";

const CreateMinutes = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // 🔹 State for minutes
  const [minutes, setMinutes] = useState<any[]>([
    {
      serialNo: 1,
      description: "",
      targetDate: null,
      responsibility: [],
      remarks: "",
    },
  ]);

  // 🔹 State for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  // 🔹 Users for responsibility dropdown
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  // Update a field in an attendee
  const updateAttendee = (index: number, field: string, value: any) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  // Add a new attendee
  const addAttendee = () => {
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
  };

  // Delete an attendee
  const deleteAttendee = (index: number) => {
    const updated = attendees.filter((_, i) => i !== index);
    const reIndexed = updated.map((a, i) => ({ ...a, sno: i + 1 }));
    setAttendees(reIndexed);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        setLoadingUsers(true);

        const res = await api.get(`/user-directory/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
        }));

        setUsers(formatted);
      } catch (err) {
        console.error("Error fetching users:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to fetch users for responsibility dropdown.",
          position: "bottom",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token, projectId]);

  // 🔹 Update a field in a specific minute
  const updateMinute = (index: number, field: string, value: any) => {
    const updated = [...minutes];
    updated[index][field] = value;
    setMinutes(updated);
  };

  // 🔹 Add a new issue
  const addMinute = () => {
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
  };

  // 🔹 Delete an issue
  const deleteMinute = (index: number) => {
    const updated = minutes.filter((_, i) => i !== index);
    // re-assign serial numbers
    const reIndexed = updated.map((m, i) => ({ ...m, serialNo: i + 1 }));
    setMinutes(reIndexed);
  };

  // 🔹 Date Picker
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Create MOM
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content */}
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 80 : 100}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 60,
        }}
      >
        <Text className="text-2xl py-4 font-extrabold text-gray-800 my-2 text-center">
          {projectName || ""} Minutes
        </Text>

        <Text className="text-2xl py-4 font-extrabold text-gray-800 my-2 text-center">
          Attendees
        </Text>

        {attendees.map((att, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-purple-600 mb-4">
              Attendee {att.sno}
            </Text>

            <TextInput
              placeholder="Name"
              value={att.name}
              onChangeText={(t) => updateAttendee(index, "name", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
            />

            <TextInput
              placeholder="Role"
              value={att.role}
              onChangeText={(t) => updateAttendee(index, "role", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
            />

            <TextInput
              placeholder="Company"
              value={att.company}
              onChangeText={(t) => updateAttendee(index, "company", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
            />

            <TextInput
              placeholder="Designation"
              value={att.designation}
              onChangeText={(t) => updateAttendee(index, "designation", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
            />

            <TextInput
              placeholder="Email"
              value={att.email}
              onChangeText={(t) => updateAttendee(index, "email", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
              keyboardType="email-address"
            />

            <TextInput
              placeholder="Phone Number"
              value={att.phone}
              onChangeText={(t) => updateAttendee(index, "phone", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50"
              keyboardType="phone-pad"
            />

            {attendees.length > 1 && (
              <Pressable onPress={() => deleteAttendee(index)} className="pt-5">
                <Text className="text-red-500 font-medium text-lg">
                  Delete Attendee
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Attendee Button */}
        <Pressable
          onPress={addAttendee}
          className="bg-indigo-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
        >
          <Text className="text-white font-semibold text-lg">
            + Add Attendee
          </Text>
        </Pressable>

        {/* Issues Section */}
        {minutes.map((minute, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-4">
              Minute {minute.serialNo}
            </Text>

            <TextInput
              placeholder="Issue Title"
              value={minute.description}
              onChangeText={(t) => updateMinute(index, "description", t)}
              className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            <TouchableOpacity onPress={() => openDatePicker(index)}>
              <TextInput
                placeholder="Target Date (DD-MM-YYYY)"
                value={
                  minute.targetDate
                    ? moment(minute.targetDate).format("DD-MM-YYYY")
                    : ""
                }
                editable={false}
                pointerEvents="none"
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base text-gray-800"
                placeholderTextColor="#999"
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={
                  minute.targetDate ? new Date(minute.targetDate) : new Date()
                }
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <MultiSelect
              style={{
                height: 40,
                borderColor: "#E5E7EB",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: "#F9FAFB",
                marginBottom: 8,
              }}
              placeholderStyle={{ fontSize: 14, color: "#888" }}
              selectedTextStyle={{ fontSize: 12, color: "#0B0B0B" }}
              selectedStyle={{
                borderRadius: 10,
                backgroundColor: "#b9EBF1",
                padding: 5,
              }}
              containerStyle={{
                borderRadius: 12,
                backgroundColor: "#fff",
              }}
              activeColor="#E0F7FA"
              inputSearchStyle={{ fontSize: 14 }}
              search
              labelField="label"
              valueField="value"
              data={users}
              value={minute.responsibility}
              placeholder="Select responsible users"
              searchPlaceholder="Search..."
              onChange={(items) => updateMinute(index, "responsibility", items)}
            />

            <TextInput
              placeholder="Issue Description"
              value={minute.remarks}
              onChangeText={(t) => updateMinute(index, "remarks", t)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            {minutes.length > 1 && (
              <Pressable onPress={() => deleteMinute(index)} className="pt-5">
                <Text className="text-red-500 font-medium text-lg">
                  Delete Issue
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Issue Button */}
        <Pressable
          onPress={addMinute}
          className="bg-emerald-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-semibold text-lg">+ Add Issue</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          onPress={() =>
            console.log("Submitting:", {
              attendees,
              minutes,
            })
          }
          className="bg-blue-600 py-4 rounded-2xl items-center active:scale-95"
        >
          <Text className="text-white font-bold text-lg">Submit MOM</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateMinutes;
