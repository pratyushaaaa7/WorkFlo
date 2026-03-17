import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  LogBox,
} from "react-native";
LogBox.ignoreLogs([
  "ref.measureLayout must be called with a ref to a native component",
]);

import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import Animated from "react-native-reanimated";
// import Collapsible from "react-native-collapsible";
import {
  AllBookmarkIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Calendar04Icon,
  Cancel01Icon,
  CircleIcon,
  Clock01Icon,
  Delete02Icon,
  Download01Icon,
  Menu01Icon,
  Note01Icon,
  PlusSignCircleIcon,
  Search01Icon,
  Tick01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
// import { exportAgendaWithAttendees } from "../utils/agendaExcel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const handleDownloadAgenda = async (
  meeting: any,
  projectName: any,
  accountName: any,
  company: any,
  token: any,
  format: "pdf" | "excel",
) => {
  try {
    const payload = {
      meeting,
      projectName,
      accountName,
      company,
    };

    // 🔀 Route selection
    const endpoint =
      format === "pdf"
        ? "/minutes/export/agenda/pdf"
        : "/minutes/export/agenda";

    const response = await api.post(endpoint, payload, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 🔀 File name & MIME
    const fileName =
      format === "pdf"
        ? `Meeting_${meeting.meetingNumber}_Agenda.pdf`
        : `Meeting_${meeting.meetingNumber}_Agenda.xlsx`;

    const mimeType =
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const uti = format === "pdf" ? "com.adobe.pdf" : "com.microsoft.excel.xlsx";

    // 🌐 WEB
    if (Platform.OS === "web") {
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } else {
      // 📱 MOBILE
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
        mimeType,
        dialogTitle:
          format === "pdf"
            ? "Share Meeting Agenda (PDF)"
            : "Share Meeting Agenda (Excel)",
        UTI: uti,
      });
    }
  } catch (err) {
    console.error("Failed to download agenda:", err);
    alert("Failed to download agenda");
  }
};

type DirectoryUser = {
  label: string;
  value: string;
  attendeeName: string;
  role?: string;
  organization?: string;
  designation?: string;
  email?: string;
  phone?: string;
  contactNumbers?: any;
};

const CreateMinutes = () => {
  const router = useRouter();
  const { meetingId, projectId, projectName, company, actionType } =
    useLocalSearchParams();
  // console.log(meetingId, projectId, projectName, company);
  const isEditMOM = actionType === "editMOM";

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const STORAGE_KEY = `minutes_draft_${projectId || "new"}`;
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [isAgendaSubmitting, setIsAgendaSubmitting] = useState(false);
  const [isMomSubmitting, setIsMomSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [expandedMinute, setExpandedMinute] = useState<number | null>(null);
  const [isAgendaDownloading, setIsAgendaDownloading] = useState(false);

  const [isDraftSubmitted, setIsDraftSubmitted] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Section Toggles
  const [showMeetingInfo, setShowMeetingInfo] = useState(true);
  const [showAttendeesSection, setShowAttendeesSection] = useState(true);
  const [showMinutesSection, setShowMinutesSection] = useState(true);
  const [activeTab, setActiveTab] = useState("attendees"); // "attendees" or "minutes"

  // ✅ Meeting-level state
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [meetingTime, setMeetingTime] = useState<string>(""); // string for time
  const [meetingVenue, setMeetingVenue] = useState<string>("");
  const [isATReview, setIsATReview] = useState(false); // 👈 new state

  const [showMeetingDatePicker, setShowMeetingDatePicker] = useState(false);
  const [showMeetingTimePicker, setShowMeetingTimePicker] = useState(false);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([
    {
      id: "initial-att-1",
      sNo: 1,
      attendeeName: "",
      organization: "",
      designation: "",
      email: "",
      contactNumbers: [""],
    },
  ]);

  // Minutes state
  const [minutes, setMinutes] = useState<any[]>([
    {
      id: "initial-min-1",
      serialNo: 1,
      raisedBy: [],
      issueSubject: "",
      issueDescription: "",
      targetDate: null,
      responsibility: [],
      remarks: "",
      targetDateForInfo: false, // ✅ new
      responsibilityForInfo: false, // ✅ new
      status: "open", // ✅ default to Open
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  // Users for responsibility dropdown
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const [openDirectoryFor, setOpenDirectoryFor] = useState<number | null>(null);
  const [meetingNumber, setMeetingNumber] = useState<number | null>(null);

  const [forwardedModalVisible, setForwardedModalVisible] = useState(false);
  const [forwardedMinutes, setForwardedMinutes] = useState<any[]>([]);

  const dropdownRef = useRef<any>(null);
  const responsibilityRef = useRef<any>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  //to store the minutes data even after the app is closed
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue) {
          const savedData = JSON.parse(jsonValue);
          setMeetingTitle(savedData.meetingTitle || "");
          setMeetingDate(
            savedData.meetingDate ? new Date(savedData.meetingDate) : null,
          );
          setMeetingTime(savedData.meetingTime || "");
          setMeetingVenue(savedData.meetingVenue || "");
          setAttendees(
            (savedData.attendees || []).map((a, i) => ({
              ...a,
              id: a.id || "att-" + Date.now() + "-" + i + "-" + Math.random(),
            })),
          );
          setMinutes(
            (savedData.minutes || []).map((m, i) => ({
              ...m,
              id: m.id || "min-" + Date.now() + "-" + i + "-" + Math.random(),
            })),
          );
        }
      } catch (err) {
        console.log("Error loading stored data:", err);
      }
    };
    loadStoredData();
  }, [projectId]);

  //Save data automatically whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = {
          meetingTitle,
          meetingDate,
          meetingTime,
          meetingVenue,
          attendees,
          minutes,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        // console.log("Data saved locally");
      } catch (err) {
        console.log("Error saving to AsyncStorage:", err);
      }
    };
    // Avoid saving immediately on mount before data loads
    if (meetingDate || attendees.length > 1 || minutes.length > 1) {
      saveData();
    }
  }, [meetingDate, meetingTime, meetingVenue, attendees, minutes, STORAGE_KEY]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // console.log("hello test", res.data);
        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
          attendeeName: u.individualName,
          // role: u.role || "",
          organization: u.firmName || "",
          designation: u.designation || "",
          email: u.email || "",
          contactNumbers: u.contactNumbers?.length ? u.contactNumbers : [""], // ✅ use existing array
        }));

        setUsers(formatted);
        // console.log(formatted);
      } catch (err) {
        Toast.show({ type: "error", text1: "Error fetching users" });
        console.log(err);
      }
    };
    fetchUsers();
  }, [token, projectId]);

  const fetchForwardedMinutes = async () => {
    try {
      if (!token || !projectId) return;
      const res = await api.get(`/minutes/forwarded/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForwardedMinutes(res.data); // array of forwarded minutes
      // console.log(res.data);
      // console.log(JSON.stringify(res.data, null, 2));
      setForwardedModalVisible(true);
    } catch (err) {
      Toast.show({ type: "error", text1: "Error fetching forwarded minutes" });
      console.log(err);
    }
  };

  // Utility functions
  const updateAttendee = (index: number, field: string, value: any) => {
    setAttendees((prev) =>
      prev.map((a, i) => {
        if (i === index) {
          if (field === "phone") {
            const contactNumbers = [...(a.contactNumbers || [""])];
            contactNumbers[0] = value;
            return { ...a, contactNumbers };
          }
          return { ...a, [field]: value };
        }
        return a;
      }),
    );
  };

  const addAttendee = () =>
    setAttendees((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random()}`,
        sNo: prev.length + 1,
        attendeeName: "",
        organization: "",
        designation: "",
        email: "",
        contactNumbers: [""],
      },
    ]);
  const deleteAttendee = (index: number) => {
    setAttendees((prev) =>
      prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, sNo: i + 1 })),
    );
  };

  const updateMinute = (index: number, field: string, value: any) => {
    setMinutes((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };
  const addMinute = () =>
    setMinutes((prev) => [
      ...prev,
      {
        id: `min-${Date.now()}-${Math.random()}`,
        serialNo: prev.length + 1,
        raisedBy: [],
        issueSubject: "",
        issueDescription: "",
        targetDate: null,
        responsibility: [],
        remarks: "",
        status: "open",
      },
    ]);
  const deleteMinute = (index: number) => {
    setMinutes((prev) =>
      prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, serialNo: i + 1 })),
    );
  };

  const openDatePicker = (index: number) => {
    setDateIndex(index);
    setShowDatePicker(true);
  };
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && dateIndex !== null) {
      updateMinute(dateIndex, "targetDate", selectedDate.toISOString());
      setDateIndex(null);
    }
  };

  const onAttendeeDragEnd = ({ data }: { data: any[] }) => {
    setAttendees(data.map((item, index) => ({ ...item, sNo: index + 1 })));
  };

  const onMinuteDragEnd = ({ data }: { data: any[] }) => {
    setMinutes(data.map((item, index) => ({ ...item, serialNo: index + 1 })));
  };

  const renderAttendee = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
      const index = getIndex() ?? 0;
      const att = item;
      return (
        <ScaleDecorator>
          <View
            collapsable={false}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 12,
              backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
              opacity: isActive ? 0.7 : 1,
              borderWidth: isActive ? 1 : 0,
              borderColor: "#5B4CCC",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={drag}
              delayLongPress={2000}
              onPress={() =>
                setExpandedAttendee(expandedAttendee === index ? null : index)
              }
              className={`flex-row justify-between items-center px-4 py-3 ${
                isDarkMode ? "bg-[#262626]" : "bg-[#F3F4F6]"
              }`}
            >
              <View className="flex-row items-center">
                <View>
                  <Text
                    className={`font-dmSemiBold text-[15px] ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Attendee {att.sNo}
                  </Text>
                  {att.attendeeName ? (
                    <Text
                      className={`text-sm font-poppins mt-0.5 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {att.attendeeName}
                    </Text>
                  ) : null}
                </View>
              </View>
              <HugeiconsIcon
                icon={
                  expandedAttendee === index
                    ? ArrowDown01Icon
                    : ArrowRight01Icon
                }
                size={18}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            {expandedAttendee === index && (
              <View className="px-4 py-4 gap-3">
                {/* Directory Select Option */}
                {openDirectoryFor === index ? (
                  <Dropdown
                    style={{
                      height: 48,
                      borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                      marginBottom: 8,
                    }}
                    placeholderStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#6B7280" : "#9CA3AF",
                    }}
                    selectedTextStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#E5E7EB" : "#111827",
                    }}
                    activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
                    data={users}
                    labelField="label"
                    valueField="value"
                    value={att.userId}
                    placeholder="Search in directory..."
                    search
                    searchPlaceholder="Type a name..."
                    onChange={(val) => {
                      const user = users.find((u) => u.value === val.value);
                      if (user) {
                        updateAttendee(index, "userId", user.value);
                        updateAttendee(
                          index,
                          "attendeeName",
                          user.attendeeName || "",
                        );
                        updateAttendee(
                          index,
                          "organization",
                          user.organization || "",
                        );
                        updateAttendee(
                          index,
                          "designation",
                          user.designation || "",
                        );
                        updateAttendee(index, "email", user.email || "");
                        updateAttendee(
                          index,
                          "contactNumbers",
                          user.contactNumbers || [""],
                        );
                      }
                      setOpenDirectoryFor(null);
                    }}
                  />
                ) : !att.userId ? (
                  <TouchableOpacity
                    onPress={() => setOpenDirectoryFor(index)}
                    className={`flex-row items-center border border-dashed rounded-xl py-3 justify-center mb-2 ${
                      isDarkMode
                        ? "border-[#A78BFA] bg-[#A78BFA]/10"
                        : "border-[#8B5CF6] bg-[#8B5CF6]/5"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={18}
                      color={isDarkMode ? "#A78BFA" : "#8B5CF6"}
                    />
                    <Text
                      className={`ml-2 font-poppinsMedium text-sm ${isDarkMode ? "text-[#A78BFA]" : "text-[#8B5CF6]"}`}
                    >
                      Find in Directory
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Manual Fields */}
                <View className="gap-3">
                  <TextInput
                    placeholder="Full Name *"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={att.attendeeName}
                    onChangeText={(t) =>
                      updateAttendee(index, "attendeeName", t)
                    }
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                  <TextInput
                    placeholder="Organization"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={att.organization}
                    onChangeText={(t) =>
                      updateAttendee(index, "organization", t)
                    }
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                  <TextInput
                    placeholder="Designation"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={att.designation}
                    onChangeText={(t) =>
                      updateAttendee(index, "designation", t)
                    }
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={att.email}
                    onChangeText={(t) => updateAttendee(index, "email", t)}
                    keyboardType="email-address"
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                  <TextInput
                    placeholder="Phone Number"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={att.contactNumbers[0] || ""}
                    onChangeText={(t) => updateAttendee(index, "phone", t)}
                    keyboardType="phone-pad"
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                </View>

                {/* Actions */}
                <View className="flex-row justify-end space-x-4 mt-2">
                  {attendees.length > 1 && (
                    <TouchableOpacity
                      onPress={() => deleteAttendee(index)}
                      className="flex-row items-center"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={14}
                        color="#EF4444"
                        className="mr-1"
                      />
                      <Text className="text-red-500 font-poppinsMedium text-sm">
                        Remove Attendee
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScaleDecorator>
      );
    },
    [isDarkMode, expandedAttendee, openDirectoryFor, users, attendees.length],
  );

  const renderMinute = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
      const index = getIndex() ?? 0;
      const m = item;
      return (
        <ScaleDecorator>
          <View
            collapsable={false}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 12,
              backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
              opacity: isActive ? 0.7 : 1,
              borderWidth: isActive ? 1 : 0,
              borderColor: "#5B4CCC",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={drag}
              delayLongPress={2000}
              onPress={() =>
                setExpandedMinute(expandedMinute === index ? null : index)
              }
              className={`flex-row justify-between items-center px-4 py-3 ${
                isDarkMode ? "bg-[#262626]" : "bg-[#F3F4F6]"
              }`}
            >
              <View className="flex-row items-center">
                <View>
                  <Text
                    className={`font-dmSemiBold text-[15px] ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Minute {m.serialNo}
                  </Text>
                  {m.issueSubject ? (
                    <Text
                      className={`text-sm font-poppins mt-0.5 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {m.issueSubject}
                    </Text>
                  ) : null}
                </View>
              </View>
              <HugeiconsIcon
                icon={
                  expandedMinute === index ? ArrowDown01Icon : ArrowRight01Icon
                }
                size={18}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            {expandedMinute === index && (
              <View className="px-4 py-4 gap-3">
                  {/* Raised By */}
                  <MultiSelect
                    ref={dropdownRef}
                    style={{
                      height: 48,
                      borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                    }}
                    placeholderStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#6B7280" : "#9CA3AF",
                    }}
                    selectedTextStyle={{
                      fontSize: 12,
                      color: isDarkMode ? "#E5E7EB" : "#111827",
                    }}
                    selectedStyle={{
                      borderRadius: 10,
                      backgroundColor: isDarkMode ? "#374151" : "#E0E7FF",
                      padding: 4,
                    }}
                    containerStyle={{
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: isDarkMode ? "#1C1C1E" : "#fff",
                    }}
                    activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
                    inputSearchStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "#E5E7EB" : "#111827",
                    }}
                    search
                    labelField="label"
                    valueField="value"
                    data={users}
                    value={m.raisedBy.map((r: any) => r.value)}
                    placeholder="Issue raised by *"
                    searchPlaceholder="Search..."
                    onChange={(selectedIds) => {
                      const selectedUsers = users
                        .filter((u) => selectedIds.includes(u.value))
                        .map((u) => ({
                          value: u.value,
                          label: u.label,
                        }));

                      updateMinute(index, "raisedBy", selectedUsers);

                      // 🔥 Programmatically close using ref
                      setTimeout(() => {
                        dropdownRef.current?.close();
                      }, 80);
                    }}
                  />

                  <TextInput
                    placeholder="Subject *"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={m.issueSubject}
                    onChangeText={(t) => updateMinute(index, "issueSubject", t)}
                    multiline
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />
                  <TextInput
                    placeholder="Meeting Discussion"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={m.issueDescription}
                    onChangeText={(t) =>
                      updateMinute(index, "issueDescription", t)
                    }
                    multiline
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />

                  {/* Status Selector */}
                  <View
                    className={`rounded-xl px-4 py-3 flex-row items-center border ${
                      isDarkMode
                        ? "bg-[#262626] border-[#4B5563]"
                        : "bg-[#F9FAFB] border-[#E5E7EB]"
                    }`}
                  >
                    <Text
                      className={`text-[15px] mr-3 ${
                        isDarkMode ? "text-gray-400" : "text-[#888]"
                      }`}
                    >
                      Status:
                    </Text>

                    <View className="flex-row items-center justify-start gap-6">
                      {/* Option 1: Open */}
                      <TouchableOpacity
                        onPress={() => updateMinute(index, "status", "open")}
                        activeOpacity={0.8}
                        className="flex-row items-center"
                      >
                        <HugeiconsIcon
                          icon={m.status === "open" ? Tick01Icon : CircleIcon}
                          size={20}
                          color={
                            m.status === "open"
                              ? isDarkMode
                                ? "#F87171"
                                : "#EF4444"
                              : isDarkMode
                                ? "#6B7280"
                                : "#9CA3AF"
                          }
                          className="mr-2"
                        />
                        <Text
                          className={`text-[14px] font-poppinsMedium ${
                            m.status === "open"
                              ? isDarkMode
                                ? "text-red-400"
                                : "text-red-600"
                              : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                          }`}
                        >
                          Open
                        </Text>
                      </TouchableOpacity>

                      {/* Option 2: For Info */}
                      <TouchableOpacity
                        onPress={() => updateMinute(index, "status", "forInfo")}
                        activeOpacity={0.8}
                        className="flex-row items-center"
                      >
                        <HugeiconsIcon
                          icon={
                            m.status === "forInfo" ? Tick01Icon : CircleIcon
                          }
                          size={20}
                          color={
                            m.status === "forInfo"
                              ? isDarkMode
                                ? "#34D399"
                                : "#10B981"
                              : isDarkMode
                                ? "#6B7280"
                                : "#9CA3AF"
                          }
                          className="mr-2"
                        />
                        <Text
                          className={`text-[14px] font-poppinsMedium ${
                            m.status === "forInfo"
                              ? isDarkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                          }`}
                        >
                          For Info
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {showDatePicker && dateIndex === index && (
                    <DateTimePicker
                      value={m.targetDate ? new Date(m.targetDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => openDatePicker(index)}
                      style={{
                        flex: 1,
                        opacity: m.targetDateForInfo ? 0.5 : 1,
                      }}
                      disabled={m.targetDateForInfo}
                    >
                      <TextInput
                        placeholder="Target Date (DD-MM-YYYY) *"
                        placeholderTextColor={
                          isDarkMode ? "#6B7280" : "#9CA3AF"
                        }
                        value={
                          m.targetDate
                            ? moment(m.targetDate).format("DD-MM-YYYY")
                            : ""
                        }
                        editable={false}
                        pointerEvents="none"
                        className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] border ${
                          isDarkMode
                            ? "bg-[#262626] text-white border-[#4B5563]"
                            : "bg-[#F3F4F6] text-gray-700 border-[#E5E7EB]"
                        }`}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (m.targetDateForInfo) {
                          updateMinute(index, "targetDateForInfo", false);
                        } else {
                          updateMinute(index, "targetDate", null);
                          updateMinute(index, "targetDateForInfo", true);
                        }
                      }}
                      className={`px-4 py-3.5 rounded-xl border flex-row items-center justify-center ${
                        m.targetDateForInfo
                          ? isDarkMode
                            ? "bg-emerald-500/20 border-emerald-500/50"
                            : "bg-emerald-50 border-emerald-500"
                          : isDarkMode
                            ? "bg-[#262626] border-[#4B5563]"
                            : "bg-[#F3F4F6] border-[#E5E7EB]"
                      }`}
                    >
                      <Text
                        className={`text-[14px] font-medium ${
                          m.targetDateForInfo
                            ? isDarkMode
                              ? "text-emerald-400"
                              : "text-emerald-600"
                            : isDarkMode
                              ? "text-gray-400"
                              : "text-gray-600"
                        }`}
                      >
                        {m.targetDateForInfo ? "For Info ✓" : "For Info"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* MultiSelect */}
                  <View className="flex-row items-center">
                    <View
                      style={{
                        flex: 1,
                        opacity: m.responsibilityForInfo ? 0.5 : 1,
                      }}
                    >
                      <MultiSelect
                        ref={responsibilityRef}
                        style={{
                          height: 48,
                          borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                          borderWidth: 1,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                        }}
                        placeholderStyle={{
                          fontSize: 14,
                          color: isDarkMode ? "#6B7280" : "#9CA3AF",
                        }}
                        selectedTextStyle={{
                          fontSize: 12,
                          color: isDarkMode ? "#E5E7EB" : "#111827",
                        }}
                        selectedStyle={{
                          borderRadius: 10,
                          backgroundColor: isDarkMode ? "#374151" : "#E0E7FF",
                          padding: 4,
                        }}
                        containerStyle={{
                          borderRadius: 12,
                          overflow: "hidden",
                          backgroundColor: isDarkMode ? "#1C1C1E" : "#fff",
                        }}
                        activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
                        inputSearchStyle={{ fontSize: 14 }}
                        search
                        labelField="label"
                        valueField="value"
                        data={users}
                        value={m.responsibility.map((r: any) => r.value)}
                        placeholder="Select responsible users *"
                        searchPlaceholder="Search..."
                        onChange={(selectedIds: string[]) => {
                          const selectedUsers = users
                            .filter((u) => selectedIds.includes(u.value))
                            .map((u) => ({
                              value: u.value,
                              label: u.label,
                            }));

                          updateMinute(index, "responsibility", selectedUsers);

                          // 🔥 Auto-close immediately after each selection/deselection
                          setTimeout(() => {
                            responsibilityRef.current?.close();
                          }, 80);
                        }}
                        disable={m.responsibilityForInfo}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        if (m.responsibilityForInfo) {
                          updateMinute(index, "responsibilityForInfo", false);
                        } else {
                          updateMinute(index, "responsibility", []);
                          updateMinute(index, "responsibilityForInfo", true);
                        }
                      }}
                      className={`ml-2 px-4 py-3.5 rounded-xl border flex-row items-center justify-center ${
                        m.responsibilityForInfo
                          ? isDarkMode
                            ? "bg-emerald-500/20 border-emerald-500/50"
                            : "bg-emerald-50 border-emerald-500"
                          : isDarkMode
                            ? "bg-[#262626] border-[#4B5563]"
                            : "bg-[#F3F4F6] border-[#E5E7EB]"
                      }`}
                    >
                      <Text
                        className={`text-[14px] font-medium ${
                          m.responsibilityForInfo
                            ? isDarkMode
                              ? "text-emerald-400"
                              : "text-emerald-600"
                            : isDarkMode
                              ? "text-gray-400"
                              : "text-gray-600"
                        }`}
                      >
                        {m.responsibilityForInfo ? "For Info ✓" : "For Info"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Remarks (if any)"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={m.remarks}
                    onChangeText={(t) => updateMinute(index, "remarks", t)}
                    multiline
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />

                  {/* 🗑 Delete Minute */}
                  {minutes.length > 1 && (
                    <View className="flex-row justify-end space-x-4 mt-2">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedIndex(index);
                          setShowDeleteModal(true);
                        }}
                        className="flex-row items-center"
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={14}
                          color="#EF4444"
                          className="mr-1"
                        />
                        <Text className="text-red-500 font-poppinsMedium text-sm">
                          Remove Minute
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
            )}
          </View>
        </ScaleDecorator>
      );
    },
    [
      isDarkMode,
      expandedMinute,
      users,
      minutes.length,
      showDatePicker,
      dateIndex,
    ],
  );

  const formatAttendees = () => {
    return attendees.map((a) => ({
      sNo: a.sNo,
      attendeeName: a.attendeeName,
      organization: a.organization,
      designation: a.designation,
      email: a.email,
      contactNumbers: a.contactNumbers || [""],
    }));
  };

  const formatMinutes = () => {
    return minutes.map((m, i) => ({
      serialNo: m.serialNo ?? i + 1,
      issueSubject: m.issueSubject,
      description: m.issueDescription || "",
      raisedBy: m.raisedBy.map((r: any) => ({ _id: r.value, name: r.label })),
      responsibility: m.responsibility.map((r: any) => ({
        _id: r.value,
        name: r.label,
      })),
      targetDate: m.targetDateForInfo ? null : m.targetDate,
      remarks: m.remarks || "",
      targetDateForInfo: !!m.targetDateForInfo,
      responsibilityForInfo: !!m.responsibilityForInfo,
      fromForwardedId: m.fromForwardedId || null,
      status: m.status || "open",
    }));
  };

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       setLoadingUsers(true);

  //       const res = await api.get("/users", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       // console.log("USERS API RESPONSE:", res.data);

  //       // Store only required fields
  //       setUsers(
  //         res.data.users.map((u) => ({
  //           label: u.fullName,
  //           value: u._id,
  //         }))
  //       );
  //     } catch (error) {
  //       console.log("Error fetching users:", error);
  //       Alert.alert("Error", "Unable to load users.");
  //     } finally {
  //       setLoadingUsers(false);
  //     }
  //   };

  //   fetchUsers();
  // }, []);

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        if (!token || !meetingId) return;

        // Try to fetch draft first, fall back to main record if needed
        let res;
        try {
          res = await api.get(`/minutes/draft/${meetingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          res = await api.get(`/minutes/${meetingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        const data = res.data.meeting || res.data;
        if (data.meetingTitle) setMeetingTitle(data.meetingTitle);

        if (data.meetingDate) setMeetingDate(new Date(data.meetingDate));
        if (data.meetingTime) setMeetingTime(data.meetingTime);
        if (data.meetingVenue) setMeetingVenue(data.meetingVenue);
        if (data.meetingNumber) setMeetingNumber(data.meetingNumber);
        if (typeof data.isATReview === "boolean")
          setIsATReview(data.isATReview);

        if (data.attendees && data.attendees.length > 0) {
          setAttendees(
            data.attendees.map((a: any, idx: number) => ({
              id: a._id || a.id || `att-${idx}-${Date.now()}`,
              sNo: a.sNo || idx + 1,
              attendeeName: a.attendeeName || "",
              organization: a.organization || "",
              designation: a.designation || "",
              email: a.email || "",
              status: a.status || "",
              userId: a.userId || null,
              contactNumbers: a.contactNumbers || [""],
            })),
          );
        }

        if (data.minutes && data.minutes.length > 0) {
          const formattedMinutes = data.minutes.map((m: any, idx: number) => ({
            id: m._id || m.id || `min-${idx}-${Date.now()}`,
            serialNo: idx + 1,
            issueSubject: m.issueSubject || "",
            issueDescription: m.description || m.issueDescription || "",
            targetDate: m.targetDate || null,
            remarks: m.remarks || "",
            raisedBy: Array.isArray(m.raisedBy)
              ? m.raisedBy.map((r: any) => ({
                  value: r._id || r.value,
                  label: r.name || r.label,
                }))
              : [],
            responsibility: Array.isArray(m.responsibility)
              ? m.responsibility.map((r: any) => ({
                  value: r._id || r.value,
                  label: r.name || r.label,
                }))
              : [],
            status: m.status || "open",
            targetDateForInfo: !!m.targetDateForInfo,
            responsibilityForInfo: !!m.responsibilityForInfo,
            fromForwardedId: m.fromForwardedId || null,
          }));
          setMinutes(formattedMinutes);
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
        Toast.show({ type: "error", text1: "Error loading meeting data" });
      }
    };

    fetchMeetingData();
  }, [token, meetingId]);

  const handleSubmit = async (type: "agenda" | "mom") => {
    try {
      if (!token) return;

      // Start loading based on type
      if (type === "agenda") setIsAgendaSubmitting(true);
      else setIsMomSubmitting(true);

      // ✅ Validation
      if (type === "agenda") {
        const invalid = minutes.some(
          (m) => !m.issueSubject || m.raisedBy.length === 0,
        );
        if (invalid) {
          Toast.show({
            type: "error",
            text1: "Issue Subject & Raised By are required for agenda",
            position: "bottom",
          });
          return;
        }
      } else {
        if (!meetingDate || !meetingTime || !meetingVenue) {
          Toast.show({
            type: "error",
            text1: "Meeting info is required",
            position: "bottom",
          });
          return;
        }
        if (attendees.length === 0) {
          Toast.show({
            type: "error",
            text1: "Add at least one attendee",
            position: "bottom",
          });
          return;
        }
        const invalid = minutes.some(
          (m) =>
            !m.issueSubject ||
            m.raisedBy.length === 0 ||
            (!m.targetDate && !m.targetDateForInfo) ||
            (m.responsibility.length === 0 && !m.responsibilityForInfo),
        );
        if (invalid) {
          Toast.show({
            type: "error",
            text1: "All MOM fields are required",
            position: "bottom",
          });
          return;
        }
      }

      // ✅ Format attendees
      const formattedAttendees = attendees.map((a) => ({
        sNo: a.sNo,
        attendeeName: a.attendeeName,
        organization: a.organization,
        designation: a.designation,
        email: a.email,
        contactNumbers: a.contactNumbers || [""],
      }));

      // ✅ Format minutes
      const formattedMinutes = minutes.map((m, i) => ({
        serialNo: m.serialNo ?? i + 1,
        issueSubject: m.issueSubject,
        description: m.issueDescription || "",
        raisedBy: m.raisedBy.map((r: any) => ({
          _id: r.value,
          name: r.label,
        })),
        responsibility: m.responsibility.map((r: any) => ({
          _id: r.value,
          name: r.label,
        })),
        targetDate: m.targetDateForInfo ? null : m.targetDate,
        remarks: m.remarks || "",
        targetDateForInfo: !!m.targetDateForInfo,
        responsibilityForInfo: !!m.responsibilityForInfo,
        fromForwardedId: m.fromForwardedId || null,
        status: m.status || "open", // ✅ new field
      }));

      const payload = {
        projectId,
        meetingTitle,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        meetingTime,
        meetingVenue,
        attendees: formattedAttendees,
        minutes: formattedMinutes,
        actionType: type,
        isATReview, // ✅ send boolean value (true/false)
      };

      // ✅ Call API
      if (type === "agenda" || !meetingId) {
        await api.post(`/minutes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.put(`/minutes/${meetingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Toast.show({
        type: "success",
        text1: type === "agenda" ? "Agenda submitted" : "MOM submitted",
        position: "bottom",
      });
      await AsyncStorage.removeItem(STORAGE_KEY); // clear local draft
      router.back();
    } catch (err: any) {
      console.error("Submit error:", err?.response?.data || err.message);

      // Extract message from backend response
      const errorMsg =
        err?.response?.data?.message || // backend returned validation message
        err?.response?.data?.error || // fallback if error object
        "Failed to submit minutes"; // ultimate fallback

      Toast.show({
        type: "error",
        text1: errorMsg, // <-- show exact backend message
        position: "bottom",
      });
    } finally {
      // Stop loading
      setIsAgendaSubmitting(false);
      setIsMomSubmitting(false);
    }
  };


  const submitDraft = async () => {
    if (!token) return;

    try {
      setIsDraftSaving(true); // reuse draft saving loader

      const payload = {
        projectId,
        meetingTitle,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        meetingTime,
        meetingVenue,
        attendees: formatAttendees(),
        minutes: formatMinutes(),
        draftSubmitted: true, // ✅ new flag
        isATReview, // keep sending this
      };

      if (!meetingId) {
        const res = await api.post("/minutes/draft", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const res = await api.put(`/minutes/draft/${meetingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setIsDraftSubmitted(true);
      Toast.show({
        type: "success",
        text1: "Draft submitted successfully",
        position: "bottom",
      });

      // ✅ Optional: clear local draft storage
      await AsyncStorage.removeItem(STORAGE_KEY);
      router.back();
    } catch (err) {
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Failed to submit draft",
        position: "bottom",
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      {/* Header */}
      <View
        className={`pt-16 pb-4 px-4 flex-row items-center justify-between ${
          isDarkMode ? "bg-black" : "bg-[#FBFCFD]"
        }`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            className={`text-xl font-dmSemiBold ml-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Minutes of Meeting
          </Text>
        </TouchableOpacity>

        {/* Draft Button */}
        {!isEditMOM && (
          <TouchableOpacity
            onPress={submitDraft}
            disabled={isDraftSaving}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            {isDraftSaving ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#fff" : "#000"}
              />
            ) : (
              <>
                <HugeiconsIcon
                  icon={AllBookmarkIcon}
                  size={16}
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Text
                  className={`text-[13px] font-poppins ml-1.5 font-medium ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Draft
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Switcher */}
      <View
        className={`flex-row px-4 border-b ${
          isDarkMode
            ? "bg-black border-gray-800"
            : "bg-[#FBFCFD] border-gray-100"
        }`}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("attendees")}
          className={`flex-1 py-3 items-center ${
            activeTab === "attendees"
              ? "border-b-[3px] border-[#5B4CCC]"
              : "border-b-[3px] border-transparent"
          }`}
        >
          <Text
            className={`text-[15px] font-poppinsMedium ${
              activeTab === "attendees"
                ? "text-[#5B4CCC]"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
            }`}
          >
            Attendees
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("minutes")}
          className={`flex-1 py-3 items-center ${
            activeTab === "minutes"
              ? "border-b-[3px] border-[#5B4CCC]"
              : "border-b-[3px] border-transparent"
          }`}
        >
          <Text
            className={`text-[15px] font-poppinsMedium ${
              activeTab === "minutes"
                ? "text-[#5B4CCC]"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
            }`}
          >
            Minutes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <NestableScrollContainer
          style={isDarkMode ? { backgroundColor: "#000" } : { backgroundColor: "#FBFCFD" }}
          contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {activeTab === "attendees" && (
          <>
            {/* ✅ Meeting Info Section */}
            <View className="mb-4">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowMeetingInfo(!showMeetingInfo)}
                className={`flex-row justify-between items-center px-4 py-3 rounded-t-xl ${
                  isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                } ${!showMeetingInfo ? "rounded-b-xl" : ""}`}
              >
                <Text
                  className={`text-[15px] font-poppinsMedium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Meeting Info
                </Text>
                <HugeiconsIcon
                  icon={showMeetingInfo ? ArrowDown01Icon : ArrowUp01Icon}
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>

              {showMeetingInfo && (
                <View
                  className={`px-4 py-4 gap-4 border-t border-gray-200 rounded-b-xl ${
                    isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                  }`}
                >
                  {/* Meeting Title Input */}
                  <TextInput
                    placeholder="Enter Title"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={meetingTitle}
                    onChangeText={setMeetingTitle}
                    className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />

                  {/* Date / Time Row */}
                  <View className="flex-row gap-3">
                    {/* Meeting Date */}
                    <TouchableOpacity
                      onPress={() => setDatePickerVisibility(true)}
                      className={`flex-1 flex-row items-center justify-between rounded-xl px-4 py-3.5 ${
                        isDarkMode ? "bg-[#262626]" : "bg-[#F3F4F6]"
                      }`}
                    >
                      <Text
                        className={`text-[14px] font-poppins ${
                          meetingDate
                            ? isDarkMode
                              ? "text-white"
                              : "text-gray-900"
                            : isDarkMode
                              ? "text-[#6B7280]"
                              : "text-[#9CA3AF]"
                        }`}
                      >
                        {meetingDate
                          ? moment(meetingDate).format("DD-MM-YYYY")
                          : "DD-MM-YYYY"}
                      </Text>
                      <HugeiconsIcon
                        icon={Calendar04Icon}
                        size={18}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>

                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="date"
                      onConfirm={(date) => {
                        setDatePickerVisibility(false);
                        setMeetingDate(date);
                      }}
                      onCancel={() => setDatePickerVisibility(false)}
                    />

                    {/* Meeting Time */}
                    <TouchableOpacity
                      onPress={() => setTimePickerVisibility(true)}
                      className={`flex-1 flex-row items-center justify-between rounded-xl px-4 py-3.5 ${
                        isDarkMode ? "bg-[#262626]" : "bg-[#F3F4F6]"
                      }`}
                    >
                      <Text
                        className={`text-[14px] font-poppins ${
                          meetingTime
                            ? isDarkMode
                              ? "text-white"
                              : "text-gray-900"
                            : isDarkMode
                              ? "text-[#6B7280]"
                              : "text-[#9CA3AF]"
                        }`}
                      >
                        {meetingTime || "00:00 AM"}
                      </Text>
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        size={18}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>

                    <DateTimePickerModal
                      isVisible={isTimePickerVisible}
                      mode="time"
                      onConfirm={(time) => {
                        setTimePickerVisibility(false);
                        const formattedTime = moment(time).format("hh:mm A");
                        setMeetingTime(formattedTime);
                      }}
                      onCancel={() => setTimePickerVisibility(false)}
                    />
                  </View>

                  {/* Venue */}
                  <TextInput
                    placeholder="Enter Venue"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    value={meetingVenue}
                    onChangeText={setMeetingVenue}
                    className={`rounded-xl font-poppins px-4 py-3.5 text-[14px] ${
                      isDarkMode
                        ? "bg-[#262626] text-white"
                        : "bg-[#F3F4F6] text-gray-900"
                    }`}
                  />

                  {/* ✅ AT Review Box */}
                  <TouchableOpacity
                    onPress={() => setIsATReview(!isATReview)}
                    className="flex-row items-center py-2"
                    activeOpacity={0.7}
                  >
                    <View
                      className={`w-5 h-5 rounded-[4px] border ${
                        isATReview
                          ? isDarkMode
                            ? "bg-transparent border-[#4B5563]"
                            : "bg-transparent border-[#D1D5DB]"
                          : isDarkMode
                            ? "border-[#4B5563]"
                            : "border-[#D1D5DB]"
                      } flex items-center justify-center mr-3`}
                    >
                      {isATReview && (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={14}
                          color={isDarkMode ? "#919191" : "#919191"}
                        />
                      )}
                    </View>

                    <Text
                      className={`text-[14px] font-poppins ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Mark this at AT review
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Attendees */}
            <View className="mb-4">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAttendeesSection(!showAttendeesSection)}
                className={`flex-row justify-between items-center px-4 py-3 rounded-t-xl ${
                  isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                } ${!showAttendeesSection ? "rounded-b-xl" : ""}`}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`text-[15px] font-poppinsMedium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Attendees
                  </Text>
                </View>
                <HugeiconsIcon
                  icon={showAttendeesSection ? ArrowDown01Icon : ArrowUp01Icon}
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>

              {showAttendeesSection && (
                <View
                  className={`px-4 py-4 gap-4 border-t border-gray-200 rounded-b-xl ${
                    isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                  }`}
                >
                  <NestableDraggableFlatList
                    data={attendees}
                    onDragEnd={onAttendeeDragEnd}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAttendee}
                  />

                  {/* Buttons Row */}
                  <View className=" gap-3 mt-1">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        addAttendee();
                        setOpenDirectoryFor(attendees.length);
                      }}
                      className={`flex-1 py-3 rounded-[10px] flex-row justify-center gap-3 items-center border ${
                        isDarkMode
                          ? "bg-[#262626] border-[#4B5563]"
                          : "bg-[#F9FAFB] border-[#E5E7EB]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={PlusSignCircleIcon}
                        size={16}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        className="mr-2"
                      />
                      <Text
                        className={`text-[14px] font-poppinsMedium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Select Attendees
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={addAttendee}
                      className={`flex-1 py-3 rounded-[10px] flex-row justify-center gap-3  items-center border ${
                        isDarkMode
                          ? "bg-[#262626] border-[#4B5563]"
                          : "bg-[#F9FAFB] border-[#E5E7EB]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={PlusSignCircleIcon}
                        size={16}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        className="mr-2"
                      />
                      <Text
                        className={`text-[14px] font-poppinsMedium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Add Manually
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === "minutes" && (
          <>
            {/* Minutes */}
            <View className="mb-4">
              {/* Minutes Header */}
              <View
                className={`flex-row justify-between items-center px-4 py-3 rounded-t-xl ${
                  isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                } ${!showMinutesSection ? "rounded-b-xl" : ""}`}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowMinutesSection(!showMinutesSection)}
                  className="flex-row items-center flex-1"
                >
                  <View className="flex-row items-center">
                    <Text
                      className={`text-[15px] font-poppinsMedium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Minutes
                    </Text>
                  </View>
                  <HugeiconsIcon
                    icon={showMinutesSection ? ArrowDown01Icon : ArrowUp01Icon}
                    size={20}
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={fetchForwardedMinutes}
                  className={`px-3 py-1.5 rounded-lg border flex-row items-center ml-2 ${
                    isDarkMode
                      ? "bg-[#B45309]/10 border-[#B45309]"
                      : "bg-amber-50 border-amber-500"
                  }`}
                >
                  <HugeiconsIcon
                    icon={Download01Icon}
                    size={14}
                    color={isDarkMode ? "#FBBF24" : "#F59E0B"}
                  />
                  <Text
                    className={`text-xs font-poppinsBold ml-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                  >
                    From Forwarded
                  </Text>
                </TouchableOpacity>
              </View>

              {showMinutesSection && (
                <View
                  className={`px-4 py-4 gap-4 border-t border-gray-200 rounded-b-xl ${
                    isDarkMode ? "bg-[#0D0D0D]" : "bg-[#F6F8FA]"
                  }`}
                >
                  <NestableDraggableFlatList
                    data={minutes}
                    onDragEnd={onMinuteDragEnd}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMinute}
                  />

                  {/* Add Minutes Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={addMinute}
                    className={`py-3 rounded-[10px]  flex-row justify-center gap-3  items-center border ${
                      isDarkMode
                        ? "bg-[#262626] border-[#4B5563]"
                        : "bg-[#F9FAFB] border-[#E5E7EB]"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={PlusSignCircleIcon}
                      size={16}
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      className="mr-2"
                    />
                    <Text
                      className={`text-[14px] font-poppinsMedium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Add Minutes
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Modal
              visible={forwardedModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setForwardedModalVisible(false)}
            >
              <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-white w-11/12 rounded-2xl p-5 max-h-[70%] ">
                  {/* Header with title + close button */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-dmSemiBold text-center flex-1">
                      Select Forwarded Issue
                    </Text>
                    <TouchableOpacity
                      onPress={() => setForwardedModalVisible(false)}
                      className="ml-2 p-1"
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={24}
                        color="#333"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* List or Empty State */}
                  {!forwardedMinutes || forwardedMinutes.length === 0 ? (
                    <View className="justify-center items-center py-10">
                      <HugeiconsIcon
                        icon={Note01Icon}
                        size={70}
                        color="#c0c0c0"
                      />
                      <Text className="text-gray-400 text-center mt-4 text-base">
                        No forwarded issues available.
                      </Text>
                      <Text className="text-gray-400 text-center mt-1 text-sm">
                        Forwarded issues will appear here once available.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={forwardedMinutes}
                      keyExtractor={(item) => item._id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 10 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          className="p-2 px-3 mb-2 bg-gray-50 rounded-xl border border-gray-200 "
                          onPress={() => {
                            setMinutes((prev) => [
                              ...prev,
                              {
                                id: Date.now() + Math.random().toString(), // Add unique ID
                                serialNo: prev.length + 1,
                                raisedBy:
                                  item.raisedBy?.map((r: any) => ({
                                    label: r.individualName || r.name || "",
                                    value: r._id || "",
                                  })) || [],
                                issueSubject: item.issueSubject || "",
                                issueDescription: item.description || "",
                                targetDate: item.targetDate || null,
                                responsibility:
                                  item.responsibility?.map((r: any) => ({
                                    label: r.individualName || r.name || "",
                                    value: r._id || "",
                                  })) || [],
                                remarks: item.remarks || "",
                                targetDateForInfo:
                                  item.targetDateForInfo || false,
                                responsibilityForInfo:
                                  item.responsibilityForInfo || false,
                                fromForwardedId: item._id,
                                status: "open", // Add default status
                              },
                            ]);
                            setForwardedModalVisible(false);
                          }}
                        >
                          <Text className="font-semibold text-gray-900 text-base">
                            {item.issueSubject || "Untitled Issue"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}

        {/* Submit Button */}
        <View className="mt-10">
          {/* Submit / Download Row */}
          <View className="flex-row gap-3">
            {meetingId ? (
              <TouchableOpacity
                disabled={isAgendaDownloading}
                onPress={() => setModalVisible(true)}
                className={`flex-1 rounded-2xl items-center justify-center py-4 ${
                  isAgendaDownloading ? "bg-gray-400" : "bg-[#1C1C1E]"
                }`}
              >
                {isAgendaDownloading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-poppinsBold text-[15px]">
                    Download Agenda
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleSubmit("agenda")}
                disabled={isAgendaSubmitting}
                className={`flex-1 rounded-2xl items-center justify-center py-4 ${
                  isAgendaSubmitting ? "bg-gray-400" : "bg-[#1C1C1E]"
                }`}
              >
                {isAgendaSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-poppins text-[15px]">
                    Submit Agenda
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => handleSubmit("mom")}
              disabled={isMomSubmitting}
              className="flex-1 rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={
                  isMomSubmitting
                    ? ["#9CA3AF", "#9CA3AF", "#9CA3AF"]
                    : ["#5B4CCC", "#6347C2", "#8056D1"]
                }
                locations={isMomSubmitting ? [0, 0.5, 1] : [0, 0.5183, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.1 }}
                className="items-center justify-center py-4"
              >
                {isMomSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-poppins text-[15px]">
                    Submit Minutes
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/40">
            <View className="bg-white rounded-2xl p-6 w-80 relative">
              {/* Close Button */}
              <TouchableOpacity
                className="absolute bg-gray-200  rounded-full top-4 right-4 p-2"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 999,
                  padding: 8,
                  zIndex: 50,
                  elevation: 10, // IMPORTANT for Android
                }}
                onPress={() => setModalVisible(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={24} color="#000" />
              </TouchableOpacity>

              <Text className="text-xl font-bold mb-6 text-gray-800 text-left">
                Select Download Format
              </Text>

              <View className="flex-row justify-between gap-3">
                {/* PDF Button */}
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-red-500 items-center"
                  onPress={async () => {
                    setModalVisible(false);
                    setIsAgendaDownloading(true);
                    try {
                      await handleDownloadAgenda(
                        {
                          meetingDate,
                          meetingTime,
                          meetingVenue,
                          meetingNumber,
                          attendees,
                          minutes,
                        },
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        auth?.token,
                        "pdf",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                >
                  <Text className="text-white font-semibold text-lg">PDF</Text>
                </TouchableOpacity>

                {/* Excel Button */}
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-green-500 items-center"
                  onPress={async () => {
                    setModalVisible(false);
                    setIsAgendaDownloading(true);
                    try {
                      await handleDownloadAgenda(
                        {
                          meetingDate,
                          meetingTime,
                          meetingVenue,
                          meetingNumber,
                          attendees,
                          minutes,
                        },
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        auth?.token,
                        "excel",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                >
                  <Text className="text-white font-semibold text-lg">
                    Excel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* <TouchableOpacity
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 rounded-2xl items-center my-4"
        >
          <Text className="text-white font-bold">Submit MOM</Text>
        </TouchableOpacity> */}

        <Modal
          transparent
          visible={showDeleteModal}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View
              className={`w-80 p-6 rounded-2xl  ${isDarkMode ? "bg-[#1C1C1E]" : "bg-white"}`}
            >
              <Text
                className={`text-lg font-dmSemiBold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Are you sure?
              </Text>

              <Text
                className={`mt-2 font-poppins ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Do you really want to remove this minute?
              </Text>

              <View className="flex-row justify-end mt-6">
                {/* Cancel button */}
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  className="mr-6"
                >
                  <Text
                    className={`font-poppinsMedium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Delete button */}
                <TouchableOpacity
                  onPress={() => {
                    if (selectedIndex !== null) {
                      deleteMinute(selectedIndex);
                    }
                    setShowDeleteModal(false);
                  }}
                >
                  <Text className="text-red-600 font-poppinsMedium">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </NestableScrollContainer>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateMinutes;
