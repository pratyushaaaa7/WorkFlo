import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar02Icon,
  Cancel01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import Modal from "react-native-modal";

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
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, // Added Pressable
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
      return "#FFEBEB";
    case "In Progress":
      return "#FEF3C7";
    case "Closed":
      return "#D1FAE5";
    default:
      return "#DDE2FB";
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
  responsible: (string | { _id?: any; name?: string; fullName?: string })[];
  targetDate: Date | null;
  // createdBy: string;
  createdAt: Date;
};

// Helper function to extract string ID from various formats
const extractStringId = (item: any): string => {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return String(item);

  let id = item._id || item;
  // Handle nested ObjectId structures
  while (id && typeof id === "object") {
    id = id._id || id.toString?.() || String(id);
  }
  return String(id);
};

// Helper to normalize responsible array to string IDs
const normalizeResponsible = (responsible: any[]): string[] => {
  const ids = responsible.map(extractStringId);
  return Array.from(new Set(ids)); // Remove duplicates
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

  // Pagination states
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Memoized user lookup map for O(1) access
  const usersMap = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    users.forEach((user) => map.set(user.value, user));
    return map;
  }, [users]);

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
  const fetchNotes = async (cursor?: string | null) => {
    if (!token || !projectId) return;

    const isInitial = !cursor;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const url = cursor
        ? `/running-notes/project/${projectId}?limit=20&cursor=${cursor}`
        : `/running-notes/project/${projectId}?limit=20`;

      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both new paginated response and old array response (for backward compatibility)
      const data = res.data.notes ? res.data.notes : res.data;
      const pagination = res.data.pagination || {};

      const formattedNotes = data.map((note: any) => ({
        id: note._id,
        text: note.text,
        status: note.status,
        responsible:
          Array.isArray(note.responsibility) && note.responsibility.length > 0
            ? note.responsibility
            : Array.isArray(note.responsible)
              ? note.responsible
              : note.responsible
                ? [note.responsible]
                : [],
        targetDate: note.targetDate ? new Date(note.targetDate) : null,
        createdAt: new Date(note.createdAt),
      }));

      if (isInitial) {
        setNotes(formattedNotes);
      } else {
        // Prevent duplicate notes if any
        setNotes((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const uniqueNewNotes = formattedNotes.filter(
            (n: Note) => !existingIds.has(n.id),
          );
          return [...prev, ...uniqueNewNotes];
        });
      }

      setNextCursor(pagination.nextCursor || null);
      setHasMore(pagination.hasMore ?? false);
    } catch (err) {
      console.log("Error fetching notes:", err);
    } finally {
      setInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && nextCursor) {
      fetchNotes(nextCursor);
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
    setNextCursor(null);
    setHasMore(true);
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
        responsible:
          Array.isArray(res.data.responsibility) &&
          res.data.responsibility.length > 0
            ? res.data.responsibility
            : Array.isArray(res.data.responsible)
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
          projectId,
          text: editingNote.text,
          status: editingNote.status,
          responsible: editingNote.responsible || [],
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
                responsible:
                  Array.isArray(res.data.responsibility) &&
                  res.data.responsibility.length > 0
                    ? res.data.responsibility
                    : Array.isArray(res.data.responsible)
                      ? res.data.responsible
                      : res.data.responsible
                        ? [res.data.responsible]
                        : [],
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
    note: 0.65,
    responsible: 0.15,
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
        ["Resp", COL.responsible],
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
      className={isCollapsed ? "border-b" : ""}
      style={{
        borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
      }}
    >
      <View
        className="px-3 py-2 flex-row justify-between items-center"
        style={{
          backgroundColor: isDarkMode ? "#0D0D0D" : "#F6F8FA",
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
      </View>
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
            setEditingNote({
              ...item,
              responsible: normalizeResponsible(item.responsible) as any,
            });
            setEditModalVisible(true);
          }}
        >
          <View>
            <AnimatedNoteRow item={item}>
              <View className="flex-row border-b dark:border-[#2B2B2B] border-[#E0E5EB]">
                {/* Note with Left Strip */}
                <View
                  style={{
                    width: COL.note,
                    backgroundColor: getNoteBgColor(item.status),
                    flexDirection: "row",
                    minHeight: 42,
                  }}
                >
                  <View className="flex-1 p-2">
                    <Text className="text-[12px] text-black font-poppins leading-tight">
                      {item.text}
                    </Text>
                  </View>
                </View>

                {/* Responsible (Assignee) */}
                <View
                  className="items-center justify-center border-r dark:border-[#2B2B2B] border-[#E0E5EB]"
                  style={{
                    width: COL.responsible,
                    backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                  }}
                >
                  {item.responsible &&
                  Array.isArray(item.responsible) &&
                  item.responsible.length > 0 ? (
                    <View className="flex-col items-center gap-1">
                      {item.responsible.map((resp, index) => {
                        // Handle different data formats:
                        // 1. responsibility: {_id: {...}, name: "..."}
                        // 2. populated responsible: {_id: "...", fullName: "..."}
                        // 3. plain ID string
                        const getName = () => {
                          if (typeof resp === "object" && resp !== null) {
                            // Check for name field (responsibility format)
                            if (resp.name) return resp.name;
                            // Check for fullName field (populated responsible)
                            if (resp.fullName) return resp.fullName;
                            // Try to extract ID and lookup
                            const id = extractStringId(resp);
                            return usersMap.get(id)?.label || "N/A";
                          }
                          // Plain ID string - lookup in users
                          return usersMap.get(resp)?.label || "N/A";
                        };

                        return (
                          <GlobalAvatar
                            key={`${item.id}-${index}`}
                            name={getName()}
                            size={28}
                            fontSize={12}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <Text
                      className="text-xs font-poppins"
                      style={{ color: isDarkMode ? "#FFF" : "#000" }}
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
                    backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                  }}
                >
                  <Text
                    className="text-xs font-poppins"
                    style={{ color: isDarkMode ? "#FFF" : "#000" }}
                  >
                    {item.targetDate ? formatDate(item.targetDate) : "N/A"}
                  </Text>
                </View>
              </View>
            </AnimatedNoteRow>
          </View>
        </TouchableOpacity>
      </Swipeable>
    ),
    [users, swipeableRefs, COL, highlightedNoteId],
  );

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#FBFCFD" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
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
            >
              <View className="flex-row items-center">
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
              </View>
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
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#7C3AED" />
                </View>
              ) : null
            }
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
                  <Ionicons
                    name="document-text-outline"
                    size={50}
                    color="#444"
                  />
                  <Text className="text-gray-500 mt-4 text-center text-base">
                    No running notes yet.{"\n"}Add a note to get started.
                  </Text>
                </View>
              )
            }
          />

          {/* DELETE MODAL */}
          <Modal
            isVisible={deleteModalVisible}
            onBackdropPress={() => setDeleteModalVisible(false)}
            onSwipeComplete={() => setDeleteModalVisible(false)}
            swipeDirection="down"
            animationIn="zoomIn"
            animationOut="zoomOut"
            backdropOpacity={0.4}
          >
            <View className="bg-white rounded-2xl w-full p-6 shadow-xl">
              <Text className="text-xl font-poppinsBold text-gray-900 mb-2">
                Delete Note
              </Text>

              <Text className="text-[15px] font-poppins text-gray-600 mb-6">
                Are you sure you want to delete this note? This action cannot be
                undone.
              </Text>

              <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  className="px-6 py-3 rounded-xl bg-slate-100"
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setNoteToDelete(null);
                  }}
                >
                  <Text className="text-slate-700 text-[15px] font-poppinsSemiBold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="px-6 py-3 rounded-xl bg-red-600"
                  onPress={deleteNote}
                >
                  <Text className="text-white text-[15px] font-poppinsBold">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>

      {/* EDIT MODAL */}
      <Modal
        isVisible={editModalVisible}
        onBackdropPress={() => {
          setEditModalVisible(false);
          setEditingNote(null);
        }}
        onSwipeComplete={() => {
          setEditModalVisible(false);
          setEditingNote(null);
        }}
        swipeDirection="down"
        // swipeThreshold={100}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        style={{ margin: 0, justifyContent: "flex-end" }}
        propagateSwipe={true}
        avoidKeyboard={true}
      >
        <View
          className="rounded-t-[40px] w-full max-h-[95%] shadow-2xl"
          style={{
            backgroundColor: isDarkMode ? "#1A1A1A" : "#FBFCFD",
          }}
        >
          {/* Handle Bar */}
          <View className="items-center pt-4 pb-2">
            <View
              className="w-[48px] h-[2px] rounded-full"
              style={{
                backgroundColor: isDarkMode ? "#FFFFFF" : "#000000",
                // opacity: isDarkMode ? 1 : 0.8,
              }}
            />
          </View>

          {/* Header */}
          <View className="px-6 py-3 items-center">
            <Text
              className="text-[18px] font-dmSemiBold"
              style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
            >
              Edit Note
            </Text>
          </View>

          <View
            className="h-[1px] w-full"
            style={{
              backgroundColor: isDarkMode ? "#413E47" : "#E0E5EB",
            }}
          />

          {/* SINGLE SCROLLVIEW */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* NOTE CONTENT */}
            <View className="px-6 py-6">
              <TextInput
                value={editingNote?.text}
                multiline
                scrollEnabled={false}
                placeholder="Enter your note here..."
                placeholderTextColor={isDarkMode ? "#666" : "#94A3B8"}
                onChangeText={(text) =>
                  setEditingNote((prev) => prev && { ...prev, text })
                }
                className="text-[16px] font-poppins "
                style={{
                  color: isDarkMode ? "#D1D5DB" : "#4B5563",
                  lineHeight: 24,
                }}
              />
            </View>

            <View
              className="h-[1px] w-full"
              style={{
                backgroundColor: isDarkMode ? "#413E47" : "#E0E5EB",
              }}
            />

            {/* STATUS */}
            <View className="px-6 py-5">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-1">
                  <Ionicons
                    name="contrast-outline"
                    size={22}
                    color={isDarkMode ? "#919191" : "#454545"}
                  />
                </View>
                <Text
                  className="text-[14px] font-poppins text-gray-500"
                  style={{ color: isDarkMode ? "#919191" : "#717171" }}
                >
                  Status & Type
                </Text>
              </View>

              <View className="flex-row gap-2">
                {statusOptions.map((s) => {
                  const active = editingNote?.status === s.value;
                  // Use colors from the design image
                  const getStatusStyles = () => {
                    if (s.value === "Open") {
                      return {
                        dot: "#6366F1",
                        bg: isDarkMode ? "#282446" : "#D7DEF2",
                        text: "#6366F1",
                      };
                    }
                    if (s.value === "In Progress") {
                      return {
                        dot: "#3B82F6",
                        bg: isDarkMode ? "#101F40" : "#E8F0FF",
                        text: "#3B82F6",
                      };
                    }
                    return {
                      dot: "#22C55E",
                      bg: isDarkMode ? "#122E25" : "#E8F9ED",
                      text: "#22C55E",
                    };
                  };

                  const styles = getStatusStyles();

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
                    >
                      <View
                        className="flex-row items-center px-4 py-2.5 rounded-[12px]"
                        style={{
                          backgroundColor: active
                            ? styles.bg
                            : isDarkMode
                              ? "#262626"
                              : "#F8FAFC",
                        }}
                      >
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: active ? styles.dot : "#9CA3AF",
                          }}
                        />
                        <Text
                          className="text-[14px] font-poppinsMedium"
                          style={{
                            color: active
                              ? styles.text
                              : isDarkMode
                                ? "#9CA3AF"
                                : "#64748B",
                          }}
                        >
                          {s.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              className="h-[1px] w-full"
              style={{
                backgroundColor: isDarkMode ? "#413E47" : "#E0E5EB",
              }}
            />

            {/* ASSIGNEE */}
            <View className="px-6 py-5">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={24}
                    color={isDarkMode ? "#9CA3AF" : "#454545"}
                  />
                </View>
                <View className="flex-1">
                  <MultiSelect
                    style={{
                      height: 48,
                      backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                      paddingHorizontal: 16,
                      borderRadius: 12,
                    }}
                    placeholder="Assignee"
                    placeholderStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#9CA3AF" : "#64748B",
                      fontFamily: "Poppins_400Regular",
                    }}
                    selectedTextStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      fontFamily: "Poppins_400Regular",
                    }}
                    containerStyle={{
                      borderRadius: 20,
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2B2B2B" : "#E2E8F0",
                      marginTop: 10,
                    }}
                    itemTextStyle={{
                      color: isDarkMode ? "#FFFFFF" : "#111827",
                      fontFamily: "Poppins_400Regular",
                    }}
                    activeColor={isDarkMode ? "#262626" : "#F8FAFC"}
                    data={users}
                    labelField="label"
                    valueField="value"
                    value={(editingNote?.responsible || []) as string[]}
                    onChange={(item) =>
                      setEditingNote(
                        (prev) => prev && { ...prev, responsible: item },
                      )
                    }
                    search
                    searchPlaceholder="Search..."
                    renderRightIcon={() => (
                      <View>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={isDarkMode ? "#666" : "#94A3B8"}
                        />
                      </View>
                    )}
                    renderSelectedItem={() => <View />} // Safety fix: return View instead of null
                  />
                </View>
              </View>

              <View className="flex-row flex-wrap items-start gap-2 mt-1">
                {(editingNote?.responsible || []).map((respId) => {
                  const id = extractStringId(respId);
                  const user = usersMap.get(id);
                  if (!user) return null;
                  return (
                    <View
                      key={id}
                      className="flex-row items-center px-3 py-1.5 rounded-[12px] border"
                      style={{
                        backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2B2B2B" : "#E2E8F0",
                      }}
                    >
                      <Text
                        className="text-[13px] font-poppinsMedium mr-2"
                        style={{
                          color: isDarkMode ? "#FFFFFF" : "#000000",
                        }}
                      >
                        {user.label.split(" (")[0]}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setEditingNote(
                            (prev) =>
                              prev && {
                                ...prev,
                                responsible: prev.responsible.filter(
                                  (r) => extractStringId(r) !== id,
                                ),
                              },
                          )
                        }
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={14}
                          color={isDarkMode ? "#fff" : "#000"}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            <View
              className="h-[1px] w-full"
              style={{
                backgroundColor: isDarkMode ? "#413E47" : "#E0E5EB",
              }}
            />

            {/* DUE DATE */}
            <TouchableOpacity onPress={() => setShowEditDatePicker(true)}>
              <View className="px-6 py-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2">
                    <HugeiconsIcon
                      icon={Calendar02Icon}
                      size={24}
                      color={isDarkMode ? "#9CA3AF" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text
                      className="text-[14px] font-poppins text-gray-500"
                      style={{
                        color: isDarkMode ? "#9CA3AF" : "#717171",
                      }}
                    >
                      Due date
                    </Text>
                    <Text
                      className="text-[18px] font-poppinsSemiBold"
                      style={{
                        color: isDarkMode ? "#FFFFFF" : "#000000",
                        marginTop: -4,
                      }}
                    >
                      {editingNote?.targetDate
                        ? new Date(editingNote.targetDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "Select date"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isDarkMode ? "#666" : "#94A3B8"}
                />
              </View>
            </TouchableOpacity>

            {/* CREATED BY FOOTER */}
            <View className="px-6 py-4 flex-row justify-between items-center">
              <Text
                className="text-[13px] font-poppins"
                style={{ color: "#717171" }}
              >
                Created by God
              </Text>
              <Text
                className="text-[13px] font-poppins"
                style={{ color: "#717171" }}
              >
                {editingNote?.createdAt
                  ? new Date(editingNote.createdAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : ""}
              </Text>
            </View>

            {/* ACTIONS */}
            <View className="flex-row px-6 py-8 gap-4">
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingNote(null);
                }}
                className="flex-1 h-[64px] rounded-[16px] border-[1.5px] items-center justify-center"
                style={{
                  borderColor: isDarkMode ? "#2B2B2B" : "#000000",
                  backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                }}
              >
                <Text
                  className="text-[18px] font-poppinsSemiBold"
                  style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveChanges}
                disabled={isEditDisabled}
                className="flex-1 h-[64px] rounded-[16px] items-center justify-center"
                style={{
                  backgroundColor: isEditDisabled
                    ? isDarkMode
                      ? "#4C1D9580"
                      : "#C7D2FE"
                    : "#6358DC",
                }}
              >
                <Text className="text-[18px] font-poppinsSemiBold text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showEditDatePicker}
        mode="date"
        date={editingNote?.targetDate || new Date()}
        onConfirm={(date) => {
          setShowEditDatePicker(false);
          setEditingNote((prev) => prev && { ...prev, targetDate: date });
        }}
        onCancel={() => setShowEditDatePicker(false)}
      />
    </>
  );
};

export default RunningNotes;
