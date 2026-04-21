import api from "@/lib/api";
import { Delete03Icon, NoteAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { View as MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../../context/AuthContext";

const NoteSkeleton = ({ isDark }: { isDark: boolean }) => {
  const height = useRef(
    Math.floor(Math.random() * (200 - 120 + 1)) + 120,
  ).current;

  return (
    <View className="mb-4">
      <Skeleton
        colorMode={isDark ? "dark" : "light"}
        width="100%"
        height={height}
        radius={24}
      />
    </View>
  );
};

const NotesTab = ({
  refreshing,
  onRefresh,
  searchQuery = "",
}: {
  refreshing: boolean;
  onRefresh: () => void;
  searchQuery?: string;
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    }, [fetchNotes]),
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
        position: "bottom",
        text1: "Note Deleted",
        text2: "Your note has been removed.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Delete Failed",
        text2: "Could not delete the note. Please try again.",
      });
    }
  };

  const getRandomColor = (id: string) => {
    const colors = ["#FFE7A0", "#FFC7EA", "#B7F0FF", "#FFE4D4"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredNotes = searchQuery.trim()
    ? (notes || []).filter(
        (note) =>
          note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (notes || []);

  const leftColumn = (filteredNotes || []).filter((_, index) => index % 2 === 0);
  const rightColumn = (filteredNotes || []).filter((_, index) => index % 2 !== 0);

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
        {/* <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#1A1A1A" /> */}
      </View>

      <Text
        className="text-[#414141] text-sm font-poppins mb-4"
        numberOfLines={isFocused ? undefined : 6}
      >
        {note.content}
      </Text>

      <Text className="text-[#4C4C4C] text-xs font-poppinsMedium opacity-70 mt-auto">
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

      {/* 🔹 CONTENT STATES */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B4CCC"]}
            tintColor="#5B4CCC"
          />
        }
      >
        {loading && notes.length === 0 ? (
          /* 🔹 LOADING STATE (MOTI SKELETON) */
          <View className="px-4 pt-5 pb-20">
            <View className="flex-row">
              <View className="flex-1 mr-2">
                <NoteSkeleton isDark={isDark} />
                <NoteSkeleton isDark={isDark} />
                <NoteSkeleton isDark={isDark} />
              </View>
              <View className="flex-1 ml-2">
                <NoteSkeleton isDark={isDark} />
                <NoteSkeleton isDark={isDark} />
                <NoteSkeleton isDark={isDark} />
              </View>
            </View>
          </View>
        ) : filteredNotes.length === 0 && searchQuery.trim() ? (
          /* 🔹 NO SEARCH RESULTS STATE */
          <View className="mt-20 items-center justify-center px-6">
            <MotiView
              key="no-results"
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 300 }}
            >
              <Text
                className={`mt-4 text-base font-poppins text-center ${
                  isDark ? "text-[#BBBBBB]" : "text-[#454545]"
                }`}
              >
                No notes found for{" "}
                <Text className="font-poppinsMedium text-black dark:text-white">
                  "{searchQuery}"
                </Text>
              </Text>
            </MotiView>
          </View>
        ) : notes.length === 0 ? (
          /* 🔹 EMPTY STATE (Only if NOT loading or if strictly empty after fetch) */
          <View className="mt-20 items-center justify-center">
            <MotiView
              key="empty-state"
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 300 }}
            >
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
            </MotiView>
          </View>
        ) : (
          /* 🔹 NOTES LIST */
          <MotiView
            key="notes-list"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500 }}
            className="px-4 pt-5 pb-20"
          >
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
          </MotiView>
        )}
      </ScrollView>
    </View>
  );
};

export default NotesTab;
