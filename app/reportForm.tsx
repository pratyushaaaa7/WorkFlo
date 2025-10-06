import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useAuth } from "./../context/AuthContext";

interface Photo {
  id: string;
  uri: string;
  caption: string;
}

interface Vendor {
  name: string;
  laborCount: number;
}

interface ReportFormProps {
  navigation: any; // replace with proper type if using react-navigation
  route?: any;
}

const { width } = Dimensions.get("window");

const ReportForm = ({ navigation }: ReportFormProps) => {
  const { user } = useAuth(); // ✅ use the custom hook at the top-level
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  // const [title, setTitle] = useState<string>("");
  const {
    projectName,
    company,
    projectId,
    vendors: vendorsParam,
    totalLabor: totalLaborParam,
  } = useLocalSearchParams();
  // Parse string back to array

  const vendors: Vendor[] = vendorsParam
    ? JSON.parse(vendorsParam as string)
    : [];
  const totalLabor = totalLaborParam ? parseInt(totalLaborParam as string) : 0;
  // console.log(totalLabor);

  const uriToBase64 = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  };

  // Pick photo from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true, // ✅ Enable multi-select
      // allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Map all selected images
      const newPhotos: Photo[] = result.assets.map((asset) => ({
        id: uuid.v4().toString(),
        uri: asset.uri,
        caption: "",
      }));

      setPhotos([...photos, ...newPhotos]); // append all selected images
    }
  };

  // Capture photo from camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhoto: Photo = {
        id: uuid.v4().toString(),
        uri: result.assets[0].uri,
        caption: "",
      };
      setPhotos([...photos, newPhoto]);
    }
  };

  const updateCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const createdBy = user?.fullName || "Unknown";

      // Convert photos to base64
      const photosWithBase64 = await Promise.all(
        photos.map(async (p) => ({
          ...p,
          base64: await uriToBase64(p.uri),
        }))
      );

      const today = new Date();
      const dateStr = today.toLocaleDateString();
      const timeStr = today.toLocaleTimeString();

      // Build HTML for PDF
      const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .page { page-break-after: always; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #999; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .photo { text-align: center; page-break-after: always; }
            .photo img { max-width: 100%; max-height: 90vh; border-radius: 8px; }
            .caption { margin-top: 8px; font-size: 14px; color: #333; }
          </style>
        </head>
        <body>
          <!-- Page 1: Project Info -->
          <div class="page">
   
            <p><strong>Project Name:</strong> ${projectName || ""}</p>
            <p><strong>Created By:</strong> ${createdBy}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
          </div>

         <!-- Page 2: Labor Report -->
<div class="page">
  <h2>Labor Report</h2>
  <table>
    <tr>
      <th>S.No</th>
      <th>Vendor Name</th>
      <th>Number of Labors</th>
    </tr>
    ${vendors
      .map(
        (v, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${v.name}</td>
        <td>${v.laborCount}</td>
      </tr>
    `
      )
      .join("")}
    <tr>
      <td colspan="2" style="text-align:right;font-weight:bold">Total Labors</td>
      <td><strong>${totalLabor}</strong></td>
    </tr>
  </table>
</div>


          <!-- Subsequent Pages: Photos -->
          ${photosWithBase64
            .map(
              (p) => `
            <div class="photo">
              <img src="${p.base64}" />
              <div class="caption">${p.caption || ""}</div>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        fileName: `DPR_${projectName || "Project"}_${Date.now()}.pdf`,
      });
      console.log("PDF saved to:", uri);

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", `Saved at: ${uri}`);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-bold text-white ml-4">
              Photo Report
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="p-4 flex-1">
        {/* Report Title */}
        {/* <Text className="text-lg font-semibold mb-2">Report Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter report title"
          placeholderTextColor={"#999"}
          className="border rounded-lg px-3 py-2 mb-4 bg-white"
        /> */}

        {/* Photo Buttons */}
        <View className="flex-row justify-around mb-6">
          <TouchableOpacity
            onPress={takePhoto}
            className="bg-indigo-500 px-6 py-3 rounded-xl flex-row items-center shadow"
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text className="text-white ml-2 font-semibold">Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="bg-green-500 px-6 py-3 rounded-xl flex-row items-center shadow"
          >
            <Ionicons name="images" size={20} color="#fff" />
            <Text className="text-white ml-2 font-semibold">Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Photos */}
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl shadow p-3 mb-4">
              <Image
                source={{ uri: item.uri }}
                className="w-full h-52 rounded-lg mb-2"
                resizeMode="cover"
              />
              <TextInput
                placeholder="Add caption"
                placeholderTextColor={"#999"}
                value={item.caption}
                onChangeText={(text) => updateCaption(item.id, text)}
                className="border rounded-lg px-3 py-2 bg-gray-50 mb-2"
              />
              <TouchableOpacity
                onPress={() => removePhoto(item.id)}
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-red-500 mt-6 p-4 rounded-2xl flex-row justify-center items-center shadow"
        >
          <MaterialCommunityIcons
            name="file-image-outline"
            size={22}
            color="#fff"
          />
          <Text className="text-white font-semibold ml-2">Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReportForm;
