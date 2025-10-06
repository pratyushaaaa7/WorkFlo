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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";

// --- Convert local asset to base64 ---
const localImageToBase64 = async (image: any) => {
  const asset = Asset.fromModule(image);
  await asset.downloadAsync(); // ensure the asset is available
  const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
};

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

// Returns date in "DD_MMM_YYYY" format, e.g., "06_Oct_2025"
const getFormattedDate = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0"); // 01, 02, ...
  const month = today.toLocaleString("default", { month: "short" }); // Jan, Feb, ...
  const year = today.getFullYear();

  return `${day}_${month}_${year}`;
};

const ReportForm = ({ navigation }: ReportFormProps) => {
  const { user } = useAuth(); // ✅ use the custom hook at the top-level
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  // const [title, setTitle] = useState<string>("");
  const {
    projectName,
    company,
    projectId,
    teamLeaders,
    teamMembers,
    vendors: vendorsParam,
    totalLabor: totalLaborParam,
  } = useLocalSearchParams();
  // Parse string back to array
  // ✅ Ensure we have a single string (not an array)
  const teamLeadersStr = Array.isArray(teamLeaders)
    ? teamLeaders[0]
    : teamLeaders;
  const teamMembersStr = Array.isArray(teamMembers)
    ? teamMembers[0]
    : teamMembers;

  // ✅ Parse safely
  const leaders = JSON.parse(teamLeadersStr || "[]");
  const members = JSON.parse(teamMembersStr || "[]");
  console.log(teamLeaders, teamMembers);

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
  const savePhotos = async (photosToSave: Photo[]) => {
    try {
      await AsyncStorage.setItem("@saved_photos", JSON.stringify(photosToSave));
    } catch (err) {
      console.error("Failed to save photos", err);
    }
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
      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      savePhotos(updatedPhotos); // persist
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
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      savePhotos(updatedPhotos); // persist
    }
  };

  const updateCaption = (id: string, caption: string) => {
    const updatedPhotos = photos.map((p) =>
      p.id === id ? { ...p, caption } : p
    );
    setPhotos(updatedPhotos);
    savePhotos(updatedPhotos); // persist
  };

  const removePhoto = (id: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== id);
    setPhotos(updatedPhotos);
    savePhotos(updatedPhotos); // persist
  };

  React.useEffect(() => {
    const loadSavedPhotos = async () => {
      try {
        const saved = await AsyncStorage.getItem("@saved_photos");
        if (saved) {
          setPhotos(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to load photos", err);
      }
    };
    loadSavedPhotos();
  }, []);

  const handleSubmit = async () => {
    try {
      const createdBy = user?.fullName || "Unknown";

      // --- 1. Determine company logo ---
      let logoImage;
      let companyStr = Array.isArray(company) ? company[0] : company;

      if (typeof companyStr === "string" && companyStr.toLowerCase() === "wp") {
        logoImage = require("../assets/images/logoWP.png");
      } else if (
        typeof companyStr === "string" &&
        companyStr.toLowerCase() === "wal"
      ) {
        logoImage = require("../assets/images/logoWAL.jpg");
      } else {
        logoImage = require("../assets/images/react-logo.png"); // fallback
      }

      // Convert logo to base64
      const logoBase64 = await localImageToBase64(logoImage);

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

      // --- 3. Build HTML for PDF ---
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
          <!-- Page 1: Project Info + Logo -->
<div class="page">
  <div style="text-align:center; margin-bottom: 20px;">
    <img src="${logoBase64}" style="width:150px; height:auto;" />
  </div>
  <p><strong>Project Name:</strong> ${projectName || ""}</p>
  <p><strong>Created By:</strong> ${createdBy}</p>
  <p><strong>Company:</strong> ${company || ""}</p>
  <p><strong>Date:</strong> ${dateStr}</p>
  <p><strong>Time:</strong> ${timeStr}</p>

 <h3 style="margin-top: 20px;">Team Leaders</h3>
<ul>
  ${
    leaders.length > 0
      ? leaders.map((leader: any) => `<li>${leader.fullName}</li>`).join("")
      : "<li>None</li>"
  }
</ul>

<h3 style="margin-top: 20px;">Team Members</h3>
<ul>
  ${
    members.length > 0
      ? members.map((member: any) => `<li>${member.fullName}</li>`).join("")
      : "<li>None</li>"
  }
</ul>
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
                  <div class="caption"  style="
            margin-top: 12px; 
            font-size: 22px; 
            color: #222; 
            font-weight: 500; 
            text-align: center;
          ">${p.caption || ""}</div>
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
      });
      // console.log("PDF saved to:", uri);

      // Create custom file name
      const newFileName = `DPR_${
        projectName || "Project"
      }_${getFormattedDate()}.pdf`;
      const newUri = FileSystem.cacheDirectory + newFileName;

      // Move/rename file
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      console.log("PDF saved with custom name:", newUri);

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      } else {
        Alert.alert("PDF Generated", `Saved at: ${newUri}`);
      }
      // Clear photos and labor data after PDF generation
      await AsyncStorage.removeItem("@saved_photos"); // photos
      await AsyncStorage.removeItem("reportData"); // labor/vendors
      setPhotos([]); // optional: reset state
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
