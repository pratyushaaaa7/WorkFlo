import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

const CreateProjectScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectName, setProjectName] = useState("");

  // Dropdown Picker
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token) {
          console.warn("No token found");
          return;
        }

        const res = await api.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dropdownUsers = res.data.users.map((user:any) => ({
          label: `${user.username} (${user.role})`,
          value: user._id,
        }));

        setAllUsers(dropdownUsers);
      } catch (err) {
        const error = err as { response?: { data?: any }; message?: string };
        console.error("Failed to fetch users:", error.response?.data || error.message);
        Alert.alert("Error", "You may not have access to user list.");
      }
    };

    fetchUsers();
  }, [token]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert("Validation", "Project name is required");
      return;
    }

    try {
      const res = await api.post(
        "/projects",
        {
          projectName,
          assignedUsers: selectedUsers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", res.data.message);
      setProjectName("");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Error creating project:", err.message);
      Alert.alert("Error", "Failed to create project");
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4 py-6 bg-white"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <View className="mb-4" style={{ zIndex: 10 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Project Name
        </Text>
        <TextInput
          className="border border-gray-300 rounded-md px-4 py-2"
          placeholder="Enter project name"
          value={projectName}
          onChangeText={setProjectName}
        />
      </View>

      <View style={{ zIndex: 1000 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Assign Users
        </Text>
        <DropDownPicker
          multiple={true}
          min={0}
          max={10}
          open={open}
          value={selectedUsers}
          items={allUsers}
          setOpen={setOpen}
          setValue={setSelectedUsers}
          setItems={setAllUsers}
          placeholder="Select users..."
          searchable={true}
          mode="BADGE"
          badgeColors={["#2563eb"]}
          badgeDotColors={["#1d4ed8"]}
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 mt-6 py-3 rounded-lg items-center"
        onPress={handleCreateProject}
      >
        <Text className="text-white font-bold text-base">Create Project</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateProjectScreen;
