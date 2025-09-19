import React, { useState, useContext, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Experience = {
  company: string;
  designation: string;
  fromDate: string; // for DateTimePicker
  toDate: string; // for DateTimePicker
  showFromPicker: boolean;
  showToPicker: boolean;
};

const RegisterUserScreen = () => {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const { userId } = useLocalSearchParams(); // 👈 check if we are editing

  const router = useRouter();

  const existingUser = !!userId; // 👈 determines edit mode
  console.log(existingUser);

  const [loading, setLoading] = useState(false);

  // Basic Info
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // Emails
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // Employee Info
  //  const [employeeCode, setEmployeeCode] = useState<number | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string>("");
  const [designation, setDesignation] = useState("");
  const [level, setLevel] = useState("");
  // const [company, setCompany] = useState(null);
  const [status, setStatus] = useState<string>("");

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

  const maritalOptions = [
    { label: "Single", value: "Single" },
    { label: "Married", value: "Married" },
  ];

  // Govt IDs
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");

  // Education
  const [education, setEducation] = useState<
    {
      qualification: string;
      college: string;
      graduationYear: string;
    }[]
  >([]);

  // Experience
  const [experience, setExperience] = useState<Experience[]>([]);

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
    { label: "WAL+L", value: "WAL+L" },
    { label: "WP", value: "WP" },
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

  useEffect(() => {
    if (userId) {
      api
        .get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data;
          console.log(user);

          // ✅ Prefill all fields
          setFullName(user.fullName || "");
          setUsername(user.username || "");
          setEmail(user.email || "");
          setPersonalEmail(user.personalEmail || "");
          setEmployeeCode(user.employeeCode || "");
          setDesignation(user.designation || "");
          setLevel(user.level || "");
          setSelectedCompany(user.company || null);
          setStatus(user.status || "");
          setContactNumbers(
            user.contactNumbers?.length ? user.contactNumbers : [""]
          );
          setEmergencyContact(user.emergencyContact || "");
          setBirthDate(user.birthDate ? new Date(user.birthDate) : null);
          setJoiningDate(user.joiningDate ? new Date(user.joiningDate) : null);
          setGender(user.gender || "");
          setFatherName(user.fatherName || "");
          setMotherName(user.motherName || "");
          setMaritalStatus(user.maritalStatus || "");
          setSpouseName(user.spouseName || "");
          setHomeAddress(user.homeAddress || "");
          setAadhar(user.aadhar || "");
          setPan(user.pan || "");
          setEducation(user.education?.length ? user.education : []);
          setExperience(user.experience?.length ? user.experience : []);
          setAdditionalInfo(
            user.additionalInfo?.length ? user.additionalInfo : []
          );

          // ✅ Prefill role
          setRole(user.role || "user");
        })
        .catch((err) => {
          console.error(
            "Failed to fetch user:",
            err.response?.data || err.message
          );
        });
    }
  }, [userId, token]);

  const handleRegister = async () => {
    Keyboard.dismiss();

    try {
      setLoading(true); // ✅ start loading
      const payload: any = {
        fullName,
        username,
        role,
        email,
        personalEmail,
        employeeCode,
        designation,
        level,
        company: selectedCompany,
        status,
        contactNumbers,
        emergencyContact,
        birthDate: birthDate ? birthDate.toISOString() : null,
        joiningDate: joiningDate ? joiningDate.toISOString() : null,
        gender,
        fatherName,
        motherName,
        maritalStatus,
        spouseName,
        homeAddress,
        aadhar,
        pan,
        education,
        experience,
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

      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push("/centralEmployeeDirectory");
      }, 800);

      // Reset only for new users
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
        setGender("");
        setFatherName("");
        setMotherName("");
        setMaritalStatus("");
        setSpouseName("");
        setHomeAddress("");
        setAadhar("");
        setPan("");
        setEducation([
          {
            qualification: "",
            college: "",
            graduationYear: "",
          },
        ]);
        setExperience([
          {
            company: "",
            designation: "",
            fromDate: "",
            toDate: "",
            showFromPicker: false,
            showToPicker: false,
          },
        ]);
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
      setLoading(false); // ✅ stop loading
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        backgroundColor: "#F9FAFB",
      }}
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 20 : 30}
      keyboardShouldPersistTaps="handled"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        {/* <View className="items-center my-6">
          <Text className="text-black font-bold text-2xl text-center">
            Employee Registration
          </Text>
          <Text className="text-gray-500 mt-1 text-sm">
            Fill out employee details below
          </Text>
        </View> */}

        {/* EMPLOYEE CODE */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Employee Code <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={employeeCode}
            onChangeText={setEmployeeCode} // keep as string
            placeholder="Enter employee code"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
          />
        </View>

        {/* Company Dropdown */}
        <View className="mb-5 bg-white rounded-xl shadow-sm p-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Select Company <Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            data={companyOptions}
            labelField="label"
            valueField="value"
            placeholder="Choose company"
            value={selectedCompany}
            onChange={(item) => setSelectedCompany(item.value)}
            style={{
              height: 35,
              borderRadius: 12,
              paddingHorizontal: 10,
              borderColor: "#D1D5DB",
              borderWidth: 1,
              // backgroundColor: "#F9FAFB",
            }}
            placeholderStyle={{
              fontSize: 14,
              color: "#9CA3AF",
            }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#111827",
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* FULL NAME */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Full Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* USERNAME */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Username <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* PASSWORD */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Password <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            // secureTextEntry
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ROLE DROPDOWN */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Role <Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            data={roleOptions}
            labelField="label"
            valueField="value"
            placeholder="Select role..."
            value={role}
            onChange={(item) => setRole(item.value)}
            style={{
              height: 35,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              paddingHorizontal: 12,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* OFFICIAL EMAIL */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Official Email <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter official email"
            keyboardType="email-address"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* PERSONAL EMAIL */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Personal Email</Text>
          <TextInput
            value={personalEmail}
            onChangeText={setPersonalEmail}
            placeholder="Enter personal email"
            keyboardType="email-address"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* DESIGNATION */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Designation</Text>
          <TextInput
            value={designation}
            onChangeText={setDesignation}
            placeholder="Enter designation"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* LEVEL DROPDOWN */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Level</Text>
          <Dropdown
            data={levelOptions}
            labelField="label"
            valueField="value"
            placeholder="Select level..."
            value={level}
            onChange={(item) => setLevel(item.value)}
            style={{
              height: 35,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              paddingHorizontal: 12,
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* CONTACT NUMBERS */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Contact Numbers
          </Text>

          {contactNumbers.map((num, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                value={num}
                onChangeText={(val) => {
                  const newNumbers = [...contactNumbers];
                  newNumbers[index] = val;
                  setContactNumbers(newNumbers);
                }}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* ❌ Show only if more than 1 number */}
              {contactNumbers.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const newNumbers = contactNumbers.filter(
                      (_, i) => i !== index
                    );
                    setContactNumbers(newNumbers.length ? newNumbers : [""]);
                  }}
                  className="ml-2 bg-red-100 p-2 rounded-full"
                >
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setContactNumbers([...contactNumbers, ""])}
            className="flex-row items-center justify-center mt-2 bg-indigo-100 px-4 py-2 rounded-full"
          >
            <Icon name="plus" size={18} color="#4F46E5" />
            <Text className="ml-2 text-indigo-600 font-medium">Add Number</Text>
          </TouchableOpacity>
        </View>

        {/* JOINING DATE */}
        {/* JOINING DATE - Web Version */}
        <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <label className="text-gray-700 mb-2 font-medium block">
            Joining Date
          </label>

          <ReactDatePicker
            selected={joiningDate}
            onChange={(date: Date | null) => {
              if (date) setJoiningDate(date); // only set if date is not null
            }}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select Joining Date"
            showYearDropdown // ✅ Enable year dropdown
            scrollableYearDropdown // ✅ Makes the year dropdown scrollable
            yearDropdownItemNumber={100} // Optional: show last 100 years
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800 w-full"
          />
        </div>

        {/*STATUS*/}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Employment Status
          </Text>
          <Dropdown
            style={{
              height: 35,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              paddingHorizontal: 12,
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            activeColor="#E0E7FF"
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={status}
            onChange={(item) => {
              setStatus(item.value);
            }}
          />
        </View>

        {/* AADHAR */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Aadhar Number</Text>
          <TextInput
            value={aadhar}
            onChangeText={setAadhar}
            placeholder="Enter aadhar number"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* PAN */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">PAN Number</Text>
          <TextInput
            value={pan}
            onChangeText={setPan}
            placeholder="Enter PAN number"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* BIRTH DATE - Web Version */}
        <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <label className="text-gray-700 mb-2 font-medium block">
            Birth Date
          </label>

          <ReactDatePicker
            selected={birthDate}
            onChange={(date: Date | null) => {
              if (date) setBirthDate(date); // only set if date is not null
            }}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select Birth Date"
            showYearDropdown // ✅ Year dropdown
            scrollableYearDropdown // ✅ Scrollable dropdown
            yearDropdownItemNumber={100} // ✅ Show 100 years
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800 w-full"
          />
        </div>

        {/* Address */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Home Address</Text>
          <TextInput
            value={homeAddress}
            onChangeText={setHomeAddress}
            placeholder="Enter Home Address"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Emergency Contact */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
            Emergency Contact
          </Text>
          <TextInput
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Enter emergency contact"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* FATHER NAME */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Father's Name</Text>
          <TextInput
            value={fatherName}
            onChangeText={setFatherName}
            placeholder="Enter father's name"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* MOTHER NAME */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Mother's Name</Text>
          <TextInput
            value={motherName}
            onChangeText={setMotherName}
            placeholder="Enter mother's name"
            className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Marital Status */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Marital Status</Text>
          <Dropdown
            style={{
              height: 35,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              paddingHorizontal: 12,
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            activeColor="#E0E7FF"
            data={maritalOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={maritalStatus}
            onChange={(item) => setMaritalStatus(item.value)}
          />

          {/* Conditional Field */}
          {maritalStatus === "Married" && (
            <View className="mt-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Spouse Name
              </Text>
              <TextInput
                placeholder="Enter spouse name"
                value={spouseName}
                onChangeText={setSpouseName}
                className="border border-gray-300 rounded-xl px-3 py-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        </View>

        {/* GENDER*/}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Gender</Text>
          <Dropdown
            style={{
              height: 35,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              paddingHorizontal: 12,
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            activeColor="#E0E7FF"
            data={genderOptions}
            labelField="label"
            valueField="value"
            placeholder="Select gender"
            value={gender}
            onChange={(item) => setGender(item.value)}
          />
        </View>

        {/* EDUCATION  QUALIFICATION + COLLEGE + DATE OF PASSING */}
        <View className="mb-6 bg-white rounded-2xl shadow-sm  p-4">
          {/* Title inside box */}
          <Text className="font-medium text-gray-800  mb-3">
            Educational Qualifications
          </Text>

          {education.map((edu, index) => (
            <View
              key={index}
              className="mb-4 p-4 bg-white rounded-2xl border border-gray-200 relative"
            >
              {/* Remove Button (only if more than 1 item) */}
              {education.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const newEdu = [...education];
                    newEdu.splice(index, 1);
                    setEducation(newEdu);
                  }}
                  className="absolute top-1 right-1 bg-red-100 p-1 rounded-full"
                >
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}

              {/* Qualification */}
              <TextInput
                placeholder="Qualification"
                value={edu.qualification}
                onChangeText={(val) => {
                  const newEdu = [...education];
                  newEdu[index].qualification = val;
                  setEducation(newEdu);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2 mt-2 mb-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* College */}
              <TextInput
                placeholder="College"
                value={edu.college}
                onChangeText={(val) => {
                  const newEdu = [...education];
                  newEdu[index].college = val;
                  setEducation(newEdu);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2 mb-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* Graduation Year */}
              <TextInput
                placeholder="Year of Passing (e.g., 2025)"
                keyboardType="numeric"
                maxLength={4}
                value={edu.graduationYear}
                onChangeText={(val) => {
                  const newEdu = [...education];
                  newEdu[index].graduationYear = val;
                  setEducation(newEdu);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2 mb-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}

          {/* Add Button inside white box */}
          <TouchableOpacity
            onPress={() =>
              setEducation([
                ...education,
                {
                  qualification: "",
                  college: "",
                  graduationYear: "",
                },
              ])
            }
            className="flex-row items-center justify-center mt-2 bg-indigo-100 px-4 py-2 rounded-full"
          >
            <Icon name="plus" size={18} color="#4F46E5" />
            <Text className="ml-2 text-indigo-600 font-medium">
              Add Qualification
            </Text>
          </TouchableOpacity>
        </View>

        {/* PAST EXPERIENCE */}
        <View className="mb-6 bg-white rounded-2xl shadow-sm  p-4">
          {/* Title inside box */}
          <Text className="font-semibold text-gray-800 text-base mb-3">
            Past Experience
          </Text>

          {experience.map((exp, index) => (
            <View
              key={index}
              className="mb-4 p-4 bg-white rounded-2xl border border-gray-200 relative"
            >
              {/* Remove Button */}
              {experience.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const newExp = [...experience];
                    newExp.splice(index, 1);
                    setExperience(newExp);
                  }}
                  className="absolute top-1 right-1 bg-red-100 p-1 rounded-full"
                >
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}

              {/* Company Name */}
              <TextInput
                placeholder="Company Name"
                value={exp.company}
                onChangeText={(val) => {
                  const newExp = [...experience];
                  newExp[index].company = val;
                  setExperience(newExp);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2 mt-2 mb-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* Designation */}
              <TextInput
                placeholder="Designation"
                value={exp.designation}
                onChangeText={(val) => {
                  const newExp = [...experience];
                  newExp[index].designation = val;
                  setExperience(newExp);
                }}
                className="border border-gray-300 rounded-xl px-3 py-2 mb-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* Tenure - Web Version */}
              <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
                <label className="text-gray-700 mb-2 font-medium block">
                  Tenure
                </label>

                <div className="flex flex-row justify-between">
                  {/* From Date */}
                  <ReactDatePicker
                    selected={exp.fromDate ? new Date(exp.fromDate) : null}
                    onChange={(date: Date | null) => {
                      const newExp = [...experience];
                      newExp[index].fromDate = date ? date.toISOString() : "";
                      setExperience(newExp);
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="From date"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 mr-2"
                  />

                  {/* To Date */}
                  <ReactDatePicker
                    selected={exp.toDate ? new Date(exp.toDate) : null}
                    onChange={(date: Date | null) => {
                      const newExp = [...experience];
                      newExp[index].toDate = date ? date.toISOString() : "";
                      setExperience(newExp);
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="To date"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 ml-2"
                  />
                </div>
              </div>
            </View>
          ))}

          {/* Add Button */}
          <TouchableOpacity
            onPress={() =>
              setExperience([
                ...experience,
                {
                  company: "",
                  designation: "",
                  fromDate: "",
                  toDate: "",
                  showFromPicker: false,
                  showToPicker: false,
                },
              ])
            }
            className="flex-row items-center justify-center mt-2 bg-indigo-100 px-4 py-2 rounded-full"
          >
            <Icon name="plus" size={18} color="#4F46E5" />
            <Text className="ml-2 text-indigo-600 font-medium">
              Add Experience
            </Text>
          </TouchableOpacity>
        </View>

        {/* ADDITIONAL INFO */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">
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
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />

              {/* ❌ Show only if more than 1 field */}
              {additionalInfo.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const newInfo = additionalInfo.filter(
                      (_, i) => i !== index
                    );
                    setAdditionalInfo(newInfo.length ? newInfo : [""]);
                  }}
                  className="ml-2 bg-red-100 p-2 rounded-full"
                >
                  <Icon name="x" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* ➕ Add More */}
          <TouchableOpacity
            onPress={() => setAdditionalInfo([...additionalInfo, ""])}
            className="flex-row items-center justify-center mt-2 bg-indigo-100 px-4 py-2 rounded-full"
          >
            <Icon name="plus" size={18} color="#4F46E5" />
            <Text className="ml-2 text-indigo-600 font-medium">Add Info</Text>
          </TouchableOpacity>
        </View>

        {/* REGISTER BUTTON */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading} // ✅ disable when loading
          className={`py-3 rounded-2xl items-center shadow-md mb-10 ${
            loading ? "bg-gray-400" : "bg-indigo-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">
              {userId ? "Update" : "Register"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAwareScrollView>
  );
};

export default RegisterUserScreen;
