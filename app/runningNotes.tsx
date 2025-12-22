import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "../context/AuthContext";
import { Swipeable } from "react-native-gesture-handler";


const formatDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
};

const getNoteBgColor = (status: string) => {
  switch (status) {
    case "Open":
      return "#FEF2F2"; // red-50
    case "In Progress":
      return "#FFFBEB"; // amber-50
    case "Closed":
      return "#ECFDF5"; // green-50
    default:
      return "#FFFFFF";
  }
};

const renderRightActions = (item: Note) => (
  <View className="flex-row h-full">
    {/* Edit */}
    <TouchableOpacity
      className="bg-indigo-600 w-16 items-center justify-center"
      onPress={() => startEdit(item)}
    >
      <Ionicons name="create-outline" size={18} color="#fff" />
      <Text className="text-white text-[10px]">Edit</Text>
    </TouchableOpacity>

    {/* Status */}
    <TouchableOpacity
      className="bg-amber-500 w-20 items-center justify-center"
      onPress={() => openStatusModal(item)}
    >
      <Ionicons name="sync-outline" size={18} color="#fff" />
      <Text className="text-white text-[10px]">Status</Text>
    </TouchableOpacity>
  </View>
);


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
  { label: "Open", value: "Open", color: "#EF4444" },
  { label: "In Progress", value: "In Progress", color: "#F59E0B" },
  { label: "Closed", value: "Closed", color: "#10B981" },
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
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<
    "Open" | "In Progress" | "Closed"
  >("Open");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !projectId) return;
      try {
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(
          res.data.map((u: any) => ({
            label: `${u.individualName} (${u.firmName})`,
            value: u._id,
          }))
        );
      } catch (err) {
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

  const COL = {
    note: 190 as const, // was 300
    responsible: 100 as const, // was 180
    target: 70 as const, // was 140
  };

  // Table column headers
  const TableColumnHeader = () => (
    <View className="flex-row border-l border-t border-slate-300 bg-slate-100">
      {[
        ["Note", COL.note],
        ["Responsible", COL.responsible],
        ["Target Date", COL.target],
      ].map(([label, width]) => (
        <View
          key={label}
          className="border-r border-b border-gray-400 px-1 py-1"
          style={{ width }}
        >
          <Text className="font-semibold text-xs text-slate-700">{label}</Text>
        </View>
      ))}
    </View>
  );

  const groupedNotes = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const dateKey = formatDate(note.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(note);
    return acc;
  }, {});

  const DateHeader = ({ date }: { date: string }) => (
   <View className="bg-indigo-100 px-2 py-2 border-l border-r border-indigo-200">

     <Text className="font-semibold text-xs text-indigo-800">
{date}</Text>
    </View>
  );

  // Note row
  const renderNote = ({ item }: { item: Note }) => {
    return (
      <View className="flex-row border-l border-slate-400">
        {/* Note */}
        <View
          className="border-r border-b border-gray-300 px-2 py-1"
          style={{
            width: COL.note,
            backgroundColor: getNoteBgColor(item.status),
          }}
        >
          <Text className="text-xs text-gray-800">{item.text}</Text>
        </View>

        {/* Responsible */}
        <View
          className="border-r border-b border-gray-300 px-1 py-1"
          style={{ width: COL.responsible }}
        >
          <Text className="text-xs" numberOfLines={2} ellipsizeMode="tail">
            {users.find((u) => u.value === item.responsible)?.label || "N/A"}
          </Text>
        </View>

        {/* Target Date */}
        <View
          className="border-r border-b border-gray-300 px-1 py-1"
          style={{ width: COL.target }}
        >
          <Text className="text-xs">
            {item.targetDate ? formatDate(item.targetDate) : "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient colors={["#4F46E5", "#6366F1"]}>
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

      <View className="p-2">
        <View className="bg-white px-2 py-2 rounded-2xl shadow-md">
          <Text className="font-semibold px-1 mb-1 text-base">
            Add New Note
          </Text>

          <TextInput
            placeholder="Enter note..."
            placeholderTextColor="#888"
            value={noteText}
            multiline
            onChangeText={setNoteText}
            className="border border-gray-200 rounded-xl p-2 mb-1 text-sm"
          />

          <View className="flex-row justify-between mb-1 gap-2">
            <Dropdown
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                height: 34,
                paddingHorizontal: 10,
              }}
              placeholderStyle={{ fontSize: 14, color: "#888" }}
              selectedTextStyle={{ fontSize: 13, color: "#111827" }}
              containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
              activeColor="#EEF2FF"
              data={statusOptions}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={status}
              onChange={(item) => setStatus(item.value)}
            />
            <TouchableOpacity
              className="border border-gray-200 rounded-xl flex-1 justify-center px-3"
              style={{ height: 34 }}
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

          <View className="flex-row items-center gap-2">
            {/* Responsible Dropdown */}
            <View style={{ flex: 1 }}>
              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  height: 34,
                  paddingHorizontal: 10,
                }}
                placeholderStyle={{ fontSize: 13, color: "#888" }}
                selectedTextStyle={{ fontSize: 13, color: "#111827" }}
                containerStyle={{
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  marginBottom: 0,
                }}
                activeColor="#EEF2FF"
                data={users}
                labelField="label"
                valueField="value"
                placeholder="Responsible"
                value={responsible}
                onChange={(item) => setResponsible(item.value)}
              />
            </View>

            {/* Add Note Button */}
            <TouchableOpacity
              className="bg-indigo-600 rounded-lg items-center justify-center"
              style={{ height: 34, width: 90 }}
              onPress={addNote}
            >
              <Text className="text-white font-semibold text-xs">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fixed Table Header */}
      <View style={{ backgroundColor: "#E5E7EB" }}>
        <TableColumnHeader />
      </View>

      <ScrollView>
        <View>
          {Object.entries(groupedNotes).map(([date, notes]) => (
            <View key={date}>
              <DateHeader date={date} />

              {notes.map((note) => (
                <View key={note.id}>{renderNote({ item: note })}</View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default RunningNotes;
