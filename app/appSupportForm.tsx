import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const CreateSupport = () => {
  const router = useRouter();
  const token = useContext(AuthContext);

  const [user, setUser] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [relatedPage, setRelatedPage] = useState("");
  const [message, setMessage] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const typeOptions = ["Issue", "Suggestion", "Feedback"];

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUser(
          decoded.fullName || decoded.name || decoded.username || "Unknown User"
        );
      }
      const today = new Date().toLocaleDateString("en-GB");
      setDate(today);
    };
    loadUser();
  }, []);

  const handleSubmit = () => {
    if (!type || !message.trim() || !relatedPage.trim()) {
      Alert.alert(
        "Missing Info",
        "Please fill all required fields before submitting."
      );
      return;
    }

    const formData = {
      raisedBy: user,
      date,
      type,
      relatedPage,
      message,
      extraNotes,
    };

    console.log("App Support Submitted:", formData);

    Alert.alert(
      "Thank You!",
      "Your feedback has been submitted successfully.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 "
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              App Support
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Form Card */}
      <View className="bg-white p-3 mx-2 my-3 rounded-xl shadow-sm border border-gray-100">
        {/* Raised By */}
        <Text className="text-gray-600 mb-1">Raised By</Text>
        <Text className="text-lg font-medium text-gray-900 mb-3">{user}</Text>

        {/* Date */}
        <Text className="text-gray-600 mb-1">Date</Text>
        <Text className="text-lg font-medium text-gray-900 mb-3">{date}</Text>

        {/* Type Selector */}
        <Text className="text-gray-600 mb-2">Select Type</Text>
        <View className="flex-row justify-between mb-4">
          {typeOptions.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={{
                backgroundColor: type === t ? "#4F46E5" : "#E5E7EB",
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: type === t ? "white" : "#374151",
                  fontWeight: "600",
                }}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Related Page */}
        <Text className="text-gray-600 mb-2">Related Page / Section</Text>
        <TextInput
          placeholder="e.g. Login Screen, ILR Form, Project List..."
          placeholderTextColor="#999"
          value={relatedPage}
          onChangeText={setRelatedPage}
          className="border border-gray-300 rounded-xl p-3 mb-4 bg-gray-50 text-gray-900"
        />

        {/* Message */}
        <Text className="text-gray-600 mb-2">
          Describe your {type || "issue"}
        </Text>
        <TextInput
          multiline
          textAlignVertical="top"
          placeholder="Write your description here..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          className="border border-gray-300 rounded-xl p-3 h-40 bg-gray-50 text-gray-900"
        />

        {/* Additional Notes */}
        <Text className="text-gray-600 mb-2 mt-4">
          Additional Notes (Optional)
        </Text>
        <TextInput
          multiline
          textAlignVertical="top"
          placeholder="Any extra details that might help the team..."
          placeholderTextColor="#999"
          value={extraNotes}
          onChangeText={setExtraNotes}
          className="border border-gray-300 rounded-xl p-3 h-24 bg-gray-50 text-gray-900"
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="mt-6 rounded-xl overflow-hidden"
        >
          <LinearGradient
            colors={["#4F46E5", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">
              Submit Feedback
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateSupport;
