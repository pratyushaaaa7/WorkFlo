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
// import * as DocumentPicker from "expo-document-picker";
import { AuthContext } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";

const DPRs = () => {
  const router = useRouter();
  const { projectId, projectName, company, teamLeaders, teamMembers } =
    useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  type DprItem = {
    _id: string;
    fileName: string;
    url: string;
    uploadedBy?: {
      fullName: string;
    };
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

  // const handleDeleteDPR = async (dprId: string) => {
  //   Alert.alert("Delete DPR", "Are you sure you want to delete this DPR?", [
  //     { text: "Cancel", style: "cancel" },
  //     {
  //       text: "Delete",
  //       style: "destructive",
  //       onPress: async () => {
  //         try {
  //           await api.delete(`/dpr/${dprId}`, {
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //             },
  //           });

  //           Alert.alert("Success", "DPR deleted successfully");

  //           // Refresh list
  //           fetchDPRs();
  //         } catch (error) {
  //           console.error("Delete DPR failed:", error);
  //           Alert.alert("Error", "Failed to delete DPR");
  //         }
  //       },
  //     },
  //   ]);
  // };

  // ✅ Upload a new DPR
  // const handleUploadDPR = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: "application/pdf",
  //     });

  //     if (result.canceled) return;
  //     const file = result.assets[0];

  //     setUploading(true);

  //     const formData = new FormData();
  //     formData.append("file", {
  //       uri: file.uri,
  //       name: file.name,
  //       type: "application/pdf",
  //     });
  //     formData.append("projectId", projectId);

  //     const response = await api.post("/dpr", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (response.data.success) {
  //       Alert.alert("Success", "DPR uploaded successfully");
  //       fetchDPRs(); // refresh list
  //     } else {
  //       Alert.alert("Error", "Upload failed");
  //     }
  //   } catch (err) {
  //     console.error("Upload failed:", err);
  //     Alert.alert("Error", "Failed to upload DPR");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  // ✅ Open PDF in browser

  const openPDF = (url: any) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open PDF link")
    );
  };

  const downloadDPR = async (url: string, fileName: string) => {
    try {
      const downloadUri = FileSystem.documentDirectory + fileName;

      const { uri } = await FileSystem.downloadAsync(url, downloadUri);

      // Open share sheet (Save to Files / Drive / Downloads)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", "File downloaded successfully");
      }
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Error", "Failed to download file");
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
            onPress={() =>
              router.push(
                `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`
              )
            }
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {/* {projectName}  */}
              DPRs
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
            No DPRs found.
          </Text>
        ) : (
          <FlatList
            data={dprs}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openPDF(item.url)}
                className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
              >
                {/* Left: File Info */}
                <View className="flex-1 pr-3">
                  <Text
                    className="text-gray-900 font-semibold text-base"
                    numberOfLines={1}
                  >
                    {item.fileName}
                  </Text>

                  <Text className="text-gray-500 text-xs mt-1">
                    Uploaded by: {item.uploadedBy?.fullName || "Unknown"}
                  </Text>
                </View>

                {/* Right: Download Button */}
                <TouchableOpacity
                  onPress={() => downloadDPR(item.url, item.fileName)}
                  className="bg-green-50 p-3 rounded-xl ml-3"
                >
                  <Ionicons name="download-outline" size={22} color="#16A34A" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
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
            `/dprLaborForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}`
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

export default DPRs;
