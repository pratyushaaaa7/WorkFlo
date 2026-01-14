import { Ionicons } from "@expo/vector-icons";
import { Delete03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const CreateNote = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const hasChanges = title.trim().length > 0 || content.trim().length > 0;

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      await api.post(
        "/personal-notes",
        {
          title: title || "Untitled",
          content: content,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Toast.show({
        type: "success",
        text1: "Note Saved",
        text2: "Your note has been added to your collection.",
      });

      router.replace("/dashboard");
    } catch (error) {
      console.error("Error saving note:", error);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: "Something went wrong while saving your note.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrCancel = () => {
    // If there's no content, just go back. If there is, maybe show a confirm?
    // For now, based on "other wise delete should show", clicking it should just go back without saving.
    router.back();
  };

  const showTick = isKeyboardVisible || hasChanges;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 pt-14 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={24} color="#D2D2D2" />
            </TouchableOpacity>

            <Text
              numberOfLines={1}
              className="text-white text-lg font-poppinsMedium flex-1 mr-4"
            >
              {title || "Untitled Page"}
            </Text>
          </View>

          <View className="flex-row items-center gap-4">
            {showTick ? (
              <TouchableOpacity onPress={handleSave} disabled={loading}>
                <HugeiconsIcon icon={Tick02Icon} size={24} color="#D2D2D2" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleDeleteOrCancel}>
                <HugeiconsIcon icon={Delete03Icon} size={24} color="#D2D2D2" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Editor Area */}
        <ScrollView
          className="flex-1 bg-black px-4"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 30 }}
        >
          <TextInput
            placeholder="Page title"
            placeholderTextColor="#606060"
            value={title}
            onChangeText={setTitle}
            className="text-white text-3xl font-poppinsBold mb-4"
            multiline
            style={{
              textAlignVertical: "top",
              minHeight: 50,
              paddingTop: Platform.OS === "android" ? 0 : 0,
            }}
          />

          <View className="h-[1px] bg-[#262626] mb-6" />

          <TextInput
            placeholder="Start writing..."
            placeholderTextColor="#4B5563"
            value={content}
            onChangeText={setContent}
            className="text-white text-lg font-poppins flex-1 min-h-[400px]"
            multiline
            textAlignVertical="top"
            style={{ lineHeight: 30 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateNote;
