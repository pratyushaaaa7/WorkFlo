import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { Swipeable } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import AddNoteCard from "./../components/runningNotes/AddNoteCard"; // adjust path

//Download the excel of notes
const handleDownloadRunningNotesExcel = async (
  projectId: string,
  projectName: string,
  company: string,
  token: string,
  setDownloadingExcel: (v: boolean) => void,
) => {
  try {
    setDownloadingExcel(true); // 👈 START LOADER
    const payload = {
      projectId,
      projectName, // send to backend
      company, // send to backend
    };

    const response = await api.post(
      `/running-notes/export`,
      { projectId, projectName, company },
      { responseType: "blob", headers: { Authorization: `Bearer ${token}` } },
    );

    const fileName = `RunningNotes_${projectName}.xlsx`;

    if (Platform.OS === "web") {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      const blobToBase64 = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(reader.result?.toString().split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      const base64data = await blobToBase64(response.data);
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Running Notes",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("Excel download error:", err);
    alert("Failed to download Running Notes");
  } finally {
    setDownloadingExcel(false); // 👈 STOP LOADER
  }
};

const formatDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
};

const getNoteBgColor = (status: string) => {
  switch (status) {
    case "Open":
      return "#FEE2E2";
    case "In Progress":
      return "#FEF3C7";
    case "Closed":
      return "#D1FAE5";
    default:
      return "#FFFFFF";
  }
};

const getNoteStripColor = (status: string) => {
  switch (status) {
    case "Open":
      return "#ef4444";
    case "In Progress":
      return "#f59e0b";
    case "Closed":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
};

const statusOptions = [
  {
    value: "Open",
    label: "Open",
    color: "#EF4444",
    bg: "bg-red-500",
    border: "border-red-500",
  },
  {
    value: "In Progress",
    label: "In Progress",
    color: "#F59E0B",
    bg: "bg-amber-500",
    border: "#F59E0B",
  },
  {
    value: "Closed",
    label: "Closed",
    color: "#22C55E",
    bg: "bg-green-500",
    border: "border-green-500",
  },
];

type Note = {
  id: string;
  text: string;
  status: "Open" | "In Progress" | "Closed";
  responsible: string[];
  targetDate: Date | null;
  // createdBy: string;
  createdAt: Date;
};

const RunningNotes = () => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const { projectId, projectName, company, highlightId } =
    useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;

  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<"Open" | "In Progress" | "Closed">(
    "Open",
  );
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const sectionListRef = useRef<SectionList>(null);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(
    null,
  );

  const [responsible, setResponsible] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !projectId) return;
      try {
        const res = await api.get(`/projects/${projectId}/project-employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(
          res.data.map((u: any) => ({
            label: `${u.name} (${u.company})`,
            value: u._id,
          })),
        );
        // console.log(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUsers();
  }, [token, projectId]);

  //Fetch Notes
  const fetchNotes = async () => {
    if (!token || !projectId) return;

    try {
      const res = await api.get(`/running-notes/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedNotes = res.data.map((note: any) => ({
        id: note._id,
        text: note.text,
        status: note.status,
        responsible: Array.isArray(note.responsible)
          ? note.responsible.map((r: any) => r._id || r)
          : note.responsible
            ? [note.responsible._id || note.responsible]
            : [],
        targetDate: note.targetDate ? new Date(note.targetDate) : null,
        createdAt: new Date(note.createdAt),
      }));
      setNotes(formattedNotes);
      // console.log(formattedNotes);
    } catch (err) {
      console.log("Error fetching notes:", err);
    } finally {
      setInitialLoading(false); // 👈 only ends first load
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token, projectId]);

  const groupedNotes = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const dateKey = formatDate(note.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(note);
    return acc;
  }, {});

  // Prepare sections from groupedNotes
  const noteSections = useMemo(
    () =>
      Object.entries(groupedNotes).map(([date, notes]) => ({
        title: date,
        data: collapsedSections.has(date) ? [] : notes,
      })),
    [notes, collapsedSections],
  );

  // 🔹 SCROLL & HIGHLIGHT LOGIC
  useEffect(() => {
    if (highlightId && notes.length > 0 && noteSections.length > 0) {
      const idToFind = Array.isArray(highlightId)
        ? highlightId[0]
        : highlightId;
      setHighlightedNoteId(idToFind);

      // Find indices
      let sectionIndex = -1;
      let itemIndex = -1;

      for (let s = 0; s < noteSections.length; s++) {
        const data = noteSections[s].data;
        const idx = data.findIndex((n) => n.id === idToFind);
        if (idx !== -1) {
          sectionIndex = s;
          itemIndex = idx;
          break;
        }
      }

      if (sectionIndex !== -1 && itemIndex !== -1) {
        // Delay slightly to ensure list is rendered
        setTimeout(() => {
          sectionListRef.current?.scrollToLocation({
            sectionIndex,
            itemIndex: itemIndex + 1, // +1 for the section header
            viewOffset: 80,
            animated: true,
          });
        }, 500);

        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedNoteId(null);
        }, 3500);
      }
    }
  }, [highlightId, notes, noteSections]);

  //refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  //Adding note to the backend
  const handleAddNote = async ({
    noteText,
    status,
    responsible,
    targetDate,
  }: {
    noteText: string;
    status: string;
    responsible: string[];
    targetDate: Date | null;
  }) => {
    if (!token || !projectId) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/running-notes",
        { projectId, text: noteText, status, responsible, targetDate },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const newNote: Note = {
        id: res.data._id,
        text: res.data.text,
        status: res.data.status,
        responsible: Array.isArray(res.data.responsible)
          ? res.data.responsible
          : res.data.responsible
            ? [res.data.responsible]
            : [],
        targetDate: res.data.targetDate ? new Date(res.data.targetDate) : null,
        createdAt: new Date(res.data.createdAt),
      };

      setNotes((prev) => [newNote, ...prev]);
    } catch (err) {
      console.log("Error adding note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Edit a note
  const saveChanges = async () => {
    if (!editingNote) return;
    try {
      const res = await api.put(
        `/running-notes/${editingNote.id}`,
        {
          text: editingNote.text,
          status: editingNote.status,
          responsible: editingNote.responsible,
          targetDate: editingNote.targetDate,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                text: res.data.text,
                status: res.data.status,
                responsible: editingNote.responsible, // Use local state, not API response
                targetDate: res.data.targetDate
                  ? new Date(res.data.targetDate)
                  : null,
                createdAt: new Date(res.data.createdAt),
              }
            : n,
        ),
      );

      setEditModalVisible(false);
      setEditingNote(null);
    } catch (err) {
      console.log("Error updating note:", err);
    }
  };

  //Delete a Note
  const deleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await api.delete(`/running-notes/${noteToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      setDeleteModalVisible(false);
      setNoteToDelete(null);
    } catch (err) {
      console.log("Error deleting note:", err);
    }
  };

  // const COL = {
  //   note: 190 as const, // was 300
  //   responsible: 100 as const, // was 180
  //   target: 70 as const, // was 140
  // };

  const COL_RATIO = {
    note: 0.6,
    responsible: 0.2,
    target: 0.2,
  };

  const COL = {
    note: Math.floor(SCREEN_WIDTH * COL_RATIO.note),
    responsible: Math.floor(SCREEN_WIDTH * COL_RATIO.responsible),
    target: Math.floor(SCREEN_WIDTH * COL_RATIO.target),
  };

  // Table column headers
  const TableColumnHeader = () => (
    <View
      className="flex-row border-y "
      style={{
        backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",
        borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
      }}
    >
      {[
        ["Notes", COL.note],
        ["Assignee", COL.responsible],
        ["T Date", COL.target],
      ].map(([label, width]) => (
        <View
          key={label as string}
          className=" items-center py-1.5 border-r"
          style={{
            width: width as number,
            borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
          }}
        >
          <Text
            className="font-poppinsMedium text-[13px] upper-case"
            style={{ color: isDarkMode ? "#D2D2D2" : "#454545" }}
          >
            {label as string}
          </Text>
        </View>
      ))}
    </View>
  );

  const DateHeader = ({
    date,
    onPress,
    isCollapsed,
  }: {
    date: string;
    onPress: () => void;
    isCollapsed: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`px-3 py-2 flex-row justify-between items-center ${
        isCollapsed ? "border-b" : ""
      }`}
      style={{
        backgroundColor: isDarkMode ? "#0D0D0D" : "#F6F8FA",
        borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
      }}
    >
      <Text
        className="font-poppinsMedium text-[13px]"
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        {date}
      </Text>
      <Ionicons
        name={isCollapsed ? "chevron-up" : "chevron-down"}
        size={18}
        color={isDarkMode ? "#BBBBBB" : "#454545"}
      />
    </TouchableOpacity>
  );

  const rightActionStyle: any = {
    width: 160,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  };
  const renderRightActions = () => (
    <View style={rightActionStyle}>
      <Ionicons name="trash-outline" size={20} color="#fff" />
    </View>
  );

  // const isAddDisabled = !noteText.trim() || isSubmitting;

  const isEditDisabled = !editingNote?.text?.trim();

  // Animated Highlight Wrapper
  const AnimatedNoteRow = ({
    item,
    children,
  }: {
    item: Note;
    children: React.ReactNode;
  }) => {
    const isHighlighted = item.id === highlightedNoteId;
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isHighlighted) {
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.delay(2000),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, [isHighlighted]);

    const highlightOpacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4],
    });

    return (
      <View style={{ position: "relative" }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "#B7F0FF",
            opacity: highlightOpacity,
          }}
        />
      </View>
    );
  };

  // Note row
  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderRightActions={renderRightActions}
        overshootRight={true}
        rightThreshold={120} // must fully overshoot
        onSwipeableWillOpen={() => {
          // close FIRST → avoids visual stop
          swipeableRefs.current.get(item.id)?.close();

          // open modal immediately
          setNoteToDelete(item);
          setDeleteModalVisible(true);
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setEditingNote(item);
            setEditModalVisible(true);
          }}
        >
          <AnimatedNoteRow item={item}>
            <View className="flex-row border-b border-black/10">
              {/* Note with Left Strip */}
              <View
                style={{
                  width: COL.note,
                  backgroundColor: getNoteBgColor(item.status),
                  flexDirection: "row",
                  minHeight: 50,
                }}
              >
                <View className="flex-1 p-2">
                  <Text className="text-sm text-black leading-tight">
                    {item.text}
                  </Text>
                </View>
              </View>

              {/* Responsible (Assignee) */}
              <View
                className="items-center justify-center border-r border-black/5"
                style={{
                  width: COL.responsible,
                  backgroundColor: isDarkMode ? "#111" : "#F8FAFC",
                }}
              >
                {item.responsible &&
                Array.isArray(item.responsible) &&
                item.responsible.length > 0 ? (
                  <View className="flex-row items-center -space-x-2">
                    {item.responsible.map((respId, index) => (
                      <GlobalAvatar
                        key={`${item.id}-${respId}-${index}`}
                        name={
                          users.find((u) => u.value === respId)?.label || "N/A"
                        }
                        size={22}
                        fontSize={8}
                      />
                    ))}
                  </View>
                ) : (
                  <Text
                    className="text-xs"
                    style={{ color: isDarkMode ? "#666" : "#94A3B8" }}
                  >
                    N/A
                  </Text>
                )}
              </View>

              {/* T Date */}
              <View
                className="items-center justify-center"
                style={{
                  width: COL.target,
                  backgroundColor: isDarkMode ? "#111" : "#F8FAFC",
                }}
              >
                <Text
                  className="text-xs"
                  style={{ color: isDarkMode ? "#444" : "#94A3B8" }}
                >
                  {item.targetDate ? formatDate(item.targetDate) : "N/A"}
                </Text>
              </View>
            </View>
          </AnimatedNoteRow>
        </TouchableOpacity>
      </Swipeable>
    ),
    [users, swipeableRefs, COL, highlightedNoteId],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#FBFCFD" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        className="pt-14 pb-2 px-4 flex-row items-center"
        style={{ backgroundColor: isDarkMode ? "#000" : "#FBFCFD" }}
      >
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`,
            )
          }
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            className="text-lg font-dmSemiBold ml-1"
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            Running Notes
          </Text>
        </TouchableOpacity>
        <View className="flex-1" />
        <TouchableOpacity
          disabled={downloadingExcel}
          onPress={() =>
            handleDownloadRunningNotesExcel(
              projectId as string,
              projectName as string,
              company as string,
              token as string,
              setDownloadingExcel,
            )
          }
          className="p-2"
        >
          {downloadingExcel ? (
            <ActivityIndicator
              size="small"
              color={isDarkMode ? "#fff" : "#000"}
            />
          ) : (
            <Ionicons
              name="download-outline"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* <AddNoteCard/
        users={users}
        onAdd={async ({ noteText, status, responsible, targetDate }) => {
          if (!token || !projectId) return;

          setIsSubmitting(true); // optional: maintain same loading state

          try {
            const res = await api.post(
              "/running-notes",
              { projectId, text: noteText, status, responsible, targetDate },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const newNote: Note = {
              id: res.data._id,
              text: res.data.text,
              status: res.data.status,
              responsible: Array.isArray(res.data.responsible)
                ? res.data.responsible
                : res.data.responsible
                  ? [res.data.responsible]
                  : [],
              targetDate: res.data.targetDate
                ? new Date(res.data.targetDate)
                : null,
              createdAt: new Date(res.data.createdAt),
            };

            setNotes((prev) => [newNote, ...prev]);
          } catch (err) {
            console.log("Error adding note:", err);
          } finally {
            setIsSubmitting(false);
          }
        }}
      /> */}

      {/* Fixed Table Header */}
      {/* <View style={{ backgroundColor: "#E5E7EB" }}>
        <TableColumnHeader />
      </View> */}

      {/* CONTENT AREA */}
      {/* {initialLoading ? (
        //  FIRST LOAD LOADER
        <View className="flex-1 justify-center items-center bg-[#F1F5F9] py-20">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-gray-500 text-sm">
            Loading running notes...
          </Text>
        </View>
      ) : notes.length === 0 ? (
        //  EMPTY STATE (after load)
        <View className="flex-1 justify-center items-center pt-10 py-20">
          <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
          <Text className="text-gray-400 mt-4 text-center text-base">
            No running notes yet.{"\n"}Add a note to get started.
          </Text>
        </View>
      ) : ( */}
      {/* // DATA STATE */}
      <AddNoteCard users={users} onAdd={handleAddNote} />
      <View style={{ backgroundColor: "#E5E7EB" }}>
        <TableColumnHeader />
      </View>

      <SectionList
        ref={sectionListRef}
        style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}
        contentContainerStyle={{
          backgroundColor: isDarkMode ? "#000" : "#fff",
          paddingBottom: Platform.OS === "android" ? 24 : 0,
        }}
        sections={noteSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderNote({ item })}
        renderSectionHeader={({ section: { title } }) => (
          <DateHeader
            date={title}
            onPress={() => toggleSection(title)}
            isCollapsed={collapsedSections.has(title)}
          />
        )}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7C3AED"]}
            tintColor="#7C3AED"
            progressBackgroundColor={isDarkMode ? "#222" : "#fff"}
          />
        }
        // contentContainerStyle={{ paddingBottom: 40 }}
        /* LOADING + EMPTY handled here */
        ListEmptyComponent={
          initialLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text className="mt-3 text-gray-400 text-sm">
                Loading running notes...
              </Text>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="document-text-outline" size={50} color="#444" />
              <Text className="text-gray-500 mt-4 text-center text-base">
                No running notes yet.{"\n"}Add a note to get started.
              </Text>
            </View>
          )
        }
      />
      {/* )} */}

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full p-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Delete Note
            </Text>

            <Text className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-slate-100"
                onPress={() => {
                  setDeleteModalVisible(false);
                  setNoteToDelete(null);
                }}
              >
                <Text className="text-slate-700 text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-red-600"
                onPress={deleteNote}
              >
                <Text className="text-white text-sm font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "height" : undefined}
        >
          <View className="flex-1 bg-black/40 justify-center items-center px-4">
            {/* Modal Card */}
            <View className="bg-white rounded-3xl w-full max-h-[85%] shadow-2xl">
              {/* 🔑 SINGLE SCROLLVIEW */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
              >
                {/* Header */}
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Note
                </Text>

                {/* NOTE */}
                <Text className="text-xs font-semibold text-gray-500 mb-1">
                  NOTE
                </Text>

                <TextInput
                  value={editingNote?.text}
                  multiline
                  scrollEnabled={false}
                  placeholder="Edit note..."
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(text) =>
                    setEditingNote((prev) => prev && { ...prev, text })
                  }
                  className="border border-gray-200 rounded-2xl p-3 mb-4 text-sm bg-slate-50"
                />

                {/* STATUS */}
                <Text className="text-xs font-semibold text-gray-500 mb-2">
                  STATUS
                </Text>

                <View className="flex-row flex-wrap gap-2 mb-4">
                  {statusOptions.map((s) => {
                    const active = editingNote?.status === s.value;

                    return (
                      <TouchableOpacity
                        key={s.value}
                        onPress={() =>
                          setEditingNote(
                            (prev) =>
                              prev && {
                                ...prev,
                                status: s.value as Note["status"],
                              },
                          )
                        }
                        className={`flex-row items-center gap-2 px-3 py-3 rounded-full border ${
                          active
                            ? `${s.bg} ${s.border}`
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: active ? "#fff" : s.color,
                          }}
                        />

                        <Text
                          className={`text-xs font-medium ${
                            active ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* DETAILS */}
                <Text className="text-xs font-semibold text-gray-500 mb-2">
                  DETAILS
                </Text>

                {/* Responsible */}
                <View className="mb-3">
                  <MultiSelect
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 14,
                      height: 38,
                      paddingHorizontal: 12,
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Select responsible"
                    placeholderStyle={{ fontSize: 13, color: "#9CA3AF" }}
                    selectedTextStyle={{ fontSize: 13, color: "#111827" }}
                    containerStyle={{
                      borderRadius: 14,
                      backgroundColor: "#fff",
                      borderColor: "#E5E7EB",
                    }}
                    itemTextStyle={{ color: "#111827" }}
                    selectedStyle={{
                      borderRadius: 12,
                      backgroundColor: "#E2E8F0",
                      borderWidth: 0,
                    }}
                    data={users}
                    labelField="label"
                    valueField="value"
                    value={editingNote?.responsible || []}
                    onChange={(item) =>
                      setEditingNote(
                        (prev) => prev && { ...prev, responsible: item },
                      )
                    }
                    search
                    searchPlaceholder="Search..."
                  />
                </View>

                {/* Target Date */}
                <TouchableOpacity
                  className="flex-row items-center gap-2 border border-gray-200 rounded-2xl px-3 py-2.5 mb-4 bg-slate-50"
                  onPress={() => setShowEditDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-700">
                    {editingNote?.targetDate
                      ? editingNote.targetDate.toDateString()
                      : "Select target date"}
                  </Text>
                </TouchableOpacity>

                <DateTimePickerModal
                  isVisible={showEditDatePicker}
                  mode="date"
                  date={editingNote?.targetDate || new Date()}
                  onConfirm={(date) => {
                    setShowEditDatePicker(false);
                    setEditingNote(
                      (prev) => prev && { ...prev, targetDate: date },
                    );
                  }}
                  onCancel={() => setShowEditDatePicker(false)}
                />

                {/* ACTIONS — SCROLLABLE */}
                <View className="flex-row justify-end gap-3 mt-2">
                  <TouchableOpacity
                    className="px-4 py-2 rounded-xl bg-slate-100"
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingNote(null);
                    }}
                  >
                    <Text className="text-slate-700 font-medium">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="px-5 py-2 rounded-xl"
                    style={{
                      backgroundColor: isEditDisabled ? "#A5B4FC" : "#4F46E5",
                    }}
                    disabled={isEditDisabled}
                    onPress={saveChanges}
                  >
                    <Text
                      className="font-semibold"
                      style={{
                        color: isEditDisabled ? "#E0E7FF" : "#FFFFFF",
                      }}
                    >
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default RunningNotes;
