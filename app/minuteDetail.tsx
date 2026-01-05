import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  // Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";

const STATUS_OPTIONS = ["open", "closed", "forwarded", "forInfo"] as const;

type Status = (typeof STATUS_OPTIONS)[number];

const statusColors: Record<Status, string> = {
  open: "bg-red-500",
  closed: "bg-green-500",
  forwarded: "bg-yellow-500",
  forInfo: "bg-green-500", // ✅ added
};

const getActivityBg = (item) => {
  if (item.text !== undefined) return "bg-cyan-50 border border-cyan-200"; // Note

  if (item.fieldChanged === "status")
    return "bg-rose-50 border border-rose-200"; // Status change

  if (
    item.fieldChanged === "targetDate" ||
    item.fieldChanged === "targetDateForInfo"
  )
    return "bg-amber-50 border border-amber-200"; // Target date

  return "bg-gray-50 border border-gray-200";
};

const humanLabel = (s: string) => {
  if (s === "forInfo") return "For Info";
  return (s || "").replace(/^\w/, (c) => c.toUpperCase());
};

const parseJsonSafe = (val: any) => {
  if (!val) return [];
  try {
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch {
    return [];
  }
};

const fmtDate = (d?: string | Date) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short", // "Jan", "Feb", ...
      year: "numeric",
    }).format(dt);
  } catch {
    return "";
  }
};

const MinuteDetail = () => {
  const params = useLocalSearchParams();
  // console.log(params, "hellooo")
  const router = useRouter();
  const auth = useContext(AuthContext);

  const minuteId = (params.id as string) || (params.minuteId as string);
  const meetingId =
    (params.meetingId as string) || (params.meetingId as string);

  // --- Base fields from params for immediate display ---
  const issueSubject = (params.issueSubject as string) || "No subject";
  const description = (params.description as string) || "";
  const serialNo = (params.serialNo as string) || "";
  const remarks = (params.remarks as string) || "";
  // Normalize targetDate param (use first element if it's an array) so fmtDate receives string | Date | undefined
  const _targetDateParam = Array.isArray(params.targetDate)
    ? params.targetDate[0]
    : (params.targetDate as string | undefined);
  const targetDate =
    params.targetDateForInfo === "true"
      ? "For Information"
      : _targetDateParam
      ? fmtDate(_targetDateParam)
      : "—";

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
    () =>
      parseJsonSafe(params.raisedBy).map(
        (r: any) => r.individualName || r.name || r
      ),
    [params.raisedBy]
  );

  // --- Status & notes ---
  const [status, setStatus] = useState<Status>(
    (params.status as string as Status) || "open"
  );
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minuteData, setMinuteData] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>(status);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const [newTargetDate, setNewTargetDate] = useState<Date | null>(null);
  const [isForInfoTarget, setIsForInfoTarget] = useState(
    params.targetDateForInfo === "true"
  );
  const [tempNoteText, setTempNoteText] = useState("");
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [tempTargetDate, setTempTargetDate] = useState<Date | null>(null);
  const [tempForInfo, setTempForInfo] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // --- Fetch activity log from backend ---
  const fetchActivityLog = async () => {
    if (!minuteId || !meetingId) return;
    setLoading(true);

    try {
      const res = await api.get(`/minutes/${meetingId}/minutes/${minuteId}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });

      const data = res.data;
      setMinuteData(data); // ✅ Single source of truth
      // console.log(data);

      // Set current status
      setStatus(data.status);

      // --- Build ACTIVITY entries (status + targetDate + other activities) ---
      const activityItems = [
        // 1️⃣ OLD DATA — Status history (only if exists)
        ...(data.statusHistory || []).map((s: any) => ({
          type: "status",
          fieldChanged: "status",
          action: "Status changed",
          oldValue: s.oldStatus || "—",
          newValue: s.status || "—",
          note: s.note || "",
          addedBy: s.changedBy,
          createdAt: s.changedAt,
        })),

        // 2️⃣ NEW DATA — Unified activity logs
        ...(data.activities || []).map((a: any) => ({
          type:
            a.fieldChanged === "status"
              ? "status"
              : a.fieldChanged === "targetDate" ||
                a.fieldChanged === "targetDateForInfo"
              ? "targetDate"
              : "activity",

          fieldChanged: a.fieldChanged,
          action: a.action,
          oldValue: a.oldValue || "—",
          newValue: a.newValue || "—",
          note: a.note || "",
          addedBy: a.createdBy,
          createdAt: a.createdAt,
        })),
      ];

      // --- Build NOTES separately ---
      const noteItems = (data.notes || []).map((n: any) => ({
        type: "note",
        text: n.text,
        addedBy: n.addedBy,
        createdAt: n.createdAt,
      }));

      // Set state
      setActivities(activityItems);
      setNotes(noteItems);
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
      addedBy: addedBy || {
        _id: auth?.user?.id,
        fullName: auth?.user?.fullName,
      },
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

    const notePayload = noteText.trim();
    const statusChanged = selectedStatus !== status;
    const noteProvided = !!notePayload;

    // Optimistic update only for notes
    if (!statusChanged && noteProvided) {
      pushNoteOptimistic(notePayload, {
        fullName: auth?.user?.fullName,
        _id: auth?.user?.id,
      });
    }

    if (statusChanged) setStatus(selectedStatus);

    try {
      const body: any = {};
      if (statusChanged) body.status = selectedStatus;
      if (noteProvided) body.note = notePayload;

      await api.put(`/minutes/${meetingId}/minutes/${minuteId}/status`, body, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });

      await fetchActivityLog();

      setModalVisible(false);
      setNoteText("");
    } catch (err) {
      console.error(err);
      setStatus(prevStatus);
      setNotes(prevNotes);
      Alert.alert("Update failed", "Could not update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTargetDate = async () => {
    if (!minuteId || !meetingId) return;

    setSaving(true);

    try {
      const body: any = {
        note: tempNoteText.trim(),
      };

      if (tempForInfo) {
        body.targetDateForInfo = true;
      } else if (tempTargetDate) {
        body.targetDateForInfo = false;
        body.targetDate = tempTargetDate.toISOString();
      } else {
        Alert.alert("Please select a date or mark as For Information");
        setSaving(false);
        return;
      }

      await api.put(`/minutes/${meetingId}/minutes/${minuteId}/status`, body, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });

      setNewTargetDate(tempTargetDate);
      setIsForInfoTarget(tempForInfo);

      setTargetModalVisible(false);
      setTempNoteText("");
      setTempTargetDate(null);

      await fetchActivityLog();
    } catch (err) {
      console.error(err);
      Alert.alert("Failed", "Could not update target date.");
    } finally {
      setSaving(false);
    }
  };

  const activityLog = [...notes, ...activities].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // console.log("Fetching minute detail", { meetingId, minuteId, token: !!auth?.token });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16 pb-6 px-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              Minutes of Meeting
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Minute summary */}
        <View className="bg-white rounded-2xl p-5 shadow-md mb-4">
          <View className=" justify-between mb-1 ">
            <Text className="text-xl font-bold text-gray-800 mb-1">
              {serialNo ? `${serialNo}. ` : ""}
              {issueSubject}
            </Text>
            <View className="flex-row items-center">
              <View
                className={`px-2 py-1 rounded-full ${
                  statusColors[status] || "bg-gray-400"
                }`}
              >
                <Text className="text-white text-xs font-pbold">
                  {humanLabel(status).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* <Text className="text-gray-600 mb-2">{description}</Text> */}
          <Text className="text-sm text-gray-500 mb-2">
            <Text className="font-semibold text-gray-700">
              Meeting Discussion:{" "}
            </Text>
            {description}
          </Text>
          <Text className="text-sm text-gray-500">
            <Text className="font-semibold text-gray-700">Raised By: </Text>
            {raisedByArr.length ? raisedByArr.join(", ") : "—"}
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            <Text className="font-semibold text-gray-700">Responsible: </Text>
            {params.responsibilityForInfo === "true"
              ? "For Information"
              : responsibilityArr.length
              ? responsibilityArr.join(", ")
              : "—"}
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            <Text className="font-semibold text-gray-700">Target Date: </Text>
            {
              minuteData
                ? minuteData.targetDateForInfo
                  ? "For Information"
                  : minuteData.targetDate
                  ? fmtDate(minuteData.targetDate)
                  : "—"
                : targetDate // <-- SHOW PARAM BEFORE API LOADS
            }
          </Text>

          {remarks ? (
            <Text className="text-sm text-gray-500 mt-2">
              <Text className="font-semibold text-gray-700">Remarks: </Text>
              {remarks}
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        <View className="flex-row mb-4">
          {/* <TouchableOpacity onPress={() => { setSelectedStatus("open"); setModalVisible(true); }} activeOpacity={0.8} className="flex-row items-center bg-white rounded-xl p-3 shadow-sm flex-1 mr-2">
            <Ionicons name="refresh" size={18} color="#374151" />
            <Text className="ml-3 font-medium text-gray-700">Change Status</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => {
              setSelectedStatus(status);
              setModalVisible(true);
            }}
            activeOpacity={0.8}
            className="flex-row items-center bg-white rounded-xl p-3 shadow-sm flex-1 mr-2"
          >
            <Ionicons name="refresh" size={18} color="#374151" />
            <Text className="ml-3 font-medium text-gray-700">
              Change Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedStatus(status);
              setModalVisible(true);
            }}
            activeOpacity={0.8}
            className="flex-row items-center bg-white rounded-xl p-3 shadow-sm"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#374151" />
            <Text className="ml-3 font-medium text-gray-700">Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Change Target Date Button */}
        <TouchableOpacity
          onPress={() => {
            setTempForInfo(isForInfoTarget);

            if (!isForInfoTarget && minuteData?.targetDate) {
              setTempTargetDate(new Date(minuteData.targetDate));
            } else {
              setTempTargetDate(null);
            }

            setTempNoteText("");
            setTargetModalVisible(true);
          }}
          className="bg-indigo-50 border border-indigo-200 rounded-xl py-3 px-4 mb-4 items-center"
        >
          <Text className="text-indigo-600 font-medium">
            Change Target Date
          </Text>
        </TouchableOpacity>

        {/* Activity log */}
        <View className="bg-white rounded-2xl p-4 shadow-md">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Activity
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : activityLog.length === 0 ? (
            <Text className="text-sm text-gray-500">No activity yet.</Text>
          ) : (
            activityLog.map((item, idx) => {
              const isNote = item.text !== undefined;

              return (
                <View key={idx} className="flex-row items-start mb-3">
                  {/* Avatar */}
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                    <Text className="text-sm font-semibold text-gray-700">
                      {(
                        item.addedBy?.fullName ||
                        item.addedBy?.individualName ||
                        item.createdBy?.fullName ||
                        ""
                      )
                        .slice(0, 2)
                        .toUpperCase() || "U"}
                    </Text>
                  </View>

                  {/* Content */}
                  <View
                    className={`ml-3 flex-1 p-2 rounded-xl ${getActivityBg(
                      item
                    )}`}
                  >
                    {/* Username */}
                    <Text className="text-gray-700 font-medium">
                      {item.addedBy?.fullName ||
                        item.addedBy?.individualName ||
                        item.createdBy?.fullName ||
                        "Unknown"}
                    </Text>

                    {/* Note text */}
                    {isNote ? (
                      <Text className="text-gray-600 text-sm">{item.text}</Text>
                    ) : (
                      <View>
                        {/* Activity action */}
                        <Text className="text-gray-700 text-sm font-semibold">
                          {item.action}
                        </Text>

                        <Text className="text-gray-600 text-sm">
                          {`From: ${
                            item.oldValue
                              ? item.fieldChanged === "status"
                                ? item.oldValue
                                : item.oldValue === "For Information"
                                ? "For Information"
                                : fmtDate(item.oldValue)
                              : "—"
                          } → To: ${
                            item.newValue
                              ? item.fieldChanged === "status"
                                ? item.newValue
                                : item.newValue === "For Information"
                                ? "For Information"
                                : fmtDate(item.newValue)
                              : "—"
                          }`}
                        </Text>

                        {/* Note attached to activity */}
                        {item.note && (
                          <Text className="text-gray-500 text-sm italic mt-1">
                            Note: {item.note}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Timestamp */}
                    <Text className="text-xs text-gray-400 mt-1">
                      {fmtDate(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal for status + note */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => !saving && setModalVisible(false)}
        onBackButtonPress={() => !saving && setModalVisible(false)}
        swipeDirection="down"
        onSwipeComplete={() => !saving && setModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{ justifyContent: "flex-end", margin: 0 }}
        //  propagateSwipe={true} // important to allow scroll inside modal
      >
        {/* <Pressable
          style={{
            flex: 1,
            justifyContent: "flex-end",
            // backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={() => !saving && setModalVisible(false)}
        > */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0} // adjust as needed
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 30,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 10,
              minHeight: 300,
            }}
            // onStartShouldSetResponrder={() => true}
          >
            {/* Modal Header */}
            <View className="items-center mb-5">
              <View className="w-14 h-1.5 bg-gray-300 rounded-full mb-4" />
              <Text className="text-lg font-semibold text-gray-800">
                Update Status
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Change current status or add an update note.
              </Text>
            </View>

            {/* Status Options */}
            {/* Status Options (2x2 grid) */}
            <View className="flex-wrap flex-row justify-between mb-5">
              {STATUS_OPTIONS.map((s, index) => {
                const active = selectedStatus === s;

                const bg =
                  s === "open"
                    ? "bg-red-50"
                    : s === "closed"
                    ? "bg-green-50"
                    : s === "forwarded"
                    ? "bg-yellow-50"
                    : "bg-emerald-50";

                const textColor =
                  s === "open"
                    ? "text-red-600"
                    : s === "closed"
                    ? "text-green-600"
                    : s === "forwarded"
                    ? "text-yellow-600"
                    : "text-emerald-700";

                const activeBg =
                  s === "open"
                    ? "bg-red-500"
                    : s === "closed"
                    ? "bg-green-500"
                    : s === "forwarded"
                    ? "bg-yellow-500"
                    : "bg-emerald-500";

                const borderColor =
                  s === "open"
                    ? "#FCA5A5" // red-300
                    : s === "closed"
                    ? "#86EFAC" // green-300
                    : s === "forwarded"
                    ? "#FDE047" // yellow-300
                    : "#6EE7B7"; // emerald-300

                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedStatus(s as Status)}
                    activeOpacity={0.9}
                    className={`w-[48%] mb-3 px-4 py-4  rounded-xl items-center justify-center ${
                      active ? activeBg : bg
                    }`}
                    style={{
                      borderWidth: active ? 0 : 1,
                      borderColor: active ? "transparent" : borderColor,
                    }}
                  >
                    <Text
                      className={`font-semibold ${
                        active ? "text-white" : textColor
                      } text-base`}
                    >
                      {s === "forInfo" ? "For Info" : humanLabel(s)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note Input */}
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Add a note (optional)
            </Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="E.g. Marked resolved after team review..."
              multiline
              placeholderTextColor={"#888"}
              numberOfLines={3}
              editable={!saving}
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                padding: 12,
                textAlignVertical: "top",
                backgroundColor: "#FAFAFA",
                marginBottom: 16,
                fontSize: 14,
              }}
            />

            {/* Footer Buttons */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setModalVisible(false);
                    setNoteText("");
                  }
                }}
                activeOpacity={0.8}
                className="flex-1 mr-2 bg-gray-100 rounded-xl py-3 items-center justify-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveStatus}
                activeOpacity={0.8}
                disabled={saving}
                className={`flex-1 ml-2 rounded-xl py-3 items-center justify-center ${
                  saving ? "bg-gray-300" : ""
                }`}
                style={{
                  backgroundColor: saving ? "#D1D5DB" : "#4F46E5",
                  shadowColor: "#6366F1",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Text className="text-white font-semibold">
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* </Pressable> */}
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        isVisible={targetModalVisible}
        onBackdropPress={() => setTargetModalVisible(false)}
        onBackButtonPress={() => setTargetModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        onSwipeComplete={() => setTargetModalVisible(false)}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-1.5 bg-gray-300 rounded-full mb-3" />
            <Text className="text-xl font-semibold text-gray-900 text-center">
              Update Target Date
            </Text>
            <Text className="text-sm text-gray-500 mt-1 text-center px-4">
              Select a new target date or mark as For Information.
            </Text>
          </View>

          {/* Toggle Buttons */}
          <View className="flex-row mb-5 gap-3">
            <TouchableOpacity
              onPress={() => setTempForInfo(false)}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                !tempForInfo ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  !tempForInfo ? "text-white" : "text-gray-700"
                }`}
              >
                Set Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTempForInfo(true);
                setTempTargetDate(null);
              }}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                tempForInfo ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  tempForInfo ? "text-white" : "text-gray-700"
                }`}
              >
                For Information
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker Button */}
          {!tempForInfo && (
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="bg-gray-100 p-3 rounded-xl mb-6 border border-gray-200"
            >
              <Text className="text-gray-700 text-center">
                {tempTargetDate
                  ? tempTargetDate.toDateString()
                  : "Select Target Date"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Date Picker */}
          {showPicker && (
            <DateTimePicker
              value={tempTargetDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (event.type === "set") {
                  setTempTargetDate(selectedDate);
                }
              }}
            />
          )}

          {/* Note Input */}

          <Text className="text-sm text-gray-600 mb-2 font-medium">
            Add a note (required to change target date)
          </Text>
          <TextInput
            value={tempNoteText}
            onChangeText={setTempNoteText}
            placeholder="Add a note here..."
            multiline
            placeholderTextColor={"#888"}
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              padding: 10,
              textAlignVertical: "top",
              backgroundColor: "#F9FAFB",

              marginBottom: 20,
              fontSize: 14,
            }}
          />

          {/* Action Buttons */}
          <View className="flex-row mt-3 gap-3">
            <TouchableOpacity
              onPress={() => setTargetModalVisible(false)}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center justify-center border border-gray-200"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveTargetDate}
              className={`flex-1 rounded-xl py-3 items-center justify-center ${
                saving ||
                !tempNoteText.trim() ||
                (!tempForInfo && !tempTargetDate)
                  ? "bg-gray-300"
                  : "bg-indigo-600"
              }`}
              disabled={
                saving ||
                !tempNoteText.trim() ||
                (!tempForInfo && !tempTargetDate)
              }
            >
              <Text className="text-white font-semibold">
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MinuteDetail;
