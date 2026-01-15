import api from "@/lib/api";
import {
  Delete03Icon,
  MoreHorizontalIcon,
  NoteAddIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../../context/AuthContext";

const NotesTab = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  // Store refs to measure NoteCards
  const noteRefs = useRef<{ [key: string]: View | null }>({});

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/personal-notes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!Array.isArray(response.data)) {
        console.warn("Unexpected response from /notes:", response.data);
        setNotes([]);
        return;
      }

      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const handleLongPress = (note: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = noteRefs.current[note._id];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setSelectedNote({ ...note, layout: { x, y, width, height } });
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/personal-notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      setSelectedNote(null);
      Toast.show({
        type: "success",
        text1: "Note Deleted",
        text2: "Your note has been removed.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: "Could not delete the note. Please try again.",
      });
    }
  };

  const getRandomColor = (id: string) => {
    const colors = ["#FEE4A1", "#FCC7E3", "#B1F0F7", "#FFD6B9"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const leftColumn = notes.filter((_, index) => index % 2 === 0);
  const rightColumn = notes.filter((_, index) => index % 2 !== 0);

  const NoteCard = ({
    note,
    isFocused = false,
  }: {
    note: any;
    isFocused?: boolean;
  }) => (
    <View
      style={{
        backgroundColor: getRandomColor(note._id || note.id),
      }}
      className={`p-4 rounded-3xl ${isFocused ? "shadow-2xl" : "mb-4"}`}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="text-[#000000] text-lg font-poppinsMedium flex-1 mr-2">
          {note.title || "Untitled"}
        </Text>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#1A1A1A" />
      </View>

      <Text
        className="text-[#414141] text-sm font-poppins mb-4"
        numberOfLines={isFocused ? undefined : 6}
      >
        {note.content}
      </Text>

      <Text className="text-[#1A1A1A] text-xs font-poppinsBold opacity-70 mt-auto">
        {new Date(note.createdAt).toDateString()}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }} className="bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* Selection Modal */}
      <Modal
        visible={!!selectedNote}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNote(null)}
      >
        <View className="flex-1">
          <Pressable style={{ flex: 1 }} onPress={() => setSelectedNote(null)}>
            <BlurView
              blurType={isDark ? "dark" : "light"}
              blurAmount={2}
              reducedTransparencyFallbackColor={isDark ? "black" : "white"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
            />
          </Pressable>

          {/* Render Focused Note & Delete Button Absolutely */}
          {selectedNote && selectedNote.layout && (
            <View
              style={{
                position: "absolute",
                top: selectedNote.layout.y,
                left: selectedNote.layout.x,
                width: selectedNote.layout.width,
              }}
            >
              {/* Focused Note */}
              <NoteCard note={selectedNote} isFocused={true} />

              {/* Delete Button - Positioned Below */}
              <TouchableOpacity
                onPress={() => handleDeleteNote(selectedNote._id)}
                activeOpacity={0.9}
                className="mt-2 flex-row items-center justify-center bg-white dark:bg-[#0D0D0D] px-4 py-4 rounded-2xl  border border-[#E0E5EB] dark:border-[#262626]"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 5,
                  alignSelf: "center",
                  width: "100%",
                }}
              >
                <HugeiconsIcon icon={Delete03Icon} size={22} color="#DF5B5B" />
                <Text className="ml-3 text-[#DF5B5B] font-poppinsMedium text-base">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 🔹 EMPTY STATE */}
      {notes.length === 0 ? (
        <View className=" mt-20 items-center justify-center ">
          <Text
            className={`mt-4 text-base font-poppins ${
              isDark ? "text-[#BBBBBB]" : "text-[#454545]"
            }`}
          >
            You have no notes yet
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/createMyNote")}
            className="flex-row items-center mt-3 justify-center"
          >
            <HugeiconsIcon
              icon={NoteAddIcon}
              size={20}
              color={isDark ? "#FFFFFF" : "#000000"}
            />
            <Text className="ml-2 text-black dark:text-[#f5f5f5] text-lg font-poppinsMedium">
              Create Notes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 🔹 NOTES LIST */
        <View className="px-4 pt-5 pb-20">
          <View className="flex-row">
            <View className="flex-1 mr-2">
              {leftColumn.map((note) => (
                <TouchableOpacity
                  key={note._id}
                  ref={(el) => {
                    noteRefs.current[note._id] = el;
                  }}
                  activeOpacity={0.9}
                  onPress={() => {
                    // Navigate to Edit Mode
                    router.push({
                      pathname: "/createMyNote",
                      params: {
                        noteId: note._id,
                        title: note.title,
                        content: note.content,
                      },
                    });
                  }}
                  onLongPress={() => handleLongPress(note)}
                  delayLongPress={300}
                >
                  <NoteCard note={note} />
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-1 ml-2">
              {rightColumn.map((note) => (
                <TouchableOpacity
                  key={note._id}
                  ref={(el) => {
                    noteRefs.current[note._id] = el;
                  }}
                  activeOpacity={0.9}
                  onPress={() => {
                    // Navigate to Edit Mode
                    router.push({
                      pathname: "/createMyNote",
                      params: {
                        noteId: note._id,
                        title: note.title,
                        content: note.content,
                      },
                    });
                  }}
                  onLongPress={() => handleLongPress(note)}
                  delayLongPress={300}
                >
                  <NoteCard note={note} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotesTab;
