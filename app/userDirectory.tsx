import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

// Delete handlers
interface IUser {
  _id: string;
  individualName: string;
  designation: string;
  role: string;
  roleDescription: string;
  firmName: string;
  email: string;
  phone: string;
}

// Edit handlers
interface EditUserData {
  _id: string;
  individualName: string;
  designation: string;
  role: string;
  roleDescription: string;
  firmName: string;
  email: string;
  phone: string;
}

interface EditFieldChangeHandler {
  (field: keyof EditUserData, value: string): void;
}

const UserList = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const fetchUsers = async () => {
    if (!projectId || !token) return;

    try {
      setLoading(true);

      const res = await api.get(`/projects/${projectId}/project-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectUsers = [
        ...(res.data.users.leaders || []),
        ...(res.data.users.members || []),
        ...(res.data.users.others || []),
      ];
      // console.log("Project Users Raw:", projectUsers);

      const formattedUsers: IUser[] = projectUsers.map((pu: any) => ({
        _id: pu._id || "", // use _id from API
        individualName: pu.individualName || pu.fullName || "N/A",
        designation: pu.designation || "-",
        role: pu.role || "-",
        roleDescription: pu.roleDescription || "-",
        firmName: pu.firmName || "-",
        email: pu.email || "-",
        phone: pu.phone || "-",
      }));

      // console.log(formattedUsers);

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load Users",
        text2: "Unable to load users for this project.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && token) {
      fetchUsers();
    }
  }, [projectId, token]);

  const handleDeletePress = (user: IUser) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  // Confirm deletion from project only
  const handleConfirmDelete = async () => {
    if (!selectedUser || !projectId || !token) return;

    try {
      setLoading(true);

      // DELETE request to remove user from project's projectUsers array
      await api.delete(
        `/projects/${projectId}/project-users/${selectedUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Toast.show({
        type: "success",
        text1: "User Removed",
        text2: "The user has been removed from the project successfully.",
        position: "bottom",
      });

      setDeleteModalVisible(false);
      setSelectedUser(null);

      // Refresh the user list
      fetchUsers();
    } catch (error: any) {
      console.error(
        "Error removing user from project:",
        error.response || error
      );

      Toast.show({
        type: "error",
        text1: "Remove Failed",
        text2: "Unable to remove the user from the project.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item, index }: { item: IUser; index: number }) => (
    <View key={index} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      {/* Top row: Username + Edit/Delete icons */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-bold text-blue-700 flex-1 truncate">
          {item.individualName || "-"}
        </Text>

        <View className="flex-row space-x-4 ml-4">
          {/* <TouchableOpacity
            onPress={() => handleEditPress(item)}
            className="px-3 py-1 rounded hover:bg-blue-100"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={20} color="#2563EB" />
          </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => handleDeletePress(item)}
            className="px-3 py-1 rounded hover:bg-red-100"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role and Role Description */}
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-800 font-semibold capitalize flex-1 pr-2">
          {item.role || "-"}
        </Text>
        <Text className="text-sm text-gray-600 italic flex-1 text-right truncate">
          {item.roleDescription || "-"}
        </Text>
      </View>

      {/* Firm Name and Designation */}
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-600 flex-1 pr-2 truncate">
          {item.firmName || "-"}
        </Text>
        <Text className="text-sm text-gray-600 flex-1 text-right truncate">
          {item.designation || "-"}
        </Text>
      </View>

      {/* Email and Phone */}
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-500 flex-1 pr-2 truncate">
          {item.email || "-"}
        </Text>
        <Text className="text-xs text-gray-500 flex-1 text-right truncate">
          {item.phone || "-"}
        </Text>
      </View>
    </View>
  );

  const handleDownloadExcel = async () => {
    try {
      // 1. Prepare the data array you want to export
      // Use your fetched users data array here, example:
      const dataToExport = users.map((user, index) => ({
        SNo: index + 1, // Serial number starting from 1
        Name: user.individualName,
        Designation: user.designation,
        Role: user.role,
        "Role Description": user.roleDescription,
        "Firm Name": user.firmName,
        Email: user.email,
        Phone: user.phone,
      }));

      // 2. Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // 3. Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      if (Platform.OS === "web") {
        // Web download using Blob
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users.xlsx";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Mobile (iOS/Android) download
        const wbout = XLSX.write(workbook, {
          type: "base64",
          bookType: "xlsx",
        });
        const fileUri = FileSystem.cacheDirectory + "users.xlsx";
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Download Users Excel File",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (error) {
      console.error("Error generating Excel file:", error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16 pb-6 px-4 flex-row items-center justify-between"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
            zIndex: 10,
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">Back</Text>
          </TouchableOpacity>

          {/* Download Icon */}
          <TouchableOpacity
            onPress={handleDownloadExcel}
            className="px-2 mr-2 rounded-full bg-white/30 active:bg-white/50"
          >
            <Feather name="download" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="px-4 pt-5 flex-1">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          {projectName} User Directory
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : users.length === 0 ? (
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 text-lg italic">No user exists</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        // onPress={() =>
        //   router.push(
        //     `/addUserDirectory?projectId=${projectId}&projectName=${projectName}`
        //   )
        // }
        onPress={() =>
          router.push(
            `/addProjectUser?projectId=${projectId}&projectName=${projectName}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,

          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white rounded-lg p-5 w-full max-w-sm shadow-md">
            <Text className="text-lg font-semibold mb-3 text-center">
              Confirm Delete
            </Text>
            <Text className="text-center mb-5 text-gray-700">
              Are you sure you want to delete user{" "}
              <Text className="font-semibold">
                {selectedUser?.individualName}
              </Text>
              ?
            </Text>

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                className="px-6 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                className="px-6 py-2 rounded-lg bg-red-600"
              >
                <Text className="text-white font-semibold text-center">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      {/* <Modal
        transparent={true}
        visible={editModalVisible}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          className="flex-1 justify-center px-6 pt-10"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white rounded-lg p-5 w-full max-w-sm mx-auto shadow-md">
            <Text className="text-xl font-semibold mb-5 text-center">
              Edit User
            </Text>

            <Text className="font-semibold mb-1 text-gray-700">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.individualName}
              onChangeText={(text) => handleEditChange("individualName", text)}
              placeholder="Name"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">
              Designation
            </Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.designation}
              onChangeText={(text) => handleEditChange("designation", text)}
              placeholder="Designation"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">Role</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.role}
              onChangeText={(text) => handleEditChange("role", text)}
              placeholder="Role"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">
              Role Description
            </Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.roleDescription}
              onChangeText={(text) => handleEditChange("roleDescription", text)}
              placeholder="Role Description"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">Firm Name</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.firmName}
              onChangeText={(text) => handleEditChange("firmName", text)}
              placeholder="Firm Name"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-3"
              value={editUserData.email}
              onChangeText={(text) => handleEditChange("email", text)}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />

            <Text className="font-semibold mb-1 text-gray-700">Phone</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-5"
              value={editUserData.phone}
              onChangeText={(text) => handleEditChange("phone", text)}
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setEditModalVisible(false)}
                className="px-6 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEdit}
                className="px-6 py-2 rounded-lg bg-indigo-600"
              >
                <Text className="text-white font-semibold text-center">
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal> */}
    </View>
  );
};

export default UserList;
