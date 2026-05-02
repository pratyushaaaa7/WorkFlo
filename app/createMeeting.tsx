import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  LogBox,
  Modal as NativeModal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Modal from "react-native-modal";

LogBox.ignoreLogs([
  "Warning: ref.measureLayout must be called with a ref to a native component.",
]);

import {
  AllBookmarkIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  Calendar04Icon,
  Cancel01Icon,
  Clock01Icon,
  Download01Icon,
  Note01Icon,
  MoreHorizontalIcon,
  Pdf01Icon,
  PlusSignCircleIcon,
  Tick02Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
// import { exportAgendaWithAttendees } from "../utils/agendaExcel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AttendeeItem from "../components/AttendeeItem";
import MinuteItem from "../components/MinuteItem";
import { useTempImageStore } from "../store/tempImageStore";

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

  const { images, addImageToIssue, removeImageFromIssue, clearAll } =
    useTempImageStore();

  const pIdStr = Array.isArray(projectId) ? projectId[0] : (projectId as string);
  const mIdStr = Array.isArray(meetingId) ? meetingId[0] : (meetingId as string);
  const STORAGE_KEY = mIdStr ? `minutes_draft_${mIdStr}` : `minutes_draft_proj_${pIdStr || "new"}`;
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);

  const [isAgendaSubmitting, setIsAgendaSubmitting] = useState(false);
  const [isMomSubmitting, setIsMomSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  const [isAgendaDownloading, setIsAgendaDownloading] = useState(false);

  const [isDraftSubmitted, setIsDraftSubmitted] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Validation errors state
  type ValidationErrors = {
    meetingDate?: boolean;
    meetingTime?: boolean;
    meetingVenue?: boolean;
    attendees?: {
      [index: number]: { attendeeName?: boolean; organization?: boolean };
    };
    minutes?: {
      [index: number]: {
        issueSubject?: boolean;
        raisedBy?: boolean;
        targetDate?: boolean;
        responsibility?: boolean;
      };
    };
  };
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const scrollRef = useRef<any>(null);
  const meetingInfoRef = useRef<View>(null);
  const attendeeSectionRef = useRef<View>(null);
  const minuteSectionRef = useRef<View>(null);
  const searchTimeoutRef = useRef<any>(null);

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
      isExpanded: true,
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
      images: [],
      isExpanded: true,
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);

  // Users for selection
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);

  const fetchDirectory = useCallback(
    async (searchQuery: string = "") => {
      try {
        if (!token) return;
        // 1. Fetch from Unified Directory (For Attendees)
        let directoryUrl = `/directory?`;
        if (projectId) directoryUrl += `projectId=${projectId}`;
        if (searchQuery)
          directoryUrl += `&search=${encodeURIComponent(searchQuery)}`;

        const resDir = await api.get(directoryUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resDir.data && resDir.data.data) {
          const formatted = resDir.data.data.map((u: any) => ({
            label: `${u.name} (${u.firmName || "N/A"})`,
            value: u._id,
            attendeeName: u.name,
            organization: u.firmName,
            designation: u.designation,
            email: u.email,
            phone: u.phone,
            contactNumbers: u.phones,
          }));
          setDirectoryUsers(formatted);
        }
      } catch (error) {
        console.log("Error fetching directory:", error);
      }
    },
    [token, projectId],
  );

  const handleSearchDirectory = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchDirectory(query);
      }, 500);
    },
    [fetchDirectory],
  );

  const [meetingNumber, setMeetingNumber] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    setMeetingTitle("");
    setMeetingDate(null);
    setMeetingTime("");
    setMeetingVenue("");
    setMeetingNumber(null);
    setAttendees([
      {
        id: "initial-att-1",
        sNo: 1,
        attendeeName: "",
        organization: "",
        designation: "",
        email: "",
        contactNumbers: [""],
        isExpanded: true,
      },
    ]);
    setMinutes([
      {
        id: "initial-min-1",
        serialNo: 1,
        raisedBy: [],
        issueSubject: "",
        issueDescription: "",
        targetDate: null,
        responsibility: [],
        remarks: "",
        targetDateForInfo: false,
        responsibilityForInfo: false,
        status: "open",
        images: [],
        isExpanded: true,
      },
    ]);
    setValidationErrors({});
    setMeeting(null); // Clear the loaded meeting object
    clearAll();
  }, [clearAll]);

  const [forwardedModalVisible, setForwardedModalVisible] = useState(false);
  const [forwardedMinutes, setForwardedMinutes] = useState<any[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  //to store the minutes data even after the app is closed
  useEffect(() => {
    const loadStoredData = async () => {
      // If we are editing a specific meeting, we primarily want data from server.
      // We only load from AsyncStorage if it's a new meeting draft.
      // (Or we could implement a merge logic, but keeping it simple for now)
      if (meetingId) return;

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
            (savedData.attendees || []).map((a: any, i: number) => ({
              ...a,
              id: a.id || "att-" + Date.now() + "-" + i + "-" + Math.random(),
            })),
          );
          setMinutes(
            (savedData.minutes || []).map((m: any, i: number) => ({
              ...m,
              id: m.id || "min-" + Date.now() + "-" + i + "-" + Math.random(),
              // Ensure dropdowns are in { value, label } format
              raisedBy: (m.raisedBy || []).map((r: any) => ({
                value: r.value || r._id,
                label: r.label || r.name,
              })),
              responsibility: (m.responsibility || []).map((r: any) => ({
                value: r.value || r._id,
                label: r.label || r.name,
              })),
            })),
          );
        } else {
          // 🆕 No draft for this project -> ensure form is clear
          resetForm();
        }
      } catch (err) {
        console.log("Error loading stored data:", err);
      }
    };
    loadStoredData();
  }, [pIdStr, STORAGE_KEY, resetForm, meetingId]);

  // Save data automatically whenever it changes (Debounced for performance)
  useEffect(() => {
    const timer = setTimeout(async () => {
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
        // console.log("Data saved locally (debounced)");
      } catch (err) {
        console.log("Error saving to AsyncStorage:", err);
      }
    }, 1000); // 1-second debounce to reduce disk overhead

    return () => clearTimeout(timer);
  }, [
    meetingTitle,
    meetingDate,
    meetingTime,
    meetingVenue,
    attendees,
    minutes,
    STORAGE_KEY,
  ]);

  // Fetch users

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
  const updateAttendee = useCallback(
    (index: number, field: string | object, value?: any) => {
      setAttendees((prev) =>
        prev.map((a, i) => {
          if (i !== index) return a;
          if (typeof field === "object") {
            return { ...a, ...field };
          }
          if (field === "phone") {
            const contactNumbers = [...(a.contactNumbers || [""])];
            contactNumbers[0] = value;
            return { ...a, contactNumbers };
          }
          return { ...a, [field]: value };
        }),
      );

      // Clear validation error for this field when it becomes valid
      setValidationErrors((prev) => {
        if (!prev.attendees?.[index]) return prev;
        const updatedFields =
          typeof field === "object" ? field : { [field]: value };
        const fieldErrors = { ...prev.attendees[index] };
        if ((updatedFields as any).attendeeName?.trim())
          delete fieldErrors.attendeeName;
        if (
          typeof field === "string" &&
          field === "attendeeName" &&
          value?.trim()
        )
          delete fieldErrors.attendeeName;
        if (Object.keys(fieldErrors).length === 0) {
          const { [index]: _, ...rest } = prev.attendees!;
          return {
            ...prev,
            attendees: Object.keys(rest).length > 0 ? rest : undefined,
          };
        }
        return {
          ...prev,
          attendees: { ...prev.attendees, [index]: fieldErrors },
        };
      });
    },
    [],
  );

  const addAttendee = useCallback(() => {
    setAttendees((prev) => {
      const updated = prev.map((a) => ({ ...a, isExpanded: false }));
      return [
        ...updated,
        {
          id: `att-${Date.now()}-${Math.random()}`,
          sNo: prev.length + 1,
          attendeeName: "",
          organization: "",
          designation: "",
          email: "",
          contactNumbers: [""],
          isExpanded: true,
        },
      ];
    });
  }, []);

  const deleteAttendee = useCallback((index: number) => {
    setAttendees((prev) =>
      prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, sNo: i + 1 })),
    );
  }, []);

  const updateMinute = useCallback(
    (index: number, field: string | object, value?: any) => {
      setMinutes((prev) =>
        prev.map((m, i) => {
          if (i !== index) return m;
          if (typeof field === "object") {
            return { ...m, ...field };
          }
          return { ...m, [field]: value };
        }),
      );

      // Clear validation error for this field when it becomes valid
      setValidationErrors((prev) => {
        if (!prev.minutes?.[index]) return prev;
        const fieldErrors = { ...prev.minutes[index] };
        if (typeof field === "string") {
          if (field === "issueSubject" && value?.trim())
            delete fieldErrors.issueSubject;
          if (field === "raisedBy" && Array.isArray(value) && value.length > 0)
            delete fieldErrors.raisedBy;
          if (field === "targetDate" && value) delete fieldErrors.targetDate;
          if (
            field === "responsibility" &&
            Array.isArray(value) &&
            value.length > 0
          )
            delete fieldErrors.responsibility;
        }
        if (typeof field === "object") {
          const obj = field as any;
          if (obj.targetDateForInfo) delete fieldErrors.targetDate;
          if (obj.responsibilityForInfo) delete fieldErrors.responsibility;
        }
        if (Object.keys(fieldErrors).length === 0) {
          const { [index]: _, ...rest } = prev.minutes!;
          return {
            ...prev,
            minutes: Object.keys(rest).length > 0 ? rest : undefined,
          };
        }
        return { ...prev, minutes: { ...prev.minutes, [index]: fieldErrors } };
      });
    },
    [],
  );

  const addMinute = useCallback(() => {
    setMinutes((prev) => {
      const updated = prev.map((m) => ({ ...m, isExpanded: false }));
      return [
        ...updated,
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
          isExpanded: true,
        },
      ];
    });
  }, []);

  const deleteMinute = useCallback((index: number) => {
    setMinutes((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, serialNo: i + 1 })),
    );
  }, []);

  const openDatePicker = useCallback((index: number) => {
    setDateIndex(index);
    setShowDatePicker(true);
  }, []);

  const onDateConfirm = useCallback(
    (date: Date) => {
      if (dateIndex !== null) {
        updateMinute(dateIndex, "targetDate", date.toISOString());
      }
      setShowDatePicker(false);
      setDateIndex(null);
    },
    [dateIndex, updateMinute],
  );

  const onDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      if (event.type === "set" && selectedDate) {
        onDateConfirm(selectedDate);
      } else {
        setShowDatePicker(false);
        setDateIndex(null);
      }
    },
    [onDateConfirm],
  );

  const onAttendeeDragEnd = useCallback(({ data }: { data: any[] }) => {
    setAttendees(data.map((item, index) => ({ ...item, sNo: index + 1 })));
  }, []);

  const onMinuteDragEnd = useCallback(({ data }: { data: any[] }) => {
    setMinutes(data.map((item, index) => ({ ...item, serialNo: index + 1 })));
  }, []);

  const handlePickImage = useCallback(
    async (index: number) => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission to access gallery was denied",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newUris = result.assets.map((a: any) => a.uri);
        newUris.forEach((uri: string) => addImageToIssue(index, uri));
        setMinutes((prev) =>
          prev.map((m, i) =>
            i === index
              ? { ...m, images: [...(m.images || []), ...newUris] }
              : m,
          ),
        );
      }
    },
    [addImageToIssue],
  );


  const handleDeleteImage = useCallback(
    (minuteIndex: number, imageUri: string) => {
      removeImageFromIssue(minuteIndex, imageUri);
      setMinutes((prev) =>
        prev.map((m, i) =>
          i === minuteIndex
            ? {
                ...m,
                images: (m.images || []).filter(
                  (uri: string) => uri !== imageUri,
                ),
              }
            : m,
        ),
      );
    },
    [removeImageFromIssue],
  );

  const handleToggleAttendee = useCallback((index: number) => {
    setAttendees((prev) =>
      prev.map((a, i) => ({
        ...a,
        isExpanded: i === index ? !a.isExpanded : false,
      })),
    );
  }, []);

  const handleToggleMinute = useCallback((index: number) => {
    setMinutes((prev) =>
      prev.map((m, i) => ({
        ...m,
        isExpanded: i === index ? !m.isExpanded : false,
      })),
    );
  }, []);

  const handleDeleteMinuteRequest = useCallback((index: number) => {
    setSelectedIndex(index);
    setShowDeleteModal(true);
  }, []);

  const renderAttendee = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
      const idx = getIndex();
      return (
        <ScaleDecorator>
          <AttendeeItem
            item={item}
            drag={drag}
            isActive={isActive}
            expanded={!!item.isExpanded}
            onToggleExpand={handleToggleAttendee}
            onUpdate={updateAttendee}
            onDelete={deleteAttendee}
            users={directoryUsers}
            onSearch={handleSearchDirectory}
            showDelete={true}
            isDarkMode={isDarkMode}
            getIndex={getIndex}
            fieldErrors={
              idx !== undefined ? validationErrors.attendees?.[idx] : undefined
            }
          />
        </ScaleDecorator>
      );
    },
    [
      directoryUsers,
      isDarkMode,
      handleToggleAttendee,
      updateAttendee,
      deleteAttendee,
      handleSearchDirectory,
      validationErrors,
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

  // Helper for existing images from backend
  const mImagesFromMinute = (item: any, index: number) => {
    if (item.images && item.images.length > 0) {
      item.images.forEach((uri: string) => {
        if (!(images[index] || []).includes(uri)) {
          addImageToIssue(index, uri);
        }
      });
    }
    return item.images || [];
  };

  const formatMinutes = () => {
    return minutes.map((m, i) => ({
      serialNo: m.serialNo ?? i + 1,
      issueSubject: m.issueSubject,
      description: m.issueDescription || "",
      raisedBy: (m.raisedBy || []).map((r: any) => ({
        _id: r.value,
        name: r.label,
        label: r.label,
      })),
      responsibility: (m.responsibility || []).map((r: any) => ({
        _id: r.value,
        name: r.label,
        label: r.label,
      })),
      targetDate: m.targetDateForInfo ? null : m.targetDate,
      remarks: m.remarks || "",
      targetDateForInfo: !!m.targetDateForInfo,
      responsibilityForInfo: !!m.responsibilityForInfo,
      fromForwardedId: m.fromForwardedId || null,
      status: m.status || "open",
      attachments: m.images || [], // ✅ send attachments
    }));
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingUsers(true);
      await fetchDirectory(); // Initial load (prioritized)

      try {
        // 2. Fetch Project-Specific Users (For RaisedBy / Responsibility)
        if (projectId) {
          const resProj = await api.get(
            `/projects/${projectId}/users-dropdown`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (resProj.data) {
            const formatted = resProj.data.map((u: any) => ({
              label: `${u.individualName} (${u.firmName || "N/A"})`,
              value: u._id,
              attendeeName: u.individualName,
              organization: u.firmName,
              designation: u.designation,
              email: u.email,
              contactNumbers: u.contactNumbers?.length
                ? u.contactNumbers
                : [""],
            }));
            setInternalUsers(formatted);
          }
        }
      } catch (e) {
        console.log("Error fetching project users-dropdown:", e);
      }

      setLoadingUsers(false);
    };

    fetchAllData();
  }, [token, projectId]);

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
        setMeeting(data);
        setMeetingTitle(data.meetingTitle || "");

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
              userId: a.userId?._id || a.userId || null,
              contactNumbers: (a.contactNumbers || []).filter(
                (n: string) => n.trim() !== "",
              ),
              isExpanded: idx === 0,
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
            raisedBy: (m.raisedBy || []).map((r: any) => ({
              value: r.value || r._id,
              label: r.label || r.name,
            })),
            responsibility: (m.responsibility || []).map((r: any) => ({
              value: r.value || r._id,
              label: r.label || r.name,
            })),
            status: m.status || "open",
            targetDateForInfo: !!m.targetDateForInfo,
            responsibilityForInfo: !!m.responsibilityForInfo,
            fromForwardedId: m.fromForwardedId || null,
            images: Array.isArray(m.attachments) ? m.attachments : [], // ✅ load attachments
            isExpanded: idx === 0,
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

      // ✅ Validation with field-level error tracking
      const errors: ValidationErrors = {};
      let hasError = false;
      let firstErrorLocation: "meetingInfo" | "attendees" | "minutes" | null =
        null;
      let firstErrorMinuteIdx: number | null = null;
      let firstErrorAttendeeIdx: number | null = null;

      if (type === "mom") {
        // Meeting info validation
        if (!meetingDate) {
          errors.meetingDate = true;
          hasError = true;
          if (!firstErrorLocation) firstErrorLocation = "meetingInfo";
        }
        if (!meetingTime) {
          errors.meetingTime = true;
          hasError = true;
          if (!firstErrorLocation) firstErrorLocation = "meetingInfo";
        }
        if (!meetingVenue) {
          errors.meetingVenue = true;
          hasError = true;
          if (!firstErrorLocation) firstErrorLocation = "meetingInfo";
        }

        // Attendee validation
        if (attendees.length === 0) {
          hasError = true;
          if (!firstErrorLocation) firstErrorLocation = "attendees";
        } else {
          const attendeeErrors: ValidationErrors["attendees"] = {};
          attendees.forEach((a, idx) => {
            const fieldErrs: any = {};
            if (!a.attendeeName?.trim()) {
              fieldErrs.attendeeName = true;
              hasError = true;
            }
            if (Object.keys(fieldErrs).length > 0) {
              attendeeErrors[idx] = fieldErrs;
              if (!firstErrorLocation) {
                firstErrorLocation = "attendees";
                firstErrorAttendeeIdx = idx;
              }
            }
          });
          if (Object.keys(attendeeErrors).length > 0)
            errors.attendees = attendeeErrors;
        }
      }

      // Minutes validation (for both agenda and MOM)
      const minuteErrors: ValidationErrors["minutes"] = {};
      minutes.forEach((m, idx) => {
        const fieldErrs: any = {};
        if (!m.issueSubject?.trim()) {
          fieldErrs.issueSubject = true;
          hasError = true;
        }
        if (!m.raisedBy || m.raisedBy.length === 0) {
          fieldErrs.raisedBy = true;
          hasError = true;
        }
        if (type === "mom") {
          if (!m.targetDate && !m.targetDateForInfo) {
            fieldErrs.targetDate = true;
            hasError = true;
          }
          if (
            (!m.responsibility || m.responsibility.length === 0) &&
            !m.responsibilityForInfo
          ) {
            fieldErrs.responsibility = true;
            hasError = true;
          }
        }
        if (Object.keys(fieldErrs).length > 0) {
          minuteErrors[idx] = fieldErrs;
          if (!firstErrorLocation) {
            firstErrorLocation = "minutes";
            firstErrorMinuteIdx = idx;
          }
        }
      });
      if (Object.keys(minuteErrors).length > 0) errors.minutes = minuteErrors;

      if (hasError) {
        setValidationErrors(errors);

        // Build descriptive error message
        const missingFields: string[] = [];
        if (errors.meetingDate || errors.meetingTime || errors.meetingVenue)
          missingFields.push("Meeting Info");
        if (errors.attendees) missingFields.push("Attendee Name");
        if (errors.minutes) {
          const minuteFieldSet = new Set<string>();
          Object.values(errors.minutes).forEach((mErr: any) => {
            if (mErr.issueSubject) minuteFieldSet.add("Subject");
            if (mErr.raisedBy) minuteFieldSet.add("Raised By");
            if (mErr.targetDate) minuteFieldSet.add("Target Date");
            if (mErr.responsibility) minuteFieldSet.add("Responsibility");
          });
          minuteFieldSet.forEach((f) => missingFields.push(f));
        }

        Toast.show({
          type: "error",
          text1: "Please fill required fields",
          text2: missingFields.join(", "),
          position: "bottom",
          visibilityTime: 4000,
        });

        // Auto-expand sections and switch tabs, then scroll
        if (
          firstErrorLocation === "meetingInfo" ||
          firstErrorLocation === "attendees"
        ) {
          setActiveTab("attendees");
          if (firstErrorLocation === "meetingInfo") {
            setShowMeetingInfo(true);
          }
          if (firstErrorLocation === "attendees") {
            setShowAttendeesSection(true);
            if (firstErrorAttendeeIdx !== null) {
              setAttendees((prev) =>
                prev.map((a, i) => ({
                  ...a,
                  isExpanded: i === firstErrorAttendeeIdx,
                })),
              );
            }
          }
        } else if (firstErrorLocation === "minutes") {
          setActiveTab("minutes");
          setShowMinutesSection(true);
          if (firstErrorMinuteIdx !== null) {
            setMinutes((prev) =>
              prev.map((m, i) => ({
                ...m,
                isExpanded: i === firstErrorMinuteIdx,
              })),
            );
          }
        }

        // Scroll to top after tab switch to show errors
        setTimeout(() => {
          scrollRef.current?.scrollTo?.({ y: 0, animated: true });
        }, 300);

        return;
      }

      // Clear errors on successful validation
      setValidationErrors({});

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
        attachments: m.images || [], // ✅ send attachments
      }));

      const formData = new FormData();
      if (projectId)
        formData.append(
          "projectId",
          Array.isArray(projectId) ? projectId[0] : projectId,
        );
      if (meetingTitle) formData.append("meetingTitle", meetingTitle);
      if (meetingDate)
        formData.append("meetingDate", meetingDate.toISOString());
      if (meetingTime) formData.append("meetingTime", meetingTime);
      if (meetingVenue) formData.append("meetingVenue", meetingVenue);
      formData.append("isATReview", isATReview.toString());
      formData.append("actionType", String(type));

      formData.append("attendees", JSON.stringify(formattedAttendees));
      formData.append("minutes", JSON.stringify(formattedMinutes));

      formattedMinutes.forEach((m, idx) => {
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach((uri: string, imgIdx: number) => {
            if (!uri.startsWith("http")) {
              const fileObj = {
                uri:
                  Platform.OS === "android" ? uri : uri.replace("file://", ""),
                name: `minute_${idx}_${Date.now()}_${imgIdx}.jpg`,
                type: "image/jpeg",
              } as any;
              formData.append(`files_${idx}`, fileObj);
            }
          });
        }
      });

      // ✅ Call API
      if (!meetingId) {
        await api.post(`/minutes`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.put(`/minutes/${meetingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
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

      const formData = new FormData();
      if (projectId)
        formData.append(
          "projectId",
          Array.isArray(projectId) ? projectId[0] : projectId,
        );
      if (meetingTitle) formData.append("meetingTitle", meetingTitle);
      if (meetingDate)
        formData.append("meetingDate", meetingDate.toISOString());
      if (meetingTime) formData.append("meetingTime", meetingTime);
      if (meetingVenue) formData.append("meetingVenue", meetingVenue);
      formData.append("isATReview", isATReview.toString());
      formData.append("draftSubmitted", "true");

      const fAttendees = formatAttendees();
      const fMinutes = minutes.map((m, i) => ({
        ...formatMinutes()[i],
        attachments: m.images || [],
      }));

      formData.append("attendees", JSON.stringify(fAttendees));
      formData.append("minutes", JSON.stringify(fMinutes));

      fMinutes.forEach((m, idx) => {
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach((uri: string, imgIdx: number) => {
            if (!uri.startsWith("http")) {
              const fileObj = {
                uri:
                  Platform.OS === "android" ? uri : uri.replace("file://", ""),
                name: `minute_${idx}_${Date.now()}_${imgIdx}.jpg`,
                type: "image/jpeg",
              } as any;
              formData.append(`files_${idx}`, fileObj);
            }
          });
        }
      });

      if (!meetingId) {
        await api.post("/minutes/draft", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.put(`/minutes/draft/${meetingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
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

          <View className="flex-row items-center">
            {/* Temporary Download Agenda Buttons */}
            {/* {meetingId && (
              <View className="flex-row items-center mr-3">
                <TouchableOpacity
                  onPress={async () => {
                    setIsAgendaDownloading(true);
                    try {
                      const currentMeeting = {
                        ...meeting,
                        meetingTitle,
                        meetingDate,
                        meetingTime,
                        meetingVenue,
                        attendees: formatAttendees(),
                        minutes: formatMinutes(),
                      };
                      await handleDownloadAgenda(
                        currentMeeting,
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        token,
                        "pdf",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                  className="flex-row items-center bg-[#F1F5F9] dark:bg-[#1A1A1A] px-2 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2A2A] mr-1.5"
                >
                  {isAgendaDownloading ? (
                    <ActivityIndicator size="small" color={isDarkMode ? "#D2D2D2" : "#454545"} />
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={Pdf01Icon}
                        size={16}
                        color={isDarkMode ? "#D2D2D2" : "#454545"}
                      />
                      <Text className="ml-1 text-[11px] font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                        PDF
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    setIsAgendaDownloading(true);
                    try {
                      const currentMeeting = {
                        ...meeting,
                        meetingTitle,
                        meetingDate,
                        meetingTime,
                        meetingVenue,
                        attendees: formatAttendees(),
                        minutes: formatMinutes(),
                      };
                      await handleDownloadAgenda(
                        currentMeeting,
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        token,
                        "excel",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                  className="flex-row items-center bg-[#F1F5F9] dark:bg-[#1A1A1A] px-2 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2A2A]"
                >
                  {isAgendaDownloading ? (
                    <ActivityIndicator size="small" color={isDarkMode ? "#D2D2D2" : "#454545"} />
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={Download01Icon}
                        size={16}
                        color={isDarkMode ? "#D2D2D2" : "#454545"}
                      />
                      <Text className="ml-1 text-[11px] font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                        XLS
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )} */}

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

            {meeting?.agendaSubmitted && (
              <TouchableOpacity
                onPress={() => setExportMenuVisible(true)}
                className="ml-4"
              >
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Switcher */}
        <View
          className={`flex-row  ${isDarkMode ? "bg-black " : "bg-[#FBFCFD] "}`}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("attendees")}
            className={`flex-1 py-3 items-center ${
              activeTab === "attendees"
                ? "border-b-[1.5px] border-[#5B4CCC]"
                : `border-b-[1px] ${isDarkMode ? "border-[#413E47]" : "border-[#E0E5EB]"}`
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
                ? "border-b-[1.5px] border-[#5B4CCC]"
                : `border-b-[1px] ${isDarkMode ? "border-[#413E47]" : "border-[#E0E5EB]"}`
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

        {/* Export Menu (Fast Overlay) */}
        {exportMenuVisible && (
          <View
            key="export-menu-overlay"
            className="absolute top-[-12] left-0 right-0 bottom-0 z-[50]"
            pointerEvents="box-none"
          >
            <Pressable
              className="absolute inset-0"
              onPress={() => setExportMenuVisible(false)}
            />
            <View className="absolute top-[100px] right-1">
              {/* Menu Container */}
              <View
                className="bg-white dark:bg-[#1A1A1A] border border-[transparent] dark:border-[#2A2A2A] rounded-2xl p-2"
                style={{
                  elevation: 25,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.2,
                  shadowRadius: 16,
                  minWidth: 170,
                }}
              >
                {/* Triangle Pointer */}
                <View
                  className="absolute rounded-md right-4 -top-1.5 w-4 h-4 bg-white dark:bg-[#1A1A1A] rotate-45 "
                  style={{
                    zIndex: -1,
                  }}
                />

                <TouchableOpacity
                  onPress={async () => {
                    setExportMenuVisible(false);
                    setIsAgendaDownloading(true);
                    try {
                      const currentMeeting = {
                        ...meeting,
                        meetingTitle,
                        meetingDate,
                        meetingTime,
                        meetingVenue,
                        attendees: formatAttendees(),
                        minutes: formatMinutes(),
                      };
                      await handleDownloadAgenda(
                        currentMeeting,
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        token,
                        "pdf",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                  className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
                >
                  <HugeiconsIcon
                    icon={Pdf01Icon}
                    size={24}
                    color={isDarkMode ? "#D2D2D2" : "#454545"}
                  />
                  <Text className="ml-3 text-base font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                    Export Agenda PDF
                  </Text>
                </TouchableOpacity>

                <View className="h-[1px] bg-gray-100 dark:bg-[#252525] mx-2" />

                <TouchableOpacity
                  onPress={async () => {
                    setExportMenuVisible(false);
                    setIsAgendaDownloading(true);
                    try {
                      const currentMeeting = {
                        ...meeting,
                        meetingTitle,
                        meetingDate,
                        meetingTime,
                        meetingVenue,
                        attendees: formatAttendees(),
                        minutes: formatMinutes(),
                      };
                      await handleDownloadAgenda(
                        currentMeeting,
                        projectName,
                        auth?.user?.fullName ?? "Unknown",
                        company,
                        token,
                        "excel",
                      );
                    } finally {
                      setIsAgendaDownloading(false);
                    }
                  }}
                  className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
                >
                  <HugeiconsIcon
                    icon={Xsl01Icon}
                    size={24}
                    color={isDarkMode ? "#D2D2D2" : "#454545"}
                  />
                  <Text className="ml-3 text-base font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                    Export Agenda Excel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <NestableScrollContainer
          ref={scrollRef}
          style={
            isDarkMode
              ? { backgroundColor: "#000" }
              : { backgroundColor: "#FBFCFD" }
          }
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 220 }}
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
                  className="flex-row justify-between items-center px-4 py-3"
                >
                  <Text
                    className={`text-[15px] font-poppinsSemiBold ${
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
                  <View ref={meetingInfoRef} className="px-4 py-2 gap-4">
                    <TextInput
                      placeholder="Enter Title"
                      placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                      value={meetingTitle}
                      onChangeText={setMeetingTitle}
                      className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                        isDarkMode
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F0F3F7] text-gray-900"
                      }`}
                    />

                    {/* Date / Time Row */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => {
                          setDatePickerVisibility(true);
                          if (validationErrors.meetingDate)
                            setValidationErrors((prev) => ({
                              ...prev,
                              meetingDate: false,
                            }));
                        }}
                        className={`flex-1 flex-row items-center justify-between rounded-xl px-4 py-3.5`}
                        style={{
                          backgroundColor: validationErrors.meetingDate
                            ? isDarkMode
                              ? "#2A1A1A"
                              : "#FFF5F5"
                            : isDarkMode
                              ? "#1A1A1A"
                              : "#F0F3F7",
                          borderWidth: validationErrors.meetingDate ? 1 : 0,
                          borderColor: validationErrors.meetingDate
                            ? "#DF5B5B"
                            : "transparent",
                        }}
                      >
                        <Text
                          className={`text-[14px] font-poppins ${
                            meetingDate
                              ? isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                              : isDarkMode
                                ? "text-[#919191]"
                                : "text-[#454545]"
                          }`}
                        >
                          {meetingDate
                            ? moment(meetingDate).format("DD-MM-YYYY")
                            : "DD-MM-YYYY *"}
                        </Text>
                        <HugeiconsIcon
                          icon={Calendar04Icon}
                          size={18}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                      </TouchableOpacity>

                      {isDatePickerVisible && (
                        <DateTimePicker
                          value={meetingDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, date) => {
                            setDatePickerVisibility(false);
                            if (event.type === "set" && date) {
                              setMeetingDate(date);
                              if (validationErrors.meetingDate)
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  meetingDate: false,
                                }));
                            }
                          }}
                        />
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          setTimePickerVisibility(true);
                          if (validationErrors.meetingTime)
                            setValidationErrors((prev) => ({
                              ...prev,
                              meetingTime: false,
                            }));
                        }}
                        className={`flex-1 flex-row items-center justify-between rounded-xl px-4 py-3.5`}
                        style={{
                          backgroundColor: validationErrors.meetingTime
                            ? isDarkMode
                              ? "#2A1A1A"
                              : "#FFF5F5"
                            : isDarkMode
                              ? "#1A1A1A"
                              : "#F0F3F7",
                          borderWidth: validationErrors.meetingTime ? 1 : 0,
                          borderColor: validationErrors.meetingTime
                            ? "#DF5B5B"
                            : "transparent",
                        }}
                      >
                        <Text
                          className={`text-[14px] font-poppins ${
                            meetingTime
                              ? isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                              : isDarkMode
                                ? "text-[#919191]"
                                : "text-[#454545]"
                          }`}
                        >
                          {meetingTime || "00:00 AM *"}
                        </Text>
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          size={18}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                      </TouchableOpacity>

                      {isTimePickerVisible && (
                        <DateTimePicker
                          value={new Date()}
                          mode="time"
                          display="default"
                          onChange={(event, time) => {
                            setTimePickerVisibility(false);
                            if (event.type === "set" && time) {
                              const formattedTime = moment(time).format("hh:mm A");
                              setMeetingTime(formattedTime);
                              if (validationErrors.meetingTime)
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  meetingTime: false,
                                }));
                            }
                          }}
                        />
                      )}
                    </View>

                    <TextInput
                      placeholder="Enter Venue *"
                      placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                      value={meetingVenue}
                      onChangeText={(val) => {
                        setMeetingVenue(val);
                        if (validationErrors.meetingVenue && val.trim())
                          setValidationErrors((prev) => ({
                            ...prev,
                            meetingVenue: false,
                          }));
                      }}
                      className={`rounded-xl font-poppins px-4 py-3.5 text-[14px] ${
                        isDarkMode
                          ? validationErrors.meetingVenue
                            ? "bg-[#2A1A1A] text-white border border-[#DF5B5B]"
                            : "bg-[#1A1A1A] text-white"
                          : validationErrors.meetingVenue
                            ? "bg-[#FFF5F5] text-gray-900 border border-[#DF5B5B]"
                            : "bg-[#F0F3F7] text-gray-900"
                      }`}
                    />

                    <TouchableOpacity
                      onPress={() => setIsATReview(!isATReview)}
                      className="flex-row items-center py-1"
                      activeOpacity={0.7}
                    >
                      <View
                        className={`w-5 h-5 rounded-[4px] border ${
                          isDarkMode ? "border-[#413E47]" : "border-[#E0E5EB]"
                        } flex items-center justify-center mr-3`}
                      >
                        {isATReview && (
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            size={14}
                            color="#919191"
                          />
                        )}
                      </View>
                      <Text
                        className={`text-[14px] font-poppins ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
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
                  className="flex-row justify-between items-center px-4 py-3"
                >
                  <View className="flex-row items-center">
                    <Text
                      className={`text-[15px] font-poppinsSemiBold ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Attendees
                    </Text>
                  </View>
                  <HugeiconsIcon
                    icon={
                      showAttendeesSection ? ArrowDown01Icon : ArrowUp01Icon
                    }
                    size={20}
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>

                {showAttendeesSection && (
                  <View className="px-4 py-2 gap-3">
                    <NestableDraggableFlatList
                      data={attendees}
                      onDragEnd={onAttendeeDragEnd}
                      keyExtractor={(item) => item.id}
                      renderItem={renderAttendee}
                      activationDistance={20}
                      removeClippedSubviews={Platform.OS === "android"}
                      maxToRenderPerBatch={10}
                      initialNumToRender={10}
                      windowSize={5}
                    />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={addAttendee}
                      disabled={isMomSubmitting || isAgendaSubmitting || isDraftSaving}
                      className={`py-3.5 rounded-xl flex-row justify-center items-center ${
                        isMomSubmitting || isAgendaSubmitting || isDraftSaving
                          ? isDarkMode ? "bg-gray-800" : "bg-gray-200"
                          : isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={PlusSignCircleIcon}
                        size={20}
                        color={isDarkMode ? "#E5E7EB" : "#111827"}
                        className="mr-2"
                      />
                      <Text
                        className={`text-[14px] font-poppinsMedium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        Add Attendees
                      </Text>
                    </TouchableOpacity>
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
                <View className="flex-row justify-between items-center px-4 py-3">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowMinutesSection(!showMinutesSection)}
                    className="flex-row items-center flex-1"
                  >
                    <View className="flex-row items-center">
                      <Text
                        className={`text-[15px] font-poppinsSemiBold ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Minutes
                      </Text>
                    </View>
                    <HugeiconsIcon
                      icon={
                        showMinutesSection ? ArrowDown01Icon : ArrowUp01Icon
                      }
                      size={20}
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={fetchForwardedMinutes}
                    activeOpacity={0.7}
                    disabled={isMomSubmitting || isAgendaSubmitting || isDraftSaving}
                    className={`px-3 py-1.5 rounded-xl border flex-row items-center ml-2 ${
                      isMomSubmitting || isAgendaSubmitting || isDraftSaving
                        ? isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-200 border-gray-300"
                        : isDarkMode
                          ? "bg-[#1A1A1A] border-[#333]"
                          : "bg-[#F0F3F7] border-[#E0E5EB]"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={Download01Icon}
                      size={16}
                      color={isDarkMode ? "#fff" : "#000"}
                    />
                    <Text
                      className={`text-xs font-poppinsSemiBold ml-1.5 ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      From Forwarded
                    </Text>
                  </TouchableOpacity>
                </View>

                {showMinutesSection && (
                  <View className="px-4 py-2 gap-3">
                    <NestableDraggableFlatList
                      data={minutes}
                      onDragEnd={onMinuteDragEnd}
                      keyExtractor={(item) => item.id}
                      activationDistance={20}
                      removeClippedSubviews={Platform.OS === "android"}
                      maxToRenderPerBatch={10}
                      initialNumToRender={10}
                      windowSize={5}
                      renderItem={({ item, drag, isActive, getIndex }) => {
                        const idx = getIndex();
                        return (
                          <ScaleDecorator>
                            <MinuteItem
                              item={item}
                              drag={drag}
                              isActive={isActive}
                              expanded={!!item.isExpanded}
                              onToggleExpand={handleToggleMinute}
                              onUpdate={updateMinute}
                              onDeleteRequest={handleDeleteMinuteRequest}
                              users={internalUsers}
                              showDelete={true}
                              isDarkMode={isDarkMode}
                              onOpenDatePicker={openDatePicker}
                              onPickImage={handlePickImage}
                              onDeleteImage={handleDeleteImage}
                              getIndex={getIndex}
                              showDatePicker={showDatePicker && dateIndex === idx}
                              onDatePickerChange={onDateChange}
                              fieldErrors={
                                idx !== undefined ? validationErrors.minutes?.[idx] : undefined
                              }
                              multipleImages={true}
                            />
                          </ScaleDecorator>
                        );
                      }}
                    />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={addMinute}
                      disabled={isMomSubmitting || isAgendaSubmitting || isDraftSaving}
                      className={`py-3.5 rounded-xl flex-row justify-center items-center ${
                        isMomSubmitting || isAgendaSubmitting || isDraftSaving
                          ? isDarkMode ? "bg-gray-800" : "bg-gray-200"
                          : isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={PlusSignCircleIcon}
                        size={20}
                        color={isDarkMode ? "#E5E7EB" : "#111827"}
                        className="mr-2"
                      />
                      <Text
                        className={`text-[14px] font-poppinsMedium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        Add Minutes
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Modal
                isVisible={forwardedModalVisible}
                onBackdropPress={() => setForwardedModalVisible(false)}
                onBackButtonPress={() => setForwardedModalVisible(false)}
                backdropOpacity={0.4}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                style={{
                  margin: 0,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <View className="w-full items-center pb-10">
                  <View
                    className={`w-[92%] rounded-2xl overflow-hidden ${
                      isDarkMode ? "bg-[#1A1A1A]" : "bg-[#FBFCFD]"
                    }`}
                    style={{ maxHeight: "85%" }}
                  >
                    {/* Handle bar */}
                    <View
                      className={`w-12 h-[2px] rounded-full self-center mt-3 ${
                        isDarkMode ? "bg-[#E0E5EB]" : "bg-[#E0E5EB]"
                      }`}
                    />

                    {/* Header */}
                    <View
                      className={`py-4 border-b ${isDarkMode ? "border-white/5" : "border-[#E0E5EB]"}`}
                    >
                      <Text
                        className={`text-[16px] font-poppinsSemiBold text-center ${isDarkMode ? "text-white" : "text-black"}`}
                      >
                        {forwardedMinutes?.length > 0
                          ? `${forwardedMinutes.length} Forwarded Minutes`
                          : "Forwarded Minutes"}
                      </Text>
                    </View>

                    {/* List or Empty State */}
                    {!forwardedMinutes || forwardedMinutes.length === 0 ? (
                      <View className="justify-center items-center py-10 pb-20">
                        <ExpoImage
                          source={
                            isDarkMode
                              ? require("../assets/images/forwardedMinutesDark.png")
                              : require("../assets/images/forwardedMinutesLight.png")
                          }
                          style={{ width: 125, height: 125 }}
                          contentFit="contain"
                        />
                        <Text
                          className={`font-dmBold text-center mt-4 text-xl ${isDarkMode ? "text-white" : "text-black"}`}
                        >
                          No forwarded minutes available
                        </Text>
                        <Text
                          className={`font-poppins text-center mt-2 text-xs ${isDarkMode ? "text-white" : "text-black"}`}
                        >
                          Forwarded Minutes will appear here once available.
                        </Text>
                      </View>
                    ) : (
                      <FlatList
                        data={forwardedMinutes}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => (
                          <View
                            className={`h-[1px] ${isDarkMode ? "bg-white/5" : "bg-[#E0E5EB]"}`}
                          />
                        )}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            activeOpacity={0.6}
                            className="px-4 py-4"
                            onPress={() => {
                              setMinutes((prev) => {
                                const updated = prev.map((m) => ({
                                  ...m,
                                  isExpanded: false,
                                }));
                                return [
                                  ...updated,
                                  {
                                    id: Date.now() + Math.random().toString(),
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
                                    status: "open",
                                    isExpanded: true,
                                  },
                                ];
                              });
                              setForwardedModalVisible(false);
                            }}
                          >
                            <Text
                              className={`text-[16px] font-poppins ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {item.issueSubject || "Untitled Issue"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    )}
                  </View>

                  {/* Close Button below the card */}
                  <TouchableOpacity
                    onPress={() => setForwardedModalVisible(false)}
                    activeOpacity={0.8}
                    className={`mt-6 px-12 py-4 rounded-full ${
                      isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
                    }`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 10,
                      elevation: 5,
                    }}
                  >
                    <Text
                      className={`text-[16px] font-dm   ${isDarkMode ? "text-white" : "text-black"}`}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </>
          )}

          <View className="mt-8 pb-4 px-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleSubmit("agenda")}
                disabled={isAgendaSubmitting || isMomSubmitting || isDraftSaving}
                className={`flex-1 rounded-2xl ${
                  isAgendaSubmitting || isMomSubmitting || isDraftSaving
                    ? "bg-gray-400"
                    : isDarkMode
                      ? "bg-white/10"
                      : "bg-[#1C1C1E]"
                }`}
                style={{
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isAgendaSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`font-poppins text-[15px] ${isDarkMode ? "text-white" : "text-white"}`}
                  >
                    Submit Agenda
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSubmit("mom")}
                disabled={isMomSubmitting || isAgendaSubmitting || isDraftSaving}
                className="flex-1 rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={
                    isMomSubmitting || isAgendaSubmitting || isDraftSaving
                      ? ["#9CA3AF", "#9CA3AF"]
                      : ["#5B4CCC", "#8056D1"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="items-center justify-center"
                  style={{
                    height: 48,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isMomSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
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
          <NativeModal
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
                    <Text className="text-white font-semibold text-lg">
                      PDF
                    </Text>
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
          </NativeModal>

          {/* <TouchableOpacity
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 rounded-2xl items-center my-4"
        >
          <Text className="text-white font-bold">Submit MOM</Text>
        </TouchableOpacity> */}

          <NativeModal
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
          </NativeModal>
        </NestableScrollContainer>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateMinutes;
