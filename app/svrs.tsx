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
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";


const SVRs = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Receiving params from previous screen
  const { projectId, projectName, company, teamLeaders, teamMembers } =
    useLocalSearchParams();

  const auth = useContext(AuthContext);
  const token = auth?.token;

  type DprItem = {
    _id: string;
    fileName: string;
    url: string;
  };

  const [dprs, setDprs] = useState<DprItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch DPR/SVR list
  const fetchDPRs = async () => {
    try {
      const response = await api.get(`/dpr?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDprs(response.data || []);
    } catch (err) {
      console.error("Fetch DPRs failed:", err);
      Alert.alert("Error", "Failed to fetch SVRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDPRs();
  }, []);

  const openTypeSelector = () => {
    setModalVisible(true);
  };

  const goAndClose = (type) => {
    setModalVisible(false);
    goToForm(type);
  };

  const goToForm = (type) => {
    router.push(
      `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}&mode=${type}`
    );
  };

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
            <Text className="text-xl font-semibold text-white ml-4">SVRs</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
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
      </View>

      {/* Type Selection Modal */}
      {modalVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="absolute inset-0 bg-black/40 flex items-center justify-center px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="w-full bg-white rounded-3xl p-6 shadow-2xl max-w-sm relative"
          >
            {/* Close (X) Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="absolute top-4 right-4 p-1"
            >
              <Ionicons name="close" size={26} color="#555" />
            </TouchableOpacity>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-800 text-center mb-6 mt-2">
              Select Report Type
            </Text>

            {/* Buttons Container */}
            <View className="gap-4">
              {/* SVR Button */}
              <TouchableOpacity
                onPress={() => goAndClose("svr")}
                className="flex-row items-center bg-indigo-600 py-4 px-4 rounded-2xl shadow-sm"
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="white"
                />
                <Text className="text-white text-lg font-semibold ml-3">
                  SVR
                </Text>
              </TouchableOpacity>

              {/* Case Study Button */}
              <TouchableOpacity
                onPress={() => goAndClose("case-study")}
                className="flex-row items-center bg-purple-600 py-4 px-4 rounded-2xl shadow-sm"
              >
                <Ionicons name="book-outline" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-3">
                  Case Study
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Floating + Button */}
      <TouchableOpacity
        // onPress={() =>
        //   router.push(
        //     `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}`
        //   )
        // }
        onPress={openTypeSelector}
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 44,
          right: 20,
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
