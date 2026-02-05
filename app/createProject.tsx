import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  const [status, setStatus] = useState("active");

  // 🔹 New fields requested by user
  const [projectIncharge, setProjectIncharge] = useState<string | null>(null);
  const [companySerialNumber, setCompanySerialNumber] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImages, setProjectImages] = useState<string[]>([]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        position: "bottom",
        text2: "We need access to your gallery to upload images.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset: any) => asset.uri);
      setProjectImages((prev) => [...prev, ...selectedUris]);
    }
  };

  const removeImage = (index: number) => {
    setProjectImages((prev) => prev.filter((_, i) => i !== index));
  };

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
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000000]">
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View className="pt-14 pb-4 px-4 flex-row items-center bg-[#FBFCFD] dark:bg-[#000000]">
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
        <Text className="text-[20px] font-dmSemiBold text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Project Name<Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="e.g. Muthoot Hospital"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>

        {/* Typology Dropdown */}
        <View className="mb-5" style={{ zIndex: 2500 }}>
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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

        {/* Project Incharge Dropdown */}
        <View className="mb-5" style={{ zIndex: 1250 }}>
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Project Incharge
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
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select Incharge"
            search
            searchPlaceholder="Search users..."
            value={projectIncharge}
            onChange={(item) => setProjectIncharge(item.value)}
            renderRightIcon={() => (
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#919191" />
            )}
          />
        </View>

        {/* Status Dropdown */}
        <View className="mb-5" style={{ zIndex: 1000 }}>
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Client Name
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="Enter client name"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        {/* Project Internal Code */}
        <View className="mb-5">
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Project Internal Code
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="Enter project code"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectCode}
            onChangeText={setProjectCode}
          />
        </View>

        {/* Company Serial Number */}
        <View className="mb-5">
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Company Serial Number
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="Enter serial number"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={companySerialNumber}
            onChangeText={setCompanySerialNumber}
            keyboardType="numeric"
          />
        </View>

        {/* Project Location */}
        <View className="mb-5">
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Project Location
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="Enter project location"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={projectLocation}
            onChangeText={setProjectLocation}
          />
        </View>

        {/* Start Date Picker */}
        <View className="mb-5">
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Start Date
          </Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] justify-center"
          >
            <Text
              className="text-[14px] font-poppins"
              style={{
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
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
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Web Name
          </Text>
          <TextInput
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
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
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
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
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
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
            className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
            placeholder="Enter designed area (in sqft)"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={designedArea}
            onChangeText={setDesignedArea}
          />
        </View>

        <View className="mb-5">
          <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Project Description
          </Text>
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[16px] p-4 min-h-[120px]">
            <TextInput
              className="text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
              style={{ textAlignVertical: "top" }}
              placeholder="e.g. Lorem ipsum dolor sit amet consecte. Scelerisque vestibulum nunc adipiscing"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              value={projectDescription}
              onChangeText={setProjectDescription}
              multiline
              numberOfLines={4}
            />
            <View className="absolute bottom-2 right-2">
              <View
                className="w-3 h-3 border-r border-b"
                style={{ borderColor: isDarkMode ? "#444" : "#CCC" }}
              />
            </View>
          </View>
        </View>

        {/* Images Option */}
        <View className="mb-10 bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[20px] p-3 justify-center">
          <Text className="text-[14px] font-poppinsMedium text-left mb-2 text-[#000000] dark:text-[#FFFFFF]">
            Images
          </Text>
          <View className="bg-white dark:bg-[#0D0D0D] rounded-[16px] p-6 w-full items-center">
            <TouchableOpacity
              onPress={pickImages}
              className="bg-black py-3 px-8 rounded-xl flex-row items-center mb-3"
              activeOpacity={0.8}
            >
              <HugeiconsIcon icon={Upload01Icon} size={20} color="#FFF" />
              <Text className="text-white font-poppinsMedium ml-2 text-[14px]">
                Upload
              </Text>
            </TouchableOpacity>
            <Text className="font-poppins text-[14px] text-center text-[#454545] dark:text-[#919191]">
              Choose Image
            </Text>
          </View>

          {/* Selected Images Preview */}
          {projectImages.length > 0 && (
            <View className="flex-row flex-wrap mt-4 gap-4">
              {projectImages.map((uri, index) => (
                <View
                  key={index}
                  style={{
                    width: 100,
                    height: 100,
                    position: "relative",
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 20,
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: "#FF3B30",
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isDarkMode ? "#000" : "#FFF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    activeOpacity={0.8}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between mb-20 gap-x-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 h-14 rounded-xl border-[1.5px] items-center justify-center bg-white dark:bg-black border-[#BBBBBB] dark:border-[#5F5F5F]"
          >
            <Text className="font-poppins text-[16px] text-[#777777] dark:text-[#919191]">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={saving}
            onPress={handleSaveProject}
              style={{
              flex: 1,
              // height: 56,
              borderRadius: 12,
              overflow: "hidden", // Important for gradient borderRadius
          
            }}
            // className="flex-1 h-14 rounded-xl overflow-hidden items-center justify-center border-0 dark:border dark:border-[#333]"
            activeOpacity={0.8}
          >
            <LinearGradient
              // 94.25deg roughly translates to start(0,0.5) end(1,0.6) or similar
              // We'll use a standard left-to-right start {x:0, y:0} end {x:1, y:0} for consistency
              colors={
                saving
                  ? ["#9CA3AF", "#9CA3AF"]
                  : ["#5B4CCC", "#6347C2", "#8056D1"]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-poppins text-[16px] text-[#FFF]">
                  Save
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateProjectScreen;
