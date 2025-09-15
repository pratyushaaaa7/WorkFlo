import React, { useState, useContext } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [education, setEducation] = useState([
    { qualification: "", college: "", graduationDate: "", showPicker: false },
  ]);

  // Experience
  const [experience, setExperience] = useState<Experience[]>([
    {
      company: "",
      designation: "",
      fromDate: "",
      toDate: "",
      showFromPicker: false,
      showToPicker: false,
    },
  ]);

  // Additional Info
  const [additionalInfo, setAdditionalInfo] = useState([""]);

  // Dropdown options
  const roleOptions = [
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ];

  const levelOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `W${i + 1}`,
    value: `W${i + 1}`,
  }));

  const companyOptions = [
    { label: "WAL+L", value: "WAL" },
    { label: "WP", value: "WP" },
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

const handleRegister = async () => {
  Keyboard.dismiss();

  try {
    const res = await api.post(
      "/auth/register",
      {
        fullName,
        username,
        password,
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
       
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Toast.show({
      type: "success",
      text1: "Success",
      text2: res.data.message || "User registered successfully!",
      position: "bottom",
    });

    // 🔹 Reset all fields here
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
    setEducation("");
    setExperience("");
    setAdditionalInfo("");
    
    
  } catch (err: any) {
    console.error("Registration error:", err.response?.data || err.message);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: err.response?.data?.message || "Registration failed.",
      position: "bottom",
    });
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

        {/* FULL NAME */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Full Name</Text>
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
          <Text className="text-gray-700 mb-2 font-medium">Username</Text>
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
          <Text className="text-gray-700 mb-2 font-medium">Password</Text>
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
          <Text className="text-gray-700 mb-2 font-medium">Role</Text>
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
          <Text className="text-gray-700 mb-2 font-medium">Official Email</Text>
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

        {/* EMPLOYEE CODE */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Employee Code</Text>
         <TextInput
  value={employeeCode}
  onChangeText={setEmployeeCode} // keep as string
  placeholder="Enter employee code"
  placeholderTextColor="#9CA3AF"
  keyboardType="numeric"
  className="border border-gray-300 rounded-xl px-3 py-2 text-gray-800"
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

        {/* Company Dropdown */}
        <View className="mb-5 bg-white rounded-xl shadow-md p-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Select Company
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

        {/* BIRTH DATE */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Birth Date</Text>
          <TouchableOpacity
            onPress={() => setShowBirthPicker(true)}
            className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2"
          >
            <Icon name="calendar" size={18} color="#9CA3AF" />
            <Text
              className={`ml-2 ${
                birthDate ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {birthDate ? birthDate.toDateString() : "Select birth date"}
            </Text>
          </TouchableOpacity>
          {showBirthPicker && (
            <DateTimePicker
              value={birthDate || new Date()} // picker must have a Date, but birthDate not set ye
              mode="date"
              display="default"
              onChange={(event, date) => {
                if (event.type === "set" && date) {
                  setBirthDate(date);
                }
                setShowBirthPicker(false);
              }}
            />
          )}
        </View>

        {/* JOINING DATE */}
        <View className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-700 mb-2 font-medium">Joining Date</Text>
          <TouchableOpacity
            onPress={() => setShowJoinPicker(true)}
            className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2"
          >
            <Icon name="calendar" size={18} color="#9CA3AF" />
            <Text
              className={`ml-2 ${
                joiningDate ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {joiningDate ? joiningDate.toDateString() : "Select Joining date"}
            </Text>
          </TouchableOpacity>

          {showJoinPicker && (
            <DateTimePicker
              value={joiningDate || new Date()} // fallback only for picker
              mode="date"
              display="default"
              onChange={(event, date) => {
                if (event.type === "set" && date) {
                  setJoiningDate(date);
                }
                setShowJoinPicker(false);
              }}
            />
          )}
        </View>

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

        {/* EDUCATION  QUALIFICATION + COLLEGE + DATE OF PASSING */}
        <View className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          {/* Title inside box */}
          <Text className="font-semibold text-gray-800 text-base mb-3">
            Educational Qualifications
          </Text>

          {education.map((edu, index) => (
            <View
              key={index}
              className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 relative"
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

              {/* Graduation Date */}
              <TouchableOpacity
                onPress={() => {
                  const newEdu = [...education];
                  newEdu[index].showPicker = true;
                  setEducation(newEdu);
                }}
                className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2"
              >
                <Icon name="calendar" size={18} color="#9CA3AF" />
                <Text
                  className={`ml-2 ${
                    edu.graduationDate ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {edu.graduationDate
                    ? new Date(edu.graduationDate).toDateString()
                    : "Select passing date"}
                </Text>
              </TouchableOpacity>

              {edu.showPicker && (
                <DateTimePicker
                  value={
                    edu.graduationDate
                      ? new Date(edu.graduationDate)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    const newEdu = [...education];
                    newEdu[index].showPicker = false;
                    if (event.type === "set" && date) {
                      newEdu[index].graduationDate = date.toISOString();
                    }
                    setEducation(newEdu);
                  }}
                />
              )}
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
                  graduationDate: "",
                  showPicker: false,
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
          <Text className="text-gray-700 mb-2 font-medium">Father Name</Text>
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
          <Text className="text-gray-700 mb-2 font-medium">Mother Name</Text>
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
          {maritalStatus === "married" && (
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

        {/* PAST EXPERIENCE */}
        <View className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          {/* Title inside box */}
          <Text className="font-semibold text-gray-800 text-base mb-3">
            Past Experience
          </Text>

          {experience.map((exp, index) => (
            <View
              key={index}
              className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 relative"
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

              {/* Tenure */}
              <View className="flex-row justify-between">
                {/* From Date */}
                <TouchableOpacity
                  onPress={() => {
                    const newExp = [...experience];
                    newExp[index].showFromPicker = true;
                    setExperience(newExp);
                  }}
                  className="flex-1 flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mr-2"
                >
                  {/* <Icon name="calendar" size={18} color="#9CA3AF" /> */}
                  <Text
                    className={` ${
                      exp.fromDate ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {exp.fromDate
                      ? new Date(exp.fromDate).toDateString()
                      : "From date"}
                  </Text>
                </TouchableOpacity>

                {/* To Date */}
                <TouchableOpacity
                  onPress={() => {
                    const newExp = [...experience];
                    newExp[index].showToPicker = true;
                    setExperience(newExp);
                  }}
                  className="flex-1 flex-row items-center border border-gray-300 rounded-xl px-3 py-2 ml-2"
                >
                  {/* <Icon name="calendar" size={18} color="#9CA3AF" /> */}
                  <Text
                    className={` ${
                      exp.toDate ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {exp.toDate
                      ? new Date(exp.toDate).toDateString()
                      : "To date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Pickers */}
              {exp.showFromPicker && (
                <DateTimePicker
                  value={exp.fromDate ? new Date(exp.fromDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    const newExp = [...experience];
                    newExp[index].showFromPicker = false;
                    if (event.type === "set" && date) {
                      newExp[index].fromDate = date.toISOString();
                    }
                    setExperience(newExp);
                  }}
                />
              )}

              {exp.showToPicker && (
                <DateTimePicker
                  value={exp.toDate ? new Date(exp.toDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    const newExp = [...experience];
                    newExp[index].showToPicker = false;
                    if (event.type === "set" && date) {
                      newExp[index].toDate = date.toISOString();
                    }
                    setExperience(newExp);
                  }}
                />
              )}
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
            <Text className="ml-2 text-indigo-600 font-medium">Add More</Text>
          </TouchableOpacity>
        </View>

        {/* REGISTER BUTTON */}
        <TouchableOpacity
          onPress={handleRegister}
          className="bg-indigo-600 py-3 rounded-2xl items-center shadow-md mb-10"
        >
          <Text className="text-white text-lg font-bold">Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAwareScrollView>
  );
};

export default RegisterUserScreen;
