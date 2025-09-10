// app/(drawer)/addProjectUsers.tsx
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Checkbox } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

type DirectoryUser = {
  _id: string;
  individualName: string;
  firmName: string;
  emailList?: string[];
  role?: string;
};

export default function AddProjectUsersPage() {
  const { projectId } = useLocalSearchParams();
  console.log(projectId)
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    { user: DirectoryUser; role: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/user-directory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch directory users",
          position: "bottom",
        });
      }
    };
    fetchUsers();
  }, []);

  const toggleUserSelection = (user: DirectoryUser) => {
    const exists = selectedUsers.find((u) => u.user._id === user._id);
    if (exists) {
      setSelectedUsers(selectedUsers.filter((u) => u.user._id !== user._id));
    } else {
      setSelectedUsers([
        ...selectedUsers,
        { user, role: user.role || "Member" },
      ]);
    }
  };

  const updateUserRole = (userId: string, newRole: string) => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u.user._id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      return Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select at least one user.",
        position: "bottom",
      });
    }

    try {
      const payload = {
        projectUsers: selectedUsers.map((u) => ({
          directoryUser: u.user._id,
          role: u.role,
        })),
      };

      await api.post(`/projects/${projectId}/add-users`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Users added to project",
        position: "bottom",
      });

      router.push(`/userDirectory`);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Something went wrong",
        position: "bottom",
      });
    }
  };

  const roleOptions = [
    { label: "Vendor", value: "Vendor" },
    { label: "Consultant", value: "Consultant" },
    { label: "Contractor", value: "Contractor" },
    { label: "Architect", value: "Architect" },
    { label: "Client", value: "Client" },
    { label: "consultant", value: "consultant" },
  ];

  const filteredUsers = users.filter((u) => {
    const name = (u.individualName || u.firmName || "").toLowerCase();
    const email = (u.emailList?.[0] || "").toLowerCase();
    return (
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="pt-16 px-4 pb-4 bg-white shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            Add Users
          </Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white mx-4 my-3 px-3 py-2 rounded-xl shadow-lg">
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search users..."
          placeholderTextColor={"#777"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const isSelected = selectedUsers.some((u) => u.user._id === item._id);
          const selectedUser = selectedUsers.find(
            (u) => u.user._id === item._id
          );

          return (
            <TouchableOpacity
              onPress={() => toggleUserSelection(item)}
              className="bg-white px-4 py-3 mb-3  rounded-2xl "
              activeOpacity={0.9}
            >
              <View className="flex-row items-center justify-between">
                {/* User Info */}
                <View className="flex-1  pr-3">
                  <Text className="font-semibold text-gray-900 text-base">
                    {item.individualName || item.firmName}
                  </Text>
                  {/* <Text className="text-gray-500 text-sm">
                    {item.emailList?.[0]}
                  </Text> */}
                </View>

                {/* Role Dropdown (only when selected) */}
                {isSelected && (
                  <View className="w-32 mr-3">
                    <Dropdown
                      style={{
                        height: 36,
                        borderColor: "#E2E8F0",
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 6,
                      }}
                      placeholderStyle={{ fontSize: 12, color: "#9CA3AF" }}
                      selectedTextStyle={{ fontSize: 12, color: "#111827" }}
                      containerStyle={{
                        borderRadius: 8,
                        borderColor: "#E2E8F0",
                      }}
                      itemTextStyle={{ fontSize: 12, color: "#374151" }}
                      data={roleOptions}
                      labelField="label"
                      valueField="value"
                      placeholder="Role"
                      value={selectedUser?.role}
                      onChange={(roleItem) =>
                        updateUserRole(item._id, roleItem.value)
                      }
                    />
                  </View>
                )}

                {/* Checkbox */}
                <Checkbox
                  status={isSelected ? "checked" : "unchecked"}
                  onPress={() => toggleUserSelection(item)}
                  color="#2563EB"
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-lg">
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-blue-600 py-4 rounded-2xl"
        >
          <Text className="text-white text-center font-bold text-lg">
            Save Users
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
