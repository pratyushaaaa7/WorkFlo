import api from "@/lib/api";
import { NoteAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { AuthContext } from "../../context/AuthContext";

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
    <View style={{ flex: 1 }} className="bg-[#F6F8FA] dark:bg-[#0d0d0d]">
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
                <NoteCard key={note.id} note={note} />
              ))}
            </View>

            <View className="flex-1 ml-2">
              {rightColumn.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotesTab;
