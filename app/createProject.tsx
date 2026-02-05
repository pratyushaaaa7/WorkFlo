import { ArrowDown01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const CreateProjectScreen = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { projectId } = useLocalSearchParams();
  const isEditing = Boolean(projectId);

  useEffect(() => {
    if (!projectId || !token) return;

    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const p = res.data.project;

        // 🔹 Prefill states
        setProjectName(p.projectName || "");
        setProjectCode(p.projectCode || "");
        setProjectLocation(p.location || "");
        setClientName(p.clientName || "");
        setSiteArea(p.siteArea || "");
        setDesignedArea(p.designedArea || "");
        setFileNumber(p.fileNumber || "");
        setWebName(p.webName || "");
        setCompanyName(p.company || null);
        setProjectTypology(p.typology || null);
        setSelectedScopes(p.scopes || []);
        setStatus(p.status || "active");

        setSelectedLeaders(p.teamLeaders?.map((u: any) => u._id) || []);
        setSelectedMembers(p.teamMembers?.map((u: any) => u._id) || []);
        setStartDate(p.startDate ? new Date(p.startDate) : null);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to load project details",
          position: "bottom",
        });
      }
    };

    fetchProject();
  }, [projectId, token]);

  // States with prefill if editing
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  // const [projectArea, setProjectArea] = useState(existingProject?.area || "");

  const [clientName, setClientName] = useState("");

  const [siteArea, setSiteArea] = useState("");
  // 🔹 New states
  const [fileNumber, setFileNumber] = useState("");
  const [webName, setWebName] = useState("");
  const [designedArea, setDesignedArea] = useState("");

  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [projectTypology, setProjectTypology] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  // status state
  const [status, setStatus] = useState("active");

  const companyOptions = [
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
    { label: "WCorp", value: "WCorp" },
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

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Closed", value: "closed" },
    { label: "BD", value: "BD" },
  ];

  // 1. Define company-specific scopes
  const scopeOptionsByCompany: Record<
    string,
    { label: string; value: string }[]
  > = {
    WAL: [
      { label: "Master Planning", value: "Master Planning" },
      { label: "Architecture", value: "Architecture" },
      { label: "Interior Design", value: "Interior Design" },
      { label: "Interior Decoration", value: "Interior Decoration" },
      { label: "Design Management", value: "Design Management" },
    ],

    WP: [
      { label: "Project Management", value: "Project Management" },
      { label: "Project Feasibility", value: "Project Feasibility" },
      { label: "Design Management", value: "Design Management" },
      {
        label: "Cost Control and Monitoring",
        value: "Cost Control and Monitoring",
      },
      {
        label: "Tender and Contract Management",
        value: "Tender and Contract Management",
      },

      { label: "Construction Management", value: "Construction Management" },

      { label: "Post Construction Audit", value: "Post Construction Audit" },
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
    [],
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

  const [saving, setSaving] = useState(false);

  const handleSaveProject = async () => {
    if (saving) return; // prevent double-taps
    setSaving(true);

    Keyboard.dismiss();
    if (!projectName.trim() || !companyName || !projectTypology) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please fill all required fields.",
        position: "bottom",
      });
      setSaving(false);
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
        // ✅ UPDATE
        await api.put(`/projects/${projectId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Project updated successfully!",
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDarkMode ? "#000000" : "#FBFCFD" }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View
        className="pt-14 pb-4 px-4 flex-row items-center"
        style={{
          backgroundColor: isDarkMode ? "#000000" : "#FBFCFD",
          // borderColor: isDarkMode ? "#1A1A1A" : "#F3F4F6",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          className="text-[20px] font-dmSemiBold"
          style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
        >
          Create project
        </Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 px-4 pt-6"
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Dropdown */}
        <View className="mb-5" style={{ zIndex: 3000 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Company Name<Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={companyOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Company"
            value={companyName}
            onChange={(item) => setCompanyName(item.value)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Project Name */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Name<Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="e.g. Muthoot Hospital"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>

        {/* Typology Dropdown */}
        <View className="mb-5" style={{ zIndex: 2500 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Typology<Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={typologyOptions}
            labelField="label"
            valueField="value"
            placeholder="Select typology"
            value={projectTypology}
            onChange={(item) => setProjectTypology(item.value)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Team Leader MultiSelect */}
        <View className="mb-5" style={{ zIndex: 2000 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Team Leader(s)<Text className="text-red-500">*</Text>
          </Text>
          <MultiSelect
            style={{
              minHeight: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: isDarkMode ? "#2D3748" : "#E2E8F0",
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 4,
              marginTop: 4,
              borderWidth: 0,
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select Leader(s)"
            search
            searchPlaceholder="Search users..."
            value={selectedLeaders}
            onChange={(items) => setSelectedLeaders(items)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Team Members MultiSelect */}
        <View className="mb-5" style={{ zIndex: 1500 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Team Member(s)<Text className="text-red-500">*</Text>
          </Text>
          <MultiSelect
            style={{
              minHeight: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: isDarkMode ? "#2D3748" : "#E2E8F0",
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 4,
              marginTop: 4,
              borderWidth: 0,
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select Member(s)"
            search
            searchPlaceholder="Search users..."
            value={selectedMembers}
            onChange={(items) => setSelectedMembers(items)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Status Dropdown */}
        <View className="mb-5" style={{ zIndex: 1000 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Status<Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={status}
            onChange={(item) => setStatus(item.value)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Client Name */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Client Name
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter client name"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        {/* Project Internal Code */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Internal Code
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter project code"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectCode}
            onChangeText={setProjectCode}
          />
        </View>

        {/* Project Location */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Project Location
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter project location"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectLocation}
            onChangeText={setProjectLocation}
          />
        </View>

        {/* Start Date Picker */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Start Date
          </Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Poppins-Regular",
                color: startDate
                  ? isDarkMode
                    ? "#FFFFFF"
                    : "#000000"
                  : isDarkMode
                    ? "#919191"
                    : "#454545",
              }}
            >
              {startDate ? startDate.toDateString() : "Select start date"}
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
        <View className="mb-5" style={{ zIndex: 500 }}>
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Scope Description
          </Text>
          <MultiSelect
            style={{
              minHeight: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            }}
            placeholderStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#919191" : "#454545",
            }}
            selectedTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: isDarkMode ? "#2D3748" : "#E2E8F0",
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 4,
              marginTop: 4,
              borderWidth: 0,
            }}
            containerStyle={{
              borderRadius: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderWidth: 0,
              marginTop: 4,
            }}
            itemTextStyle={{
              fontSize: 14,
              fontFamily: "Poppins-Regular",
              color: isDarkMode ? "#FFFFFF" : "#000000",
            }}
            activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
            data={scopeOptions}
            labelField="label"
            valueField="value"
            placeholder="Select scopes"
            value={selectedScopes}
            onChange={(items) => setSelectedScopes(items)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Web Name */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Web Name
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter web name"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={webName}
            onChangeText={setWebName}
          />
        </View>

        {/* File Number */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            File Number
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter file number"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={fileNumber}
            onChangeText={setFileNumber}
          />
        </View>

        {/* Site Area */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Site Area
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter site area (in acres)"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={siteArea}
            onChangeText={setSiteArea}
          />
        </View>

        {/* Designed Area */}
        <View className="mb-5">
          <Text
            className="text-[14px] font-poppinsMedium mb-2"
            style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Designed Area
          </Text>
          <TextInput
            style={{
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontFamily: "Poppins-Regular",
              fontSize: 14,
            }}
            placeholder="Enter designed area (in sqft)"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={designedArea}
            onChangeText={setDesignedArea}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          disabled={saving}
          onPress={handleSaveProject}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: saving ? "#9CA3AF" : "#5B4CCC",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 100,
          }}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-dmBold text-lg">
              {isEditing ? "Update Project" : "Create Project"}
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateProjectScreen;
