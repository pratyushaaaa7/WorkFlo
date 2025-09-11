import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext"; // JWT context
import api from "../../lib/api";
import { useRouter } from "expo-router";

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
    <View className="flex-1 bg-gray-50 p-4">
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
      ) : (
        <FlatList
          data={users}
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
  );
}
