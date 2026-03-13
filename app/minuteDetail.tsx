import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeftIcon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  Calendar02Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  DashedLineCircleIcon,
  Note03Icon,
  UserCircleIcon,
  UserIcon,
  Menu05Icon,
  CircleArrowUpRightIcon,
  Calendar03Icon,
  InformationCircleIcon,
  ArrowUpRightIcon,
  Search01Icon,
  Cancel01Icon,
  Delete03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Modal from "react-native-modal";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAvatar from "@/components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const STATUS_OPTIONS = ["open", "closed", "forwarded", "forInfo"] as const;

type Status = (typeof STATUS_OPTIONS)[number];

const statusColors: Record<Status, string> = {
  open: "bg-red-500",
  closed: "bg-green-500",
  forwarded: "bg-yellow-500",
  forInfo: "bg-green-500",
};

const getActivityStyles = (type: string, isDark: boolean) => {
  switch (type) {
    case "targetDate":
      return {
        bg: isDark ? "bg-[#420A0A]" : "bg-[#FFEBEB]",
        text: isDark ? "text-white" : "text-black",
        iconColor: "#DC2626",
        icon: Calendar03Icon,
        title: "Target Date Change",
      };
    case "status":
      return {
        bg: isDark ? "bg-[#1A1A1A]" : "bg-[#F5F5F5]",
        text: isDark ? "text-white" : "text-black",
        iconColor: isDark ? "#D2D2D2" : "#7F7F7F",
        icon: CircleIcon,
        title: "Status Updated",
      };
    case "remark":
    case "discussion":
      return {
        bg: isDark ? "bg-[#09225A]" : "bg-[#E9F1FF]",
        text: isDark ? "text-white" : "text-black",
        iconColor: isDark ? "#6D9EFF" : "#335EB3",
        icon: Menu05Icon,
        title: "Discussion Updated",
      };
    case "activity":
    case "assignee":
    case "responsibility":
      return {
        bg: isDark ? "bg-[#5A2209]" : "bg-[#FFECE3]",
        text: isDark ? "text-white" : "text-black",
        iconColor: isDark ? "#F97316" : "#EA580C",
        icon: UserIcon,
        title: "Assignee Updated",
      };
    case "note":
    default:
      return {
        bg: isDark ? "bg-[#0A4230]" : "bg-[#E3F8EB]",
        text: isDark ? "text-white" : "text-black",
        iconColor: isDark ? "#2DC77B" : "#239F62",
        icon: Note03Icon,
        title: "Note Added",
      };
  }
};

const getStatusBadgeStyles = (status: string | undefined, isDark: boolean) => {
  const s = (status || "").toLowerCase();
  let badgeBg = isDark ? "#5E1010" : "#FED7DA";
  let badgeText = "#DF5B5B";
  let statusLabel = "Open";
  let icon = DashedLineCircleIcon;

  if (s === "closed") {
    badgeBg = isDark ? "#122E25" : "#E8F9ED";
    badgeText = "#1AA45B";
    statusLabel = "Closed";
    icon = CheckmarkCircle02Icon;
  } else if (s === "open" || s === "") {
    // defaults set above
  } else if (s === "forinfo") {
    badgeBg = isDark ? "#2F2F2F" : "#EBEFF2";
    badgeText = isDark ? "#BBBBBB" : "#454545";
    statusLabel = "For Info";
    icon = InformationCircleIcon;
  } else if (s === "forwarded") {
    badgeBg = isDark ? "#282446" : "#D7DEF2";
    badgeText = isDark ? "#9486FB" : "#5B4CCC";
    statusLabel = "Forwarded";
    icon = CircleArrowUpRightIcon;
  }

  return { badgeBg, badgeText, statusLabel, icon };
};

const humanLabel = (s: string) => {
  if (s === "forInfo") return "For Info";
  return (s || "").replace(/^\w/, (c) => c.toUpperCase());
};

const parseJsonSafe = (val: any) => {
  if (!val) return [];
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed.filter((i) => !!i) : [];
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
  const router = useRouter();
  const auth = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { top, bottom } = useSafeAreaInsets();

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
        : parseJsonSafe(params.responsibility)
            .filter((r: any) => !!r)
            .map(
              (r: any) =>
                r.individualName || r.name || (typeof r === "string" ? r : ""),
            ),
    [params.responsibility, params.responsibilityForInfo],
  );
  const raisedByArr = useMemo(
    () =>
      parseJsonSafe(params.raisedBy)
        .filter((r: any) => !!r)
        .map(
          (r: any) =>
            r.individualName || r.name || (typeof r === "string" ? r : ""),
        ),
    [params.raisedBy],
  );

  // --- Status & notes ---
  const [status, setStatus] = useState<Status>(
    (params.status as string as Status) || "open",
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
    params.targetDateForInfo === "true",
  );
  const [tempNoteText, setTempNoteText] = useState("");
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [tempTargetDate, setTempTargetDate] = useState<Date | null>(null);
  const [tempForInfo, setTempForInfo] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // --- Responsibility Change State ---
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [tempAssignees, setTempAssignees] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [loadingProjectUsers, setLoadingProjectUsers] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [newNote, setNewNote] = useState("");

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const noteInputRef = React.useRef<TextInput>(null);

  const addNote = async () => {
    if (!newNote.trim()) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await api.put(
        `/minutes/${meetingId}/minutes/${minuteId}/status`,
        { note: newNote },
        { headers: { Authorization: `Bearer ${auth?.token}` } },
      );
      setNewNote("");
      fetchActivityLog();
    } catch (err) {
      console.error("Failed to add note:", err);
      Alert.alert("Error", "Failed to add note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fetchProjectUsers = async () => {
    if (!auth?.token || !minuteData?.projectId) return;
    setLoadingProjectUsers(true);
    try {
      const res = await api.get(
        `/projects/${minuteData.projectId}/users-dropdown`,
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        },
      );
      const mapped = res.data.map((u: any) => ({
        _id: u._id,
        name: `${u.individualName} (${u.firmName})`,
        individualName: u.individualName,
        firmName: u.firmName,
        designation: u.designation || "",
      }));
      setProjectUsers(mapped);
    } catch (err) {
      console.error("Error fetching project users:", err);
    } finally {
      setLoadingProjectUsers(false);
    }
  };

  useEffect(() => {
    if (showAssigneeModal) {
      fetchProjectUsers();
    }
  }, [showAssigneeModal]);

  const saveAssigneeChange = async () => {
    // Backend to be provided later, currently a placeholder/UI-only update
    Alert.alert("Success", "Assignees updated locally.");
    setShowAssigneeModal(false);
  };

  const getSafeId = (user: any): string => {
    if (!user) return "";
    const idInfo = user._id || user.id;
    if (typeof idInfo === "string") return idInfo;
    if (idInfo && typeof idInfo === "object") {
      if (idInfo._id) return getSafeId(idInfo);
      return idInfo.toString();
    }
    return String(idInfo || Math.random());
  };

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
        ...(Array.isArray(data.statusHistory) ? data.statusHistory : [])
          .filter((s: any) => !!s)
          .map((s: any) => ({
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
        ...(Array.isArray(data.activities) ? data.activities : [])
          .filter((a: any) => !!a)
          .map((a: any) => ({
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
      const noteItems = (Array.isArray(data.notes) ? data.notes : [])
        .filter((n: any) => !!n)
        .map((n: any) => ({
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

    // Optimistic update only for notes (REMOVED as per new logic: notes only with status change in modal)
    // if (!statusChanged && noteProvided) {
    //   pushNoteOptimistic(notePayload, {
    //     fullName: auth?.user?.fullName,
    //     _id: auth?.user?.id,
    //   });
    // }

    if (!statusChanged) {
      setSaving(false);
      setModalVisible(false);
      return;
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

      setNewTargetDate(tempTargetDate || null);
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // console.log("Fetching minute detail", { meetingId, minuteId, token: !!auth?.token });

  return (
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-[#FBFCFD]"}`}>
      {/* Header */}
      <View
        style={{ paddingTop: top + 15 }}
        className="flex-row items-center justify-between px-4 pb-2"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-1"
          >
            <HugeiconsIcon
              icon={ArrowLeftIcon}
              size={22}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text
            className={`text-[18px] font-dmSemiBold ${isDark ? "text-white" : "text-black"}`}
          >
            Minutes of Meeting
          </Text>
        </View>
      </View>
      <View className="flex-1">
        <KeyboardAwareScrollView
          className="px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Info Collapsible */}
          <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.7}
            className="flex-row justify-between items-start mt-2 border-b border-gray-200 dark:border-gray-800 pb-2 -mx-4 px-4"
          >
            <Text
              className={`text-sm font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
            >
              Minute ID :{" "}
              <Text
                className={`${isDark ? "text-[#919191]" : "text-[#454545]"} font-poppins`}
              >
                {minuteId?.slice(-6).toUpperCase() || "N/A"}
              </Text>
            </Text>
            <View className="flex-row items-center">
              <Text
                className={`text-xs ${isDark ? "text-[#919191]" : "text-[#454545]"} mr-1 font-poppinsMedium`}
              >
                Serial No: {serialNo || "—"}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={isDark ? "#919191" : "#454545"}
              />
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View>
              {/* Title */}
              <Text
                className={`text-xl font-dmMedium mt-4 mb-2 ${isDark ? "text-white" : "text-black"}`}
              >
                {issueSubject}
              </Text>

              {/* Status Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedStatus(status);
                  setModalVisible(true);
                }}
                className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4"
              >
                <View className="p-2 rounded-full mr-3">
                  {status === "closed" ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={20}
                      color="#1AA45B"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={
                        status === "open" ? DashedLineCircleIcon : CircleIcon
                      }
                      size={20}
                      color={status === "open" ? "#DF5B5B" : "#5B4CCC"}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-poppins ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Status
                  </Text>
                  <View className="self-start mt-1 flex-row items-center">
                    <Text
                      style={{
                        color: getStatusBadgeStyles(status, isDark).badgeText,
                      }}
                      className=" font-poppinsMedium "
                    >
                      {getStatusBadgeStyles(status, isDark).statusLabel}
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Raised By Row */}
              <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4">
                <View className="p-2 rounded-full mr-3">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={20}
                    color={isDark ? "#919191" : "#454545"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                  >
                    Raised By
                  </Text>
                  <Text
                    className={`text-sm font-poppinsMedium ${isDark ? "text-white" : "text-black"}`}
                  >
                    {raisedByArr.length ? raisedByArr.join(", ") : "—"}
                  </Text>
                </View>
              </View>

              {/* Responsible Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setTempAssignees(
                    Array.isArray(minuteData?.responsibility)
                      ? [...minuteData.responsibility]
                      : [],
                  );
                  setShowAssigneeModal(true);
                  setAssigneeSearchQuery("");
                }}
                className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4"
              >
                <View className="p-2 rounded-full mr-3">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={20}
                    color={isDark ? "#919191" : "#454545"}
                  />
                </View>
                <View className="flex-1 flex-row justify-between items-center pr-2">
                  <Text
                    className={`text-sm font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                  >
                    Responsible
                  </Text>
                  <View className="flex-row items-center">
                    {minuteData?.responsibilityForInfo ? (
                      <Text className="text-xs text-gray-400">
                        For Information
                      </Text>
                    ) : Array.isArray(minuteData?.responsibility) &&
                      minuteData.responsibility.length > 0 ? (
                      <>
                        {minuteData.responsibility.length <= 3 ? (
                          minuteData.responsibility.map((r: any, i: number) => (
                            <GlobalAvatar
                              key={getSafeId(r) || i}
                              name={r.individualName || r.name}
                              size={32}
                              className="-ml-2 border-2 border-white dark:border-black"
                            />
                          ))
                        ) : (
                          <>
                            {minuteData.responsibility
                              .slice(0, 2)
                              .map((r: any, i: number) => (
                                <GlobalAvatar
                                  key={getSafeId(r) || i}
                                  name={r.individualName || r.name}
                                  size={32}
                                  className="-ml-2 border-2 border-white dark:border-black"
                                />
                              ))}
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                              }}
                              className="-ml-2 bg-[#F0F3F7] dark:bg-zinc-800 border-2 border-white dark:border-black items-center justify-center"
                            >
                              <Text className="text-[11px] font-dmBold text-[#454545] dark:text-[#D2D2D2]">
                                +{minuteData.responsibility.length - 2}
                              </Text>
                            </View>
                          </>
                        )}
                      </>
                    ) : (
                      <Text className="text-xs text-gray-400">Unassigned</Text>
                    )}
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Target Date Row */}
              <TouchableOpacity
                activeOpacity={0.7}
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
                className="flex-row items-center py-3 -mx-4 px-4"
              >
                <View className="p-2 rounded-full mr-3">
                  <HugeiconsIcon
                    icon={Calendar02Icon}
                    size={20}
                    color={isDark ? "#919191" : "#454545"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-poppins ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                  >
                    Target Date
                  </Text>
                  <Text
                    className={`text-sm font-poppinsMedium ${isDark ? "text-white" : "text-black"}`}
                  >
                    {minuteData
                      ? minuteData.targetDateForInfo
                        ? "For Information"
                        : minuteData.targetDate
                          ? fmtDate(minuteData.targetDate)
                          : "—"
                      : targetDate}
                  </Text>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color="#919191"
                />
              </TouchableOpacity>

              {/* Description Section */}
              {minuteData?.description || description ? (
                <>
                  <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />
                  <View className="py-4">
                    <Text
                      className={`text-base font-poppinsMedium mb-2 ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                    >
                      Description
                    </Text>
                    <Text
                      className={`text-[14px] font-poppins leading-5 ${isDark ? "text-white" : "text-black"}`}
                    >
                      {minuteData?.description || description}
                    </Text>
                  </View>
                </>
              ) : null}

              {/* Remarks Section */}
              {minuteData?.remarks || remarks ? (
                <>
                  <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />
                  <View className="py-4">
                    <Text
                      className={`text-base font-poppinsMedium mb-2 ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                    >
                      Remarks
                    </Text>
                    <Text
                      className={`text-[14px] font-poppins leading-5 ${isDark ? "text-white" : "text-black"}`}
                    >
                      {minuteData?.remarks || remarks}
                    </Text>
                  </View>
                </>
              ) : null}

              <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />

              {/* Attachments Section */}
              {Array.isArray(minuteData?.attachments) &&
                minuteData.attachments.length > 0 && (
                  <>
                    <View className="my-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text
                          className={`text-base font-poppinsMedium ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                        >
                          Attachments
                        </Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                      >
                        {minuteData.attachments.map(
                          (item: any, index: number) => {
                            const url =
                              typeof item === "string" ? item : item?.url || "";
                            const fileName =
                              url.split("/").pop() || `Attachment ${index + 1}`;
                            return (
                              <TouchableOpacity
                                key={index}
                                className={`mr-3 rounded-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                                style={{ width: 140 }}
                                activeOpacity={0.7}
                                onPress={() => {
                                  // In a real app, you might use Linking or a viewer
                                  Alert.alert("Open Attachment", url);
                                }}
                              >
                                {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                  <View className="w-full h-24 bg-gray-200 dark:bg-zinc-700 items-center justify-center">
                                    {/* Ideally an Image component here if it's an image */}
                                    <Ionicons
                                      name="image-outline"
                                      size={32}
                                      color="#999"
                                    />
                                  </View>
                                ) : (
                                  <View className="w-full h-24 bg-gray-200 dark:bg-zinc-700 items-center justify-center">
                                    <Ionicons
                                      name="document-attach-outline"
                                      size={32}
                                      color="#999"
                                    />
                                  </View>
                                )}
                                <View className="p-2">
                                  <Text
                                    className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}
                                    numberOfLines={1}
                                  >
                                    {fileName}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          },
                        )}
                      </ScrollView>
                    </View>
                    <View className="h-1 bg-[#F6F8FA] dark:bg-[#413E47] -mx-4" />
                  </>
                )}
            </View>
          )}

          {/* Quick Actions */}
          <View className="flex-row my-4">
            <TouchableOpacity
              onPress={() => {
                setSelectedStatus(status);
                setModalVisible(true);
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mr-2 ${isDark ? "bg-zinc-900" : "bg-gray-100"}`}
            >
              <HugeiconsIcon
                icon={CircleIcon}
                size={18}
                color={isDark ? "#D2D2D2" : "#454545"}
              />
              <Text
                className={`ml-2 font-poppinsMedium ${isDark ? "text-[#D2D2D2]" : "text-[#454545]"}`}
              >
                Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                noteInputRef.current?.focus();
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? "bg-zinc-900" : "bg-gray-100"}`}
            >
              <HugeiconsIcon
                icon={Note03Icon}
                size={18}
                color={isDark ? "#D2D2D2" : "#454545"}
              />
              <Text
                className={`ml-2 font-poppinsMedium ${isDark ? "text-[#D2D2D2]" : "text-[#454545]"}`}
              >
                Note
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity Log */}
          <Text
            className={`text-lg font-dmSemiBold my-4 ${isDark ? "text-white" : "text-black"}`}
          >
            Activity Log
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color="#5B4CCC" />
          ) : activityLog.length === 0 ? (
            <Text
              className={`text-sm font-poppins text-center py-8 ${isDark ? "text-zinc-500" : "text-gray-400"}`}
            >
              No activities yet.
            </Text>
          ) : (
            <View>
              {activityLog.map((item, idx) => {
                const style = getActivityStyles(item.type, isDark);
                return (
                  <View key={idx} className="mb-2">
                    {/* Activity Card */}
                    <View className={`px-4 py-3 rounded-2xl ${style.bg}`}>
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-0.5">
                          <HugeiconsIcon
                            icon={style.icon}
                            size={20}
                            color={style.iconColor}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-poppinsMedium text-[14px] ${style.text} `}
                          >
                            {style.title}
                          </Text>

                          {/* Details */}
                          {item.type === "status" && item.newValue && (
                            <View className="flex-row items-center mt-2 mb-2">
                              {/* Old Status Pill */}
                              <View
                                style={{
                                  backgroundColor: getStatusBadgeStyles(
                                    item.oldValue,
                                    isDark,
                                  ).badgeBg,
                                }}
                                className="flex-row items-center rounded-lg px-2.5 py-1"
                              >
                                <HugeiconsIcon
                                  icon={
                                    getStatusBadgeStyles(item.oldValue, isDark)
                                      .icon
                                  }
                                  size={14}
                                  color={
                                    getStatusBadgeStyles(item.oldValue, isDark)
                                      .badgeText
                                  }
                                />
                                <Text
                                  style={{
                                    color: getStatusBadgeStyles(
                                      item.oldValue,
                                      isDark,
                                    ).badgeText,
                                  }}
                                  className="ml-1 text-xs font-dmMedium"
                                >
                                  {
                                    getStatusBadgeStyles(item.oldValue, isDark)
                                      .statusLabel
                                  }
                                </Text>
                              </View>

                              {/* Arrow */}
                              <View className="mx-2">
                                <HugeiconsIcon
                                  icon={ArrowRight02Icon}
                                  size={16}
                                  color={isDark ? "#9CA3AF" : "#454545"}
                                />
                              </View>

                              {/* New Status Pill */}
                              <View
                                style={{
                                  backgroundColor: getStatusBadgeStyles(
                                    item.newValue,
                                    isDark,
                                  ).badgeBg,
                                }}
                                className="flex-row items-center rounded-lg px-2.5 py-1"
                              >
                                <HugeiconsIcon
                                  icon={
                                    getStatusBadgeStyles(item.newValue, isDark)
                                      .icon
                                  }
                                  size={14}
                                  color={
                                    getStatusBadgeStyles(item.newValue, isDark)
                                      .badgeText
                                  }
                                />
                                <Text
                                  style={{
                                    color: getStatusBadgeStyles(
                                      item.newValue,
                                      isDark,
                                    ).badgeText,
                                  }}
                                  className="ml-1 text-xs font-dmMedium"
                                >
                                  {
                                    getStatusBadgeStyles(item.newValue, isDark)
                                      .statusLabel
                                  }
                                </Text>
                              </View>
                            </View>
                          )}

                          {(item.type === "targetDate" ||
                            item.type === "activity" ||
                            item.type === "assignee" ||
                            item.type === "responsibility") && (
                            <View className="mt-1 mb-2">
                              {item.oldValue && item.oldValue !== "—" && (
                                <Text
                                  className={`text-[12px] font-poppins ${isDark ? "text-zinc-400" : "text-[#454545]"}`}
                                >
                                  From :{" "}
                                  {item.type === "targetDate"
                                    ? fmtDate(item.oldValue)
                                    : item.oldValue}
                                </Text>
                              )}
                              <Text
                                className={`text-[12px] font-poppins mt-0.5 ${isDark ? "text-zinc-400" : "text-[#454545]"}`}
                              >
                                To :{" "}
                                {item.type === "targetDate"
                                  ? fmtDate(item.newValue)
                                  : item.newValue}
                              </Text>
                            </View>
                          )}

                          {item.type === "note" && item.text && (
                            <Text
                              className={`text-[12px] font-poppins mt-1 mb-1 ${isDark ? "text-zinc-300" : "text-[#454545]"}`}
                            >
                              {item.text}
                            </Text>
                          )}

                          {item.note && item.type !== "note" && (
                            <Text
                              className={`text-[12px] font-poppins mt-1 mb-1 ${isDark ? "text-zinc-300" : "text-[#454545]"}`}
                            >
                              Note : {item.note}
                            </Text>
                          )}

                          {/* Footer */}
                          <Text
                            className={`text-[11px] font-poppins mt-1 ${isDark ? "text-zinc-500" : "text-[#454545] opacity-60"}`}
                          >
                            By{" "}
                            {item.addedBy?.fullName ||
                              item.addedBy?.individualName ||
                              item.createdBy?.fullName ||
                              "Unknown"}{" "}
                            • {fmtDate(item.createdAt)} -{" "}
                            {new Date(item.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </KeyboardAwareScrollView>
      </View>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          className="px-3 py-2 pb-6 rounded-t-[20px] border-x border-t flex-row items-end bg-white dark:bg-[#1A1A1A]"
          style={{
            borderColor: isDark ? "#413E47" : "#E0E5EB",
            paddingBottom: bottom > 0 ? bottom : 0,
          }}
        >
          <View className="flex-1 pb-4 flex-row items-end">
            <TextInput
              ref={noteInputRef}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Write a Note..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              className="flex-1 text-black dark:text-white font-poppins text-[15px] max-h-[120px]"
              multiline
              style={{ paddingBottom: Platform.OS === "ios" ? 4 : 0 }}
            />
          </View>

          <TouchableOpacity
            onPress={addNote}
            disabled={!newNote.trim() || saving}
            className={`ml-3 w-11 h-11 mb-2 rounded-full items-center justify-center shadow-lg ${
              newNote.trim() && !saving ? "bg-[#5B4CCC]" : "bg-[#9CA3AF]"
            }`}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>

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
      >
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View
            style={{
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
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
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mb-6" />
              <Text
                className={`text-xl font-dmSemiBold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Change Status
              </Text>
            </View>

            <View className="mb-6">
              {STATUS_OPTIONS.map((s, index) => {
                const active = selectedStatus === s;
                const { icon, iconColor, statusLabel } = (() => {
                  const styles = getStatusBadgeStyles(s, isDark);
                  return {
                    icon: styles.icon,
                    iconColor: styles.badgeText,
                    statusLabel: styles.statusLabel,
                  };
                })();

                return (
                  <View key={s}>
                    <TouchableOpacity
                      onPress={() => setSelectedStatus(s as Status)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-4"
                    >
                      <View className="mr-4">
                        <HugeiconsIcon
                          icon={icon}
                          size={24}
                          color={iconColor}
                        />
                      </View>
                      <Text
                        className={`flex-1 text-base font-poppinsMedium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {statusLabel}
                      </Text>
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          active
                            ? "border-[#6366F1]"
                            : isDark
                              ? "border-zinc-700"
                              : "border-gray-200"
                        }`}
                      >
                        {active && (
                          <View className="w-3 h-3 rounded-full bg-[#6366F1]" />
                        )}
                      </View>
                    </TouchableOpacity>
                    {index < STATUS_OPTIONS.length - 1 && (
                      <View
                        className={`h-[1px] ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {status !== selectedStatus && (
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add an update note (optional)"
                multiline
                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                numberOfLines={2}
                editable={!saving}
                className={`mb-6 p-3 rounded-xl text-sm font-poppins ${
                  isDark ? "bg-zinc-900 text-white" : "bg-gray-50 text-black"
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#27272A" : "#E5E7EB",
                  textAlignVertical: "top",
                }}
              />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setModalVisible(false);
                    setNoteText("");
                  }
                }}
                activeOpacity={0.8}
                className={`flex-1 rounded-2xl py-4 items-center justify-center border ${
                  isDark
                    ? "bg-black border-zinc-700"
                    : "bg-white border-gray-900"
                }`}
              >
                <Text
                  className={`text-base font-dmBold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveStatus}
                activeOpacity={0.8}
                disabled={saving || selectedStatus === status}
                className={`flex-1 rounded-2xl py-4 items-center justify-center ${
                  saving || selectedStatus === status ? "bg-zinc-700" : "bg-[#6366F1]"
                }`}
              >
                <Text className="text-white text-base font-dmBold">
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardStickyView>
      </Modal>

      {/* Modal for Target Date */}
      <Modal
        isVisible={targetModalVisible}
        onBackdropPress={() => !saving && setTargetModalVisible(false)}
        onBackButtonPress={() => !saving && setTargetModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        onSwipeComplete={() => !saving && setTargetModalVisible(false)}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View
            style={{
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
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
              <View className="w-16 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mb-3" />
              <Text
                className={`text-xl font-dmSemiBold text-center ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Update Target Date
              </Text>
              <Text
                className={`text-sm mt-1 text-center px-4 font-poppins ${isDark ? "text-zinc-500" : "text-gray-500"}`}
              >
                Select a new target date or mark as For Information.
              </Text>
            </View>

            {/* Toggle Buttons */}
            <View className="flex-row mb-5 gap-3">
              <TouchableOpacity
                onPress={() => setTempForInfo(false)}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  !tempForInfo
                    ? "bg-indigo-600"
                    : isDark
                      ? "bg-zinc-800"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-dmBold ${
                    !tempForInfo
                      ? "text-white"
                      : isDark
                        ? "text-zinc-400"
                        : "text-gray-700"
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
                  tempForInfo
                    ? "bg-indigo-600"
                    : isDark
                      ? "bg-zinc-800"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-dmBold ${
                    tempForInfo
                      ? "text-white"
                      : isDark
                        ? "text-zinc-400"
                        : "text-gray-700"
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
                className={`p-3 rounded-xl mb-6 border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-gray-100 border-gray-200"}`}
              >
                <Text
                  className={`text-center font-poppins ${isDark ? "text-white" : "text-gray-700"}`}
                >
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
                    setTempTargetDate(selectedDate || null);
                  }
                }}
              />
            )}

            {/* Note Input */}

            <Text
              className={`text-sm mb-2 font-poppinsMedium ${isDark ? "text-zinc-400" : "text-gray-600"}`}
            >
              Add a note (required)
            </Text>
            <TextInput
              value={tempNoteText}
              onChangeText={setTempNoteText}
              placeholder="Reason for change..."
              multiline
              placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#27272A" : "#E5E7EB",
                borderRadius: 12,
                padding: 10,
                textAlignVertical: "top",
                backgroundColor: isDark ? "#09090B" : "#F9FAFB",
                marginBottom: 20,
                fontSize: 14,
                color: isDark ? "white" : "black",
                fontFamily: "Poppins-Regular",
              }}
            />

            {/* Action Buttons */}
            <View className="flex-row mt-3 gap-3">
              <TouchableOpacity
                onPress={() => setTargetModalVisible(false)}
                className={`flex-1 rounded-xl py-3 items-center justify-center border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200"}`}
              >
                <Text
                  className={`font-dmBold ${isDark ? "text-zinc-300" : "text-gray-700"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveTargetDate}
                disabled={
                  saving ||
                  !tempNoteText.trim() ||
                  (!tempForInfo && !tempTargetDate)
                }
                className={`flex-1 rounded-xl py-3 items-center justify-center ${
                  saving ||
                  !tempNoteText.trim() ||
                  (!tempForInfo && !tempTargetDate)
                    ? isDark
                      ? "bg-zinc-700"
                      : "bg-gray-300"
                    : "bg-indigo-600"
                }`}
              >
                <Text className="text-white font-dmBold">
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardStickyView>
      </Modal>

      {/* Change Assignee Modal */}
      <Modal
        isVisible={showAssigneeModal}
        onBackdropPress={() => setShowAssigneeModal(false)}
        onSwipeComplete={() => setShowAssigneeModal(false)}
        swipeDirection="down"
        propagateSwipe={true}
        style={{ margin: 0, justifyContent: "flex-end" }}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        onModalHide={() => Keyboard.dismiss()}
        onBackButtonPress={() => setShowAssigneeModal(false)}
        useNativeDriver
        hideModalContentWhileAnimating
        avoidKeyboard={false}
        statusBarTranslucent={true}
      >
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          className={`rounded-t-3xl px-4 pt-6 pb-8 h-[85vh] ${isDark ? "bg-[#1A1A1A]" : "bg-[#FBFCFD]"}`}
        >
          {/* Handle Bar */}
          <View className="w-full items-center mb-4">
            <View className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </View>

          {/* Title */}
          <Text
            className={`text-xl font-dmSemiBold text-center mb-4 ${isDark ? "text-white" : "text-black"}`}
          >
            Change Responsibility
          </Text>

          {/* Search Bar */}
          <View
            className={`flex-row items-center px-4 py-1 rounded-xl mb-6 ${isDark ? "bg-[#121212] border border-[#606060]" : "bg-[#F6F8FA] border border-[#E0E5EB]"}`}
          >
            <HugeiconsIcon icon={Search01Icon} size={20} color="#919191" />
            <TextInput
              value={assigneeSearchQuery}
              onChangeText={setAssigneeSearchQuery}
              placeholder="Search people"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              className={`flex-1 ml-3 font-poppins text-[15px] ${isDark ? "text-white" : "text-black"}`}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Currently Assigned Section */}
            {tempAssignees.length > 0 && (
              <View className="mb-6">
                <Text
                  className={`text-[12px] font-poppinsMedium mb-3 ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
                >
                  Selected
                </Text>
                {tempAssignees.map((user) => {
                  const userId = getSafeId(user);
                  return (
                    <View
                      key={userId}
                      className="flex-row items-center justify-between mb-4"
                    >
                      <View className="flex-row items-center">
                        <GlobalAvatar
                          name={user.individualName || user.name}
                          size={40}
                        />
                        <Text
                          className={`ml-3 font-poppins text-[15px] ${isDark ? "text-white" : "text-black"}`}
                        >
                          {user.individualName || user.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setTempAssignees((prev) =>
                            prev.filter((u) => getSafeId(u) !== userId),
                          );
                        }}
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={20}
                          color="#919191"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* People List Section */}
            <View className="mb-4">
              <Text
                className={`text-[12px] font-poppinsMedium mb-3 ${isDark ? "text-[#919191]" : "text-[#454545]"}`}
              >
                People
              </Text>
              {loadingProjectUsers ? (
                <ActivityIndicator size="small" color="#5B4CCC" />
              ) : (
                projectUsers
                  .filter((u) => {
                    const name = u.individualName || u.name || "";
                    const isMatch = name
                      .toLowerCase()
                      .includes(assigneeSearchQuery.toLowerCase());
                    const isAlreadyIn = tempAssignees.some((ta) => {
                      return getSafeId(ta) === getSafeId(u);
                    });
                    return isMatch && !isAlreadyIn;
                  })
                  .map((user) => {
                    const userId = getSafeId(user);
                    return (
                      <TouchableOpacity
                        key={userId}
                        onPress={() => {
                          setTempAssignees((prev) => [...prev, user]);
                        }}
                        className="flex-row items-center mb-4"
                      >
                        <GlobalAvatar
                          name={user.individualName || user.name}
                          size={40}
                        />
                        <Text
                          className={`ml-3 font-poppins text-[15px] ${isDark ? "text-white" : "text-black"}`}
                        >
                          {user.individualName || user.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              )}
            </View>
          </ScrollView>

          {/* Bottom Buttons */}
          <View className="flex-row gap-3 pt-4">
            <TouchableOpacity
              onPress={() => setShowAssigneeModal(false)}
              className={`flex-1 py-3 rounded-xl border ${isDark ? "border-white" : "border-black"}`}
            >
              <Text
                className={`text-center text-[16px] font-poppins ${isDark ? "text-white" : "text-black"}`}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={saveAssigneeChange} className="flex-1">
              <LinearGradient
                colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12 }}
                className="py-3 items-center justify-center"
              >
                <Text className="text-[16px] font-poppins text-white">
                  Save
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardStickyView>
      </Modal>
    </View>
  );
};

export default MinuteDetail;
