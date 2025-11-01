import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";

export default function UserRoleList() {
  const { role } = useLocalSearchParams(); // role = client/vendor/consultant
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/user-directory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filter users by role from params
        const filtered = res.data.filter(
          (u: any) => u.role?.toLowerCase() === role?.toString().toLowerCase()
        );
        setUsers(filtered);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [role]);

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      // disabled={auth?.user?.role !== "admin"}
      className="mt-3 rounded-2xl bg-white shadow-sm mx-4 p-4"
      onPress={() =>
        router.push({
          pathname: "/userDetail",
          params: { user: JSON.stringify(item) },
        })
      }
    >
      {/* Name + Role */}
      <View className="flex-row justify-between  items-center ">
        <Text className="text-lg font-semibold text-gray-900">
          <Text className="text-sm text-red-500">#{item.userCode || ""}</Text>
          {"   "}
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
          {item.designationList?.join(", ") || ""} @ {item.firmName || "N/A"}
        </Text>

        {/* Average Rating */}
        <View className="flex-row items-center">
          {item.averageRating && item.averageRating > 0 ? (
            <>
              <Ionicons name="star" size={18} color="#FACC15" />
              <Text className="ml-2 text-gray-700 text-sm font-semibold">
                {item.averageRating.toFixed(1)} / 5
              </Text>
            </>
          ) : (
            <Text className="text-gray-400 text-sm italic">
              No rating available
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 ">
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16  mb-6 px-4 flex-row items-center justify-between"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
            zIndex: 10,
          }}
        >
          {/* Back Button + Title */}
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/centralUserDirectory")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {role} Directory
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
      ) : users.length === 0 ? (
        <Text className="text-center text-gray-400 mt-10">No {role} found</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}
