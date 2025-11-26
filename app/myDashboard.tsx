import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
  fullName?: string;
  iat: number;
  exp: number;
};

const Dashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("");

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myILRs, setMyILRs] = useState<any[]>([]);
  const [myMeetings, setMyMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch user info ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode<TokenPayload>(token);
        setUsername(decoded.username);
        setFullName(decoded.fullName || decoded.username);
        setRole(decoded.role);

        const nameParts = (decoded.fullName || decoded.username).split(" ");
        setInitials(
          nameParts
            .map((n) => (n ? n[0] : ""))
            .join("")
            .toUpperCase()
        );
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    };

    fetchUser();
  }, []);

  // --- Fetch dashboard ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/dashboard/my-tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;

        if (data.success) {
          setMyProjects(data.myProjects || []);
          setMyILRs(data.myILRs || []);
          setMyMeetings(data.myMeetings || []);
        } else {
          Toast.show({
            type: "error",
            text1: "Dashboard Error",
            text2: data.message || "Failed to load dashboard",
          });
        }
      } catch (error: any) {
        console.error("Dashboard fetch error:", error);
        Toast.show({
          type: "error",
          text1: "Dashboard Error",
          text2: error.message || "Failed to fetch dashboard",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // --- Render Project item ---
  const renderProject = (item: any) => (
    <View key={item._id} className="bg-white p-4 rounded-xl shadow mb-3">
      <Text className="text-gray-800 font-semibold">{item.company}</Text>
      <Text className="text-gray-600">{item.location || "No location"}</Text>
      <Text className="text-gray-600">{item.typology || "No typology"}</Text>
    </View>
  );

  // --- Render ILR item ---
  const renderILR = (item: any) => (
    <Pressable
      key={item._id}
      onPress={() =>
        router.push({
          pathname: "/ilrActivities",
          params: {
            ilrId: item._id,
            description: item.description,
            targetDate: item.targetDate,
            remarks: item.remarks,
            responsibility: JSON.stringify(item.responsibility || []),
            status: item.status,
            createdBy:
              item.createdBy?.fullName || item.createdBy?.username || "Unknown",
            createdAt: item.createdAt,
            ilrNumber: item.ilrNumber,
          },
        })
      }
      className="bg-white p-4 rounded-xl shadow mb-3"
    >
      <Text className="font-semibold text-gray-800">{item.ilrNumber}</Text>
      <Text className="text-gray-600">{item.description}</Text>
    </Pressable>
  );

  // --- Render Meeting item ---
  const renderMeeting = (item: any) => (
    <Pressable
      key={item._id}
      onPress={() =>
        router.push({
          pathname: "/minuteDetail",
          params: {
            meetingId: item._id,
            minuteId: item.minutes?.[0]?._id || "",
            responsibilityForInfo: item.minutes?.[0]?.responsibility
              ? "false"
              : "true",
            targetDate: item.minutes?.[0]?.targetDate || "",
          },
        })
      }
      className="bg-white p-4 rounded-xl shadow mb-3"
    >
      <Text className="font-semibold text-gray-800">
        Meeting #{item.meetingNumber}
      </Text>
      <Text className="text-gray-600">{item.meetingVenue || "No venue"}</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50 ">
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/projects")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {/* {projectName}  */}
              MY DASHBOARD
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View className="items-center mt-10">
          <ActivityIndicator size="large" />
          <Text className="text-gray-500 mt-2">Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="px-4 pt-4">
          {/* Projects */}
          <Text className="text-lg font-semibold mb-2">My Projects</Text>
          {myProjects.map(renderProject)}

          {/* ILRs */}
          <Text className="text-lg font-semibold mb-2 mt-4">My ILRs</Text>
          {myILRs.map(renderILR)}

          {/* Meetings */}
          <Text className="text-lg font-semibold mb-2 mt-4">My Meetings</Text>
          {myMeetings.map(renderMeeting)}
        </ScrollView>
      )}
    </View>
  );
};

export default Dashboard;
