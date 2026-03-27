import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext"; // adjust path
import api from "@/lib/api";
import { Image } from "expo-image";
import {
  ArrowLeft01Icon,
  SlidersHorizontalIcon,
  BookOpen01Icon,
  Cancel01Icon,
  Delete03Icon,
  Download01Icon,
  Note01Icon,
  Pdf01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

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
  const isDarkMode = useColorScheme() === "dark";

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
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}>
      <View className={`pt-16 pb-4 px-4 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text
            className={`text-[20px] font-dmSemiBold ml-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Project Stage
          </Text>
        </TouchableOpacity>

        {stages.length > 0 && !loading && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/manageProjectStages",
                params: { projectId, projectName, company },
              })
            }
          >
            <HugeiconsIcon
              icon={SlidersHorizontalIcon}
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          { padding: 12, paddingBottom: 40 },
          stages.length === 0 && !loading && { flex: 1 },
        ]}
      >
        {/* Manage Stages button removed from here as it's now in the header icon */}

        {loading ? (
          <View className="flex-1 justify-center items-center mt-12">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-gray-500 mt-2">Loading stages...</Text>
          </View>
        ) : stages.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Image
              source={
                isDarkMode
                  ? require("../assets/images/darkStages.svg")
                  : require("../assets/images/lightStages.svg")
              }
              style={{ width: 140, height: 140 }}
              contentFit="contain"
            />
            <Text
              className={`text-xl font-dmBold mt-6 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              No projects Stages
            </Text>
            <Text
              className={`text-[14px] font-poppins mt-2 text-center ${
                isDarkMode ? "text-[#919191]" : "text-[#6B6B6B]"
              }`}
            >
              Use{" "}
              <Text className="font-poppinsMedium text-black dark:text-white">
                'Manage stages'
              </Text>{" "}
              to set up{"\n"}your project timeline
            </Text>
          </View>
        ) : (
          stages.map((stage, idx) => {
            return (
              <TouchableOpacity
                key={stage._id || idx}
                activeOpacity={0.7}
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
                className={`mb-3 p-4 rounded-[16px] flex-row justify-between items-center ${
                  isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
                }`}
              >
                <View className="flex-1 mr-4">
                  <Text
                    className={`text-[17px] font-dmMedium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {stage.title}
                  </Text>
                  <Text
                    className={`text-[13px] font-poppins mt-1 ${
                      isDarkMode ? "text-[#919191]" : "text-[#6B6B6B]"
                    }`}
                  >
                    Tap to add revision
                  </Text>
                </View>

                <View className="rounded-[8px] overflow-hidden">
                  <LinearGradient
                    colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 py-2"
                  >
                    <Text className="text-white font-poppins text-[13px]">
                      Add
                    </Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {stages.length === 0 && !loading && (
        <View
          className={`px-4 pb-8 pt-4 ${
            isDarkMode ? "bg-black" : "bg-[#F3F4F6]"
          }`}
        >
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/manageProjectStages",
                params: { projectId, projectName, company },
              })
            }
            className="rounded-xl shadow-md w-full overflow-hidden"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center py-4"
            >
              <MaterialCommunityIcons name="tune" size={18} color="#fff" />
              <Text className="text-white font-semibold text-[15px] ml-2">
                Manage stages
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProjectStage;
