import { Add01Icon, NoteAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useContext, useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import api from "@/lib/api";

const NotesTab = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const [notes, setNotes] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

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

      const notesWithColor = response.data.map((note: any) => ({
        ...note,
        color: getRandomColor(),
      }));

      setNotes(notesWithColor);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]); // make sure notes is never undefined
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  // const notes = [
  //   {
  //     id: "1",
  //     title: "Generate 3D model renderings",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FEE4A1",
  //   },
  //   {
  //     id: "2",
  //     title: "Important Note",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FCC7E3",
  //   },
  //   {
  //     id: "3",
  //     title: "Important Note",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#B1F0F7",
  //   },
  //   {
  //     id: "4",
  //     title: "Generate 3D model renderings",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FFD6B9",
  //   },
  //   {
  //     id: "5",
  //     title: "Generate 3D model renderings",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FFD6B9",
  //   },
  //   {
  //     id: "6",
  //     title: "Important Note",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FCC7E3",
  //   },
  //   {
  //     id: "7",
  //     title: "Important Note",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#B1F0F7",
  //   },
  //   {
  //     id: "8",
  //     title: "Generate 3D model renderings",
  //     content:
  //       "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
  //     date: "15 Dec 2026",
  //     color: "#FEE4A1",
  //   },
  // ];

  // Logic to split notes into two columns for masonry effect

  const leftColumn = notes.filter((_, index) => index % 2 === 0);
  const rightColumn = notes.filter((_, index) => index % 2 !== 0);

  const getRandomColor = () => {
    const colors = ["#FEE4A1", "#FCC7E3", "#B1F0F7", "#FFD6B9"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const NoteCard = ({ note }: any) => (
    <View
      style={{ backgroundColor: getRandomColor() }}
      className="mb-4 p-4 rounded-3xl"
    >
      <Text className="text-[#1A1A1A] text-lg font-poppinsBold mb-2">
        {note.title || "Untitled"}
      </Text>

      <Text className="text-[#1A1A1A] text-[13px] font-poppinsMedium opacity-60 mb-4">
        {note.content}
      </Text>

      <Text className="text-[#1A1A1A] text-xs font-poppinsBold opacity-80">
        {new Date(note.createdAt).toDateString()}
      </Text>
    </View>
  );

  return (
    <View
      style={{ backgroundColor: isDark ? "#0D0D0D" : "#F8F9FA" }}
      className="flex-1"
    >
      {/* 🔹 EMPTY STATE */}
      {notes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className={`mt-4 text-base font-poppinsMedium ${
              isDark ? "text-[BBBBBB]" : "text-[#454545]"
            }`}
          >
            You have no notes yet
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/createMyNote")}
            className="flex-row items-center mt-3"
          >
            <HugeiconsIcon icon={NoteAddIcon} size={30} color="#000000" />
            <Text className="ml-2 text-black font-poppinsSemiBold text-sm">
              Create Notes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 🔹 NOTES LIST */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
          className="px-4"
        >
          <View className="flex-row">
            <View className="flex-1 mr-2">
              {leftColumn.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>

            <View className="flex-1 ml-2">
              {rightColumn.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 🔹 FLOATING ACTION BUTTON */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/createMyNote")}
          className="w-16 h-16 bg-[#566FEC] rounded-full items-center justify-center shadow-lg shadow-blue-500/50"
        >
          <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotesTab;
