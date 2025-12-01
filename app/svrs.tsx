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

type SVRItem = {
  _id: string;
  fileName: string;
  url: string;
  svrNumber?: number;
  uploadedBy?: { username?: string };
};

const SVRs = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Receiving params from previous screen
  const { projectId, projectName, company, teamLeaders, teamMembers } =
    useLocalSearchParams();

  const auth = useContext(AuthContext);
  const token = auth?.token;



  const [svrs, setSvrs] = useState<SVRItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch DPR/SVR list
  const fetchSVRs = async () => {
    try {
      const response = await api.get(`/svr?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSvrs(response.data || []);
    } catch (err) {
      console.error("Fetch DPRs failed:", err);
      Alert.alert("Error", "Failed to fetch SVRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSVRs();
  }, []);

  const openTypeSelector = () => {
    setModalVisible(true);
  };

  const goAndClose = (type: any) => {
    setModalVisible(false);
    goToForm(type);
  };

  const goToForm = (type: any) => {
    router.push(
      `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}&mode=${type}`
    );
  };

  // ✅ Open PDF in browser
  const openPDF = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open PDF link")
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
      {/* SVR List */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : svrs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No SVRs found.
          </Text>
        ) : (
          <FlatList
            data={svrs}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openPDF(item.url)}
                className="bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm"
              >
                <View>
                  <Text className="text-gray-800 font-medium">
                    {item.fileName}
                  </Text>
                  {item.svrNumber && (
                    <Text className="text-gray-500 text-sm">
                      SVR #{item.svrNumber} |{" "}
                      {item.uploadedBy?.username || "Unknown"}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#6366F1"
                />
              </TouchableOpacity>
            )}
          />
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
