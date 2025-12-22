import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";

const statusOptions = [
  { label: "Open", value: "Open" },
  { label: "In Progress", value: "In Progress" },
  { label: "Closed", value: "Closed" },
];

type Props = {
  users: { label: string; value: string }[];
  onAddNote: (note: {
    text: string;
    status: "Open" | "In Progress" | "Closed";
    responsible: string | null;
    targetDate: Date | null;
  }) => void;
};

const CreateNoteCard = ({ users, onAddNote }: Props) => {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"Open" | "In Progress" | "Closed">("Open");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const submit = () => {
    if (!text.trim()) return alert("Note is required");

    onAddNote({
      text,
      status,
      responsible,
      targetDate,
    });

    setText("");
    setStatus("Open");
    setResponsible(null);
    setTargetDate(null);
  };

  return (
    <View className="bg-white p-4 m-3 rounded-2xl shadow-md">
      <Text className="font-semibold mb-2">Add New Note</Text>

      <TextInput
        placeholder="Enter note..."
        value={text}
        multiline
        onChangeText={setText}
        className="border rounded-xl p-2 mb-2"
      />

      <Dropdown
        data={statusOptions}
        labelField="label"
        valueField="value"
        value={status}
        placeholder="Select status"
        onChange={(item) => setStatus(item.value)}
        style={{ borderWidth: 1, borderRadius: 12, height: 38 }}
      />

      <TouchableOpacity
        className="border rounded-xl mt-2 px-3 justify-center"
        style={{ height: 38 }}
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
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setTargetDate(d);
          }}
        />
      )}

      <Dropdown
        data={users}
        labelField="label"
        valueField="value"
        placeholder="Select responsible"
        value={responsible}
        onChange={(item) => setResponsible(item.value)}
        style={{ borderWidth: 1, borderRadius: 12, height: 38, marginTop: 8 }}
      />

      <TouchableOpacity
        onPress={submit}
        className="bg-indigo-600 mt-3 rounded-xl py-3 items-center"
      >
        <Text className="text-white font-semibold">Add Note</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateNoteCard;
