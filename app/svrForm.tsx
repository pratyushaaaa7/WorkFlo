import {
  ArrowLeft01Icon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import uuid from "react-native-uuid";
import AttendeeItem from "../components/AttendeeItem";
import MinuteItem from "../components/MinuteItem";
import { AuthContext } from "../context/AuthContext";
import { Image as ExpoImage } from "expo-image";
import api from "../lib/api";
import { FlatList } from "react-native";

interface Entry {
  id: string;
  serialNo: number;
  issueSubject: string;
  issueDescription: string;
  responsibility: any[];
  isExpanded: boolean;
  raisedBy: any[];
  status: string;
  targetDate: any;
  images: string[];
}

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

const SVRform = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const { projectName, company, projectId, teamLeaders, teamMembers, mode } =
    useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Use dynamic storage key based on projectId if available
  const pIdStr = Array.isArray(projectId) ? projectId[0] : (projectId as string);
  const storageKey = `SVR_FORM_DATA_${pIdStr || "default"}`;

  const resetForm = useCallback(() => {
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
    setEntries([
      {
        id: uuid.v4().toString(),
        serialNo: 1,
        issueSubject: "",
        issueDescription: "",
        responsibility: [],
        isExpanded: true,
        raisedBy: [],
        status: "open",
        targetDate: null,
        images: [],
      },
    ]);
    setCaseStudyRemarks("");
    setActiveTab("attendees");
  }, []);

  const [activeTab, setActiveTab] = useState("attendees");
  const [entries, setEntries] = useState<Entry[]>([]);
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
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [caseStudyRemarks, setCaseStudyRemarks] = useState("");
  const [dateIndex, setDateIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchDirectory = useCallback(
    async (searchQuery: string = "") => {
      try {
        if (!token) return;
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
      fetchDirectory(query);
    },
    [fetchDirectory],
  );

  // Fetch users for dropdowns
  useEffect(() => {
    const fetchInternalUsers = async () => {
      try {
        if (!token || !projectId) return;
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName || "N/A"})`,
          value: u._id,
          attendeeName: u.individualName,
          organization: u.firmName || "",
          designation: u.designation || "",
          email: u.email || "",
          contactNumbers: u.contactNumbers?.length ? u.contactNumbers : [""],
        }));
        setInternalUsers(formatted);
      } catch (err) {
        console.log("Fetch internal users error:", err);
      }
    };

    fetchDirectory();
    fetchInternalUsers();
  }, [token, projectId, fetchDirectory]);

  // Initial Entry if empty
  useEffect(() => {
    if (entries.length === 0) {
      setEntries([
        {
          id: uuid.v4().toString(),
          serialNo: 1,
          issueSubject: "",
          issueDescription: "",
          responsibility: [],
          isExpanded: true,
          raisedBy: [],
          status: "open",
          targetDate: null,
          images: [],
        },
      ]);
    }
  }, [entries.length]);

  // Persistence: Load
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.attendees) setAttendees(parsed.attendees);
          if (parsed.entries) setEntries(parsed.entries);
          if (parsed.caseStudyRemarks)
            setCaseStudyRemarks(parsed.caseStudyRemarks);
        } else {
          resetForm();
        }
      } catch (err) {
        console.log("Load draft error:", err);
      }
    };
    loadDraft();
  }, [storageKey]);

  // Persistence: Auto-Save (debounced)
  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(async () => {
      try {
        const data = {
          attendees,
          entries,
          caseStudyRemarks,
          projectId,
          projectName,
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));
      } catch (err) {
        console.log("Auto-save error:", err);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [attendees, entries, caseStudyRemarks, projectId, projectName, storageKey]);

  // --- Handlers: Attendees ---
  const updateAttendee = useCallback(
    (index: number, field: string | object, value?: any) => {
      setAttendees((prev) =>
        prev.map((a, i) => {
          if (i !== index) return a;
          if (typeof field === "object") return { ...a, ...field };
          if (field === "phone") {
            const contactNumbers = [...(a.contactNumbers || [""])];
            contactNumbers[0] = value;
            return { ...a, contactNumbers };
          }
          return { ...a, [field]: value };
        }),
      );
    },
    [],
  );

  const addAttendee = useCallback(() => {
    setAttendees((prev) => {
      const updated = prev.map((a) => ({ ...a, isExpanded: false }));
      return [
        ...updated,
        {
          id: uuid.v4().toString(),
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

  const handleToggleAttendee = useCallback((index: number) => {
    setAttendees((prev) =>
      prev.map((a, i) => ({
        ...a,
        isExpanded: i === index ? !a.isExpanded : false,
      })),
    );
  }, []);

  // --- Handlers: Discussion Entries ---
  const updateEntry = useCallback(
    (index: number, field: string | object, value?: any) => {
      setEntries((prev) =>
        prev.map((m, i) => {
          if (i !== index) return m;
          if (typeof field === "object") return { ...m, ...field };
          return { ...m, [field]: value };
        }),
      );
    },
    [],
  );

  const addEntry = useCallback(() => {
    setEntries((prev) => {
      const updated = prev.map((m) => ({ ...m, isExpanded: false }));
      return [
        ...updated,
        {
          id: uuid.v4().toString(),
          serialNo: prev.length + 1,
          issueSubject: "",
          issueDescription: "",
          responsibility: [],
          isExpanded: true,
          raisedBy: [],
          status: "open",
          targetDate: null,
          images: [],
        },
      ];
    });
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, serialNo: i + 1 })),
    );
  }, []);

  const handleToggleEntry = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((m, i) => ({
        ...m,
        isExpanded: i === index ? !m.isExpanded : false,
      })),
    );
  }, []);

  // --- Handlers: Multimedia ---
  const onPickImage = useCallback(async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission denied" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a: any) => a.uri);
      setEntries((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, images: uris } : m,
        ),
      );
    }
  }, []);

  const onDeleteImage = useCallback((index: number, uri: string) => {
    setEntries((prev) =>
      prev.map((m, i) =>
        i === index
          ? { ...m, images: (m.images || []).filter((u) => u !== uri) }
          : m,
      ),
    );
  }, []);

  const onOpenDatePicker = useCallback((index: number) => {
    setDateIndex(index);
    setShowDatePicker(true);
  }, []);

  const onDateConfirm = useCallback(
    (date: Date) => {
      if (dateIndex !== null) {
        updateEntry(dateIndex, "targetDate", date);
      }
      setShowDatePicker(false);
    },
    [dateIndex, updateEntry],
  );

  // --- Final Actions ---
  const saveAndNext = useCallback(async () => {
    const mappedEntries = entries.map((e) => ({
      ...e,
      agenda: e.issueSubject,
      discussion: e.issueDescription,
      responsibility: Array.isArray(e.responsibility)
        ? e.responsibility.map((r: any) => r.label).join(", ")
        : e.responsibility,
    }));

    router.push({
      pathname: "/svrPdfForm",
      params: {
        projectName,
        projectId,
        mode,
        company,
        teamLeaders,
        teamMembers,
        svrEntries: JSON.stringify(mappedEntries),
        attendees: JSON.stringify(attendees),
        caseStudyRemarks,
      },
    });
  }, [entries, attendees, caseStudyRemarks, projectName, projectId, mode, company, teamLeaders, teamMembers, router]);

  const skipAndNext = useCallback(async () => {
    router.push({
      pathname: "/svrPdfForm",
      params: {
        projectName,
        projectId,
        company,
        teamLeaders,
        teamMembers,
        svrEntries: "[]",
        attendees: "[]",
        caseStudyRemarks: "",
      },
    });
  }, [projectName, projectId, company, teamLeaders, teamMembers, router]);

  // --- Memoized rendered lists ---
  const renderedAttendees = useMemo(
    () =>
      attendees.map((item, index) => (
        <AttendeeItem
          key={item.id}
          item={item}
          drag={() => {}}
          isActive={false}
          expanded={!!item.isExpanded}
          onToggleExpand={handleToggleAttendee}
          onUpdate={updateAttendee}
          onDelete={deleteAttendee}
          users={directoryUsers}
          onSearch={handleSearchDirectory}
          showDelete={attendees.length > 1}
          isDarkMode={isDarkMode}
          getIndex={() => index}
        />
      )),
    [
      attendees,
      isDarkMode,
      handleToggleAttendee,
      updateAttendee,
      deleteAttendee,
      directoryUsers,
      handleSearchDirectory,
    ],
  );

  const renderedEntries = useMemo(
    () =>
      entries.map((item, index) => (
        <MinuteItem
          key={item.id}
          item={item}
          drag={() => {}}
          isActive={false}
          expanded={!!item.isExpanded}
          onToggleExpand={handleToggleEntry}
          onUpdate={updateEntry}
          onDeleteRequest={removeEntry}
          users={internalUsers}
          showDelete={entries.length > 1}
          isDarkMode={isDarkMode}
          onOpenDatePicker={onOpenDatePicker}
          onPickImage={onPickImage}
          onDeleteImage={onDeleteImage}
          getIndex={() => index}
          showDatePicker={showDatePicker && dateIndex === index}
          onDatePickerChange={(event, date) => {
            if (event.type === "set" && date) {
              onDateConfirm(date);
            } else {
              setShowDatePicker(false);
            }
          }}
          multipleImages={false}
          showRemarks={false}
        />
      )),
    [
      entries,
      internalUsers,
      isDarkMode,
      handleToggleEntry,
      updateEntry,
      removeEntry,
      onOpenDatePicker,
      onPickImage,
      onDeleteImage,
      showDatePicker,
      dateIndex,
      onDateConfirm,
    ],
  );

  // --- UI: CASE STUDY ---
  if (mode === "case-study") {
    return (
      <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
        <View
          className={`pt-16 pb-4 px-4 flex-row items-center justify-between ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}
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
              className={`text-xl font-dmSemiBold ml-2 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Case Study
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          className="flex-1 px-4 mt-4"
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={100}
        >
          <View
            className={`rounded-[20px] p-5 ${isDarkMode ? "bg-[#0D0D0D]" : "bg-white shadow-sm"}`}
          >
            <Text
              className={`text-[15px] font-poppinsMedium mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Remarks <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              multiline
              placeholder="Enter case study details..."
              placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
              value={caseStudyRemarks}
              onChangeText={setCaseStudyRemarks}
              className={`rounded-2xl px-4 py-4 font-poppins min-h-[250px] text-base ${
                isDarkMode
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#F0F3F7] text-gray-900"
              }`}
              textAlignVertical="top"
            />
          </View>
        </KeyboardAwareScrollView>

        <View
          className="mt-8 pb-4 px-4 flex-row gap-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity
            onPress={saveAndNext}
            disabled={!caseStudyRemarks.trim()}
            className="flex-1 h-[56px] rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={
                !caseStudyRemarks.trim()
                  ? ["#9CA3AF", "#9CA3AF"]
                  : ["#5B4CCC", "#8056D1"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 16,
                width: "100%",
                height: "100%",
              }}
            >
              <Text className="text-white font-poppins text-[15px]">
                Save & Next
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- UI: SVR FORM ---
  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          className={`pt-16 pb-4 px-4 flex-row items-center justify-between ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}
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
              className={`text-xl font-dmSemiBold ml-2 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              SVR Form
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          className={`flex-row ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}
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
              className={`text-[15px] font-poppinsMedium ${activeTab === "attendees" ? "text-[#5B4CCC]" : isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Attendees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("discussion")}
            className={`flex-1 py-3 items-center ${
              activeTab === "discussion"
                ? "border-b-[1.5px] border-[#5B4CCC]"
                : `border-b-[1px] ${isDarkMode ? "border-[#413E47]" : "border-[#E0E5EB]"}`
            }`}
          >
            <Text
              className={`text-[15px] font-poppinsMedium ${activeTab === "discussion" ? "text-[#5B4CCC]" : isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Discussion
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main scroll area — plain ScrollView, no JS-driven drag overhead */}
        <FlatList
          ref={scrollRef as any}
          data={activeTab === "attendees" ? attendees : entries}
          style={
            isDarkMode
              ? { backgroundColor: "#000" }
              : { backgroundColor: "#FBFCFD" }
          }
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 220, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (activeTab === "attendees") {
              return (
                <View className="mb-3">
                  <AttendeeItem
                    key={item.id}
                    item={item}
                    drag={() => {}}
                    isActive={false}
                    expanded={!!item.isExpanded}
                    onToggleExpand={handleToggleAttendee}
                    onUpdate={updateAttendee}
                    onDelete={deleteAttendee}
                    users={directoryUsers}
                    onSearch={handleSearchDirectory}
                    showDelete={attendees.length > 1}
                    isDarkMode={isDarkMode}
                    getIndex={() => index}
                  />
                </View>
              );
            } else {
              return (
                <View className="mb-3">
                  <MinuteItem
                    key={item.id}
                    item={item}
                    drag={() => {}}
                    isActive={false}
                    expanded={!!item.isExpanded}
                    onToggleExpand={handleToggleEntry}
                    onUpdate={updateEntry}
                    onDeleteRequest={removeEntry}
                    users={internalUsers}
                    showDelete={entries.length > 1}
                    isDarkMode={isDarkMode}
                    onOpenDatePicker={onOpenDatePicker}
                    onPickImage={onPickImage}
                    onDeleteImage={onDeleteImage}
                    getIndex={() => entries.findIndex(e => e.id === item.id)}
                    multipleImages={false}
                    showRemarks={false}
                  />
                </View>
              );
            }
          }}
          ListFooterComponent={() => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={activeTab === "attendees" ? addAttendee : addEntry}
              className={`py-3.5 rounded-xl flex-row justify-center items-center mt-3 ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            >
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                size={20}
                color={isDarkMode ? "#E5E7EB" : "#111827"}
              />
              <Text
                className={`text-[14px] font-poppinsMedium ml-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                {activeTab === "attendees" ? "Add Attendees" : "Add Discussion"}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Bottom action bar */}
        <View
          className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={skipAndNext}
              className={`flex-1 h-[52px] rounded-xl items-center justify-center ${isDarkMode ? "bg-[#1A1A1A]" : "bg-gray-100"}`}
            >
              <Text
                className={`font-poppinsMedium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveAndNext}
              className="flex-1 h-[52px] rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={["#5B4CCC", "#8056D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  width: "100%",
                  height: "100%",
                }}
              >
                <Text className="text-white font-poppins text-[15px]">
                  Save & Next
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SVRform;
