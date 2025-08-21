import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useILR } from "../../context/ILRContext";

const NotesSection = () => {
  const { notes, newNote, setNewNote, addNote, showRemarkInput, newRemark, setNewRemark, saveRemark } = useILR();

  return (
    <>
      {/* Remark Input */}
      {showRemarkInput && (
        <View className="p-3 bg-white rounded-xl shadow mb-6">
          <TextInput
            value={newRemark}
            onChangeText={setNewRemark}
            placeholder="Enter remark..."
            className="border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <TouchableOpacity className="bg-blue-600 py-2 rounded-lg" onPress={saveRemark}>
            <Text className="text-center text-white font-medium">Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes Section */}
      <Text className="font-semibold text-gray-800 text-base mb-2">Notes</Text>
      <View className="mb-3 flex-row items-center">
        <TextInput
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Add a note..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
        />
        <TouchableOpacity className="ml-2 bg-blue-600 px-4 py-2 rounded-lg shadow" onPress={addNote}>
          <Text className="text-white font-medium">Add</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <Text className="text-gray-500">No notes yet.</Text>
      ) : (
        notes.map((note, idx) => (
          <View key={idx} className="bg-white rounded-xl p-3 mb-2 shadow">
            <Text className="text-gray-800 text-sm">{note.text}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              By {note.createdBy?.username || "Unknown"} • {new Date(note.createdAt ?? "").toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </>
  );
};

export default NotesSection;
