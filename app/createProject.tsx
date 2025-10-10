import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  Keyboard,
} from "react-native";
import Toast from "react-native-toast-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";

const CreateProjectScreen = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const { project } = useLocalSearchParams(); // <-- get project from params
  const existingProject = project ? JSON.parse(project as string) : null;
  const isEditing = !!existingProject;

  // States with prefill if editing
  const [projectName, setProjectName] = useState(
    existingProject?.projectName || ""
  );
  const [projectCode, setProjectCode] = useState(
    existingProject?.projectCode || ""
  );
  const [projectLocation, setProjectLocation] = useState(
    existingProject?.location || ""
  );
  // const [projectArea, setProjectArea] = useState(existingProject?.area || "");

  const [clientName, setClientName] = useState(
    existingProject?.clientName || ""
  );

  const [siteArea, setSiteArea] = useState(existingProject?.siteArea || "");

  // 🔹 New states
  const [fileNumber, setFileNumber] = useState(
    existingProject?.fileNumber || ""
  );
  const [webName, setWebName] = useState(existingProject?.webName || "");

  const [designedArea, setDesignedArea] = useState(
    existingProject?.designedArea || ""
  );

  const [selectedLeaders, setSelectedLeaders] = useState(
    existingProject?.teamLeaders?.map((u: any) => u._id || u) || []
  );

  const [selectedMembers, setSelectedMembers] = useState(
    existingProject?.teamMembers?.map((u: any) => u._id || u) || []
  );
  const [companyName, setCompanyName] = useState(
    existingProject?.company || null
  );
  const [projectTypology, setProjectTypology] = useState(
    existingProject?.typology || null
  );
  const [selectedScopes, setSelectedScopes] = useState(
    existingProject?.scopes || []
  );
  const [startDate, setStartDate] = useState(
    existingProject?.startDate ? new Date(existingProject.startDate) : null
  );

  const companyOptions = [
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
  ];

  const typologyOptions = [
    { label: "Residence", value: "Residence" },
    { label: "Commercial", value: "Commercial" },
    { label: "Hospitality", value: "Hospitality" },
    { label: "Industrial", value: "Industrial" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Housing", value: "Housing" },
    { label: "Sports Infrastructure", value: "Sports Infrastructure" },
    { label: "Assembly", value: "Assembly" },
    { label: "Research", value: "Research" },
    { label: "Institutional", value: "Institutional" },
    { label: "Misc.", value: "Miscellaneous" },
  ];

  // status state
  const [status, setStatus] = useState(existingProject?.status || "active");

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Closed", value: "closed" },
  ];

  // 1. Define company-specific scopes
  const scopeOptionsByCompany: Record<
    string,
    { label: string; value: string }[]
  > = {
    WAL: [
      { label: "MASTER PLANNING", value: "Master Planning" },
      { label: "ARCHITECTURE", value: "Architecture" },
      { label: "FAÇADE", value: "Facade" },
      { label: "INTERIORS", value: "Interiors" },
      { label: "DESIGN MANAGEMENT", value: "Design Management" },
    ],
    WP: [
      { label: "DESIGN MANAGEMENT", value: "Design Management" },
      {
        label: "TENDER AND CONTRACTS MANAGEMENT",
        value: "Tender and Contracts Management",
      },
      { label: "CONSTRUCTION MANAGEMENT", value: "Construction Management" },
      { label: "QS AND COST CONSULTANCY", value: "QS and Cost Consultancy" },
      { label: "HANDOVER MANAGEMENT", value: "Handover Management" },
      { label: "AUDITORS", value: "Auditors" },
      { label: "DLP MANAGEMENT", value: "DLP Management" },
    ],
  };

  // 2. Use dynamic scope options based on selected company
  const scopeOptions = companyName
    ? scopeOptionsByCompany[companyName] || []
    : [];

  // 3. Reset scopes when company changes
  useEffect(() => {
    if (!isEditing) {
      setSelectedScopes([]);
    }
  }, [companyName]);

  const [allUsers, setAllUsers] = useState<{ label: string; value: string }[]>(
    []
  );

  const [showStartPicker, setShowStartPicker] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        const res = await api.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dropdownUsers = res.data.users.map((user: any) => ({
          label: `${user.fullName}`,
          value: user._id,
        }));

        setAllUsers(dropdownUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "You may not have access to user list.",
          position: "bottom",
        });
      }
    };

    fetchUsers();
  }, [token]);

  const handleSaveProject = async () => {
    Keyboard.dismiss();
    if (!projectName.trim() || !companyName || !projectTypology) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please fill all required fields.",
        position: "bottom",
      });
      return;
    }

    const payload = {
      company: companyName,
      projectName,
      projectCode,
      location: projectLocation,
      teamLeaders: selectedLeaders,
      teamMembers: selectedMembers,
      startDate: startDate?.toISOString(),
      typology: projectTypology,
      scopes: selectedScopes,
      clientName,
      siteArea,
      designedArea,
      status, // ✅ send status to backend
      fileNumber, // ✅ new field
      webName, // ✅ new field
    };

    try {
      if (isEditing) {
        //  UPDATE PROJECT
        const res = await api.put(`/projects/${existingProject._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Toast.show({
          type: "success",
          text1: "Success",
          text2: res.data.message || "Project updated successfully!",
          position: "bottom",
        });
      } else {
        //  CREATE PROJECT
        const res = await api.post("/projects", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Toast.show({
          type: "success",
          text1: "Success",
          text2: res.data.message || "Project created successfully!",
          position: "bottom",
        });
      }

      setTimeout(() => router.push({ pathname: "/masterProjectList" }), 800);
    } catch (err) {
      console.error("Error creating project:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Failed to ${isEditing ? "update" : "create"} project`,
        position: "bottom",
      });
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16 pb-6 px-4 flex-row items-center justify-between"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
            zIndex: 10,
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/masterProjectList",
              })
            }
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {" "}
              Create Project
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        className="flex-1 px-4 py-6 bg-white"
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={50}
      >
        {/* Company Dropdown */}
        <View className="mb-4" style={{ zIndex: 2500 }}>
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Company Name
          </Text>

          <Dropdown
            style={{
              height: 35,
              borderColor: "#000", // Aqua border to match theme
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
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
              overflow: "hidden",
              backgroundColor: "#fff", // Soft aqua dropdown background
            }}
            activeColor="#E0E7FF" // Medium aqua for active highlight
            data={companyOptions}
            labelField="label"
            valueField="value"
            placeholder="Select company..."
            value={companyName}
            onChange={(item) => setCompanyName(item.value)}
          />
        </View>

        {/* Typology Dropdown */}
        <View className="mb-4" style={{ zIndex: 2000 }}>
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Typology
          </Text>
          <Dropdown
            style={{
              height: 35,
              borderColor: "#000", // Aqua border to match theme
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
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
              overflow: "hidden",
              backgroundColor: "#fff", // Soft aqua dropdown background
            }}
            activeColor="#E0E7FF" // Medium aqua for active highlight
            data={typologyOptions}
            labelField="label"
            valueField="value"
            placeholder="Select typology..."
            value={projectTypology}
            onChange={(item) => setProjectTypology(item.value)}
          />
        </View>

        {/* Text Inputs */}

        {/*Project Name*/}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Name
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter project name"
            placeholderTextColor="#999"
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>

        {/* Client Name */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Client Name
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter client name"
            placeholderTextColor="#999"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        {/*Project Code*/}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Internal Code
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter project code"
            placeholderTextColor="#999"
            value={projectCode}
            onChangeText={setProjectCode}
          />
        </View>

        {/*file number*/}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            File Number
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="File Number"
            placeholderTextColor="#999"
            value={fileNumber}
            onChangeText={setFileNumber}
          />
        </View>

        {/*web name*/}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Web Name
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Web Name"
            placeholderTextColor="#999"
            value={webName}
            onChangeText={setWebName}
          />
        </View>

        {/*Project Location*/}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Location
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter project location"
            placeholderTextColor="#999"
            value={projectLocation}
            onChangeText={setProjectLocation}
          />
        </View>

        {/*Project area*/}
        {/* <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Area <Text className="text-gray-400">(in sqft)</Text>
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter project area"
            placeholderTextColor="#999"
            value={projectArea}
            onChangeText={setProjectArea}
            keyboardType="numeric"
          />
        </View> */}

        {/* Site Area */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Site Area
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter site area (in acres)"
            placeholderTextColor="#999"
            value={siteArea}
            onChangeText={setSiteArea}
          />
        </View>

        {/* Designed Area */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Designed Area
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter designed area (in sqft)"
            placeholderTextColor="#999"
            value={designedArea}
            onChangeText={setDesignedArea}
          />
        </View>

        {/* Start Date Picker */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Start Date
          </Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="border border-black rounded-lg py-2 px-4 bg-white"
          >
            <Text
              className={`text-base ${
                startDate ? "text-black" : "text-[#999]"
              }`}
            >
              {startDate ? startDate.toDateString() : "Enter start date"}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Scope Dropdown */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Scope Description
          </Text>
          <MultiSelect
            style={{
              height: 35,
              borderColor: "#000",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: "#Fff",
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{
              fontSize: 10,
              color: "#111827",
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: "#E0E7FF",
              padding: 5,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#fff", // Very soft aqua for the dropdown
            }}
            activeColor="#E0E7FF"
            data={scopeOptions}
            labelField="label"
            valueField="value"
            placeholder="Select scopes..."
            value={selectedScopes}
            onChange={(items) => setSelectedScopes(items)}
          />
        </View>

        {/* Team Leader Dropdown */}
        <View className="mb-4" style={{ zIndex: 1500 }}>
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Team Leader(s)
          </Text>
          <MultiSelect
            style={{
              height: 35,
              borderColor: "#000", // Aqua border to match theme
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff", // Keep white for good contrast
            }}
            placeholderStyle={{
              fontSize: 14,
              color: "#9CA3AF",
            }}
            selectedTextStyle={{
              fontSize: 10,
              color: "#111827",
            }}
            selectedStyle={{
              borderRadius: 10,
              // backgroundColor: "#b9EBF1", // Light aqua (cool & clean)
              backgroundColor: "#E0E7FF",
              padding: 5,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#fff", // Very soft aqua for dropdown
            }}
            activeColor="#E0E7FF" // Medium aqua for active selection
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select Leader(s)..."
            search
            searchPlaceholder="Search users..."
            value={selectedLeaders}
            onChange={(items) => setSelectedLeaders(items)}
          />
        </View>

        {/* Project Team Members Dropdown */}
        <View className="mb-4" style={{ zIndex: 1400 }}>
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Team Member(s)
          </Text>
          <MultiSelect
            style={{
              height: 35,
              borderColor: "#000",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 10, color: "#111827" }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: "#E0E7FF",
              padding: 5,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
            activeColor="#E0E7FF"
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select members..."
            search
            searchPlaceholder="Search users..."
            value={selectedMembers}
            onChange={(items) => setSelectedMembers(items)}
          />
        </View>

        {/* Status Dropdown */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Status
          </Text>
          <Dropdown
            style={{
              height: 35,
              borderColor: "#000",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
            activeColor="#E0E7FF"
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status..."
            value={status}
            onChange={(item) => setStatus(item.value)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSaveProject}
          className="bg-indigo-600 mt-6 mb-20 py-3 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-base">
            {isEditing ? "Update Project" : "Create Project"}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateProjectScreen;
