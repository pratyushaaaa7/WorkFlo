import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

type Project = {
  _id: string;
  projectName: string;
  company: string;
};

const ProjectList = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const { company } = useLocalSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !company) return;

    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
          params: { company },
        });
        setProjects(res.data.projects);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token, company]);

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      // onPress={() => router.push({ pathname: "/projectMain/detail", params: { projectId: item._id } })}
    >
      <Text className="text-lg font-semibold">{item.projectName}</Text>
      <Text className="text-gray-500">{item.company}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Back button container with shadow */}
      <View
        className="bg-white  pt-16 pb-6 px-4"
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
          onPress={() => router.push("/masterProjectList")}
          className="flex-row items-center "
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <View className="flex-1 bg-gray-50">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : projects.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-gray-500 text-lg">
              No projects found for {company}
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
          />
        )}
      </View>
    </View>
  );
};

export default ProjectList;
