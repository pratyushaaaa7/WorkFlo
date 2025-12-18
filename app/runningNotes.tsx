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

const formatDate = (date: Date) => {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
};

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
    date: 120 as const,
    note: 250 as const,
    status: 100 as const,
    responsible: 150 as const,
    target: 120 as const,
  };

  // Table column headers
  const TableColumnHeader = () => (
    <View className="flex-row border-l border-t border-gray-400 bg-gray-200">
      {[
        ["Date", COL.date],
        ["Note", COL.note],
        ["Status", COL.status],
        ["Responsible", COL.responsible],
        ["Target Date", COL.target],
      ].map(([label, width]) => (
        <View
          key={label}
          className="border-r border-b border-gray-400 px-2 py-2"
          style={{ width }}
        >
          <Text className="font-semibold text-sm">{label}</Text>
        </View>
      ))}
    </View>
  );

  const saveStatusChange = () => {
    if (!editingNoteId) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingNoteId ? { ...n, status: editingStatus } : n
      )
    );

    setStatusModalVisible(false);
    setEditingNoteId(null);
  };

  // Note row
  const renderNote = ({ item }: { item: Note }) => {
    const statusColor =
      statusOptions.find((s) => s.value === item.status)?.color || "#000";

    return (
      <View className="flex-row border-l border-gray-400">
        {/* Date */}
        <View
          className="border-r border-b border-gray-300 px-2 py-2 justify-center"
          style={{ width: COL.date }}
        >
          <Text className="text-sm">{formatDate(item.createdAt)}</Text>
        </View>

        {/* Note */}
        <View
          className="border-r border-b border-gray-300 px-2 py-2"
          style={{ width: COL.note }}
        >
          <Text className="text-sm">{item.text}</Text>
        </View>

        {/* Status */}
        <TouchableOpacity
          className="border-r border-b border-gray-300 px-2 py-2 items-center justify-center"
          style={{ width: COL.status }}
          onPress={() => {
            setEditingNoteId(item.id);
            setEditingStatus(item.status); // preselect
            setStatusModalVisible(true);
          }}
        >
          <View
            className="rounded-md px-2 py-1"
            style={{ backgroundColor: statusColor }}
          >
            <Text className="text-white font-semibold text-xs">
              {item.status}
            </Text>
          </View>
        </TouchableOpacity>

       <Modal
  transparent
  animationType="fade"
  visible={statusModalVisible}
  onRequestClose={() => setStatusModalVisible(false)}
>
  <View className="flex-1 bg-black/50 justify-center items-center px-6">
    <View className="bg-white w-full rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Gradient Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="px-4 py-3 flex-row justify-between items-center"
      >
        <Text className="text-white text-lg font-semibold">
          Change Status
        </Text>

        <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <View className="p-4">
        <Text className="text-sm text-gray-500 mb-3">
          Select the new status for this note
        </Text>

        {/* Status options */}
        {statusOptions.map((opt) => {
          const isSelected = editingStatus === opt.value;

          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setEditingStatus(opt.value)}
              className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300"
              }`}
            >
              <View className="flex-row items-center">
                {/* Color indicator */}
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: opt.color }}
                />

                <Text
                  className={`font-medium ${
                    isSelected ? "text-indigo-600" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </Text>
              </View>

              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4F46E5"
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Save button */}
        <TouchableOpacity
          className="mt-4 rounded-xl overflow-hidden"
          onPress={saveStatusChange}
        >
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            className="py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">
              Save Changes
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


        {/* Responsible */}
        <View
          className="border-r border-b border-gray-300 px-2 py-2"
          style={{ width: COL.responsible }}
        >
          <Text className="text-sm">
            {users.find((u) => u.value === item.responsible)?.label || "N/A"}
          </Text>
        </View>

        {/* Target Date */}
        <View
          className="border-r border-b border-gray-300 px-2 py-2"
          style={{ width: COL.target }}
        >
          <Text className="text-sm">
            {item.targetDate ? formatDate(item.targetDate) : "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
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

      <View className="p-3">
        <View className="bg-white p-3 rounded-2xl shadow-md">
          <Text className="font-semibold mb-2 text-base">Add New Note</Text>

          <TextInput
            placeholder="Enter note..."
            placeholderTextColor="#888"
            value={noteText}
            multiline
            onChangeText={setNoteText}
            className="border border-gray-200 rounded-xl p-2 mb-2 text-sm"
          />

          <View className="flex-row justify-between mb-2 gap-2">
            <Dropdown
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                height: 38,
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

          <Dropdown
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              height: 38,
              paddingHorizontal: 10,
            }}
            placeholderStyle={{ fontSize: 14, color: "#888" }}
            selectedTextStyle={{ fontSize: 13, color: "#111827" }}
            containerStyle={{
              borderRadius: 14,
              backgroundColor: "#fff",
              marginBottom: 8,
            }}
            activeColor="#EEF2FF"
            data={users}
            labelField="label"
            valueField="value"
            placeholder="Select responsible"
            value={responsible}
            onChange={(item) => setResponsible(item.value)}
          />

          <TouchableOpacity
            className="bg-indigo-600 mt-2 rounded-lg  items-center justify-center"
            style={{ height: 40 }}
            onPress={addNote}
          >
            <Text className="text-white font-semibold text-sm">Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal scroll for table */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 740 }}>
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<TableColumnHeader />}
            renderItem={renderNote}
            // contentContainerStyle={{ paddingBottom: 32 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RunningNotes;
