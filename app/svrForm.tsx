import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";

const SVRform = () => {
  const router = useRouter();
  const { projectName } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [saving, setSaving] = useState(false);

  // Main fields
  const [responsibility, setResponsibility] = useState("");
  const [description, setDescription] = useState("");

  // Multiple entries
  type Entry = {
    agenda: string;
    discussion: string;
    responsibility: string;
    remarks: string;
  };

  const [entries, setEntries] = useState<Entry[]>([
    { agenda: "", discussion: "", responsibility: "", remarks: "" },
  ]);

  const addEntry = () => {
    setEntries([
      ...entries,
      { agenda: "", discussion: "", responsibility: "", remarks: "" },
    ]);
  };

  const updateEntry = (index: number, key: keyof Entry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [key]: value };
    setEntries(updated);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) {
      Alert.alert("Error", "At least one entry must remain.");
      return;
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    Alert.alert("Submit", "Submit logic to be added.");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              SVR Form
            </Text>
          </TouchableOpacity>
        </View>
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
        <Text className="text-2xl py-4 font-extrabold text-gray-800 text-center">
          {projectName || ""} SVR
        </Text>

        {/* Agenda Entries */}
        {entries.map((item, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6"
          >
            <Text className="font-semibold  text-blue-600 mb-4">
              Discussion {index + 1}
            </Text>

            {/* Agenda */}
            <TextInput
              placeholder="Agenda "
              value={item.agenda}
              multiline
              onChangeText={(v) => updateEntry(index, "agenda", v)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base mb-3"
              placeholderTextColor="#999"
            />

            {/* Discussion */}
            <TextInput
              placeholder="Discussion "
              value={item.discussion}
              onChangeText={(v) => updateEntry(index, "discussion", v)}
              multiline
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base mb-3"
              placeholderTextColor="#999"
            />

            {/* Responsibility */}
            <TextInput
              placeholder="Responsibility "
              value={item.responsibility}
              multiline
              onChangeText={(v) => updateEntry(index, "responsibility", v)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base mb-3"
              placeholderTextColor="#999"
            />

            {/* Remarks */}
            <TextInput
              placeholder="Remarks (Optional)"
              value={item.remarks}
              onChangeText={(v) => updateEntry(index, "remarks", v)}
              multiline
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            {/* Delete */}
            {entries.length > 1 && (
              <Pressable onPress={() => removeEntry(index)} className="pt-5">
                <Text className="text-red-500 font-medium text-lg">
                  Delete Entry
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Entry Button */}
        <Pressable
          onPress={addEntry}
          className="bg-emerald-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-semibold text-lg">+ Add More</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          className={`py-4 rounded-2xl items-center mb-20 ${
            saving ? "bg-gray-400" : "bg-blue-700"
          }`}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Next</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default SVRform;
