import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  useWindowDimensions,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "../context/AuthContext";
import { Swipeable } from "react-native-gesture-handler";
import AddNoteCard from "./../components/runningNotes/AddNoteCard"; // adjust path
import DateTimePickerModal from "react-native-modal-datetime-picker";

const formatDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
};

const getNoteBgColor = (status: string) => {
  switch (status) {
    case "Open":
      return "#FEE2E2"; // red-100 (clear but not aggressive)
    case "In Progress":
      return "#FEF3C7"; // amber-100 (warm, readable)
    case "Closed":
      return "#D1FAE5"; // green-100 (soft success)
    default:
      return "#FFFFFF";
  }
};

const statusOptions = [
  {
    value: "Open",
    label: "Open",
    color: "#EF4444", // red-500
    bg: "bg-red-500",
    border: "border-red-500",
  },
  {
    value: "In Progress",
    label: "In Progress",
    color: "#F59E0B", // amber-500
    bg: "bg-amber-500",
    border: "#F59E0B",
  },
  {
    value: "Closed",
    label: "Closed",
    color: "#22C55E", // green-500
    bg: "bg-green-500",
    border: "border-green-500",
  },
];

type Note = {
  id: string;
  text: string;
  status: "Open" | "In Progress" | "Closed";
  responsible: string | null;
  targetDate: Date | null;
  // createdBy: string;
  createdAt: Date;
};

const RunningNotes = () => {
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const user = auth?.user;

  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<"Open" | "In Progress" | "Closed">(
    "Open"
  );
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const [responsible, setResponsible] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
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
          }))
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
        responsible: note.responsible?._id || null,
        targetDate: note.targetDate ? new Date(note.targetDate) : null,
        createdAt: new Date(note.createdAt),
      }));
      setNotes(formattedNotes);
      console.log(formattedNotes);
    } catch (err) {
      console.log("Error fetching notes:", err);
    } finally {
      setInitialLoading(false); // 👈 only ends first load
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token, projectId]);

  //refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  //Adding note to the backend
  const addNote = async () => {
    if (!noteText.trim() || isSubmitting) return;

    setIsSubmitting(true);

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
        responsible: res.data.responsible || null,
        targetDate: res.data.targetDate ? new Date(res.data.targetDate) : null,
        createdAt: new Date(res.data.createdAt),
      };

      setNotes((prev) => [newNote, ...prev]);
      setNoteText("");
      setStatus("Open");
      setResponsible(null);
      setTargetDate(null);
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
        { headers: { Authorization: `Bearer ${token}` } }
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
            : n
        )
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
    note: 0.62, // 55%
    responsible: 0.23, // 25%
    target: 0.15, // 20%
  };

  const COL = {
    note: Math.floor(SCREEN_WIDTH * COL_RATIO.note),
    responsible: Math.floor(SCREEN_WIDTH * COL_RATIO.responsible),
    target: Math.floor(SCREEN_WIDTH * COL_RATIO.target),
  };

  // Table column headers
  const TableColumnHeader = () => (
    <View className="flex-row border-l border-t border-slate-300 bg-slate-100">
      {[
        ["Note", COL.note],
        ["Responsible", COL.responsible],
        ["T Date", COL.target],
      ].map(([label, width]) => (
        <View
          key={label}
          className="border-r border-b border-gray-400 px-1 py-1"
          style={{ width: width as number }}
        >
          <Text className="font-semibold text-sm text-slate-700">{label}</Text>
        </View>
      ))}
    </View>
  );

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
        data: notes,
      })),
    [notes]
  );

  const DateHeader = ({ date }: { date: string }) => (
    <View className="bg-indigo-100 px-2 py-2 border-l border-r border-indigo-200">
      <Text className="font-semibold text-xs text-indigo-800">{date}</Text>
    </View>
  );

  const rightActionStyle = {
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
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderRightActions={renderRightActions}
        overshootRight={true}
        rightThreshold={120} // must fully overshoot
        onSwipeableWillOpen={() => {
          // 🔥 close FIRST → avoids visual stop
          swipeableRefs.current.get(item.id)?.close();

          // 🔥 open modal immediately
          setNoteToDelete(item);
          setDeleteModalVisible(true);
        }}
        // onSwipeableOpen={() => {
        //   setNoteToDelete(item);
        //   setDeleteModalVisible(true);
        //   setTimeout(() => swipeableRefs.current.get(item.id)?.close(), 100);
        // }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setEditingNote(item);
            setEditModalVisible(true);
          }}
        >
          <View className="flex-row border-l border-slate-400 bg-white">
            {/* Note */}
            <View
              className="border-r border-b border-gray-300 px-2 py-1"
              style={{
                width: COL.note,
                backgroundColor: getNoteBgColor(item.status),
              }}
            >
              <Text className="text-sm text-black">{item.text}</Text>
            </View>

            {/* Responsible */}
            <View
              className="border-r border-b border-gray-300 px-1 py-1"
              style={{ width: COL.responsible }}
            >
              <Text className="text-xs" numberOfLines={2}>
                {users.find((u) => u.value === item.responsible)?.label ||
                  "N/A"}
              </Text>
            </View>

            {/* Target Date */}
            <View
              className="border-r border-b border-gray-300 px-1 py-1"
              style={{ width: COL.target }}
            >
              <Text className="text-xs">
                {item.targetDate ? formatDate(item.targetDate) : "N/A"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    ),
    [users, swipeableRefs, COL]
  );

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient colors={["#4F46E5", "#6366F1"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`
              )
            }
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-white text-xl font-semibold ml-3">
              Running Notes
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* <View className="p-2">
        <View className="bg-white px-2 py-2 rounded-2xl shadow-md">
          <Text className="font-semibold px-1 mb-1 text-base">
            Add New Note
          </Text>

          <TextInput
            placeholder="Enter note..."
            placeholderTextColor="#888"
            value={noteText}
            multiline
            onChangeText={setNoteText}
            className="border border-gray-200 rounded-xl p-2 mb-1 text-sm"
          />

          <View className="flex-row justify-between mb-1 gap-2">
            <Dropdown
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                height: 34,
                paddingHorizontal: 10,
              }}
              placeholderStyle={{ fontSize: 14, color: "#888" }}
              selectedTextStyle={{ fontSize: 13, color: "#111827" }}
              containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
              activeColor="#EEF2FF"
              data={statusOptions}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={status}
              onChange={(item) => setStatus(item.value)}
            />
            <TouchableOpacity
              className="border border-gray-200 rounded-xl flex-1 justify-center px-3"
              style={{ height: 34 }}
              onPress={() => setShowAddDatePicker(true)}
            >
              <Text className="text-sm">
                {targetDate ? targetDate.toDateString() : "Select target date"}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddDatePicker && (
            <DateTimePicker
              value={targetDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowAddDatePicker(false);
                if (date) setTargetDate(date);
              }}
            />
          )}

          <View className="flex-row items-center gap-2">
            <View style={{ flex: 1 }}>
              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  height: 34,
                  paddingHorizontal: 10,
                }}
                placeholderStyle={{ fontSize: 13, color: "#888" }}
                selectedTextStyle={{ fontSize: 13, color: "#111827" }}
                containerStyle={{
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  marginBottom: 0,
                }}
                activeColor="#EEF2FF"
                data={users}
                labelField="label"
                valueField="value"
                placeholder="Responsible"
                value={responsible}
                onChange={(item) => setResponsible(item.value)}
              />
            </View>

            <TouchableOpacity
              className="bg-indigo-600 rounded-lg items-center justify-center"
              style={{
                height: 34,
                width: 90,
                backgroundColor: isAddDisabled ? "#A5B4FC" : "#4F46E5", // lighter when disabled
              }}
              onPress={addNote}
              disabled={isAddDisabled}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className="font-semibold text-xs"
                  style={{ color: isAddDisabled ? "#E0E7FF" : "#FFFFFF" }}
                >
                  Add
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View> */}

      <AddNoteCard
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
              responsible: res.data.responsible || null,
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
      />

      {/* Fixed Table Header */}
      <View style={{ backgroundColor: "#E5E7EB" }}>
        <TableColumnHeader />
      </View>

      {/* CONTENT AREA */}
      {initialLoading ? (
        <View className="flex-1 justify-center items-center bg-white py-20">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-gray-500 text-sm">
            Loading running notes...
          </Text>
        </View>
      ) : notes.length === 0 ? (
        <View className="flex-1 justify-center items-center pt-10 py-20">
          <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
          <Text className="text-gray-400 mt-4 text-center text-base">
            No running notes yet.{"\n"}Add a note to get started.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={noteSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderNote({ item })}
          renderSectionHeader={({ section: { title } }) => (
            <DateHeader date={title} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
          stickySectionHeadersEnabled
          contentContainerStyle={{
            paddingBottom: 40, // 👈 IMPORTANT
          }}
        />
      )}

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
        <View className="flex-1 bg-black/40 justify-center items-center px-4">
          {/* Modal Card */}
          <View className="bg-white rounded-3xl w-full p-5 shadow-2xl">
            {/* Header */}
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Edit Note
            </Text>

            {/* NOTE SECTION */}
            <Text className="text-xs font-semibold text-gray-500 mb-1">
              NOTE
            </Text>

            <TextInput
              value={editingNote?.text}
              multiline
              placeholder="Edit note..."
              placeholderTextColor="#9CA3AF"
              onChangeText={(text) =>
                setEditingNote((prev) => prev && { ...prev, text })
              }
              className="border border-gray-200 rounded-2xl p-3 mb-4 text-sm bg-slate-50"
            />

            {/* STATUS SECTION */}
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
                          }
                      )
                    }
                    className={`flex-row items-center gap-2 px-3 py-3 rounded-full border ${
                      active
                        ? `${s.bg} ${s.border}`
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {/* status dot */}
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: active ? "#fff" : s.color,
                      }}
                    />

                    {/* label */}
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

            {/* DETAILS SECTION */}
            <Text className="text-xs font-semibold text-gray-500 mb-2">
              DETAILS
            </Text>

            {/* Responsible */}
            <View className="mb-3">
              <Dropdown
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
                data={users}
                labelField="label"
                valueField="value"
                value={editingNote?.responsible}
                onChange={(item) =>
                  setEditingNote(
                    (prev) => prev && { ...prev, responsible: item.value }
                  )
                }
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
                setEditingNote((prev) => prev && { ...prev, targetDate: date });
              }}
              onCancel={() => setShowEditDatePicker(false)}
            />

            {/* ACTIONS */}
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
                className="px-5 py-2 rounded-xl "
                style={{
                  backgroundColor: isEditDisabled ? "#A5B4FC" : "#4F46E5", // light vs active indigo
                }}
                disabled={isEditDisabled}
                onPress={saveChanges}
              >
                <Text
                  className="text-white font-semibold"
                  style={{
                    color: isEditDisabled ? "#E0E7FF" : "#FFFFFF",
                  }}
                >
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RunningNotes;
