import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Note } from "./../../app/runningNotes";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const COL = {
  note: 300,
  status: 120,
  responsible: 180,
  target: 140,
};

type Props = {
  notes: Note[];
  users: { label: string; value: string }[];
  onStatusChange: (id: string, status: Note["status"]) => void;
};

const NotesTable = ({ notes, users, onStatusChange }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Note["status"]>("Open");

  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    const key = formatDate(n.createdAt);
    acc[key] = acc[key] || [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <View style={{ minWidth: 740 }}>
      {Object.entries(grouped).map(([date, notes]) => (
        <View key={date}>
          <View className="bg-gray-300 px-3 py-2">
            <Text className="font-semibold">{date}</Text>
          </View>

          {notes.map((n) => (
            <View key={n.id} className="flex-row border-b">
              <View style={{ width: COL.note }} className="p-2">
                <Text>{n.text}</Text>
              </View>

              <TouchableOpacity
                style={{ width: COL.status }}
                className="p-2 items-center"
                onPress={() => {
                  setEditingId(n.id);
                  setStatus(n.status);
                }}
              >
                <Text>{n.status}</Text>
              </TouchableOpacity>

              <View style={{ width: COL.responsible }} className="p-2">
                <Text>
                  {users.find((u) => u.value === n.responsible)?.label || "N/A"}
                </Text>
              </View>

              <View style={{ width: COL.target }} className="p-2">
                <Text>
                  {n.targetDate ? formatDate(n.targetDate) : "N/A"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Status Modal */}
      <Modal transparent visible={!!editingId}>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-xl p-4">
            <TouchableOpacity
              onPress={() => {
                onStatusChange(editingId!, status);
                setEditingId(null);
              }}
            >
              <LinearGradient
                colors={["#4F46E5", "#7C3AED"]}
                className="py-3 items-center rounded-xl"
              >
                <Text className="text-white">Save Status</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NotesTable;
