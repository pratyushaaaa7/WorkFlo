import { Ionicons } from "@expo/vector-icons";
import { Delete03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const CreateNote = () => {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();

  // Note data from params (if editing)
  const noteId = params.noteId as string;
  // If title is "Untitled", treat it as empty for UX (show placeholder)
  const rawTitle = (params.title as string) || "";
  const initialTitle = rawTitle === "Untitled" ? "" : rawTitle;
  const initialContent = (params.content as string) || "";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#D2D2D2" : "#1A1A1A";

  // Strict state initialization on focus
  useFocusEffect(
    useCallback(() => {
      setTitle(initialTitle);
      setContent(initialContent);

      return () => {
        // Clear state on blur to be defensive
        setTitle("");
        setContent("");
      };
    }, [noteId, initialTitle, initialContent]),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const hasChanges =
    title.trim() !== initialTitle.trim() ||
    content.trim() !== initialContent.trim() ||
    (!noteId && (title.trim().length > 0 || content.trim().length > 0));

  // Handle back button / gesture
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        handleSave();
      } else {
        router.back();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [hasChanges, title, content, noteId, initialTitle, initialContent]);

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      if (noteId) {
        // Update
        await api.put(
          `/personal-notes/${noteId}`,
          {
            title: title.trim(),
            content: content.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        // Create

        await api.post(
          "/personal-notes",
          {
            title: title.trim(),
            content: content.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      Toast.show({
        type: "success",
        position: "bottom",
        text1: noteId ? "Note Updated" : "Note Saved",
        text2: noteId
          ? "Your changes have been saved."
          : "Your note has been added to your collection.",
      });

      // Clear local state explicitly before navigating
      setTitle("");
      setContent("");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error saving note:", error);
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Save Failed",
        text2: "Something went wrong while saving your note.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrCancel = () => {
    if (noteId) {
      setDeleteModalVisible(true);
    } else {
      router.back();
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/personal-notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        position: "bottom",
        text1: "Note Deleted",
        text2: "Your note has been removed.",
      });

      setDeleteModalVisible(false);
      // Clear state and route back
      setTitle("");
      setContent("");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error deleting note:", error);
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Delete Failed",
        text2: "Could not delete the note. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
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
            {noteId ? (
              <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
                <HugeiconsIcon
                  icon={Delete03Icon}
                  size={24}
                  color={iconColor}
                />
              </TouchableOpacity>
            ) : !showTick ? (
              <TouchableOpacity onPress={() => router.back()}>
                <HugeiconsIcon
                  icon={Delete03Icon}
                  size={24}
                  color={iconColor}
                />
              </TouchableOpacity>
            ) : null}

            {showTick && (
              <TouchableOpacity onPress={handleSave} disabled={loading}>
                <HugeiconsIcon icon={Tick02Icon} size={24} color={iconColor} />
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
            className="text-black dark:text-white text-3xl font-poppinsMedium "
            multiline
            style={{
              textAlignVertical: "top",
              minHeight: 50,
              paddingTop: Platform.OS === "android" ? 0 : 0,
            }}
          />

          <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#262626] mb-2" />

          <TextInput
            value={content}
            onChangeText={setContent}
            className="text-black dark:text-white text-lg font-poppins flex-1 min-h-[400px]"
            multiline
            textAlignVertical="top"
            style={{ lineHeight: 30 }}
            autoFocus={true}
          />
        </ScrollView>
        <DeleteConfirmationModal
          isVisible={isDeleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          loading={isDeleting}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateNote;
