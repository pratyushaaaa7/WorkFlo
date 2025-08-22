import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import Toast from "react-native-toast-message";

type ILR = {
  _id: string;
  description: string;
  targetDate: string;
  remarks: string;
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

  const handleDownloadExcel = async () => {
    try {
      if (!ilrs || ilrs.length === 0) {
        alert("No ILRs available to download");
        return;
      }

      // Prepare data
      const worksheetData = ilrs.map((ilr, index) => ({
        "S. No": index + 1,
        "Issue Description": ilr.description,
        "Target Date": new Date(ilr.targetDate).toLocaleDateString(),
        Status: ilr.status,
        Responsibility: ilr.responsibility
          .map((r) => `${r.individualName} (${r.designation})`)
          .join(", "),
        Remarks: ilr.remarks || "No remarks",
        "Added By": ilr.createdBy?.username || "N/A",
        "Created At": new Date(ilr.createdAt).toLocaleDateString(),
      }));

      // Create worksheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ILRs");

      // Convert to binary
      const excelBuffer = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      // Save to device
      const filename = FileSystem.documentDirectory + "ILRs.xlsx";
      await FileSystem.writeAsStringAsync(filename, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share
      await Sharing.shareAsync(filename, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share ILRs Excel",
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (err) {
      console.error("Error exporting Excel:", err);
      alert("Failed to export Excel");
    }
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
            {item.description}
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="bg-white pt-16 pb-5 px-4 flex-row items-center justify-between"
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
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-4">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownloadExcel} // 👈 attach function
          className="px-3 py-1 rounded hover:bg-brown-100"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          // activeOpacity={0.7}
        >
          <Feather name="download" size={22} color="black" />
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-5 flex-1">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          {projectName}&#39;s Issue Log Register
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : ilrs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No ILRs found for this project.
          </Text>
        ) : (
          <FlatList
            data={ilrs}
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
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,
          backgroundColor: "#2563EB",
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
