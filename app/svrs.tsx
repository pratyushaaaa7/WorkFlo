import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import * as DocumentPicker from "expo-document-picker";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const SVRs = () => {
  const router = useRouter();
  const { projectId, projectName, company, teamLeaders, teamMembers } =
    useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  type DprItem = {
    _id: string;
    fileName: string;
    url: string;
    // add other fields if needed
  };

  // const [uploading, setUploading] = useState(false);
  const [dprs, setDprs] = useState<DprItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch DPRs for this project
  const fetchDPRs = async () => {
    try {
      const response = await api.get(`/dpr?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDprs(response.data || []);
    } catch (err) {
      console.error("Fetch DPRs failed:", err);
      Alert.alert("Error", "Failed to fetch DPRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDPRs();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {/* {projectName}  */}
              SVRs
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* DPR List */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : dprs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No SVRs found.
          </Text>
        ) : (
          <Text className="text-center text-gray-500 mt-10">
            No DPRs found. tralalalalala
          </Text>
        )}

        {/* Upload Button */}
        {/* <TouchableOpacity
          onPress={handleUploadDPR}
          disabled={uploading}
          className="bg-indigo-600 px-6 py-3 rounded-full mt-6 items-center"
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Upload DPR (PDF)</Text>
          )}
        </TouchableOpacity> */}
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 44,
          right: 20,
          // backgroundColor: "#6366F1",
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default SVRs;
