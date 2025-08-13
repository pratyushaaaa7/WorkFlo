import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

const RegisterUserScreen = () => {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Role dropdown state
  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user"); // default to 'user'
  const [roleItems, setRoleItems] = useState([
    
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
    { label: "Team Lead", value: "teamLead" },
  ]);

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Username and password are required.");
      return;
    }

    try {
      const res = await api.post(
        "/auth/register",
        {
          username,
          password,
          role: selectedRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Only allow admin to register users
          },
        }
      );

      Alert.alert(
        "Success",
        res.data.message || "User registered successfully!"
      );
      setUsername("");
      setPassword("");
      setSelectedRole("user");
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Registration failed."
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 py-6">
      <Text className="text-xl font-bold mb-4">Register New User</Text>

      <Text className="mb-1 font-semibold text-gray-700">Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        placeholderTextColor="#999"
        className="border border-gray-300 rounded-md px-4 py-2 mb-4"
      />

      <Text className="mb-1 font-semibold text-gray-700">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor="#999"
        // secureTextEntry
        className="border border-gray-300 rounded-md px-4 py-2 mb-4"
      />

      <Text className="mb-1 font-semibold text-gray-700">Role</Text>
      <DropDownPicker
        open={roleOpen}
        value={selectedRole}
        items={roleItems}
        setOpen={setRoleOpen}
        setValue={setSelectedRole}
        setItems={setRoleItems}
        placeholder="Select role"
        className="mb-4"
        containerStyle={{ marginBottom: roleOpen ? 160 : 20, zIndex: 1000 }}
        listMode="FLATLIST"
      />

      <TouchableOpacity
        onPress={handleRegister}
        className="bg-blue-600 py-3 rounded-lg items-center mt-4"
      >
        <Text className="text-white font-bold">Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterUserScreen;
