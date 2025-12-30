import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext"; // JWT context
import api from "../lib/api";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function UserDirectoryScreen() {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/user-directory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return users;

    const q = searchQuery.toLowerCase();

    return users.filter((u) => {
      return (
        u.individualName?.toLowerCase().includes(q) ||
        u.userCode?.toString().toLowerCase().includes(q) ||
        u.firmName?.toLowerCase().includes(q) ||
        u.expertiseList?.some((e: any) => e.toLowerCase().includes(q)) ||
        u.designationList?.some((d: any) => d.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, users]);

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="mb-4 rounded-2xl bg-white shadow-sm p-4"
      onPress={() =>
        router.push({
          pathname: "/userDetail",
          params: { user: JSON.stringify(item) },
        })
      }
    >
      {/* Name + Role */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-gray-900">
          {item.individualName || "Unnamed"}
        </Text>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-700 text-xs font-semibold">
            {item.role}
          </Text>
        </View>
      </View>

      {/* Firm + Designation */}
      <View className="flex-row justify-between mt-2 items-center">
        <Text className="text-sm text-gray-700 ">
          {item.designationList?.join(", ") || "N/A"} @ {item.firmName || "N/A"}
        </Text>

        {/* Average Rating */}
        <View className="flex-row items-center">
          {item.averageRating && item.averageRating > 0 ? (
            <Ionicons name="star" size={18} color="#FACC15" />
          ) : null}
          <Text className="ml-2 text-gray-700 text-sm font-semibold">
            {item.averageRating && item.averageRating > 0
              ? `${item.averageRating.toFixed(1)} / 5`
              : // : (
                //   <Text className="text-gray-400  italic">
                //     No rating available
                //   </Text>
                // )
                null}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/centralUserDirectory")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              Central Directory
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View className="flex-1 bg-gray-50 p-4">
        <View className="mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-2 shadow-sm">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search users..."
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1 text-gray-900"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating + Button */}
        {/* <TouchableOpacity
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
      </TouchableOpacity> */}
      </View>
    </>
  );
}
