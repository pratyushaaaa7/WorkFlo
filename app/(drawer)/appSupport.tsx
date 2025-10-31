import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

const AppSupport = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const response = await api.get("/support", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data.supports || []);
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
      Toast.show({
        type: "error",
        text1: "Failed to load tickets",
        text2: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-500">Loading tickets...</Text>
      </View>
    );
  }

const renderTicket = ({ item }) => (
  <TouchableOpacity
    onPress={() =>
      router.push({
        pathname: "/ticketResponse",
        params: {
          id: item._id,
          type: item.type,
          description: item.description,
          imageUrl: item.imageUrl,
          relatedPage: item.relatedPage,
          raisedBy: item.raisedBy?.username,
          date: item.date,
          fixed: item.fixed,
          published: item.published,
          remark: item.remark || "",
        },
      })
    }
    className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 w-full"
  >
    {/* Header */}
    <View className="flex-row justify-between items-center mb-2">
      <Text className="font-semibold text-gray-800 text-base">
        {item.type || "Support Ticket"}
      </Text>
      <Text
        className={`text-xs px-2 py-1 rounded-full ${
          item.fixed
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {item.fixed ? "Fixed" : "Open"}
      </Text>
    </View>

    {/* Ticket Info */}
    <Text className="text-lg font-bold text-gray-900">
      Ticket #{item.ticketId}
    </Text>

    <Text className="text-gray-600 font-medium mt-1">
      {item.relatedPage || "N/A"}
    </Text>

    <Text
      className="text-gray-500 mt-2 text-sm leading-5"
      numberOfLines={2}
    >
      {item.description || "No description provided."}
    </Text>

    {/* Remark Section */}
    {item.remark ? (
      <View className="mt-3 bg-gray-50 rounded-xl p-2 border border-gray-100">
        <Text className="text-xs text-gray-500 mb-1 font-medium">
          Remark:
        </Text>
        <Text className="text-gray-700 text-sm">{item.remark}</Text>
      </View>
    ) : null}

    {/* Published Status */}
    <View className="flex-row justify-between items-center mt-4">
      <View className="flex-row items-center">
        <Ionicons
          name={item.published ? "checkmark-circle" : "close-circle"}
          size={16}
          color={item.published ? "#16a34a" : "#dc2626"}
        />
        <Text
          className={`ml-1 text-sm font-medium ${
            item.published ? "text-green-700" : "text-red-700"
          }`}
        >
          {item.published ? "Published" : "Unpublished"}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
        <Text className="ml-1 text-xs text-gray-500">
          {item.raisedBy?.fullName ||
            item.raisedBy?.username ||
            "Unknown"}
        </Text>
      </View>
    </View>

    {/* Date */}
    <Text className="text-xs text-gray-400 mt-2">
      {item.date || new Date(item.createdAt).toLocaleDateString()}
    </Text>
  </TouchableOpacity>
);


  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4 pb-20">
      {tickets.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={90}
            color="#a3a3a3"
          />
          <Text className="text-gray-700 text-xl font-semibold mt-4">
            No Suggestions Yet
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Have an idea or facing an issue?{"\n"}Tap the + button below to
            share your feedback.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          renderItem={renderTicket}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => router.push("/appSupportForm")}
        style={{
          position: "absolute",
          bottom: 50,
          right: 30,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#4F46E5",
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AppSupport;
