import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { AuthContext } from "../../context/AuthContext"; // adjust path if needed
import api from "../../lib/api"; // axios instance with baseURL
import Toast from "react-native-toast-message";

type User = {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
};

export default function AllUsersScreen() {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, [token]);

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
    <View className="flex-1 bg-gray-50 p-4">
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800">
              {item.fullName}
            </Text>
            <Text className="text-gray-600">{item.email}</Text>
            {/* <Text className="text-gray-500">@{item.username}</Text> */}
            <Text
              className={`mt-1 px-2 py-1 rounded-lg text-sm font-medium w-20 text-center ${
                item.role === "admin"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.role}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
