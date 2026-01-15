import { Ionicons } from "@expo/vector-icons";
import { Delete03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#D2D2D2" : "#1A1A1A";

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

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        handleSave();
      } else {
        router.back();
      }
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [hasChanges, title, content]); // Dep on state for closure

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
          title: title.trim() || "Untitled",
          content: content.trim(),
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
    router.back();
  };

  const handleBackPress = () => {
    if (hasChanges) {
      handleSave();
    } else {
      router.back();
    }
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
              onPress={handleBackPress}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={24} color={iconColor} />
            </TouchableOpacity>

            <Text
              numberOfLines={1}
              className="text-black dark:text-white text-lg font-poppinsMedium flex-1 mr-4"
            >
              {title || "Untitled Page"}
            </Text>
          </View>

          <View className="flex-row items-center gap-4">
            {showTick ? (
              <TouchableOpacity onPress={handleSave} disabled={loading}>
                <HugeiconsIcon icon={Tick02Icon} size={24} color={iconColor} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleDeleteOrCancel}>
                <HugeiconsIcon
                  icon={Delete03Icon}
                  size={24}
                  color={iconColor}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Editor Area */}
        <ScrollView
          className="flex-1 dark:bg-black bg-white px-4"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 30 }}
        >
          <TextInput
            placeholder="Page Title"
            placeholderTextColor="#BDBDBD"
            value={title}
            onChangeText={setTitle}
            className="text-black dark:text-white text-3xl font-poppinsMedium mb-4"
            multiline
            style={{
              textAlignVertical: "top",
              minHeight: 50,
              paddingTop: Platform.OS === "android" ? 0 : 0,
            }}
          />

          <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#262626] mb-6" />

          <TextInput
            value={content}
            onChangeText={setContent}
            className="text-black dark:text-white text-lg font-poppins flex-1 min-h-[400px]"
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
