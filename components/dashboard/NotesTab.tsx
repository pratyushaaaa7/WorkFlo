import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

const NotesTab = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const notes = [
    {
      id: "1",
      title: "Generate 3D model renderings",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FEE4A1",
    },
    {
      id: "2",
      title: "Important Note",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FCC7E3",
    },
    {
      id: "3",
      title: "Important Note",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#B1F0F7",
    },
    {
      id: "4",
      title: "Generate 3D model renderings",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FFD6B9",
    },
    {
      id: "5",
      title: "Generate 3D model renderings",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FFD6B9",
    },
    {
      id: "6",
      title: "Important Note",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FCC7E3",
    },
    {
      id: "7",
      title: "Important Note",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#B1F0F7",
    },
    {
      id: "8",
      title: "Generate 3D model renderings",
      content:
        "Lorem ipsum dolor sit amet consectetur. Proin tincidunt nibh felis fames. Enim sapien ac euismod ornare enim. Varius sit eget venenatis mattis etiam commodo faucibus ac in. Sit aenean eget sagittis orci dignissim facilisis",
      date: "15 Dec 2026",
      color: "#FEE4A1",
    },
  ];

  // Logic to split notes into two columns for masonry effect
  const leftColumn = notes.filter((_, index) => index % 2 === 0);
  const rightColumn = notes.filter((_, index) => index % 2 !== 0);

  const NoteCard = ({ note }: { note: any }) => (
    <View
      style={{ backgroundColor: note.color }}
      className="mb-4 p-4 rounded-3xl"
    >
      <Text className="text-[#1A1A1A] text-lg font-poppinsBold mb-2 leading-tight">
        {note.title}
      </Text>
      <Text className="text-[#1A1A1A] text-[13px] font-poppinsMedium opacity-60 mb-4 leading-relaxed">
        {note.content}
      </Text>
      <Text className="text-[#1A1A1A] text-xs font-poppinsBold opacity-80">
        {note.date}
      </Text>
    </View>
  );

  return (
    <View
      style={{ backgroundColor: isDark ? "#0D0D0D" : "#F8F9FA" }}
      className="flex-1"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
        className="px-4"
      >
        <View className="flex-row">
          {/* Left Column */}
          <View className="flex-1 mr-2">
            {leftColumn.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>

          {/* Right Column */}
          <View className="flex-1 ml-2">
            {rightColumn.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/createNote")}
          className="w-16 h-16 bg-[#566FEC] rounded-full items-center justify-center shadow-lg shadow-blue-500/50"
        >
          <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotesTab;
