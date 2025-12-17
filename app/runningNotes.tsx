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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const resp = await fetch("https://your-backend.com/api/users");
        const data = await resp.json();
        setUsers(data.map((u: any) => ({ label: u.username, value: u._id })));
      } catch (err) {
        console.log("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

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
      <View className="p-4">
        <View className="bg-white p-4 rounded-2xl shadow-md">
          <Text className="font-semibold mb-2 text-lg">Add New Note</Text>

          <TextInput
            placeholder="Enter note..."
            placeholderTextColor="#888"
            value={noteText}
            onChangeText={setNoteText}
            className="border border-gray-300 rounded-xl p-3 mb-3"
          />

          {/* Status Dropdown */}
          <Dropdown
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              padding: 12,
              marginBottom: 12,
            }}
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={status}
            onChange={(item) => setStatus(item.value)}
          />

          {/* Responsible Dropdown */}
          <Dropdown
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              padding: 12,
              marginBottom: 12,
            }}
            data={users}
            labelField="label"
            valueField="value"
            placeholder="Select responsible"
            value={responsible}
            onChange={(item) => setResponsible(item.value)}
          />

          {/* Date picker */}
          <TouchableOpacity
            className="border border-gray-300 p-3 rounded-xl mb-3"
            onPress={() => setShowDatePicker(true)}
          >
            <Text>
              {targetDate ? targetDate.toDateString() : "Select target date"}
            </Text>
          </TouchableOpacity>

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

          <TouchableOpacity
            className="bg-indigo-600 p-3 rounded-xl items-center"
            onPress={addNote}
          >
            <Text className="text-white font-bold">Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [noteText, status, responsible, targetDate, showDatePicker, users]);

  const renderNote = ({ item }: { item: Note }) => {
    const statusColor =
      statusOptions.find((s) => s.value === item.status)?.color || "#000";

    return (
      <View className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold text-base">{item.text}</Text>
          <View
            className="px-2 py-1 rounded-lg"
            style={{ backgroundColor: statusColor }}
          >
            <Text className="text-white font-semibold text-xs">
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-1">
          <Text>
            Responsible:{" "}
            {users.find((u) => u.value === item.responsible)?.label || "N/A"}
          </Text>
          <Text>Target: {item.targetDate?.toDateString() || "N/A"}</Text>
        </View>

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
