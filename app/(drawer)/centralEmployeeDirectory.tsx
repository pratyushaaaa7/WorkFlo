import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { AuthContext } from "../../context/AuthContext"; // adjust path if needed
import api from "../../lib/api"; // axios instance with baseURL
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router"; // if you are using expo-router
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type User = {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  employeeCode: number;
};

export default function AllUsersScreen() {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter(); // expo-router navigation

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false); // ✅ state to track download

  const downloadExcelWeb = async () => {
    try {
      setDownloading(true); // start loader
      const response = await fetch(`${api.defaults.baseURL}/users/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "users.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel download error:", error);
    } finally {
      setDownloading(false); // stop loader
    }
  };

  const downloadExcel = async () => {
    if (Platform.OS === "web") {
      return downloadExcelWeb();
    }

    try {
      setDownloading(true); // start loader

      const url = `${api.defaults.baseURL}/users/download`;
      const fileUri = FileSystem.documentDirectory + "users.xlsx";

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({
          type: "success",
          text1: "Downloaded",
          text2: "Excel saved at " + uri,
        });
      }
    } catch (error) {
      console.error("Excel download error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to download Excel",
      });
    } finally {
      setDownloading(false); // stop loader
    }
  };

  const fetchUsers = async () => {
    if (!token) return;

    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to fetch users",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEmployeeCode = (code?: number) =>
    code !== undefined && code !== null
      ? code.toString().padStart(3, "0")
      : "---";

  // inside AllUsersScreen
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [token])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading users...</Text>
      </View>
    );
  }

  if (!users.length) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">No users found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      {auth?.user?.role === "admin" && (
        <TouchableOpacity
          onPress={downloadExcel}
          className="flex-row items-center bg-green-500 px-4 py-2 mb-4 rounded-lg self-start"
          disabled={downloading} // disable while downloading
        >
          <Ionicons name="download-outline" size={20} color="white" />
          <Text className="text-white ml-2">
            {downloading ? "Downloading..." : "Download Excel"}
          </Text>
          {downloading && (
            <ActivityIndicator size="small" color="#fff" className="ml-2" />
          )}
        </TouchableOpacity>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }} // 👈 adds bottom padding
        renderItem={({ item }) => (
          <TouchableOpacity
            disabled={auth?.user?.role !== "admin"} // disable press if not admin
            onPress={() =>
              router.push({
                pathname: "/employeeDetail",
                params: { userId: item._id },
              })
            }
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-200"
          >
            <View className="flex-row justify-between items-center">
              {/* Left Side - User Info */}
              <View>
                <Text className="text-lg font-semibold text-gray-800">
                  {item.fullName}
                </Text>
                <Text className="text-gray-600">{item.email}</Text>
                {item.employeeCode && (
                  <Text
                    className={`mt-1 p-1 rounded-lg text-sm font-medium w-20 text-center ${
                      item.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    W{formatEmployeeCode(item.employeeCode)}
                  </Text>
                )}
              </View>

              {/* Right Side - Edit Button */}
              {auth?.user?.role === "admin" && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/registerUser", // same form screen
                      params: { userId: item._id }, // pass id for editing
                    })
                  }
                  className="p-4 bg-indigo-50 rounded-full"
                >
                  <Ionicons name="create-outline" size={22} color="#4F46E5" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
