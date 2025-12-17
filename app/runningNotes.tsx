import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "@/lib/api";

type Note = {
  id: string;
  text: string;
  status: "Open" | "In Progress" | "Closed";
  responsible: string | null;
  targetDate: Date | null;
  createdBy: string;
  createdAt: Date;
};

const statusOptions = [
  { label: "Open", value: "Open", color: "#EF4444" }, // red
  { label: "In Progress", value: "In Progress", color: "#F59E0B" }, // amber
  { label: "Closed", value: "Closed", color: "#10B981" }, // green
];

const RunningNotes = () => {
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<"Open" | "In Progress" | "Closed">(
    "Open"
  );
  const [responsible, setResponsible] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);

  // ✅ Fetch users for the dropdown
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
        }));

        setUsers(formatted);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error fetching users" });
        console.log(err);
      }
    };

    fetchUsers();
  }, [token, projectId]);

  const addNote = () => {
    if (!noteText.trim()) return alert("Note text is required.");
    const newNote: Note = {
      id: Date.now().toString(),
      text: noteText,
      status,
      responsible,
      targetDate,
      createdBy: user?.fullName || "Unknown",
      createdAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    setNoteText("");
    setStatus("Open");
    setResponsible(null);
    setTargetDate(null);
  };

  const renderHeader = React.useMemo(() => {
    return (
      <View className="p-3">
        <View className="bg-white p-3 rounded-2xl shadow-md">
          <Text className="font-semibold mb-2 text-base">Add New Note</Text>

          {/* Row 1: Note input */}
          <TextInput
            placeholder="Enter note..."
            placeholderTextColor="#888"
            value={noteText}
            multiline
            onChangeText={setNoteText}
            className="border border-gray-200 rounded-xl p-2 mb-2 text-sm"
          />

          {/* Row 2: Status + Target date */}
          <View className="flex-row justify-between mb-2 gap-2">
            {/* Status Dropdown */}
            <Dropdown
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingVertical: 2,
                paddingHorizontal: 10,
                height: 38,
              }}
              placeholderStyle={{ fontSize: 14, color: "#888" }}
              selectedTextStyle={{
                fontSize: 13,
                color: "#111827",
                // fontWeight: "500",
              }}
              containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
              activeColor="#EEF2FF"
              data={statusOptions}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={status}
              onChange={(item) => setStatus(item.value)}
            />

            {/* Target date */}
            <TouchableOpacity
              className="border border-gray-200 rounded-xl flex-1 justify-center px-3"
              style={{ height: 38 }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-sm">
                {targetDate ? targetDate.toDateString() : "Select target date"}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={targetDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setTargetDate(date);
              }}
            />
          )}

          {/* Row 3: Responsible + Add Note */}
          <View className="flex-row justify-between ">
            {/* Responsible Dropdown */}
            <Dropdown
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingVertical: 2,
                paddingHorizontal: 10,
                height: 38,
              }}
                placeholderStyle={{ fontSize: 14, color: "#888" }}
              selectedTextStyle={{
                fontSize: 13,
                color: "#111827",
                // fontWeight: "500",
              }}
               activeColor="#EEF2FF"
              containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
              data={users}
              labelField="label"
              valueField="value"
              placeholder="Select responsible"
              value={responsible}
              onChange={(item) => setResponsible(item.value)}
            />
          </View>

          {/* Add Note button */}
          <TouchableOpacity
            className="bg-indigo-600 mt-2 rounded-lg flex-1 items-center justify-center"
            style={{ height: 40 }}
            onPress={addNote}
          >
            <Text className="text-white font-semibold text-sm">Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [noteText, status, responsible, targetDate, showDatePicker, users]);

  const renderNote = ({ item }: { item: Note }) => {
    const statusColor =
      statusOptions.find((s) => s.value === item.status)?.color || "#000";

    return (
      <View className="bg-white mx-4 mb-2 p-3 rounded-2xl shadow-md">
        {/* Note text & status */}
        <View className="flex-row justify-between items-start mb-1">
          <Text className="font-semibold text-sm flex-1 mr-2">{item.text}</Text>
          <View
            className="px-2 py-0.5 rounded-lg"
            style={{ backgroundColor: statusColor }}
          >
            <Text className="text-white font-semibold text-xs">
              {item.status}
            </Text>
          </View>
        </View>

        {/* Responsible (full name) */}
        <Text className="text-sm mb-0.5">
          Responsible:{" "}
          {users.find((u) => u.value === item.responsible)?.label || "N/A"}
        </Text>

        {/* Target date */}
        <Text className="text-sm mb-0.5">
          Target: {item.targetDate?.toDateString() || "N/A"}
        </Text>

        {/* Created info */}
        <Text className="text-gray-500 text-xs">
          Added by {item.createdBy} on {item.createdAt.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`
              )
            }
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-white text-xl font-semibold ml-3">
              Running Notes
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderNote}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
};

export default RunningNotes;
