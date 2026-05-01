import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  Calendar04Icon,
  Cancel01Icon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

type Experience = {
  company: string;
  designation: string;
  fromDate: string | null;
  toDate: string | null;
  jobDescription: string;
};

type Education = {
  college: string;
  qualification: string;
  specialization: string;
  graduationYear: string;
};

const RegisterUserScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const { bottom } = useSafeAreaInsets();

  const { userId, educationData, experienceData } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // Basic Info
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // Emails
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // Employee Info
  const [employeeCode, setEmployeeCode] = useState<string>("");
  const [designation, setDesignation] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<string>("");
  const [totalExperience, setTotalExperience] = useState("");
  const [reportingTo, setReportingTo] = useState<string | null>(null);
  const [secondaryReportingTo, setSecondaryReportingTo] = useState<
    string | null
  >(null);
  const [userList, setUserList] = useState<{ label: string; value: string }[]>(
    [],
  );

  // Contact
  const [contactNumbers, setContactNumbers] = useState([""]);
  const [emergencyContact, setEmergencyContact] = useState("");

  // Personal
  const [gender, setGender] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null);
  const [spouseName, setSpouseName] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  const maritalOptions = [
    { label: "Single", value: "Single" },
    { label: "Married", value: "Married" },
  ];

  // Govt IDs
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");

  // Key Strength & Languages
  const [keyStrength, setKeyStrength] = useState<string[]>([]);
  const [keyStrengthInput, setKeyStrengthInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");

  // Education
  const [education, setEducation] = useState<Education[]>([]);

  // Experience
  const [experience, setExperience] = useState<Experience[]>([]);

  // Expansion state
  const [expandedEducation, setExpandedEducation] = useState<number | null>(
    null,
  );
  const [expandedExperience, setExpandedExperience] = useState<number | null>(
    null,
  );

  // Additional Info
  const [additionalInfo, setAdditionalInfo] = useState<string[]>([]);

  // Dropdown options
  const roleOptions = [
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ];
  const levelOptions = [
    ...Array.from({ length: 10 }, (_, i) => ({
      label: `W${i + 1}`,
      value: `W${i + 1}`,
    })),
    { label: "S", value: "S" },
  ];

  const companyOptions = [
    { label: "WALL", value: "WAL+L" },
    { label: "WProjects", value: "WP" },
    { label: "WCorp", value: "WCorp" },
  ];

  const statusOptions = [
    { label: "Permanent", value: "Permanent" },
    { label: "Probation", value: "Probation" },
    { label: "Notice", value: "Notice" },
    { label: "Exit", value: "Exit" },
  ];

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  const [selectedCompany, setSelectedCompany] = useState(null);

  // State definitions
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showBirthPicker, setShowBirthPicker] = useState(false);

  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [showJoinPicker, setShowJoinPicker] = useState(false);

  const [exitDate, setExitDate] = useState<Date | null>(null);
  const [showExitPicker, setShowExitPicker] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (educationData) {
      try {
        const parsed = JSON.parse(educationData as string);
        setEducation(parsed);
      } catch (e) {
        console.error("Failed to parse education data:", e);
      }
    }
  }, [educationData]);

  useEffect(() => {
    if (experienceData) {
      try {
        const parsed = JSON.parse(experienceData as string);
        setExperience(parsed);
      } catch (e) {
        console.error("Failed to parse experience data:", e);
      }
    }
  }, [experienceData]);

  useEffect(() => {
    if (token) {
      api
        .get("/users/names", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const formatted = res.data.map((u: any) => ({
            label: u.fullName,
            value: u._id,
          }));
          setUserList(formatted);
        })
        .catch((err) => {
          console.error("Failed to fetch user names:", err);
        });
    }
  }, [token]);

  useEffect(() => {
    if (userId && userId !== "undefined") {
      setLoading(true);
      api
        .get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data;
          setFullName(user.fullName || "");
          setUsername(user.username || "");
          setAbout(user.about || "");
          setEmail(user.email || "");
          setPersonalEmail(user.personalEmail || "");
          setEmployeeCode(user.employeeCode?.toString() || "");
          setDesignation(user.designation || "");
          setLevel(user.level || "");
          setSelectedCompany(user.company || null);
          setStatus(user.status || "");
          setTotalExperience(user.totalExperience?.toString() || "");
          setReportingTo(user.reportingTo?._id || user.reportingTo || null);
          setSecondaryReportingTo(
            user.secondaryReportingTo?._id || user.secondaryReportingTo || null,
          );
          setContactNumbers(
            user.contactNumbers?.length ? user.contactNumbers : [""],
          );
          setEmergencyContact(user.emergencyContact || "");
          setBirthDate(user.birthDate ? new Date(user.birthDate) : null);
          setJoiningDate(user.joiningDate ? new Date(user.joiningDate) : null);
          setExitDate(user.exitDate ? new Date(user.exitDate) : null);
          setGender(user.gender || "");
          setFatherName(user.fatherName || "");
          setMotherName(user.motherName || "");
          setMaritalStatus(user.maritalStatus || "");
          setSpouseName(user.spouseName || "");
          setHomeAddress(user.homeAddress || "");
          setBloodGroup(user.bloodGroup || "");
          setAadhar(user.aadhar || "");
          setPan(user.pan || "");
          setKeyStrength(user.keyStrength?.length ? user.keyStrength : []);
          setLanguages(user.languages?.length ? user.languages : []);

          if (!educationData) {
            if (user.education?.length) {
              setEducation(
                user.education.map((edu: any) => ({
                  college: edu.college || "",
                  qualification: edu.qualification || "",
                  specialization: edu.specialization || "",
                  graduationYear: edu.graduationYear || "",
                })),
              );
            } else {
              setEducation([]);
            }
          }

          if (!experienceData) {
            if (user.experience?.length) {
              setExperience(
                user.experience.map((exp: any) => ({
                  company: exp.company || exp.companyName || "",
                  designation: exp.designation || exp.jobTitle || "",
                  fromDate: exp.fromDate || null,
                  toDate: exp.toDate || null,
                  jobDescription: exp.jobDescription || "",
                })),
              );
            } else {
              setExperience([]);
            }
          }

          setAdditionalInfo(
            user.additionalInfo?.length ? user.additionalInfo : [],
          );
          setRole(user.role || "user");
        })
        .catch((err) => {
          console.error(
            "Failed to fetch user:",
            err.response?.data || err.message,
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // RESET FORM FOR NEW USER REGISTRATION
      setFullName("");
      setUsername("");
      setAbout("");
      setPassword("");
      setRole("user");
      setEmail("");
      setPersonalEmail("");
      setEmployeeCode("");
      setDesignation("");
      setLevel("");
      setSelectedCompany(null);
      setStatus("");
      setTotalExperience("");
      setReportingTo(null);
      setSecondaryReportingTo(null);
      setContactNumbers([""]);
      setEmergencyContact("");
      setBirthDate(null);
      setJoiningDate(null);
      setExitDate(null);
      setGender("");
      setFatherName("");
      setMotherName("");
      setMaritalStatus("");
      setSpouseName("");
      setHomeAddress("");
      setBloodGroup("");
      setAadhar("");
      setPan("");
      setKeyStrength([]);
      setLanguages([]);
      if (!educationData) setEducation([]);
      if (!experienceData) setExperience([]);
      setAdditionalInfo([]);
    }
  }, [userId, token, educationData, experienceData]);

  const handleRegister = async () => {
    Keyboard.dismiss();

    try {
      setLoading(true);
      const payload: any = {
        fullName,
        username,
        role,
        email,
        personalEmail,
        employeeCode: Number(employeeCode),
        designation,
        level,
        company: selectedCompany,
        status,
        contactNumbers,
        emergencyContact,
        birthDate: birthDate ? birthDate.toISOString() : null,
        joiningDate: joiningDate ? joiningDate.toISOString() : null,
        exitDate: exitDate ? exitDate.toISOString() : null,
        gender,
        fatherName,
        motherName,
        maritalStatus,
        spouseName,
        homeAddress,
        bloodGroup,
        aadhar,
        pan,
        keyStrength,
        languages,
        education,
        experience,
        about,
        totalExperience,
        reportingTo,
        secondaryReportingTo,
        additionalInfo,
      };

      if (!userId && !password?.trim()) {
        Toast.show({
          type: "error",
          text1: "Validation",
          text2: "Password is required for new users.",
          position: "bottom",
        });
        return;
      }

      if (password?.trim()) {
        payload.password = password;
      }

      let res;
      if (userId) {
        res = await api.put(`/auth/${userId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await api.post("/auth/register", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2:
          res.data.message || (userId ? "User updated!" : "User registered!"),
        position: "bottom",
      });

      setTimeout(() => {
        if (userId) {
          router.back();
        } else {
          router.replace("/centralEmployeeDirectory");
        }
      }, 200);

      if (!userId) {
        setFullName("");
        setUsername("");
        setPassword("");
        setRole("");
        setEmail("");
        setPersonalEmail("");
        setEmployeeCode("");
        setDesignation("");
        setLevel("");
        setSelectedCompany(null);
        setStatus("");
        setContactNumbers([]);
        setEmergencyContact("");
        setBirthDate(null);
        setJoiningDate(null);
        setExitDate(null);
        setGender("");
        setFatherName("");
        setMotherName("");
        setMaritalStatus("");
        setSpouseName("");
        setHomeAddress("");
        setBloodGroup("");
        setAadhar("");
        setPan("");
        setEducation([]);
        setExperience([]);
        setAbout("");
        setTotalExperience("");
        setReportingTo(null);
        setSecondaryReportingTo(null);
        setAdditionalInfo([""]);
      }
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Operation failed.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setFullName("");
    setUsername("");
    setPassword("");
    setRole("");
    setEmail("");
    setPersonalEmail("");
    setEmployeeCode("");
    setDesignation("");
    setLevel("");
    setSelectedCompany(null);
    setStatus("");
    setContactNumbers([""]);
    setEmergencyContact("");
    setBirthDate(null);
    setJoiningDate(null);
    setExitDate(null);
    setGender("");
    setFatherName("");
    setMotherName("");
    setMaritalStatus("");
    setSpouseName("");
    setHomeAddress("");
    setBloodGroup("");
    setAadhar("");
    setPan("");
    setEducation([]);
    setExperience([]);
    setAbout("");
    setTotalExperience("");
    setReportingTo(null);
    setSecondaryReportingTo(null);
    setShowCancelModal(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="pt-14 px-4 pb-4 bg-white dark:bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold text-black dark:text-white">
            {userId ? "Update User" : "Register User"}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 40, // Reduced from 150 as buttons are no longer absolute
        }}
        className="bg-white dark:bg-black"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Full Name */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Full Name<Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter Full Name"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* About */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              About
            </Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              placeholder="Give a brief description"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[16px] px-4 py-3 text-black dark:text-white font-poppins text-[14px]"
              style={{ minHeight: 150 }}
            />
          </View>

          {/* Company */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Company<Text className="text-red-500">*</Text>
            </Text>
            <Dropdown
              data={companyOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Company"
              value={selectedCompany}
              onChange={(item) => setSelectedCompany(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Designation */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Designation<Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={designation}
              onChangeText={setDesignation}
              placeholder="e.g. Software Engineer"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Total Experience */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Total Experience{" "}
              <Text className="text-gray-500 font-poppins text-xs">
                (in years)
              </Text>
            </Text>
            <TextInput
              value={totalExperience}
              onChangeText={(val) =>
                setTotalExperience(val.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 5"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              keyboardType="numeric"
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Employee ID */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Employee ID<Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={employeeCode}
              onChangeText={setEmployeeCode}
              placeholder="Enter number"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              keyboardType="numeric"
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Username */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Username<Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. W001"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Password
              {!userId && <Text className="text-red-500">*</Text>}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={userId ? "Leave blank to keep current password" : "Enter password"}
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              // secureTextEntry
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
            {/* {userId && (
              <Text className="text-xs font-poppins text-gray-400 mt-1 ml-1">
                Leave blank to keep the current password.
              </Text>
            )} */}
          </View>

          {/* Joining Date */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Joining Date
            </Text>
            <TouchableOpacity
              onPress={() => setShowJoinPicker(true)}
              activeOpacity={0.7}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] flex-row items-center justify-between"
            >
              <Text
                className="font-poppins text-[14px]"
                style={{
                  color: joiningDate
                    ? isDarkMode
                      ? "#FFFFFF"
                      : "#000000"
                    : isDarkMode
                      ? "#919191"
                      : "#454545",
                }}
              >
                {joiningDate
                  ? joiningDate.toDateString()
                  : "Select Joining date"}
              </Text>
              <HugeiconsIcon
                icon={Calendar04Icon}
                size={20}
                color={isDarkMode ? "#919191" : "#454545"}
              />
            </TouchableOpacity>
            {showJoinPicker && (
              <DateTimePicker
                value={joiningDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (event.type === "set" && date) {
                    setJoiningDate(date);
                  } else if (event.type === "dismissed") {
                    setJoiningDate(null);
                  }
                  setShowJoinPicker(false);
                }}
              />
            )}
          </View>

          {/* Status */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Status <Text className="text-red-500">*</Text>
            </Text>
            <Dropdown
              data={statusOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Status"
              value={status}
              onChange={(item) => setStatus(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Exit Date */}
          {status === "Exit" && (
            <View className="mb-4">
              <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                Exit Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowExitPicker(true)}
                activeOpacity={0.7}
                className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] flex-row items-center justify-between"
              >
                <Text
                  className="font-poppins text-[14px]"
                  style={{
                    color: exitDate
                      ? isDarkMode
                        ? "#FFFFFF"
                        : "#000000"
                      : isDarkMode
                        ? "#919191"
                        : "#454545",
                  }}
                >
                  {exitDate
                    ? exitDate.toDateString()
                    : "Select Exit date"}
                </Text>
                <HugeiconsIcon
                  icon={Calendar04Icon}
                  size={20}
                  color={isDarkMode ? "#919191" : "#454545"}
                />
              </TouchableOpacity>
              {showExitPicker && (
                <DateTimePicker
                  value={exitDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (event.type === "set" && date) {
                      setExitDate(date);
                    } else if (event.type === "dismissed") {
                      setExitDate(null);
                    }
                    setShowExitPicker(false);
                  }}
                />
              )}
            </View>
          )}

          {/* Level */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Level <Text className="text-red-500">*</Text>
            </Text>
            <Dropdown
              data={levelOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Level"
              value={level}
              onChange={(item) => setLevel(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Role */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Role <Text className="text-red-500">*</Text>
            </Text>
            <Dropdown
              data={roleOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Role"
              value={role}
              onChange={(item) => setRole(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Reporting To */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Reporting Manager 
            </Text>
            <Dropdown
              data={userList}
              labelField="label"
              valueField="value"
              search
              searchPlaceholder="Search person..."
              placeholder="Select Person"
              value={reportingTo}
              onChange={(item) => setReportingTo(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Secondary Reporting To */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Secondary Reporting To
            </Text>
            <Dropdown
              data={userList}
              labelField="label"
              valueField="value"
              search
              searchPlaceholder="Search person..."
              placeholder="Select Person"
              value={secondaryReportingTo}
              onChange={(item) => setSecondaryReportingTo(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Official Email */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Official Email <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter official email"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              keyboardType="email-address"
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Personal Email */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Personal Email
            </Text>
            <TextInput
              value={personalEmail}
              onChangeText={setPersonalEmail}
              placeholder="Enter personal email"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              keyboardType="email-address"
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Contact Numbers */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Contact Numbers{" "}
              <Text className="text-gray-500 text-xs">
                (Enter 10 digits number)
              </Text>
            </Text>
            {contactNumbers.map((num, index) => (
              <View key={index} className="relative justify-center mb-2">
                <TextInput
                  value={num}
                  onChangeText={(val) => {
                    const newNumbers = [...contactNumbers];
                    newNumbers[index] = val;
                    setContactNumbers(newNumbers);
                  }}
                  placeholder="Enter contact number"
                  placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="h-[52px] rounded-[16px] px-4 pr-12 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
                />
                {contactNumbers.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const newNumbers = contactNumbers.filter(
                        (_, i) => i !== index,
                      );
                      setContactNumbers(newNumbers.length ? newNumbers : [""]);
                    }}
                    className="absolute right-3"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={18}
                      color="#919191"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setContactNumbers([...contactNumbers, ""])}
              className="flex-row items-center justify-center mt-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-full"
            >
              <Icon name="plus" size={18} color="#4F46E5" />
              <Text className="ml-2 text-indigo-600 dark:text-indigo-400 font-poppinsMedium">
                Add Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Contact */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Emergency Contact{" "}
              <Text className="text-gray-500 text-xs">
                (Enter 10 digits number)
              </Text>
            </Text>
            <TextInput
              value={emergencyContact}
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={setEmergencyContact}
              placeholder="Enter emergency contact"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Birth Date */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Birth Date
            </Text>
            <TouchableOpacity
              onPress={() => setShowBirthPicker(true)}
              activeOpacity={0.7}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] flex-row items-center justify-between"
            >
              <Text
                className="font-poppins text-[14px]"
                style={{
                  color: birthDate
                    ? isDarkMode
                      ? "#FFFFFF"
                      : "#000000"
                    : isDarkMode
                      ? "#919191"
                      : "#454545",
                }}
              >
                {birthDate ? birthDate.toDateString() : "Select birth date"}
              </Text>
              <HugeiconsIcon
                icon={Calendar04Icon}
                size={20}
                color={isDarkMode ? "#919191" : "#454545"}
              />
            </TouchableOpacity>
            {showBirthPicker && (
              <DateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  if (event.type === "set" && date) {
                    setBirthDate(date);
                  } else if (event.type === "dismissed") {
                    setBirthDate(null);
                  }
                  setShowBirthPicker(false);
                }}
              />
            )}
          </View>

          {/* Gender */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Gender
            </Text>
            <Dropdown
              data={genderOptions}
              labelField="label"
              valueField="value"
              placeholder="Select gender"
              value={gender}
              onChange={(item) => setGender(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Father's Name */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Father's Name
            </Text>
            <TextInput
              value={fatherName}
              onChangeText={setFatherName}
              placeholder="Enter father's name"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Mother's Name */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Mother's Name
            </Text>
            <TextInput
              value={motherName}
              onChangeText={setMotherName}
              placeholder="Enter mother's name"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Marital Status */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Marital Status
            </Text>
            <Dropdown
              data={maritalOptions}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={maritalStatus}
              onChange={(item) => setMaritalStatus(item.value)}
              style={{
                height: 52,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              }}
              placeholderStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
            {maritalStatus === "Married" && (
              <View className="mt-4">
                <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                  Spouse Name
                </Text>
                <TextInput
                  placeholder="Enter spouse name"
                  value={spouseName}
                  onChangeText={setSpouseName}
                  placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                  className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
                />
              </View>
            )}
          </View>

          {/* Home Address */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Home Address
            </Text>
            <TextInput
              value={homeAddress}
              onChangeText={setHomeAddress}
              multiline
              placeholder="Enter Home Address"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[16px] px-4 py-3 text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Blood Group */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Blood Group
            </Text>
            <TextInput
              value={bloodGroup}
              onChangeText={setBloodGroup}
              placeholder="Enter Blood Group"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Aadhar Number */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Aadhar Number
            </Text>
            <TextInput
              value={aadhar}
              keyboardType="phone-pad"
              maxLength={12}
              onChangeText={setAadhar}
              placeholder="Enter aadhar number"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* PAN Number */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              PAN Number
            </Text>
            <TextInput
              value={pan}
              onChangeText={setPan}
              placeholder="Enter PAN number"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px]"
            />
          </View>

          {/* Key Strength */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Key Strength
            </Text>
            <TextInput
              value={keyStrengthInput}
              onChangeText={setKeyStrengthInput}
              placeholder="Add multiple strengths"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px] mb-3"
              onSubmitEditing={() => {
                if (keyStrengthInput.trim()) {
                  setKeyStrength([...keyStrength, keyStrengthInput.trim()]);
                  setKeyStrengthInput("");
                }
              }}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            {keyStrength.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {keyStrength.map((strength, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-white dark:bg-black border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2"
                  >
                    <Text className="text-sm font-poppins text-black dark:text-white mr-2">
                      {strength}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setKeyStrength(
                          keyStrength.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={14}
                        color={isDarkMode ? "#919191" : "#454545"}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Language */}
          <View className="mb-4">
            <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
              Language
            </Text>
            <TextInput
              value={languageInput}
              onChangeText={setLanguageInput}
              placeholder="e.g. English"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white font-poppins text-[14px] mb-3"
              onSubmitEditing={() => {
                if (languageInput.trim()) {
                  setLanguages([...languages, languageInput.trim()]);
                  setLanguageInput("");
                }
              }}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            {languages.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {languages.map((lang, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-white dark:bg-black border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2"
                  >
                    <Text className="text-sm font-poppins text-black dark:text-white mr-2">
                      {lang}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setLanguages(languages.filter((_, i) => i !== index));
                      }}
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={14}
                        color={isDarkMode ? "#919191" : "#454545"}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Education */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-poppinsMedium text-black dark:text-white">
                Education
              </Text>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/addEducation",
                    params: {
                      userId: userId as string,
                      existingEducation: JSON.stringify(education),
                    },
                  });
                }}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={PlusSignCircleIcon}
                  size={16}
                  color="#0073CB"
                />
                <Text className="ml-2 text-[#0073CB] font-poppinsMedium">
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {education.map((edu, idx) => (
              <View
                key={idx}
                className="mb-4 overflow-hidden rounded-2xl bg-[#F0F3F7] dark:bg-[#1A1A1A]"
              >
                <TouchableOpacity
                  onPress={() =>
                    setExpandedEducation(expandedEducation === idx ? null : idx)
                  }
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="text-sm font-poppinsMedium text-black dark:text-white flex-1 pr-4">
                    {edu.college || "University/School"}
                  </Text>
                  <HugeiconsIcon
                    icon={
                      expandedEducation === idx
                        ? ArrowUp01Icon
                        : ArrowDown01Icon
                    }
                    size={20}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>

                {expandedEducation === idx && (
                  <View className="px-4 pb-4">
                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="mb-4">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Institute Name
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {edu.college || "N/A"}
                      </Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="mb-4">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Degree/ Diploma
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {edu.qualification || "N/A"}
                      </Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="mb-4">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Specialization
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {edu.specialization || "N/A"}
                      </Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Year of completion
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {edu.graduationYear || "N/A"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Work Experience */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-poppinsMedium text-black dark:text-white">
                Work Experience
              </Text>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/addWorkExperience",
                    params: {
                      userId: userId as string,
                      existingExperience: JSON.stringify(experience),
                    },
                  });
                }}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={PlusSignCircleIcon}
                  size={16}
                  color="#0073CB"
                />
                <Text className="ml-2 text-[#0073CB] font-poppinsMedium">
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {experience.map((exp, idx) => (
              <View
                key={idx}
                className="mb-4 overflow-hidden rounded-2xl bg-[#F0F3F7] dark:bg-[#1A1A1A]"
              >
                <TouchableOpacity
                  onPress={() =>
                    setExpandedExperience(
                      expandedExperience === idx ? null : idx,
                    )
                  }
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="text-sm font-poppinsMedium text-black dark:text-white flex-1 pr-4">
                    {exp.company || "Company"}
                  </Text>
                  <HugeiconsIcon
                    icon={
                      expandedExperience === idx
                        ? ArrowUp01Icon
                        : ArrowDown01Icon
                    }
                    size={20}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>

                {expandedExperience === idx && (
                  <View className="px-4 pb-4">
                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="mb-4">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Company Name
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {exp.company || "N/A"}
                      </Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="mb-4">
                      <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                        Designation
                      </Text>
                      <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                        {exp.designation || "N/A"}
                      </Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-[#252525] mb-4" />

                    <View className="flex-row">
                      <View className="flex-1">
                        <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                          From Date
                        </Text>
                        <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                          {exp.fromDate
                            ? new Date(exp.fromDate).toLocaleDateString()
                            : "N/A"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                          To Date
                        </Text>
                        <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                          {exp.toDate
                            ? new Date(exp.toDate).toLocaleDateString()
                            : "N/A"}
                        </Text>
                      </View>
                    </View>

                    {exp.jobDescription ? (
                      <>
                        <View className="h-[1px] bg-gray-200 dark:bg-[#252525] my-4" />
                        <View>
                          <Text className="text-xs font-poppinsMedium text-gray-500 dark:text-gray-400 mb-1">
                            Job Description
                          </Text>
                          <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                            {exp.jobDescription}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Additional Info */}
          {/* <View className="mb-6">
          <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
            Additional Info
          </Text>
          {additionalInfo.map((info, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                value={info}
                onChangeText={(val) => {
                  const newInfo = [...additionalInfo];
                  newInfo[index] = val;
                  setAdditionalInfo(newInfo);
                }}
                placeholder="Enter additional info"
                placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                className="flex-1 bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
              />
              {additionalInfo.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const newInfo = additionalInfo.filter(
                      (_, i) => i !== index,
                    );
                    setAdditionalInfo(newInfo.length ? newInfo : [""]);
                  }}
                  className="ml-2 bg-red-100 dark:bg-red-900/30 p-2 rounded-full"
                >
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setAdditionalInfo([...additionalInfo, ""])}
            className="flex-row items-center justify-center mt-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-full"
          >
            <Icon name="plus" size={18} color="#4F46E5" />
            <Text className="ml-2 text-indigo-600 dark:text-indigo-400 font-poppinsMedium">
              Add Info
            </Text>
          </TouchableOpacity>
        </View> */}
      </KeyboardAwareScrollView>

      {/* Bottom Action Buttons */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          className="bg-white dark:bg-black px-4 pt-4 flex-row gap-3"
          style={{ paddingBottom: Math.max(bottom, 20) }}
        >
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            className="flex-1 bg-transparent border border-[#BBB] dark:border-[#333] rounded-xl py-3 items-center"
          >
            <Text className="text-[#777777] dark:text-[#919191] font-poppins text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="flex-1 "
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 12,
                alignItems: "center",
                borderRadius: 12,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-poppins text-lg">
                  {userId ? "Update" : "Register"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>

      {/* Discard Changes Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCancelModal(false)}
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()} // Prevent bubbling to background
            className="bg-white dark:bg-[#1A1A1A] w-full rounded-[24px] p-6 shadow-xl"
          >
            <Text className="text-lg font-poppinsMedium text-black dark:text-white mb-8">
              Are you sure you want to discard changes?
            </Text>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="flex-1 border border-black dark:border-white rounded-xl py-3 items-center"
              >
                <Text className="text-black dark:text-white  font-poppins  text-lg">
                  Not Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDiscard}
                className="flex-1 bg-[#DF5B5B] rounded-xl py-3 items-center"
              >
                <Text className="text-white font-poppins  text-lg">
                  Yes I’m
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default RegisterUserScreen;
