import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const AddUsers = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [formUsers, setFormUsers] = useState([
    {
      individualName: "",
      designation: "",
      role: "",
      roleDescription: "",
      firmName: "",
      email: "",
      phone: "",
    },
  ]);

  const [roleOpenIndex, setRoleOpenIndex] = useState(null);
    const [submitting, setSubmitting] = useState(false); // to disable button

  // Validation helper - returns true if any user has empty required fields
  const hasEmptyFields = () => {
    return formUsers.some(user =>
      !user.individualName.trim() ||
      !user.designation.trim() ||
      !user.role.trim() ||
      !user.firmName.trim() ||
      !user.email.trim()
      // You can add more required fields here if needed
    );
  };

  const [roleItems] = useState([
    { label: "Contractor", value: "Contractor" },
    { label: "Vendor", value: "Vendor" },
    { label: "Client", value: "Client" },
    { label: "Consultant", value: "Consultant" },
    { label: "Architecture", value: "Architecture" },
  ]);

  const updateUserField = (index, field, value) => {
    const updated = [...formUsers];
    updated[index][field] = value;
    setFormUsers(updated);
  };

  const addUserField = () => {
    setFormUsers([
      ...formUsers,
      {
        individualName: "",
        designation: "",
        role: "",
        roleDescription: "",
        firmName: "",
        email: "",
        phone: "",
      },
    ]);
  };

  const removeUserField = (index) => {
    if (formUsers.length > 1) {
      const updated = [...formUsers];
      updated.splice(index, 1);
      setFormUsers(updated);
    }
  };

const handleSubmit = async () => {
    if (hasEmptyFields()) {
      Alert.alert("Validation Error", "Please fill all required fields for every user.");
      return;
    }

    setSubmitting(true);
    try {
      for (const user of formUsers) {
        await api.post(
          `/user-directory/${projectId}`,
          { projectId, ...user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      Alert.alert("Success", "Users added successfully!");
      router.back();
    } catch (error) {
      console.error("Error adding users:", error.response?.data || error);
      Alert.alert("Error", "Unable to add user(s).");
      setSubmitting(false); // Re-enable on error
    }
  };


  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="pt-16 px-4 pb-6 bg-white shadow-md"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">Back</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingVertical: 24 }}
        className="px-4"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 150}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
          {projectName} - Add Users
        </Text>

        {formUsers.map((user, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl p-5 shadow-md mb-6"
            style={{
              zIndex: roleOpenIndex === index ? 1000 : 0,
              elevation: roleOpenIndex === index ? 1000 : 0,
            }}
          >
            <Text className="font-bold text-lg text-blue-600 mb-4">User {index + 1}</Text>

            <DropDownPicker
              open={roleOpenIndex === index}
              value={user.role}
              items={roleItems}
              setOpen={() =>
                setRoleOpenIndex(roleOpenIndex === index ? null : index)
              }
              setValue={(callback) => {
                const val = callback(user.role);
                updateUserField(index, "role", val);
              }}
              setItems={() => {}}
              placeholder="Select Role"
              style={{
                borderColor: "#D1D5DB",
                backgroundColor: "#F9FAFB",
                borderRadius: 10,
                height: 45,
                marginBottom: 16,
              }}
              dropDownContainerStyle={{
                borderColor: "#D1D5DB",
                borderRadius: 12,
              }}
              textStyle={{ fontSize: 16, color: "#111827" }}
            />

            <TextInput
              placeholder="Individual Name"
              value={user.individualName}
              onChangeText={(text) => updateUserField(index, "individualName", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Designation"
              value={user.designation}
              onChangeText={(text) => updateUserField(index, "designation", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Role Description"
              value={user.roleDescription}
              onChangeText={(text) => updateUserField(index, "roleDescription", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Company Name"
              value={user.firmName}
              onChangeText={(text) => updateUserField(index, "firmName", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              value={user.email}
              onChangeText={(text) => updateUserField(index, "email", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Phone"
              keyboardType="phone-pad"
              value={user.phone}
              onChangeText={(text) => updateUserField(index, "phone", text)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-base text-gray-900"
              placeholderTextColor="#999"
            />

            {formUsers.length > 1 && (
              <Pressable onPress={() => removeUserField(index)} className="mt-3">
                <Text className="text-red-500 font-medium">Delete User</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Pressable
          onPress={addUserField}
          className="bg-emerald-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
        >
          <Text className="text-white font-semibold text-lg">+ Add Another User</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          className="bg-blue-600 py-4 rounded-2xl items-center active:scale-95"
        >
          <Text className="text-white font-bold text-lg">Save Users</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddUsers;
