import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const CreateNote = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = async () => {
    if (!title && !content) {
      Toast.show({
        type: "error",
        text1: "Empty Note",
        text2: "Please add a title or content to save.",
      });
      return;
    }

    try {
      const newNote = {
        id: Date.now().toString(),
        title: title || "Untitled",
        content: content,
        date: new Date().toISOString(),
      };

      // Get existing notes
      const existingNotesRaw = await AsyncStorage.getItem("notes");
      const existingNotes = existingNotesRaw
        ? JSON.parse(existingNotesRaw)
        : [];

      // Save updated list
      const updatedNotes = [newNote, ...existingNotes];
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));

      Toast.show({
        type: "success",
        text1: "Note Saved",
        text2: "Your note has been added to your collection.",
      });

      router.back();
    } catch (error) {
      console.error("Error saving note:", error);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: "Something went wrong while saving your note.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 pt-10 pb-4 overflow-hidden">
          <BlurView intensity={20} tint="dark" className="absolute inset-0" />
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-900/50"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-lg font-poppinsBold">
              New Note
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              className="px-5 py-2 rounded-full bg-blue-600"
            >
              <Text className="text-white font-poppinsBold text-sm">Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Editor Area */}
        <ScrollView
          className="flex-1 bg-black"
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            placeholder="Page title"
            placeholderTextColor="#4B5563"
            value={title}
            onChangeText={setTitle}
            className="text-white text-4xl font-poppinsBold mb-6"
            multiline
            selectionColor="#3B82F6"
          />

          <View className="h-[1px] bg-gray-800 w-full mb-6 opacity-50" />

          <TextInput
            placeholder="Start writing something amazing..."
            placeholderTextColor="#4B5563"
            value={content}
            onChangeText={setContent}
            className="text-white text-lg font-poppinsMedium flex-1 min-h-[400px]"
            multiline
            textAlignVertical="top"
            style={{ lineHeight: 30 }}
            selectionColor="#3B82F6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateNote;
