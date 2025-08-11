import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";

const CreateProjectScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectArea, setProjectArea] = useState("");

  const [openUsers, setOpenUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<{ label: string; value: string }[]>(
    []
  );

  const [openCompany, setOpenCompany] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const companyOptions = [
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
  ];

  const [openTypology, setOpenTypology] = useState(false);
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

  const [openScope, setOpenScope] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const scopeOptions = [
    { label: "MASTER PLANNING", value: "Master Planning" },
    { label: "ARCHITECTURE", value: "Architecture" },
    { label: "INTERIORS", value: "Interiors" },
    { label: "DESIGN MANAGEMENT", value: "Design Management" },
    { label: "CONSTRUCTION MANAGEMENT", value: "Construction Management" },
    { label: "PROJECT MANAGEMENT", value: "Project Management" },
    { label: "QS", value: "QS" },
    { label: "AUDITORS", value: "Auditors" },
  ];

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token) return;

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
          projectName: projectName,
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
    <KeyboardAwareScrollView
      className="flex-1 px-4 py-6  bg-white"
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={50}
    >
      {/* Company Dropdown */}
      <View className="mb-4" style={{ zIndex: 2500 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Company Name
        </Text>
        <DropDownPicker
          open={openCompany}
          value={companyName}
          items={companyOptions}
          setOpen={setOpenCompany}
          setValue={setCompanyName}
          setItems={() => {}}
          placeholder="Select company..."
          listMode="SCROLLVIEW"
          dropDownContainerStyle={{ maxHeight: 200 }}
        />
      </View>

      {/* Typology Dropdown */}
      <View className="mb-4" style={{ zIndex: 2000 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Project Typology
        </Text>
        <DropDownPicker
          open={openTypology}
          value={projectTypology}
          items={typologyOptions}
          setOpen={setOpenTypology}
          setValue={setProjectTypology}
          setItems={() => {}}
          placeholder="Select typology..."
          listMode="FLATLIST"
          dropDownContainerStyle={{ maxHeight: 400 }}
        />
      </View>

      {/* Text Inputs */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Project Name
        </Text>
        <TextInput
          className="border border-gray-black rounded-md px-4 py-2"
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
          className="border border-gray-black rounded-md px-4 py-2"
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
          className="border border-gray-black rounded-md px-4 py-2"
          placeholder="Enter project location"
          placeholderTextColor="#999"
          value={projectLocation}
          onChangeText={setProjectLocation}
        />
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Project Area
        </Text>
        <TextInput
          className="border border-gray-black rounded-md px-4 py-2"
          placeholder="Enter project area"
          placeholderTextColor="#999"
          value={projectArea}
          onChangeText={setProjectArea}
        />
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Scope Description
        </Text>
        <DropDownPicker
          multiple={true}
          min={0}
          max={10}
          open={openScope}
          value={selectedScopes}
          items={scopeOptions}
          setOpen={setOpenScope}
          setValue={setSelectedScopes}
          setItems={() => {}}
          placeholder="Select scopes..."
          mode="BADGE"
          badgeColors={["#bfdbfe"]} // blue-300
          badgeDotColors={["#60a5fa"]} // blue-400
          listMode="SCROLLVIEW"
          dropDownContainerStyle={{ maxHeight: 300 }}
        />
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Start Date
        </Text>

        <Pressable
          onPress={() => setShowStartPicker(true)}
          className="border border-gray-300 rounded-xl py-3 px-4 bg-white"
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
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Users Dropdown */}
      <View style={{ zIndex: 1500 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Project Team Leader(s)
        </Text>
        <DropDownPicker
          multiple
          min={0}
          max={10}
          open={openUsers}
          value={selectedUsers}
          items={allUsers}
          setOpen={setOpenUsers}
          setValue={setSelectedUsers}
          setItems={setAllUsers}
          placeholder="Select users..."
          searchable
          mode="BADGE"
          badgeColors={["#bfdbfe"]} // blue-300
          badgeDotColors={["#60a5fa"]} // blue-400
          listMode="SCROLLVIEW"
          dropDownContainerStyle={{ maxHeight: 300 }}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        className="bg-blue-600 mt-6 mb-10 py-3 rounded-lg items-center"
        onPress={handleCreateProject}
      >
        <Text className="text-white font-bold text-base">Create Project</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default CreateProjectScreen;
