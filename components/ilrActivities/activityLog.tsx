import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useILR } from "../../context/ILRContext";

const ActivityLog = () => {
  const { activities, activitiesLoading } = useILR();

  return (
    <>
      <Text className="font-semibold text-gray-800 text-base mt-6 mb-2">Activity Log</Text>
      {activitiesLoading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : activities.length === 0 ? (
        <Text className="text-gray-500">No activities yet.</Text>
      ) : (
        activities.map((act) => (
          <View key={act._id} className="bg-white rounded-xl p-3 mb-2 shadow">
            <Text className="text-sm text-gray-800 font-medium">{act.title}</Text>
            {act.oldValue !== undefined && act.newValue !== undefined && (
              <Text className="text-xs text-gray-500 mt-1">
                From: <Text>{act.oldValue}</Text> → To: <Text className="font-medium">{act.newValue}</Text>
              </Text>
            )}
            <Text className="text-xs text-gray-500 mt-1">
              By {act.createdBy} • {new Date(act.createdAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </>
  );
};

export default ActivityLog;
