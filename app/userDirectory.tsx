import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const UserList = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/user-directory/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error);
      Alert.alert("Error", "Unable to load users for this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && token) {
      fetchUsers();
    }
  }, [projectId, token]);

  const renderUserItem = ({ item, index }) => (
    <View
      key={index}
      className="bg-white rounded-2xl p-4 mb-4 "
    >
      <Text className="text-lg font-semibold text-blue-600">{item.individualName}</Text>
      <Text className="text-gray-700">{item.designation}</Text>
      <Text className="text-gray-700">{item.role}</Text>
      <Text className="text-gray-600">{item.email}</Text>
      <Text className="text-gray-600">{item.phone}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="pt-16 px-4 pb-6 bg-white "
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-6">
        <Text className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
          {projectName} - User Directory
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item, idx) => idx.toString()}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Floating + Button */}
     <TouchableOpacity
  onPress={() => router.push(`/addUserDirectory?projectId=${projectId}&projectName=${projectName}`)}
  style={{
    position: "absolute",
    bottom: 40,
    right: 24,
    backgroundColor: "#2563EB",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }}
>
  <Ionicons name="add" size={36} color="white" />
</TouchableOpacity>

    </View>
  );
};

export default UserList;
