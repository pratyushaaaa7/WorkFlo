import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  // Switch,
  // Platform,
  // Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import * as XLSX from "xlsx";
import { LinearGradient } from "expo-linear-gradient";
// import Toast from "react-native-toast-message";
import Activity from "@/types/ILRActivity";
// import ExcelJS from "exceljs";

import { exportILRsToExcel } from "../utils/ilrExcel"; // adjust path

type ILR = {
  _id: string;
  ilrNumber: number; // 👈 add here
  description: string;
  targetDate: string;
  remarks: string;
  activities?: Activity[]; // 👈 add this
  responsibility: {
    _id: string;
    individualName: string;
    designation: string;
  }[];

  status: "Open" | "Closed";
  createdBy: { _id: string; username: string }; // 👈 add this
  createdAt: string; // 👈 add this
};

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [ilrs, setIlrs] = useState<ILR[]>([]);
  const [loading, setLoading] = useState(false);

  // const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<"All" | "Open" | "Closed">("All"); // 👈 filter state

  // const toggleFilter = (selected: "Open" | "Closed") => {
  //   setFilter(selected);
  // };

  useEffect(() => {
    const fetchILRs = async () => {
      if (!token || !projectId) return;
      try {
        setLoading(true);
        const res = await api.get(`/ilrs/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIlrs(res.data);
        // console.log("Fetched ILRs:", res.data);
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchILRs();
  }, [token, projectId]);
  // console.log("ILRs State:", ilrs);


 const handleDownloadExcel = () => {
    exportILRsToExcel(parsedILRs, projectName, auth.user?.username); // 👈 one-line call
  };

  const renderCard = ({ item }: { item: ILR }) => {
    const statusClasses = item.status === "Open" ? "bg-red-500" : "bg-gray-600";

    return (
      <TouchableOpacity
        className="bg-white rounded-xl px-4 py-3 mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          const params = {
            ilrId: item._id,
            projectName,
            description: item.description,
            targetDate: item.targetDate,
            remarks: item.remarks,
            responsibility: JSON.stringify(item.responsibility),
            status: item.status,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
            ilrNumber: item.ilrNumber,
          };
          router.push({ pathname: `/ilrActivities`, params });
        }}
      >
        {/* Row: Description + Status */}
        <View className="flex-row justify-between items-start">
          {/* Issue description */}
          <Text
            className="font-medium text-gray-900 text-base flex-1 mr-3"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.ilrNumber}. {item.description}
          </Text>

          {/* Status pill */}
          <View className={`px-3 py-1 rounded-full ${statusClasses}`}>
            <Text className="text-white text-xs font-semibold">
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 👇 filter ILRs before rendering
  const filteredILRs =
    filter === "All" ? ilrs : ilrs.filter((ilr) => ilr.status === filter);

  const parsedILRs = filteredILRs.map((ilr) => ({
    ...ilr,
    activities:
      typeof ilr.activities === "string"
        ? JSON.parse(ilr.activities)
        : ilr.activities || [],
  }));

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            {" "}
            {projectName} ILRs
          </Text>
        </TouchableOpacity>

        {/* Download Icon */}
        <TouchableOpacity
          onPress={handleDownloadExcel}
          className="px-2 mr-2 rounded-full bg-white/30 active:bg-white/50"
        >
          <Feather name="download" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Buttons */}
      <View className="flex-row justify-center gap-3 mt-3">
        {["All", "Open", "Closed"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as "All" | "Open" | "Closed")}
            className={`px-4 py-2 rounded-full ${
              filter === f ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === f ? "text-white" : "text-gray-700"
              }`}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="px-4 pt-5 flex-1">
        {/* <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          {projectName}&#39;s Issue Log Register
        </Text> */}

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : filteredILRs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No ILRs found.
          </Text>
        ) : (
          <FlatList
            data={filteredILRs}
            keyExtractor={(item) => item._id}
            renderItem={renderCard}
          />
        )}
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/ilrForm?projectId=${projectId}&projectName=${projectName}`
          )
        }
        className="bg-indigo-600"
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,

          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ILRs;
