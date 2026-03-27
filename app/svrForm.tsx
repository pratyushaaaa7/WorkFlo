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
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import uuid from "react-native-uuid";
import AttendeeItem from "../components/AttendeeItem";
import MinuteItem from "../components/MinuteItem";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

interface Entry {
  id: string;
  serialNo: number;
  issueSubject: string;
  issueDescription: string;
  responsibility: any[];
  remarks: string;
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
  const scrollRef = useRef<any>(null);

  // Use dynamic storage key based on projectId if available
  const storageKey = `SVR_FORM_DATA_${projectId || "default"}`;

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
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [caseStudyRemarks, setCaseStudyRemarks] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [dateIndex, setDateIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Keyboard hooks
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch users for dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
          attendeeName: u.individualName,
          organization: u.firmName || "",
          designation: u.designation || "",
          email: u.email || "",
        }));
        setUsers(formatted);
      } catch (err) {
        console.log("Fetch users error:", err);
      }
    };
    fetchUsers();
  }, [token, projectId]);

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
          remarks: "",
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
        }
      } catch (err) {
        console.log("Load draft error:", err);
      }
    };
    loadDraft();
  }, [storageKey]);

  // Persistence: Auto-Save
  useEffect(() => {
    const saveDraft = async () => {
      if (!projectId) return;
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
    };
    const timer = setTimeout(saveDraft, 1000); // Debounce save
    return () => clearTimeout(timer);
  }, [
    attendees,
    entries,
    caseStudyRemarks,
    projectId,
    projectName,
    storageKey,
  ]);

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
          remarks: "",
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
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a: any) => a.uri);
      setEntries((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, images: [...(m.images || []), ...uris] } : m,
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

  const onDateConfirm = (date: Date) => {
    if (dateIndex !== null) {
      updateEntry(dateIndex, "targetDate", date);
    }
    setShowDatePicker(false);
  };

  // --- Final Actions ---
  const saveAndNext = async () => {
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
  };

  const skipAndNext = async () => {
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
  };

  // --- Renderers ---
  const renderAttendee = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => (
      <ScaleDecorator>
        <AttendeeItem
          item={item}
          drag={drag}
          isActive={isActive}
          expanded={!!item.isExpanded}
          onToggleExpand={(idx) => handleToggleAttendee(idx)}
          onUpdate={(idx, field, value) => updateAttendee(idx, field, value)}
          onDelete={(idx) => deleteAttendee(idx)}
          users={users}
          showDelete={attendees.length > 1}
          isDarkMode={isDarkMode}
          getIndex={getIndex}
        />
      </ScaleDecorator>
    ),
    [
      isDarkMode,
      handleToggleAttendee,
      updateAttendee,
      deleteAttendee,
      users,
      attendees.length,
    ],
  );

  const renderMinute = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Entry>) => (
      <ScaleDecorator>
        <MinuteItem
          item={item}
          drag={drag}
          isActive={isActive}
          expanded={!!item.isExpanded}
          onToggleExpand={(idx) => handleToggleEntry(idx)}
          onUpdate={(idx, field, value) => updateEntry(idx, field, value)}
          onDeleteRequest={(idx) => removeEntry(idx)}
          users={users}
          showDelete={entries.length > 1}
          isDarkMode={isDarkMode}
          onOpenDatePicker={onOpenDatePicker}
          onPickImage={onPickImage}
          onDeleteImage={onDeleteImage}
          getIndex={getIndex}
        />
      </ScaleDecorator>
    ),
    [
      isDarkMode,
      handleToggleEntry,
      updateEntry,
      removeEntry,
      users,
      entries.length,
      onOpenDatePicker,
      onPickImage,
      onDeleteImage,
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
              className="items-center justify-center py-4 w-full h-full"
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
              className={`text-[15px] font-poppinsMedium ${activeTab === "attendees" ? "text-[#5B4CCC]" : isDarkMode ? "text-gray-500" : "text-gray-400"}}`}
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
              className={`text-[15px] font-poppinsMedium ${activeTab === "discussion" ? "text-[#5B4CCC]" : isDarkMode ? "text-gray-500" : "text-gray-400"}}`}
            >
              Discussion
            </Text>
          </TouchableOpacity>
        </View>

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
            <View className="px-4 py-2 gap-3">
              <NestableDraggableFlatList
                data={attendees}
                renderItem={renderAttendee}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) =>
                  setAttendees(data.map((a, i) => ({ ...a, sNo: i + 1 })))
                }
                activationDistance={20}
                removeClippedSubviews={Platform.OS === "android"}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={addAttendee}
                className={`py-3.5 rounded-xl flex-row justify-center items-center ${
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
                  Add Attendees
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "discussion" && (
            <View className="px-4 py-2 gap-3">
              <NestableDraggableFlatList
                data={entries}
                renderItem={renderMinute}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) =>
                  setEntries(data.map((m, i) => ({ ...m, serialNo: i + 1 })))
                }
                activationDistance={20}
                removeClippedSubviews={Platform.OS === "android"}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={addEntry}
                className={`py-3.5 rounded-xl flex-row justify-center items-center ${
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
                  Add Discussion
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </NestableScrollContainer>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={onDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />

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
                className="items-center justify-center py-4 w-full h-full"
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
