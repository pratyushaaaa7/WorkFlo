import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar02Icon,
  Cancel01Icon,
  Delete03Icon,
  Progress03Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { MultiSelect } from "react-native-element-dropdown";
import Modal from "react-native-modal";
import { KeyboardStickyView } from "react-native-keyboard-controller";
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
  createdBy: string;
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

const AnimatedNoteRow = ({
  item,
  isHighlighted,
  children,
}: {
  item: Note;
  isHighlighted: boolean;
  children: React.ReactNode;
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHighlighted) {
      console.log("Starting Highlight Animation for:", item.id);
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isHighlighted]);

  const highlightOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={{ position: "relative" }}>
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "#DFE5FB",
          opacity: highlightOpacity,
        }}
      />
      {children}
    </View>
  );
};

// Memoized Note Row Component for performance
const NoteRow = React.memo(
  ({
    item,
    isHighlighted,
    isDarkMode,
    COL,
    usersMap,
    onEdit,
    onDelete,
    renderRightActions,
    swipeableRefs,
  }: {
    item: Note;
    isHighlighted: boolean;
    isDarkMode: boolean;
    COL: any;
    usersMap: Map<string, any>;
    onEdit: (note: Note) => void;
    onDelete: (note: Note) => void;
    renderRightActions: () => React.ReactNode;
    swipeableRefs: React.MutableRefObject<Map<string, Swipeable>>;
  }) => {
    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderRightActions={renderRightActions}
        overshootRight={true}
        rightThreshold={120}
        onSwipeableWillOpen={() => {
          swipeableRefs.current.get(item.id)?.close();
          onDelete(item);
        }}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={() => onEdit(item)}>
          <View>
            <AnimatedNoteRow item={item} isHighlighted={isHighlighted}>
              <View
                className="flex-row border-b"
                style={{
                  borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
                }}
              >
                {/* Note with Left Strip */}
                <View
                  style={{
                    width: COL.note,
                    backgroundColor: isHighlighted
                      ? "transparent"
                      : getNoteBgColor(item.status),
                    flexDirection: "row",
                    minHeight: 42,
                  }}
                >
                  <View className="flex-1 p-2">
                    <Text
                      className="text-[12px] font-poppins leading-tight"
                      style={{ color: "#000" }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>

                {/* Responsible (Assignee) */}
                <View
                  className="items-center justify-center border-r"
                  style={{
                    width: COL.responsible,
                    backgroundColor: isHighlighted
                      ? "transparent"
                      : isDarkMode
                        ? "#1A1A1A"
                        : "#F0F3F7",
                    borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
                  }}
                >
                  {item.responsible &&
                  Array.isArray(item.responsible) &&
                  item.responsible.length > 0 ? (
                    <View className="flex-col items-center gap-1">
                      {item.responsible.map((resp, index) => {
                        const getName = () => {
                          if (typeof resp === "object" && resp !== null) {
                            if (resp.name) return resp.name;
                            if (resp.fullName) return resp.fullName;
                            const id = extractStringId(resp);
                            return usersMap.get(id)?.label || "N/A";
                          }
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
                    backgroundColor: isHighlighted
                      ? "transparent"
                      : isDarkMode
                        ? "#1A1A1A"
                        : "#F0F3F7",
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
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isHighlighted === nextProps.isHighlighted &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.item.text === nextProps.item.text &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.item.targetDate === nextProps.item.targetDate &&
      JSON.stringify(prevProps.item.responsible) ===
        JSON.stringify(nextProps.item.responsible)
    );
  },
);

const RunningNotes = () => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const { projectId, projectName, company, highlightId } =
    useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;

  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<"Open" | "In Progress" | "Closed">(
    "Open",
  );
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const sectionListRef = useRef<SectionList>(null);
  const editMultiSelectRef = useRef<any>(null);
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
  const hasScrolledToHighlightRef = useRef<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      // 🔄 Initial fetch on focus
      fetchNotes();

      // ⏱️ Start polling (Auto-refresh every 10 seconds)
      const interval = setInterval(() => {
        // console.log("🔄 Background Live Refresh for Running Notes...");
        fetchNotes(null, true); // Pass a flag for silent refresh
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }, [token, projectId]),
  );

  // Update fetchNotes to handle silent refreshes
  const fetchNotes = async (cursor?: string | null, isSilent = false) => {
    if (!token || !projectId) return;

    const isInitial = !cursor;
    if (isInitial && !isSilent) {
      setInitialLoading(true);
    } else if (!isInitial) {
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
        createdBy:
          note.createdBy?.fullName || note.createdBy?.username || "N/A",
        createdAt: new Date(note.createdAt),
      }));

      if (isInitial) {
        if (isSilent) {
          setNotes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newNotes = formattedNotes.filter(
              (n: Note) => !existingIds.has(n.id),
            );

            // Update matched notes in the existing list to reflect status changes
            const updatedNotes = prev.map((pn) => {
              const match = formattedNotes.find((fn: Note) => fn.id === pn.id);
              return match ? match : pn;
            });

            return [...newNotes, ...updatedNotes];
          });
        } else {
          setNotes(formattedNotes);
        }
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

  // Redundant fetch removed (handled by useFocusEffect)

  // Prepare sections from notes
  const noteSections = useMemo(() => {
    const grouped = notes.reduce<Record<string, Note[]>>((acc, note) => {
      const dateKey = formatDate(note.createdAt);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(note);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, notes]) => ({
      title: date,
      data: collapsedSections.has(date) ? [] : notes,
    }));
  }, [notes, collapsedSections]);

  // 🔹 SCROLL & HIGHLIGHT LOGIC
  useEffect(() => {
    if (!highlightId) {
      hasScrolledToHighlightRef.current = null;
      return;
    }

    if (
      notes.length > 0 &&
      noteSections.length > 0 &&
      hasScrolledToHighlightRef.current !== highlightId
    ) {
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
        hasScrolledToHighlightRef.current = idToFind;
        // Delay slightly to ensure list is rendered
        setTimeout(() => {
          try {
            sectionListRef.current?.scrollToLocation({
              sectionIndex,
              itemIndex: itemIndex,
              viewOffset: 80,
              animated: true,
            });
          } catch (e) {
            console.log("Scroll failed:", e);
          }
        }, 800);

        // Clear highlight state exactly after animation finishes (300ms in + 2000ms hold + 500ms out)
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
        createdBy:
          res.data.createdBy?.fullName || res.data.createdBy?.username || "N/A",
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
                createdBy:
                  res.data.createdBy?.fullName ||
                  res.data.createdBy?.username ||
                  n.createdBy,
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
        ["Target", COL.target],
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

  const DateHeader = React.memo(
    ({
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
    ),
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

  // Note row
  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteRow
        item={item}
        isHighlighted={item.id === highlightedNoteId}
        isDarkMode={isDarkMode}
        COL={COL}
        usersMap={usersMap}
        swipeableRefs={swipeableRefs}
        renderRightActions={renderRightActions}
        onEdit={(note) => {
          setEditingNote({
            ...note,
            responsible: normalizeResponsible(note.responsible) as any,
          });
          setEditModalVisible(true);
        }}
        onDelete={(note) => {
          setNoteToDelete(note);
          setDeleteModalVisible(true);
        }}
      />
    ),
    [
      highlightedNoteId,
      isDarkMode,
      COL,
      usersMap,
      swipeableRefs,
      renderRightActions,
    ],
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
                // router.push(
                //   `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`,
                // )
                router.back()
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
            onEndReachedThreshold={0.5}
            // Performance optimizations
            // removeClippedSubviews={true}
            // maxToRenderPerBatch={10}
            // updateCellsBatchingPeriod={50}
            // windowSize={10}
            // initialNumToRender={15}
            // getItemLayout={(data, index) => ({
            //   length: 42, // minHeight from the note row
            //   offset: 42 * index,
            //   index,
            // })}
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
            onBackButtonPress={() => setDeleteModalVisible(false)}
            onSwipeComplete={() => setDeleteModalVisible(false)}
            swipeDirection="down"
            propagateSwipe={true}
            animationIn="fadeIn"
            animationOut="fadeOut"
            backdropOpacity={0.5}
            useNativeDriver
            hideModalContentWhileAnimating
          >
            <View className="flex-1 justify-center items-center">
              <Pressable
                className={`w-full max-w-sm p-4 rounded-3xl ${isDarkMode ? "bg-[#000000]" : "bg-white"}`}
                onPress={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${isDarkMode ? "bg-[#5E1010]" : "bg-[#FDE6E6]"}`}
                >
                  <HugeiconsIcon
                    icon={Delete03Icon}
                    size={24}
                    color="#DF5B5B"
                  />
                </View>

                {/* Content */}
                <Text
                  className={`text-xl font-dmSemiBold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
                >
                  Delete this item
                </Text>
                <Text
                  className={`text-[14px] font-poppins mb-6 ${isDarkMode ? "text-[#919191]" : "text-[#454545]"}`}
                >
                  Are you sure you want to delete this item? This action is
                  final.
                </Text>

                {/* Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setDeleteModalVisible(false)}
                    className={`flex-1 py-3 rounded-xl border ${isDarkMode ? "border-white" : "border-black"}`}
                  >
                    <Text
                      className={`text-center text-lg font-poppins ${isDarkMode ? "text-white" : "text-black"}`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={deleteNote}
                    className="flex-1 py-3 rounded-xl bg-[#DF5B5B]"
                  >
                    <Text className="text-center text-lg font-poppins text-white">
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
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
        avoidKeyboard={false}
      >
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View
            className="rounded-t-[24px] w-full h-[460px] shadow-2xl"
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
            <View className="px-5 py-2 items-center">
              <Text
                className="text-[17px] font-dmSemiBold"
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
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* NOTE CONTENT */}
              <View className="px-3 py-1">
                <TextInput
                  value={editingNote?.text}
                  multiline
                  scrollEnabled={true}
                  placeholder="Enter your note here..."
                  placeholderTextColor={isDarkMode ? "#666" : "#94A3B8"}
                  onChangeText={(text) =>
                    setEditingNote((prev) => prev && { ...prev, text })
                  }
                  className="text-[12px] font-poppins text-left min-h-[40px] max-h-[100px]"
                  style={{
                    color: isDarkMode ? "#D1D5DB" : "#454545",
                    lineHeight: 20,
                    padding: 0,
                    textAlignVertical: "top",
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
              <View className="px-4 py-2 flex-row">
                <View className="w-10 items-start pt-1">
                  <HugeiconsIcon
                    icon={Progress03Icon}
                    size={20}
                    color={isDarkMode ? "#9CA3AF" : "#454545"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-poppins text-[#454545]  dark:text-[#919191] my-0.5">
                    Status
                  </Text>

                  <View className="flex-row gap-2">
                    {statusOptions.map((s) => {
                      const active = editingNote?.status === s.value;
                      const getStatusStyles = () => {
                        if (s.value === "Open") {
                          return {
                            dot: "#DF5B5B",
                            bg: isDarkMode ? "#5E1010" : "#FDE6E6",
                            text: "#DF5B5B",
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
                            className="flex-row items-center px-2 py-1.5 rounded-[10px]"
                            style={{
                              backgroundColor: active
                                ? styles.bg
                                : isDarkMode
                                  ? "#0D0D0D"
                                  : "#F0F3F7",
                            }}
                          >
                            <View
                              className="w-2 h-2 rounded-full mr-2"
                              style={{
                                backgroundColor: active
                                  ? styles.dot
                                  : "#9CA3AF",
                              }}
                            />
                            <Text
                              className="text-[11px] font-poppinsMedium"
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
              </View>

              <View
                className="h-[1px] w-full"
                style={{
                  backgroundColor: isDarkMode ? "#413E47" : "#E0E5EB",
                }}
              />

              {/* ASSIGNEE */}
              <View className="px-4 py-2 flex-row">
                <View className="w-10 items-start pt-1">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={20}
                    color={isDarkMode ? "#9CA3AF" : "#454545"}
                  />
                </View>
                <View className="flex-1">
                  <MultiSelect
                    ref={editMultiSelectRef}
                    style={{
                      height: 38,
                      backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                    placeholder="Assign to.."
                    placeholderStyle={{
                      fontSize: 11,
                      color: isDarkMode ? "#919191" : "#000",
                      fontFamily: "Poppins_400Regular",
                    }}
                    selectedTextStyle={{
                      fontSize: 11,
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      fontFamily: "Poppins_400Regular",
                    }}
                    containerStyle={{
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? "#0D0D0D" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2B2B2B" : "#E2E8F0",
                      marginTop: 10,
                    }}
                    itemTextStyle={{
                      color: isDarkMode ? "#FFFFFF" : "#111827",
                      fontFamily: "Poppins_400Regular",
                    }}
                    activeColor={isDarkMode ? "#0D0D0D" : "#F3F4F6"}
                    data={users}
                    labelField="label"
                    valueField="value"
                    value={(editingNote?.responsible || []) as string[]}
                    onChange={(item) => {
                      setEditingNote(
                        (prev) => prev && { ...prev, responsible: item },
                      );
                      editMultiSelectRef.current?.close();
                    }}
                    search
                    searchPlaceholder="Search..."
                    inputSearchStyle={{
                      backgroundColor: isDarkMode ? "#000" : "#F0F3F7",
                      color: isDarkMode ? "#fff" : "#000",
                      borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
                      borderRadius: 8,
                      height: 48,
                      fontSize: 13,
                      fontFamily: "Poppins_400Regular",
                    }}
                    renderRightIcon={() => (
                      <View>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color={isDarkMode ? "#919191" : "#919191"}
                        />
                      </View>
                    )}
                    renderSelectedItem={() => <View />}
                  />

                  <View className="flex-row flex-wrap items-start gap-2">
                    {(editingNote?.responsible || []).map((respId) => {
                      const id = extractStringId(respId);
                      const user = usersMap.get(id);
                      if (!user) return null;
                      return (
                        <View
                          key={id}
                          className="flex-row items-center px-2.5 py-1 rounded-[7px] border"
                          style={{
                            backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                            borderColor: isDarkMode ? "#413E47" : "#E0E5EB",
                          }}
                        >
                          <Text
                            className="text-[12px] font-poppinsMedium mr-2"
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
                              strokeWidth={2}
                              color={isDarkMode ? "#fff" : "#000"}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
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
                <View className="px-4 py-2 flex-row">
                  <View className="w-10 items-start pt-1">
                    <HugeiconsIcon
                      icon={Calendar02Icon}
                      size={20}
                      color={isDarkMode ? "#9CA3AF" : "#454545"}
                    />
                  </View>
                  <View className="flex-1 flex-row items-center justify-between">
                    <View>
                      <Text className="text-[11px] font-poppins text-[#454545] dark:text-[#919191] mt-0.5">
                        Due date
                      </Text>
                      <Text
                        className="text-[14px] font-poppinsMedium"
                        style={{
                          color: isDarkMode ? "#FFFFFF" : "#000000",
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
                          : "No date selected"}
                      </Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color={isDarkMode ? "#919191" : "#919191"}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Date Picker — inline below the due date row */}
              {showEditDatePicker && (
                <DateTimePicker
                  value={editingNote?.targetDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (event.type === "set" && date) {
                      setShowEditDatePicker(false);
                      setEditingNote((prev) => prev && { ...prev, targetDate: date });
                    } else {
                      setShowEditDatePicker(false);
                    }
                  }}
                />
              )}

              {/* CREATED BY FOOTER */}
              {editingNote?.createdBy && (
                <View className="px-4 py-1 pt-2 flex-row justify-between items-center">
                  <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
                    Created by {editingNote?.createdBy || "Unknown"}
                  </Text>

                  <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
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
              )}
            </ScrollView>

            {/* ACTIONS (Sticky Footer) */}
            <View
              className="flex-row px-4 pt-3 gap-3 border-t"
              style={{
                borderColor: isDarkMode ? "#413E47" : "#E0E5EB",
                paddingBottom: Math.max(bottomInset, 16),
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingNote(null);
                }}
                className="flex-1 h-[44px] rounded-[16px] border-[1px] items-center justify-center"
                style={{
                  borderColor: isDarkMode ? "#FFFFFF" : "#000000",
                  backgroundColor: isDarkMode ? "transparent" : "transparent",
                }}
              >
                <Text
                  className="text-[14px] font-poppins"
                  style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveChanges}
                disabled={isEditDisabled}
                className="flex-1"
              >
                <LinearGradient
                  colors={
                    isEditDisabled
                      ? isDarkMode
                        ? ["#2F2F2F", "#2F2F2F", "#2F2F2F"]
                        : ["#EFEFEF", "#EFEFEF", "#EFEFEF"]
                      : ["#5B4CCC", "#6347C2", "#8056D1"]
                  }
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  locations={[0, 0.5183, 1]}
                  style={{
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text className="text-[14px] font-poppins text-white">
                    Save
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardStickyView>
      </Modal>
    </>
  );
};

export default RunningNotes;
