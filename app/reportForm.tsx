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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import api from "../lib/api";
import * as FileSystem from "expo-file-system";
import { useAuth } from "./../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";

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
  expertise?: string;
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
  const { user, token } = useAuth(); // ✅ use the custom hook at the top-level
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
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
  console.log(projectId, projectName);
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
  // console.log(teamLeaders, teamMembers);

  const vendors: Vendor[] = vendorsParam
    ? JSON.parse(vendorsParam as string)
    : [];
  // console.log(vendors);
  const totalLabor = totalLaborParam ? parseInt(totalLaborParam as string) : 0;
  // console.log(totalLabor);

  const STORAGE_KEY = `@saved_photos_${projectId || "default"}`;

  const uriToBase64 = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  };
  const savePhotos = async (photosToSave: Photo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(photosToSave));
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
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
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
      setUploading(true); // start loader
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
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        position: relative;
      }
      .page {
        page-break-after: always;
        position: relative;
        padding: 120px 20px 40px 20px; /* reduced left/right margins */
        box-sizing: border-box;
        height: 100vh;
      }

      /* Fixed top-left header (project info) for subsequent pages only */
      .header-left {
        position: fixed;
        top: 20px;
        left: 20px;
        font-size: 16px; /* increased font size */
        font-weight: bold;
        color: #000; /* black */
        line-height: 1.5;
        background: white;
        padding: 8px 12px;
      }

      /* Fixed top-right logo */
      .header-right {
        position: fixed;
        top: 20px;
        right: 20px;
      }
      .header-right img {
        width: 180px;
        height: auto;
      }

      /* Table styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #999;
        padding: 8px;
        text-align: left;
        font-size: 14px;
      }
      th {
        background-color: #f0f0f0;
      }

      /* Photo page layout */
      .photo {
        display: flex;
        flex-direction: column;
    align-items: flex-start; /* <-- changed from center to flex-start */
        justify-content: center;
        height: 100%;
      }
      .photo img {
        max-height: 66vh; /* 2/3 page height */
        max-width: 90%;
        object-fit: contain;
        border-radius: 8px;
      }

      /* Caption styling */
      .caption {
        margin-top: 16px;
        font-size: 20px;
        color: #222;
        font-weight: 500;
     
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    </style>
  </head>
  <body>

    <!-- PAGE 1: Project Info -->
    <div class="page">
      <div class="header-right">
        <img src="${logoBase64}" />
      </div>

      <h2>Project Information</h2>
      <p><strong>Project Name:</strong> ${projectName || ""}</p>
      <p><strong>Created By:</strong> ${createdBy}</p>
      <p><strong>Company:</strong> ${company || ""}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Time:</strong> ${timeStr}</p>

      <h3 style="margin-top: 20px;">Team Leaders</h3>
      <ul>
        ${
          leaders.length > 0
            ? leaders.map((l: any) => `<li>${l.fullName}</li>`).join("")
            : "<li>None</li>"
        }
      </ul>

      <h3 style="margin-top: 20px;">Team Members</h3>
      <ul>
        ${
          members.length > 0
            ? members.map((m: any) => `<li>${m.fullName}</li>`).join("")
            : "<li>None</li>"
        }
      </ul>
    </div>

    <!-- CONDITIONAL LABOR REPORT PAGE -->
    ${
      vendors.length > 0
        ? `
      <div class="page">
        <div class="header-left">
          <div><strong>Project:</strong> ${projectName || ""}</div>
          <div><strong>Created By:</strong> ${createdBy || ""}</div>
        </div>
        <div class="header-right">
          <img src="${logoBase64}" />
        </div>

        <h2 style="margin-top: 80px;">Labor Report</h2>
        <table>
          <tr>
            <th>S.No</th>
            <th>Vendor Name</th>
            <th>Expertise</th>
            <th>Number of Labors</th>
          </tr>
          ${vendors
            .map(
              (v, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${v.name || "-"}</td>
                <td>${v.expertise || "-"}</td>
                <td>${v.laborCount || 0}</td>
              </tr>
            `
            )
            .join("")}
          <tr>
            <td colspan="3" style="text-align:right;font-weight:bold;">Total Labors</td>
            <td><strong>${totalLabor}</strong></td>
          </tr>
        </table>
      </div>
      `
        : ""
    }

  <!-- PHOTO PAGES -->
${photosWithBase64
  .map(
    (p) => `
     <div class="page photo">
  <div class="header-left">
    <div><strong>Project:</strong> ${projectName || ""}</div>
    <div><strong>Created By:</strong> ${createdBy || ""}</div>
  </div>
  <div class="header-right">
    <img src="${logoBase64}" />
  </div>

  <!-- Image container -->
  <div style="
    width: 94%;
    height: 66vh;          /* 2/3 of viewport height */
    border: 2px solid #000;
    border-radius: 8px;
    margin: 20px auto 0 auto; /* center container horizontally */
    padding: 6px;
    display: flex;
    justify-content: flex-start; /* LEFT align the image */
    align-items: flex-start;     /* align top */
    overflow: hidden;
  ">
    <img src="${p.base64}" style="
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      display: block;
    " />
  </div>

  <!-- Caption below image -->
  <div class="caption" style="text-align: left; margin-top: 12px;">
    ${p.caption?.trimStart() || ""}
  </div>
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

      // // Share PDF
      // if (await Sharing.isAvailableAsync()) {
      //   await Sharing.shareAsync(newUri);
      // } else {
      //   Alert.alert("PDF Generated", `Saved at: ${newUri}`);
      // }

      // --- Auto Upload ---
      const formData = new FormData();
      formData.append("file", {
        uri: newUri,
        name: newFileName,
        type: "application/pdf",
      });
      formData.append("projectId", projectId);
      formData.append("projectName", projectName);


      const response = await api.post("/dpr", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "DPR uploaded successfully",
          position: "bottom",
        });
        // Navigate after 2 seconds so the user sees the toast
        setTimeout(() => {
          router.push({
            pathname: "/dprs", // the page you want to navigate to
            params: {
              projectId, // now it’s an object
            }, // pass as query param
          });
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Upload failed",
          position: "bottom",
        });
      }
      // Clear photos and labor data after PDF generation
      await AsyncStorage.removeItem(STORAGE_KEY); // photos
      await AsyncStorage.removeItem("reportData"); // labor/vendors
      setPhotos([]); // optional: reset state
    } catch (err) {
      console.error("PDF generation error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload DPR",
        position: "bottom",
      });
    } finally {
      setUploading(false); // stop loader
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

      <KeyboardAwareScrollView
        className="flex-1 p-4"
        enableOnAndroid={true}
        extraScrollHeight={100} // how much to scroll above keyboard
        keyboardOpeningTime={0}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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

        {photos.map((item) => (
          <View
            key={item.id}
            className="bg-white rounded-2xl shadow p-3 mb-4 relative"
          >
            {/* Image container with fixed width and flexible height */}
            <View className="w-full rounded-lg overflow-hidden bg-white">
              <Image
                source={{ uri: item.uri }}
                className="w-full"
                style={{ height: undefined, aspectRatio: 1 }} // 1:1 default, adjusts for landscape/portrait
                resizeMode="contain" // ensures full image is visible
              />
            </View>

            {/* Caption box */}
            <TextInput
              placeholder="Write caption here..."
              placeholderTextColor="#888"
              value={item.caption}
              onChangeText={(text) => updateCaption(item.id, text)}
              multiline
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
              className="border rounded-2xl px-4 py-3 bg-gray-50 mb-2 min-h-[40px] text-base mt-2"
            />

            {/* Delete button */}
            <TouchableOpacity
              onPress={() => removePhoto(item.id)}
              className="absolute top-3 right-3 bg-red-500 p-2 rounded-full shadow-md"
            >
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading || photos.length === 0} // disabled if uploading or no photos
          className={`mt-6 p-4 rounded-2xl flex-row justify-center items-center shadow ${
            uploading || photos.length === 0 ? "bg-gray-400" : "bg-red-500"
          }`}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="file-image-outline"
                size={22}
                color="#fff"
              />
              <Text className="text-white font-semibold ml-2">
                Generate Report
              </Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default ReportForm;
