import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext"; // adjust path
import api from "@/lib/api";

type StageStatus = "not_started" | "in_progress" | "paused" | "completed";

type StageActivity = {
  status: StageStatus;
  savedAt: string;
};

type ProjectStageType = {
  _id: string;
  title: string;
  status: StageStatus;
  latestRemark?: string;
  history?: StageActivity[];
};

const ProjectStage: React.FC = () => {
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams<{
    projectId?: string;
    projectName?: string;
    company?: string;
  }>();

  const statusColor: Record<string, string> = {
    not_started: "bg-gray-400",
    in_progress: "bg-blue-500",
    paused: "bg-yellow-400",
    completed: "bg-green-500",
  };

  const [stages, setStages] = useState<ProjectStageType[]>([]);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  useEffect(() => {
    if (!projectId || !token) return;

    const fetchStages = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/stages/${projectId}/stages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedStages = res.data.stages || [];
        console.log("API stages:", fetchedStages); // ✅ correct

        setStages(fetchedStages);
      } catch (err) {
        console.error("Error fetching project stages:", err);
        setStages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [projectId, token]);



  return (
    <View className="flex-1 bg-gray-100">
      <LinearGradient colors={["#4F46E5", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {projectName || "Project"} Stages
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/manageProjectStages",
              params: { projectId, projectName, company },
            })
          }
          className="flex-row items-center justify-center bg-indigo-600 px-4 py-3 rounded-2xl shadow-md mb-4"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="tune" size={22} color="#fff" />
          <Text className="text-white font-semibold text-base ml-2">
            Manage Stages
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View className="flex-1 justify-center items-center mt-12">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-gray-500 mt-2">Loading stages...</Text>
          </View>
        ) : stages.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-12">
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={60}
              color="#cbd5e1"
            />
            <Text className="text-gray-400 text-lg mt-4">
              No stages added yet
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Click "Manage Stages" to add stages
            </Text>
          </View>
        ) : (
          stages.map((stage, idx) => {
            return (
              <View
                key={stage._id || idx}
                className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-gray-900 font-semibold">
                    {stage.title}
                  </Text>
                  <View className="flex-row mt-1">
                    <View
                      className={`w-3 h-3 rounded-full mr-1 ${
                        statusColor[stage.status] || "bg-gray-400"
                      }`}
                    />
                    {stage.latestRemark && (
                      <Text className="text-gray-400 text-xs ml-1">
                        {stage.latestRemark}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/projectStageLog",
                      params: {
                        stageId: stage._id,
                        projectId,
                        stage: stage.title,
                      },
                    })
                  }
                  className="bg-indigo-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-medium">Add/Update</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default ProjectStage;
