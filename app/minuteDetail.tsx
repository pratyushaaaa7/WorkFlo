import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const STATUS_OPTIONS = ["open", "closed", "forwarded"] as const;
type Status = typeof STATUS_OPTIONS[number];

const statusColors: Record<Status, string> = {
  open: "bg-red-500",
  closed: "bg-green-500",
  forwarded: "bg-yellow-500",
};

const humanLabel = (s: string) =>
  (s || "").replace(/^\w/, (c) => c.toUpperCase());

const parseJsonSafe = (val: any) => {
  if (!val) return [];
  try {
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch {
    return [];
  }
};

const fmtDate = (d?: string | Date) => {
  try {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return "";
  }
};

const MinuteDetail = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const auth = useContext(AuthContext);

  const minuteId = (params.id as string) || (params.minuteId as string);
  const meetingId = (params.meetingId as string) || (params.meetingId as string);

  // --- Base fields from params for immediate display ---
  const issueSubject = (params.issueSubject as string) || "No subject";
  const description = (params.description as string) || "";
  const serialNo = (params.serialNo as string) || "";
  const remarks = (params.remarks as string) || "";
  const targetDate = params.targetDateForInfo === "true" ? "For Information" : params.targetDate ? new Date(params.targetDate as string).toLocaleDateString() : "—";
  const responsibilityArr = useMemo(
    () =>
      params.responsibilityForInfo === "true"
        ? []
        : parseJsonSafe(params.responsibility).map(
            (r: any) => r.individualName || r.name || r
          ),
    [params.responsibility, params.responsibilityForInfo]
  );
  const raisedByArr = useMemo(
    () => parseJsonSafe(params.raisedBy).map((r: any) => r.individualName || r.name || r),
    [params.raisedBy]
  );

  // --- Status & notes ---
  const [status, setStatus] = useState<Status>(((params.status as string) as Status) || "open");
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>(status);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  // --- Fetch activity log from backend ---
  const fetchActivityLog = async () => {
    if (!minuteId || !meetingId) return;
    setLoading(true);
    try {
      const res = await api.get(`/minutes/${meetingId}/minutes/${minuteId}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      const data = res.data;

      // set current status
      setStatus(data.status);

      // combine status history + notes
      const timeline = [
        ...(data.statusHistory || []).map((s: any) => ({
          type: "status",
          text: `Status changed to ${s.status}${s.note ? `: ${s.note}` : ""}`,
          addedBy: s.changedBy,
          createdAt: s.changedAt,
        })),
        ...(data.notes || []).map((n: any) => ({
          type: "note",
          text: n.text,
          addedBy: n.addedBy,
          createdAt: n.createdAt,
        })),
      ].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotes(timeline);
    } catch (err) {
      console.error("Failed to fetch activity log", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLog();
  }, []);

  const pushNoteOptimistic = (text: string, addedBy: any) => {
    const note = {
      text,
      addedBy: addedBy || { _id: auth?.user?.id, fullName: auth?.user?.fullName },
      createdAt: new Date().toISOString(),
      type: "note",
    };
    setNotes((prev) => [note, ...prev]);
  };

const handleSaveStatus = async () => {
  if (!minuteId || !meetingId) return;
  if (!STATUS_OPTIONS.includes(selectedStatus)) return;

  setSaving(true);

  const prevStatus = status;
  const prevNotes = [...notes];

  const notePayload = noteText?.trim();
  const statusChanged = selectedStatus !== status;
  const noteProvided = !!notePayload;

  // Optimistic update for note-only (status not changed)
  if (!statusChanged && noteProvided) {
    pushNoteOptimistic(notePayload!, { fullName: auth?.user?.fullName, _id: auth?.user?.id });
  }

  // Update local status immediately
  if (statusChanged) setStatus(selectedStatus);

  try {
    const body: { status?: Status; note?: string } = {};
    if (statusChanged) body.status = selectedStatus;
    if (noteProvided) body.note = notePayload;

    await api.put(
      `/minutes/${meetingId}/minutes/${minuteId}/status`,
      body,
      { headers: { Authorization: `Bearer ${auth?.token}` } }
    );

    // Reload from backend (fetch combined activity log)
    await fetchActivityLog();

    setModalVisible(false);
    setNoteText("");
  } catch (err) {
    console.error(err);
    // Rollback optimistic updates if API fails
    setStatus(prevStatus);
    setNotes(prevNotes);
    Alert.alert("Update failed", "Could not update status. Please try again.");
  } finally {
    setSaving(false);
  }
};


// console.log("Fetching minute detail", { meetingId, minuteId, token: !!auth?.token });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-14 pb-4 px-4"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 6 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center" activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text className="text-white text-lg font-semibold ml-3">Minute Detail</Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className={`px-3 py-1 rounded-full ${statusColors[status] || "bg-gray-400"}`}>
              <Text className="text-white font-semibold">{status.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              onPress={() => { setSelectedStatus(status); setModalVisible(true); }}
              activeOpacity={0.8}
              className="ml-3 px-3 py-2 rounded-md bg-white/20"
            >
              <Text className="text-white font-medium">Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Minute summary */}
        <View className="bg-white rounded-2xl p-5 shadow-md mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-1">{serialNo ? `${serialNo}. ` : ""}{issueSubject}</Text>
          {description ? <Text className="text-gray-600 mb-4">{description}</Text> : null}
          <Text className="text-sm text-gray-500"><Text className="font-semibold text-gray-700">Raised By: </Text>{raisedByArr.length ? raisedByArr.join(", ") : "—"}</Text>
          <Text className="text-sm text-gray-500 mt-2"><Text className="font-semibold text-gray-700">Responsible: </Text>{params.responsibilityForInfo === "true" ? "For Information" : responsibilityArr.length ? responsibilityArr.join(", ") : "—"}</Text>
          <Text className="text-sm text-gray-500 mt-2"><Text className="font-semibold text-gray-700">Target Date: </Text>{targetDate}</Text>
          {remarks ? <Text className="text-sm text-gray-500 mt-2"><Text className="font-semibold text-gray-700">Remarks: </Text>{remarks}</Text> : null}
        </View>

        {/* Actions */}
        <View className="flex-row mb-4">
          <TouchableOpacity onPress={() => { setSelectedStatus("open"); setModalVisible(true); }} activeOpacity={0.8} className="flex-row items-center bg-white rounded-xl p-3 shadow-sm flex-1 mr-2">
            <Ionicons name="refresh" size={18} color="#374151" />
            <Text className="ml-3 font-medium text-gray-700">Change Status</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setSelectedStatus(status); setModalVisible(true); }} activeOpacity={0.8} className="flex-row items-center bg-white rounded-xl p-3 shadow-sm">
            <Ionicons name="chatbubble-ellipses" size={18} color="#374151" />
            <Text className="ml-3 font-medium text-gray-700">Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Activity log */}
        <View className="bg-white rounded-2xl p-4 shadow-md">
          <Text className="text-base font-semibold text-gray-800 mb-3">Activity</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : notes.length === 0 ? (
            <Text className="text-sm text-gray-500">No activity yet.</Text>
          ) : (
            notes.map((n, idx) => (
              <View key={idx} className="flex-row items-start mb-3">
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                  <Text className="text-sm font-semibold text-gray-700">{(n.addedBy?.fullName || n.addedBy?.individualName || "").slice(0,2).toUpperCase() || "U"}</Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-700 font-medium">{n.addedBy?.fullName || n.addedBy?.individualName || "Unknown"}</Text>
                  <Text className="text-gray-600 text-sm">{n.text}</Text>
                  <Text className="text-xs text-gray-400 mt-1">{fmtDate(n.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal for status + note */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { if(!saving) setModalVisible(false); }}>
        <Pressable style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => !saving && setModalVisible(false)}>
          <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: 260 }} onStartShouldSetResponder={() => true}>
            <Text className="text-lg font-semibold text-gray-800 mb-3">Update status</Text>
            <View className="flex-row justify-between mb-3">
              {STATUS_OPTIONS.map((s) => {
                const active = selectedStatus === s;
                return (
                  <TouchableOpacity key={s} onPress={() => setSelectedStatus(s as Status)} activeOpacity={0.8} className={`flex-1 mx-1 px-4 py-3 rounded-lg items-center ${active ? statusColors[s as Status] : "bg-gray-100"}`}>
                    <Text className={`font-semibold ${active ? "text-white" : "text-gray-700"}`}>{humanLabel(s)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-sm text-gray-600 mb-2">Add a note (optional)</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="E.g. Marked resolved after discussion..."
              multiline
              numberOfLines={3}
              editable={!saving}
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 10, textAlignVertical: "top", backgroundColor: "#FAFAFA", marginBottom: 12 }}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => { if(!saving) { setModalVisible(false); setNoteText(""); } }} activeOpacity={0.8} className="px-4 py-2 rounded-md mr-2">
                <Text className="text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveStatus} activeOpacity={0.8} className={`px-4 py-2 rounded-md ${saving ? "bg-gray-300" : "bg-indigo-600"}`} disabled={saving}>
                <Text className="text-white font-semibold">{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default MinuteDetail;
