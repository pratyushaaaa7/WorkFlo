import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
// import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";

const CreateProjectScreen = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectArea, setProjectArea] = useState("");

  // const [openUsers, setOpenUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<{ label: string; value: string }[]>(
    []
  );

  // const [openCompany, setOpenCompany] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const companyOptions = [
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
  ];

  // const [openTypology, setOpenTypology] = useState(false);
  const [projectTypology, setProjectTypology] = useState<string | null>(null);
  const typologyOptions = [
    { label: "RESIDENCE", value: "Residence" },
    { label: "COMMERCIAL", value: "Commercial" },
    { label: "HOSPITALITY", value: "Hospitality" },
    { label: "INDUSTRIAL", value: "Industrial" },
    { label: "HEALTHCARE", value: "Healthcare" },
    { label: "HOUSING", value: "Housing" },
    { label: "MISC.", value: "Misc" },
  ];

  // const [openScope, setOpenScope] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const scopeOptions = [
    { label: "MASTER PLANNING", value: "Master Planning" },
    { label: "ARCHITECTURE", value: "Architecture" },
    { label: "INTERIORS", value: "Interiors" },
    { label: "DESIGN MANAGEMENT", value: "Design Management" },
    { label: "CONSTRUCTION MANAGEMENT", value: "Construction Management" },
    { label: "CONTRACT MANAGEMENT", value: "Contract Management" },
    { label: "PROJECT MANAGEMENT", value: "Project Management" },
    { label: "QS", value: "QS" },
    { label: "AUDITORS", value: "Auditors" },
    { label: "FAÇADE", value: "Facade" },
    { label: "TENDER MANAGEMENT", value: "Tender Management" },
    { label: "HANDOVER MANAGEMENT", value: "Handover Management" },
  ];

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        const res = await api.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dropdownUsers = res.data.users.map((user: any) => ({
          label: `${user.username} (${user.role})`,
          value: user._id,
        }));

        setAllUsers(dropdownUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        Alert.alert("Error", "You may not have access to user list.");
      }
    };

    fetchUsers();
  }, [token]);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !companyName || !projectTypology) {
      Alert.alert("Validation", "Please fill all required fields.");
      return;
    }

    try {
      const res = await api.post(
        "/projects",
        {
          company: companyName,
          projectName,
          projectCode,
          location: projectLocation,
          area: projectArea,
          assignedUsers: selectedUsers,
          startDate: startDate.toISOString(),
          typology: projectTypology,
          scopes: selectedScopes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", res.data.message);

      // Reset form
      setProjectName("");
      setProjectCode("");
      setProjectLocation("");
      setProjectArea("");
      setSelectedUsers([]);
      setCompanyName(null);
      setProjectTypology(null);
      setSelectedScopes([]);
      setStartDate(new Date());
    } catch (err) {
      console.error("Error creating project:", err);
      Alert.alert("Error", "Failed to create project");
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="bg-white pt-16 pb-4 px-6 border-b border-gray-200 shadow-lg flex-row items-center space-x-2"
        style={{ zIndex: 10 }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-900">Back</Text>
      </View>

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
              backgroundColor: "#fff", // White for contrast
            }}
            placeholderStyle={{
              fontSize: 14,
              color: "#888",
            }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#0B0B0B", // Rich black for readability
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#E0F7FA", // Soft aqua dropdown background
            }}
            activeColor="#4DD0E1" // Medium aqua for active highlight
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
              borderColor: "#000",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
            placeholderStyle={{ fontSize: 14, color: "#888" }}
             selectedTextStyle={{
              fontSize: 14,
              color: "#0B0B0B", // Rich black for readability
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#E0F7FA", // Soft aqua dropdown background
            }}
            activeColor="#4DD0E1" // Medium aqua for active highlight
            data={typologyOptions}
            labelField="label"
            valueField="value"
            placeholder="Select typology..."
            value={projectTypology}
            onChange={(item) => setProjectTypology(item.value)}
          />
        </View>

        {/* Text Inputs */}
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

        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-2">
            Project Code
          </Text>
          <TextInput
            className="border border-gray-600 rounded-lg px-4 py-2 text-black"
            placeholder="Enter project code"
            placeholderTextColor="#999"
            value={projectCode}
            onChangeText={setProjectCode}
          />
        </View>

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

        <View className="mb-4">
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
            <Text className="text-base text-black">
              {startDate.toDateString()}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
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
            placeholderStyle={{ fontSize: 14, color: "#888" }}
            selectedTextStyle={{
              fontSize: 10,
              color: "#0B0B0B", // Rich black for contrast
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: "#B2EBF2", // Light aqua (cool & clean)
              padding: 5,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#E0F7FA", // Very soft aqua for the dropdown
            }}
            activeColor="#4DD0E1" // Medium aqua for active selection
            data={scopeOptions}
            labelField="label"
            valueField="value"
            placeholder="Select scopes..."
            value={selectedScopes}
            onChange={(items) => setSelectedScopes(items)}
          />
        </View>

        {/* Users Dropdown */}
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
              color: "#888",
            }}
            selectedTextStyle={{
              fontSize: 10,
              color: "#0B0B0B", // Rich black for contrast
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: "#B2EBF2", // Light aqua (cool & clean)
              padding: 5,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#E0F7FA", // Very soft aqua for dropdown
            }}
            activeColor="#4DD0E1" // Medium aqua for active selection
            data={allUsers}
            labelField="label"
            valueField="value"
            placeholder="Select users..."
            search
            value={selectedUsers}
            onChange={(items) => setSelectedUsers(items)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleCreateProject}
          className="bg-blue-600 mt-6 mb-10 py-3 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-base">Create Project</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateProjectScreen;
