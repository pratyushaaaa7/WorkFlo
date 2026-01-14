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
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Delete03Icon, Tick02Icon } from "@hugeicons/core-free-icons";

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
    <View className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 pt-14 flex-row items-center justify-between overflow-hidden">
          <View className="flex-row  items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10  justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={24} color="#D2D2D2" />
            </TouchableOpacity>

            <Text className="text-white text-lg font-poppinsMedium">
              {title || "Untitled Page"}
            </Text>
          </View>
          <View className="flex-row  ">
            <HugeiconsIcon icon={Delete03Icon} size={24} color="#D2D2D2" />
            <HugeiconsIcon icon={Tick02Icon} size={24} color="#D2D2D2" />
          </View>
        </View>

        {/* Editor Area */}
        <ScrollView
          className="flex-1 bg-black pt-10 px-2"
          // contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            placeholder="Page title"
            placeholderTextColor="#BDBDBD"
            value={title}
            onChangeText={setTitle}
            className="text-white text-2xl font-poppinsMedium "
            multiline
            // selectionColor="#3B82F6"
          />

          <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#262626] mb-6 opacity-50" />

          <TextInput
            // placeholder="Start writing something amazing..."
            placeholderTextColor="#4B5563"
            value={content}
            onChangeText={setContent}
            className="text-white text-lg font-poppins flex-1 min-h-[400px]"
            multiline
            textAlignVertical="top"
            style={{ lineHeight: 30 }}
            selectionColor="#3B82F6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateNote;
