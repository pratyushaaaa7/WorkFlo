import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Alert,
  useColorScheme,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { MinusSignIcon } from "@hugeicons/core-free-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import uuid from "react-native-uuid";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { List, Card } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";

interface Entry {
  id: string;
  agenda: string;
  discussion: string;
  responsibility: string;
  remarks: string;
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

  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  // Users for responsibility dropdown
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [openDirectoryFor, setOpenDirectoryFor] = useState<number | null>(null);
  const [caseStudyRemarks, setCaseStudyRemarks] = useState("");

  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(true); // Treat as visible even if just showing
    });
    const hideSubscriptionActual = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      hideSubscriptionActual.remove();
    };
  }, []);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([
    {
      sNo: 1,
      attendeeName: "",
      // role: "",
      organization: "",
      designation: "",
      email: "",
      // contactNumbers: [""], // first number only
    },
  ]);

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
          // contactNumbers: u.contactNumbers?.length ? u.contactNumbers : [""], // ✅ use existing array
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

  useEffect(() => {
    // Initial one entry
    setEntries([
      {
        id: uuid.v4().toString(),
        agenda: "",
        discussion: "",
        responsibility: "",
        remarks: "",
      },
    ]);
  }, []);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: uuid.v4().toString(),
        agenda: "",
        discussion: "",
        responsibility: "",
        remarks: "",
      },
    ]);
  };

  const updateEntry = (id: string, key: keyof Entry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e))
    );
  };

  const removeEntry = (id: string) => {
    if (entries.length === 1) {
      Alert.alert("Error", "At least one entry must remain.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const saveAndNext = async () => {
    // Save the form data before moving to next screen
    await AsyncStorage.setItem(
      "SVR_FORM_DATA",
      JSON.stringify({
        attendees,
        entries,
        caseStudyRemarks,
        projectName,
        projectId,
      })
    );
    router.push({
      pathname: "/svrPdfForm",
      params: {
        projectName,
        projectId,
        mode,
        company,
        teamLeaders,
        teamMembers,
        svrEntries: JSON.stringify(entries),
        attendees: JSON.stringify(attendees), // ✅ Add this line
        caseStudyRemarks, // ✅ add this
      },
    });
  };

  const skipAndNext = async () => {
    try {
      // Clear saved draft so nothing accidental goes forward
      // Save an empty dataset so nothing old loads next time
      await AsyncStorage.setItem(
        "SVR_FORM_DATA",
        JSON.stringify({
          attendees: [],
          entries: [],
          caseStudyRemarks: "",
          projectName,
          projectId,
        })
      );
    } catch (error) {
      console.log("Error clearing saved SVR form:", error);
    }

    router.push({
      pathname: "/svrPdfForm",
      params: {
        projectName,
        projectId,
        company,
        teamLeaders,
        teamMembers,
        svrEntries: "[]",
        attendees: "[]", // empty arrays for skip
        caseStudyRemarks: "", // ✅ add this for skip case
      },
    });
  };

  // Utility functions
  const updateAttendee = (index: number, field: string, value: any) => {
    const updated = [...attendees];

    if (field === "phone") {
      // ensure contactNumbers array exists
      if (!updated[index].contactNumbers) updated[index].contactNumbers = [""];
      updated[index].contactNumbers[0] = value; // only first number
    } else {
      updated[index][field] = value;
    }

    setAttendees(updated);
  };

  const addAttendee = () =>
    setAttendees((prev) => [
      ...prev,
      {
        sNo: prev.length + 1,
        attendeeName: "",
        // role: "",
        organization: "",
        designation: "",
        email: "",
        // contactNumbers: [""], // first number
      },
    ]);
  const deleteAttendee = (index: number) => {
    const updated = attendees
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, sNo: i + 1 }));
    setAttendees(updated);
  };

  const saveFormToLocal = async () => {
    try {
      const formData = {
        attendees,
        entries,
        projectId,
        projectName,
        company,
        teamLeaders,
        teamMembers,
        caseStudyRemarks, // ✅ ADD THIS
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem("SVR_FORM_DATA", JSON.stringify(formData));
    } catch (error) {
      console.log("Error saving SVR form:", error);
    }
  };

  useEffect(() => {
    const loadStoredForm = async () => {
      try {
        const saved = await AsyncStorage.getItem("SVR_FORM_DATA");
        if (saved) {
          const parsed = JSON.parse(saved);

          // Only load if it's the same project
          if (parsed.projectId === projectId) {
            setAttendees(parsed.attendees || attendees);
            setEntries(parsed.entries || entries);
            setCaseStudyRemarks(parsed.caseStudyRemarks || ""); // ✅
          }
        }
      } catch (error) {
        console.log("Error loading SVR form:", error);
      }
    };

    loadStoredForm();
  }, [projectId]);

  // Auto-save on every change
  useEffect(() => {
    saveFormToLocal();
  }, [attendees, entries, caseStudyRemarks]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDarkMode ? "black" : "white" }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
    >
      <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-white"}`}>
      {/* ---------- FIXED HEADER ---------- */}
      {mode === "case-study" ? (
        <View className="pt-16 pb-6 px-4 flex-row items-center border-b border-transparent">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2"
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            className={`text-2xl font-dmSemiBold ml-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Case Study
          </Text>
        </View>
      ) : (
        <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
          <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <Text className="text-xl font-bold text-white">SVR Form</Text>

            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>
      )}

      {mode === "svr" && (
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="always"
          extraScrollHeight={Platform.OS === "ios" ? 80 : 100}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Content */}
          <View className="flex-1 px-3 py-4">
            {/* ------------------- ATTENDEES SECTION ------------------- */}
            <View className="bg-white rounded-xl p-2 shadow-md mb-6">
              <Text className="text-lg font-bold text-gray-700 p-2">
                Attendees <Text className="text-red-500">*</Text>
              </Text>

              {attendees.map((att, index) => (
                <Card
                  key={index}
                  className="mb-4 rounded-3xl shadow-sm overflow-hidden"
                >
                  <List.Accordion
                    title={
                      <View>
                        <Text className="font-semibold text-gray-700 text-lg">
                          Attendee {att.sNo}
                        </Text>
                        {att.attendeeName ? (
                          <Text className="text-sm text-gray-500">
                            {att.attendeeName}
                          </Text>
                        ) : null}
                      </View>
                    }
                    style={{
                      backgroundColor: "#F0F9FF",
                      borderRadius: 12,
                    }}
                    expanded={expandedAttendee === index}
                    onPress={() =>
                      setExpandedAttendee(
                        expandedAttendee === index ? null : index
                      )
                    }
                  >
                    <Card.Content className="bg-white px-3 py-4">
                      {/* DIRECTORY DROPDOWN */}
                      {openDirectoryFor === index ? (
                        <Dropdown
                          style={{
                            height: 35,
                            borderColor: "#0EA5E9",
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            backgroundColor: "#FFF",
                            marginBottom: 8,
                          }}
                          placeholderStyle={{ fontSize: 14, color: "#0EA5E9" }}
                          selectedTextStyle={{ fontSize: 14, color: "#111827" }}
                          activeColor="#F0F9FF"
                          data={users}
                          labelField="label"
                          valueField="value"
                          value={att.userId}
                          placeholder="Select attendee"
                          search
                          searchPlaceholder="Search..."
                          onChange={(val) => {
                            const user = users.find(
                              (u) => u.value === val.value
                            );
                            if (user) {
                              updateAttendee(index, "userId", user.value);
                              updateAttendee(
                                index,
                                "attendeeName",
                                user.attendeeName || ""
                              );
                              updateAttendee(
                                index,
                                "organization",
                                user.organization || ""
                              );
                              updateAttendee(
                                index,
                                "designation",
                                user.designation || ""
                              );
                              updateAttendee(index, "email", user.email || "");
                              // updateAttendee(
                              //   index,
                              //   "contactNumbers",
                              //   user.contactNumbers || [""]
                              // );
                            }
                            setOpenDirectoryFor(null);
                          }}
                        />
                      ) : !att.userId ? (
                        <TouchableOpacity
                          onPress={() => setOpenDirectoryFor(index)}
                          className="flex-row items-center border w-full border-sky-500 py-2 px-3 rounded-xl justify-center mb-3"
                        >
                          <Ionicons
                            name="people-outline"
                            size={18}
                            color="#0EA5E9"
                          />
                          <Text className="ml-2 text-sky-500 font-medium text-sm">
                            Select From Directory
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {/* MANUAL FIELDS */}
                      <View className="gap-2">
                        <TextInput
                          placeholder="Full Name *"
                          placeholderTextColor="#888"
                          value={att.attendeeName}
                          onChangeText={(t) =>
                            updateAttendee(index, "attendeeName", t)
                          }
                          className={`border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm ${
                            isDarkMode
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#F0F3F7] text-gray-900"
                          }`}
                        />

                        <TextInput
                          placeholder="Organization"
                          placeholderTextColor="#888"
                          value={att.organization}
                          onChangeText={(t) =>
                            updateAttendee(index, "organization", t)
                          }
                          className={`border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm ${
                            isDarkMode
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#F0F3F7] text-gray-900"
                          }`}
                        />

                        <TextInput
                          placeholder="Designation"
                          placeholderTextColor="#888"
                          value={att.designation}
                          onChangeText={(t) =>
                            updateAttendee(index, "designation", t)
                          }
                          className={`border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm ${
                            isDarkMode
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#F0F3F7] text-gray-900"
                          }`}
                        />

                        <TextInput
                          placeholder="Email"
                          placeholderTextColor="#888"
                          value={att.email}
                          onChangeText={(t) =>
                            updateAttendee(index, "email", t)
                          }
                          keyboardType="email-address"
                          className={`border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm ${
                            isDarkMode
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#F0F3F7] text-gray-900"
                          }`}
                        />

                        {/* <TextInput
                        placeholder="Phone"
                        placeholderTextColor="#888"
                        value={att.contactNumbers[0] || ""}
                        onChangeText={(t) => updateAttendee(index, "phone", t)}
                        keyboardType="phone-pad"
                        className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900"
                      /> */}

                        {/* REMOVE BUTTON */}
                        {attendees.length > 1 && (
                          <TouchableOpacity
                            onPress={() => deleteAttendee(index)}
                            className="flex-row items-center justify-end mt-1"
                          >
                            <View className="mb-0.5 h-4 w-4 rounded-full bg-[#EF4444] items-center justify-center mr-1">
                              <HugeiconsIcon
                                icon={MinusSignIcon}
                                size={10}
                                color="#FFFFFF"
                              />
                            </View>
                            <Text className="text-red-500 font-poppinsMedium text-[13px]">
                              Remove
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </Card.Content>
                  </List.Accordion>
                </Card>
              ))}

              {/* ADD ATTENDEE BUTTON */}
              <TouchableOpacity
                onPress={addAttendee}
                className="bg-sky-500 py-3 rounded-2xl items-center my-3 shadow-md active:opacity-80"
              >
                <Text className="text-white font-pbold">+ Add Attendee</Text>
              </TouchableOpacity>
            </View>

            {entries.length === 0 ? (
              <View className="flex-1 items-center justify-center opacity-70 px-6">
                <MaterialCommunityIcons
                  name="playlist-plus"
                  size={64}
                  color="#6366F1"
                />
                <Text className="text-gray-500 mt-2 text-center text-sm">
                  No SVR entries yet. Tap below to add your first one!
                </Text>
              </View>
            ) : (
              <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="always" // <-- ADD THIS
                scrollEnabled={false} // Important with KeyboardAwareScrollView
                renderItem={({ item, index }) => (
                  <View className="bg-white rounded-2xl shadow-md p-4 mb-2 relative">
                    {/* Close Button */}
                    {entries.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeEntry(item.id)}
                        className="absolute top-3 right-3 z-10"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}

                    {/* Header */}
                    <Text className="font-semibold text-indigo-600 text-lg mb-4">
                      Discussion {index + 1}
                    </Text>

                    {/* Agenda Input */}
                    <TextInput
                      placeholder="Agenda"
                      placeholderTextColor="#9ca3af"
                      value={item.agenda}
                      onChangeText={(v) => updateEntry(item.id, "agenda", v)}
                      multiline
                      className={`border border-gray-400 rounded-lg px-4 py-3 mb-2 text-sm font-poppins ${
                        isDarkMode
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F0F3F7] text-gray-900"
                      }`}
                      style={{ minHeight: 40 }}
                    />

                    {/* Discussion Input */}
                    <TextInput
                      placeholder="Discussion"
                      placeholderTextColor="#9ca3af"
                      value={item.discussion}
                      multiline
                      onChangeText={(v) =>
                        updateEntry(item.id, "discussion", v)
                      }
                      className={`border border-gray-400 rounded-lg px-4 py-3 mb-2 text-sm font-poppins ${
                        isDarkMode
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F0F3F7] text-gray-900"
                      }`}
                      style={{ minHeight: 40 }}
                    />

                    {/* Responsibility + For Info */}
                    <View className="mb-2">
                      <View className="flex-row items-center gap-2">
                        {/* Responsibility Input */}
                        <TextInput
                          placeholder="Responsibility"
                          placeholderTextColor="#9ca3af"
                          value={
                            item.responsibility === "For Info"
                              ? "For Info"
                              : item.responsibility
                          }
                          editable={item.responsibility !== "For Info"}
                          multiline
                          onChangeText={(v) =>
                            updateEntry(item.id, "responsibility", v)
                          }
                          className={`flex-1 border rounded-lg px-4 text-sm font-poppins ${
                            item.responsibility === "For Info"
                              ? isDarkMode
                                ? "bg-[#252525] text-gray-500 border-gray-700"
                                : "bg-gray-200 text-gray-500 border-gray-300"
                              : isDarkMode
                                ? "bg-[#1A1A1A] text-white border-gray-600"
                                : "bg-[#F0F3F7] text-gray-700 border-gray-400"
                          }`}
                          style={{ height: 40 }}
                        />

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            const isInfo = item.responsibility === "For Info";
                            updateEntry(
                              item.id,
                              "responsibility",
                              isInfo ? "" : "For Info"
                            );
                          }}
                          style={{
                            height: 40,
                            minWidth: 95,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor:
                              item.responsibility === "For Info"
                                ? "#22c55e"
                                : "#d1d5db",
                            backgroundColor:
                              item.responsibility === "For Info"
                                ? "#22c55e"
                                : "#f3f4f6",
                          }}
                          className="flex-row items-center justify-center px-3"
                        >
                          {item.responsibility === "For Info" && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                          <Text
                            className={`ml-1 text-xs font-medium ${
                              item.responsibility === "For Info"
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            For Info
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Remarks Input */}
                    <TextInput
                      placeholder="Remarks (Optional)"
                      placeholderTextColor="#9ca3af"
                      value={item.remarks}
                      multiline
                      onChangeText={(v) => updateEntry(item.id, "remarks", v)}
                      className={`border border-gray-400 rounded-lg px-4 py-3 mb-2 text-sm font-poppins ${
                        isDarkMode
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F0F3F7] text-gray-900"
                      }`}
                      style={{ minHeight: 40 }}
                    />
                  </View>
                )}
              />
            )}
          </View>
          <View>
            <Pressable
              onPress={addEntry}
              className="bg-indigo-500 px-3 mx-4 py-3 rounded-lg flex-row items-center justify-center mt-2 mb-6"
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text className="text-white ml-2 text-sm font-semibold">
                Add More
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      )}

      {mode === "case-study" && (
        <View className="p-4 flex-1">
          <View
            className={`rounded-2xl p-2 relative ${
              isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
            }`}
            style={{ height: 160 }}
          >
            <TextInput
              placeholder="Remarks"
              value={caseStudyRemarks}
              onChangeText={setCaseStudyRemarks}
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              multiline
              textAlignVertical="top"
              className={`text-lg font-poppins flex-1 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            />
            <View className="absolute bottom-3 right-3 opacity-40">
              <MaterialCommunityIcons
                name="resize-bottom-right"
                size={24}
                color={isDarkMode ? "#fff" : "#000"}
              />
            </View>
          </View>
        </View>
      )}

      {/* Footer Buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 16),
          paddingTop: 12,
          gap: 12,
          backgroundColor: isDarkMode ? "#000" : "#FFF",
          borderTopWidth: mode === "case-study" ? 1 : 0,
          borderTopColor: isDarkMode ? "#111" : "#F0F3F7",
        }}
      >
        <TouchableOpacity
          onPress={skipAndNext}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderWidth: mode === "case-study" ? 1 : 0,
            borderColor: isDarkMode ? "#FFF" : "#000",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: mode === "case-study" ? "transparent" : "#9ca3af",
          }}
        >
          <Text
            className={`text-lg text-center ${
              mode === "case-study"
                ? "font-poppins"
                : "font-medium text-white text-sm"
            } ${
              mode === "case-study"
                ? isDarkMode
                  ? "text-white"
                  : "text-gray-900"
                : "text-white"
            }`}
          >
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveAndNext}
          disabled={mode === "case-study" && !caseStudyRemarks.trim()}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor:
              mode === "case-study"
                ? caseStudyRemarks.trim()
                  ? "transparent"
                  : isDarkMode
                    ? "#1A1A1A"
                    : "#F0F3F7"
                : "#22c55e",
            overflow: "hidden",
            justifyContent: "center",
          }}
        >
          {mode === "case-study" && caseStudyRemarks.trim() ? (
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              locations={[0, 0.5183, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                paddingVertical: 14,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Text className="text-white font-poppins text-lg">Next</Text>
            </LinearGradient>
          ) : (
            <View style={{ paddingVertical: 14, alignItems: "center" }}>
              <Text
                className={
                  mode === "case-study" ? "font-poppins text-lg" : "text-white text-sm font-medium"
                }
                style={{
                  color:
                    mode === "case-study"
                      ? isDarkMode
                        ? "#919191"
                        : "#454545"
                      : "#FFF",
                }}
              >
                {mode === "case-study" ? "Next" : "Save & Next"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
);
};

export default SVRform;
