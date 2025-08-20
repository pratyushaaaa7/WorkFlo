import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Responsibility = { _id: string; individualName: string; designation: string };

const IlrActivities = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get ILR data from params
  const ilr = {
    _id: params.ilrId as string,
    description: params.description as string,
    targetDate: params.targetDate as string,
    remarks: params.remarks as string,
    responsibility: JSON.parse(params.responsibility as string) as Responsibility[],
    status: params.status as "Open" | "Closed",
  };

  // Activity fetching state
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // Example: fetch activities later using ilr._id
  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        // TODO: fetch activities from backend using ilr._id
        // const res = await api.get(`/ilrs/${ilr._id}/activities`);
        // setActivities(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [ilr._id]);

  const statusClasses = ilr.status === "Open" ? "bg-blue-600" : "bg-green-500";

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-4">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
      

        {/* ILR Details from params */}
        <View className="bg-white rounded-xl p-4 shadow-md mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-semibold text-gray-900 text-base flex-1 mr-2">{ilr.description}</Text>
            <View className={`px-3 py-1 rounded-full ${statusClasses}`}>
              <Text className="text-white text-xs font-semibold">{ilr.status}</Text>
            </View>
          </View>

          <Text className="text-gray-500 text-sm mt-2">
            Target Date: {new Date(ilr.targetDate).toLocaleDateString()}
          </Text>

          <Text className="text-gray-500 text-sm mt-1">
            Responsibility: {ilr.responsibility.map(u => `${u.individualName} (${u.designation})`).join(", ")}
          </Text>

          <Text className={`text-gray-500 text-sm mt-1 ${ilr.remarks ? "" : "italic"}`}>
            Remarks: {ilr.remarks ? ilr.remarks : "No remarks"}
          </Text>
        </View>

        {/* Future activities */}
        {activitiesLoading ? (
          <View className="flex-row justify-center items-center py-10">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <View>
            {/* Map activities here when fetched */}
            {activities.map(act => (
              <Text key={act._id}>{act.title}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default IlrActivities;
