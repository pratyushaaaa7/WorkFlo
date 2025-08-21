import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

type ILR = {
  _id: string;
  description: string;
  targetDate: string;
  remarks: string;
  responsibility: {
    _id: string;
    individualName: string;
    designation: string;
  }[];

  status: "Open" | "Closed";
  createdBy: { _id: string; username: string }; // 👈 add this
  createdAt: string; // 👈 add this
};

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const { token } = useContext(AuthContext); // Assuming your AuthContext provides token

  const [ilrs, setIlrs] = useState<ILR[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchILRs = async () => {
      if (!token || !projectId) return;
      try {
        setLoading(true);
        const res = await api.get(`/ilrs/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIlrs(res.data);
        // console.log("Fetched ILRs:", res.data);
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchILRs();
  }, [token, projectId]);

  const renderCard = ({ item }: { item: ILR }) => {
   const statusClasses =
  item.status === "Open"
    ? "bg-red-600" // Deep red for Open
    : "bg-[#4B5563]"; // Deep gray for Closed

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-3 mb-3 shadow-md"
        onPress={() => {
          const params = {
            ilrId: item._id,
            projectName,
            description: item.description,
            targetDate: item.targetDate,
            remarks: item.remarks,
            responsibility: JSON.stringify(item.responsibility),
            status: item.status,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
          };

          // console.log("🔍 Params passed to ilrActivities:", params); // 👈 check here

          router.push({
            pathname: `/ilrActivities`,
            params,
          });
        }}
      >
        {/* Top row: Description + Status */}
        <View className="flex-row justify-between items-center">
          <Text
            className="font-semibold text-gray-900 text-base flex-1 mr-2"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
          <View className={`px-3 py-1 rounded-full ${statusClasses}`}>
            <Text className="text-white text-xs font-semibold">
              {item.status}
            </Text>
          </View>
        </View>

        {/* Target Date */}
        <Text className="text-gray-500 text-xs mt-1">
          Target Date: {new Date(item.targetDate).toLocaleDateString()}
        </Text>

        {/* Responsibility */}
        <Text
          className="text-gray-500 text-xs mt-1"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          Responsibility:{" "}
          {item.responsibility
            .map((u) => `${u.individualName} (${u.designation})`)
            .join(", ")}
        </Text>

        {/* Remarks */}
        <Text
          className={`text-gray-500 text-xs mt-1 ${
            item.remarks ? "" : "italic"
          }`}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          Remarks: {item.remarks ? item.remarks : "No remarks"}
        </Text>

        {/* Created By */}
        <Text className="text-gray-400 text-xs mt-1">
          Added by {item.createdBy?.username} on{" "}
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="bg-white pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-4">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-5 flex-1">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          {projectName}'s Issue Log Register
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : ilrs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No ILRs found for this project.
          </Text>
        ) : (
          <FlatList
            data={ilrs}
            keyExtractor={(item) => item._id}
            renderItem={renderCard}
          />
        )}
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/ilrForm?projectId=${projectId}&projectName=${projectName}`
          )
        }
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,
          backgroundColor: "#2563EB",
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
    </View>
  );
};

export default ILRs;
