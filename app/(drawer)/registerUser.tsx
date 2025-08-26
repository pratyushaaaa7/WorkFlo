import React, { useState, useContext } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";

const RegisterUserScreen = () => {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");

  const roleOptions = [
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ];

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!fullName || !email || !username || !password || !selectedRole) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "All fields are required.",
        position: "bottom",
      });
      return;
    }

    try {
      const res = await api.post(
        "/auth/register",
        { fullName, email, username, password, role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: res.data.message || "User registered successfully!",
        position: "bottom",
      });

      setFullName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setSelectedRole("user");
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
        paddingHorizontal: 20,
      }}
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 20 : 30}
      keyboardShouldPersistTaps="handled"
    >
      {/* Optional subheader */}
      <View className="items-center my-6">
        <Text className="text-black font-bold text-xl text-center">
          Create an account for your team
        </Text>
      </View>

      {/* Form Card */}
      <View className="bg-white rounded-2xl p-5 shadow-md">
        {/* Full Name */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-1 font-semibold">Full Name</Text>
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Icon name="user" size={18} color="#9CA3AF" />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1"
            />
          </View>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-1 font-semibold">Email</Text>
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Icon name="mail" size={18} color="#9CA3AF" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              className="ml-2 flex-1"
            />
          </View>
        </View>

        {/* Username */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-1 font-semibold">Username</Text>
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Icon name="user-check" size={18} color="#9CA3AF" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1"
            />
          </View>
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-1 font-semibold">Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-md px-3 py-2">
            <Icon name="lock" size={18} color="#9CA3AF" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1"
            />
          </View>
        </View>

        {/* Role Dropdown */}
        <View className="mb-6">
          <Text className="text-gray-600 mb-1 font-semibold">Role</Text>
          <Dropdown
            data={roleOptions}
            labelField="label"
            valueField="value"
            placeholder="Select role..."
            value={selectedRole}
            onChange={(item) => setSelectedRole(item.value)}
            style={{
              height: 55,
              borderRadius: 6,
              paddingHorizontal: 12,
              backgroundColor: "#FFF",
              borderWidth: 1,
              borderColor: "#D1D5DB",
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{ fontSize: 14, color: "#111827" }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 3,
            }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          className="bg-indigo-600 py-3 rounded-xl items-center shadow-md"
        >
          <Text className="text-white text-lg font-bold">Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default RegisterUserScreen;
