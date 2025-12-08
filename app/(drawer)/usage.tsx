import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/lib/api";

export default function LeaderboardScreen() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userLeaderboard, setUserLeaderboard] = useState([]);
  const [projectLeaderboard, setProjectLeaderboard] = useState([]);

  // -------------------------------
  // 🔥 Fetch leaderboard data
  // -------------------------------
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      console.log("🔄 Fetching leaderboard...");

      const [usersRes, projectsRes] = await Promise.all([
        api.get("/usage/users/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // api.get("/usage/projects/most-active", {
        //   headers: { Authorization: `Bearer ${token}` },
        // }),
      ]);

      console.log("🟦 USERS LEADERBOARD RAW DATA:");
      console.log(JSON.stringify(usersRes.data, null, 2));

      // console.log("🟩 PROJECT LEADERBOARD RAW DATA:");
      // console.log(JSON.stringify(projectsRes.data, null, 2));

      setUserLeaderboard(usersRes.data);
      // setProjectLeaderboard(projectsRes.data);
    } catch (err) {
      console.log("❌ Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // -------------------------------------
  // UI Components
  // -------------------------------------

  const SectionTitle = ({ title }) => (
    <Text className="text-xl font-bold text-gray-800 mt-4 mb-2 px-4">
      {title}
    </Text>
  );

  const UserCard = ({ item, index }) => {
  const lastUsedFormatted = item.lastUsed
  ? new Date(item.lastUsed).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  : "No activity";

    return (
      <View className="bg-white mx-4 px-4 py-3 rounded-xl mb-3 shadow">
        <View className="flex-row items-center">
          <Text className="text-xs font-bold text-indigo-500 ">
            #{index + 1}
          </Text>

          <MaterialCommunityIcons
            name="account-circle"
            size={40}
            color="#6366F1"
          />

          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {item._id?.fullName}
            </Text>
            <Text className="text-gray-500 capitalize">{item._id?.role}</Text>

            {/* 🔥 Show Last Used */}
            <Text className="text-gray-400 text-xs mt-1">
              Last Used: {lastUsedFormatted}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-xl font-bold text-indigo-600">
              {item.apiCount}
            </Text>
            <Text className="text-gray-400 text-sm">requests</Text>
          </View>
        </View>
      </View>
    );
  };

  // const ProjectCard = ({ item, index }) => (
  //   <View className="bg-white mx-4 px-4 py-3 rounded-xl mb-3 shadow">
  //     <View className="flex-row items-center">
  //       <Text className="text-2xl font-bold text-green-600 w-10">
  //         #{index + 1}
  //       </Text>

  //       <MaterialCommunityIcons name="file-tree" size={40} color="#10B981" />

  //       <View className="ml-3 flex-1">
  //         <Text className="text-lg font-semibold text-gray-800">
  //           {item._id?.projectName}
  //         </Text>
  //       </View>

  //       <View className="items-end">
  //         <Text className="text-xl font-bold text-green-600">
  //           {item.activityCount}
  //         </Text>
  //         <Text className="text-gray-400 text-sm">requests</Text>
  //       </View>
  //     </View>
  //   </View>
  // );

  // -------------------------------------
  // MAIN SCREEN UI
  // -------------------------------------
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-gray-600">Loading Leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* USER LEADERBOARD */}
      <SectionTitle title="Top Active Users" />

      {userLeaderboard.length === 0 ? (
        <Text className="text-gray-500 text-center mt-3">
          No usage data available.
        </Text>
      ) : (
        userLeaderboard.map((item, index) => (
          <UserCard key={index} item={item} index={index} />
        ))
      )}

      {/* PROJECT LEADERBOARD */}
      {/* <SectionTitle title="Most Active Projects" /> */}

      {/* {projectLeaderboard.length === 0 ? (
        <Text className="text-gray-500 text-center mt-3">
          No project activity found.
        </Text>
      ) : (
        projectLeaderboard.map((item, index) => (
          <ProjectCard key={index} item={item} index={index} />
        ))
      )} */}
    </ScrollView>
  );
}
