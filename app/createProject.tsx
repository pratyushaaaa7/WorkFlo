import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar04Icon,
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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const CreateProjectScreen = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { bottom } = useSafeAreaInsets();

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
        setPartnerInCharge(
          p.partnerInCharge?.map((u: any) => u._id || u) || [],
        );
        // Strip prefix (WP, WALL, WCORP) from serial number for display
        setCompanySerialNumber(
          p.companySerialNumber?.replace(/^(WP|WALL|WCORP)/i, "") || "",
        );
        setProjectDescription(p.projectDescription || "");
        setProjectImages(p.projectImages || []);
        setAssociatedProject(
          p.associatedProject?._id || p.associatedProject || null,
        );
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
  const [partnerInCharge, setPartnerInCharge] = useState<string[]>([]);
  const [companySerialNumber, setCompanySerialNumber] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [associatedProject, setAssociatedProject] = useState<string | null>(
    null,
  );
  const [allProjects, setAllProjects] = useState<
    { label: string; value: string; company: string }[]
  >([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const resetForm = () => {
    setProjectName("");
    setProjectCode("");
    setProjectLocation("");
    setClientName("");
    setSiteArea("");
    setFileNumber("");
    setWebName("");
    setDesignedArea("");
    setSelectedLeaders([]);
    setSelectedMembers([]);
    setCompanyName(null);
    setProjectTypology(null);
    setSelectedScopes([]);
    setStartDate(null);
    setStatus("active");
    setPartnerInCharge([]);
    setCompanySerialNumber("");
    setProjectDescription("");
    setProjectImages([]);
    setAssociatedProject(null);
  };

  const handleDiscard = () => {
    resetForm();
    setShowCancelModal(false);
    router.back();
  };

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
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset: any) => asset.uri);
      const totalImages = projectImages.length + selectedUris.length;

      if (totalImages > 5) {
        Toast.show({
          type: "error",
          text1: "Limit Exceeded",
          text2: "You can only upload up to 5 images.",
          position: "bottom",
        });

        // Optionally add only up to the limit
        const remainingSlots = 5 - projectImages.length;
        if (remainingSlots > 0) {
          const allowedUris = selectedUris.slice(0, remainingSlots);
          setProjectImages((prev) => [...prev, ...allowedUris]);
        }
      } else {
        setProjectImages((prev) => [...prev, ...selectedUris]);
      }
    }
  };

  const removeImage = (index: number) => {
    setProjectImages((prev) => prev.filter((_, i) => i !== index));
  };

  const companyOptions = [
    { label: "WP", value: "WP" },
    { label: "WALL", value: "WAL" },
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
    WCorp: [
      { label: "Design Management", value: "Design Management" },
      { label: "Project Management", value: "Project Management" },
      { label: "Construction Management", value: "Construction Management" },
      { label: "Master Planning", value: "Master Planning" },
      { label: "Architecture", value: "Architecture" },
      { label: "Interior Design", value: "Interior Design" },
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

        // 🔹 Auto-select "Apul Tandon" as Partner in Charge for NEW projects
        if (!isEditing) {
          const defaultPartner = dropdownUsers.find(
            (u: any) =>
              u.label.toLowerCase().includes("apul") ||
              u.label.toLowerCase().includes("apul tandon"),
          );
          if (defaultPartner) {
            setPartnerInCharge([defaultPartner.value]);
          }
        }
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

    const fetchAllProjects = async () => {
      if (!token) return;
      try {
        const res = await api.get("/projects/list-all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const projects = res.data.projects.map((p: any) => ({
          label: p.projectName,
          value: p._id,
          company: p.company || "-",
        }));
        setAllProjects(projects);
      } catch (err) {
        console.error("Failed to fetch projects list:", err);
      }
    };
    fetchAllProjects();
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

    try {
      setIsUploadingImages(true);
      const finalImageUrls: string[] = [];

      for (const imgUri of projectImages) {
        // 🔹 If it's already an http link, it's already on cloud (Editing mode)
        if (imgUri.startsWith("http")) {
          finalImageUrls.push(imgUri);
          continue;
        }

        // 🔹 Upload local file to cloud
        try {
          const formData = new FormData();
          const filename = imgUri.split("/").pop() || "image.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          // @ts-ignore
          formData.append("file", {
            uri:
              Platform.OS === "android"
                ? imgUri
                : imgUri.replace("file://", ""),
            name: filename,
            type,
          });
          formData.append("module", "project");
          if (isEditing) formData.append("referenceId", projectId as string);

          const uploadRes = await api.post("/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          });

          if (uploadRes.data?.file?.url) {
            finalImageUrls.push(uploadRes.data.file.url);
          }
        } catch (err) {
          console.error("Failed to upload image:", imgUri, err);
        }
      }
      setIsUploadingImages(false);

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
        partnerInCharge, // ✅ new field
        companySerialNumber, // ✅ new field
        projectDescription, // ✅ new field
        projectImages: finalImageUrls, // ✅ Final clean list
        associatedProject,
      };

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

      resetForm();
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <ScrollView
          className="flex-1 px-4 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
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
              data={companyOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Company"
              value={companyName}
              onChange={(item) => setCompanyName(item.value)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
              data={typologyOptions}
              labelField="label"
              valueField="value"
              placeholder="Select typology"
              value={projectTypology}
              onChange={(item) => setProjectTypology(item.value)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              data={allUsers}
              labelField="label"
              valueField="value"
              placeholder="Select Leader(s)"
              search
              searchPlaceholder="Search users..."
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              value={selectedLeaders}
              onChange={(items) => setSelectedLeaders(items)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              data={allUsers}
              labelField="label"
              valueField="value"
              placeholder="Select Member(s)"
              search
              searchPlaceholder="Search users..."
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              value={selectedMembers}
              onChange={(items) => setSelectedMembers(items)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Project Incharge Dropdown */}
          <View className="mb-5" style={{ zIndex: 1250 }}>
            <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
              Partner In Charge
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              data={allUsers}
              labelField="label"
              valueField="value"
              placeholder="Select Incharge"
              search
              searchPlaceholder="Search users..."
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              value={partnerInCharge}
              onChange={(items) => setPartnerInCharge(items)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
              data={statusOptions}
              labelField="label"
              valueField="value"
              placeholder="Select status"
              value={status}
              onChange={(item) => setStatus(item.value)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
              className="h-[52px] rounded-[16px] px-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] flex-row items-center justify-between"
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
              <HugeiconsIcon
                icon={Calendar04Icon}
                size={20}
                color={isDarkMode ? "#919191" : "#454545"}
              />
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#919191" : "#454545",
              }}
              selectedTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
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
                fontFamily: "Poppins_400Regular",
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
              data={scopeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select scopes"
              value={selectedScopes}
              onFocus={() => {
                if (!companyName) {
                  Toast.show({
                    type: "info",
                    text1: "Company Required",
                    text2: "Please select a company first to see scopes.",
                    position: "bottom",
                  });
                }
              }}
              onChange={(items) => setSelectedScopes(items)}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
              )}
            />
          </View>

          {/* Associated Project Dropdown */}
          <View className="mb-5" style={{ zIndex: 2800 }}>
            <Text className="text-[14px] font-poppinsMedium mb-2 text-[#000000] dark:text-[#FFFFFF]">
              Associated Project
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
              data={allProjects}
              labelField="label"
              valueField="value"
              placeholder="Select associated project"
              search
              searchPlaceholder="Search projects..."
              inputSearchStyle={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 14,
                borderColor: "grey",
                fontSize: 14,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              }}
              value={associatedProject}
              onChange={(item) => setAssociatedProject(item.value)}
              renderItem={(item) => (
                <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <Text className="text-[14px] font-poppins text-black dark:text-white">
                    {item.label}
                  </Text>
                  <Text className="text-[11px] font-poppinsRegular text-gray-500">
                    {item.company}
                  </Text>
                </View>
              )}
              renderRightIcon={() => (
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={20}
                  color="#919191"
                />
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
            <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[16px] p-2 min-h-[120px]">
              <TextInput
                className="text-[#000000] dark:text-[#FFFFFF] font-poppins text-[14px]"
                style={{ textAlignVertical: "top" }}
                placeholder="Give a brief description of the project"
                placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                maxLength={200}
                numberOfLines={5}
              />
              <View className="absolute bottom-2 right-2">
                <Text className="text-right text-xs text-gray-400 font-poppins mt-1">
                  {projectDescription.length}/200
                </Text>
              </View>
            </View>
          </View>

          {/* Images Option */}
          <View className="mb-10 bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[20px] p-3 justify-center">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[14px] font-poppinsMedium text-[#000000] dark:text-[#FFFFFF]">
                Images
              </Text>
              <Text className="text-[11px] font-poppins text-gray-500 dark:text-gray-400">
                (Max 5 images)
              </Text>
            </View>
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
                      width: 90,
                      height: 90,
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
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        borderRadius: 14,
                        width: 22,
                        height: 22,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      activeOpacity={0.8}
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={16}
                        strokeWidth={3}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#FBFCFD] dark:bg-[#000000]"
        style={{ padding: 16, paddingBottom: bottom + 16 }}
      >
        <View className="flex-row items-center justify-between gap-x-4">
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            className="flex-1 h-14 rounded-xl border-[1.5px] items-center justify-center bg-white dark:bg-black border-[#BBBBBB] dark:border-[#5F5F5F]"
          >
            <Text className="font-poppins text-[16px] text-[#777777] dark:text-[#919191]">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={saving}
            onPress={handleSaveProject}
            className="flex-1 h-14 rounded-xl overflow-hidden"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                saving || isUploadingImages
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
              {saving || isUploadingImages ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-poppinsMedium text-[16px] ml-2">
                    {isUploadingImages ? "Uploading..." : "Saving..."}
                  </Text>
                </View>
              ) : (
                <Text className="font-poppins text-[16px] text-[#FFF]">
                  {isEditing ? "Update" : "Save"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
          className="flex-1 justify-center items-center px-6 bg-black/50"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
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
                <Text className="text-black dark:text-white font-poppins text-lg">
                  Not Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDiscard}
                className="flex-1 bg-[#DF5B5B] rounded-xl py-3 items-center"
              >
                <Text className="text-white font-poppins text-lg">Yes I’m</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CreateProjectScreen;
