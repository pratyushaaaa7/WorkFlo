// ReportForm.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import uuid from "react-native-uuid";
import api from "../lib/api";
// import logoWP from "../assets/images/logoWPcrop.png";
// import logoWAL from "../assets/images/logoWALL.png";
// import logoFallback from "../assets/images/react-logo.png";
// Adjust this to your actual AuthContext hook type
import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuth } from "./../context/AuthContext";
// import logoW from "../assets/images/logoW.png";
// import { getBase64ImageFromAsset } from "../utils/getBase64Image";
// Define this function in ReportForm.tsx (or ensure your utility function uses this logic)
const getBase64ImageFromAsset = async (
  imageModule: number,
): Promise<string> => {
  try {
    const asset = Asset.fromModule(imageModule);
    await asset.downloadAsync(); // Download if not present

    let localUri = asset.localUri;
    if (!localUri || !localUri.startsWith("file://")) {
      // In production, asset.localUri may be undefined, so copy asset.uri to local FS
      const dest = FileSystem.documentDirectory + asset.name;
      await FileSystem.copyAsync({
        from: asset.uri,
        to: dest,
      });
      localUri = dest;
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Use correct extension
    const ext =
      localUri.endsWith(".jpg") || localUri.endsWith(".jpeg") ? "jpeg" : "png";
    return `data:image/${ext};base64,${base64}`;
  } catch (error) {
    console.warn("Logo load failed in getBase64ImageFromAsset:", error);
    // Inline blank PNG fallback
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  }
};

const { width } = Dimensions.get("window");

const getFormattedDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = today.toLocaleString("default", { month: "short" });
  const year = today.getFullYear();
  return `${day}_${month}_${year}`;
};

/* -----------------------------
   Lightweight types used here
   tighten them as needed later
   ----------------------------- */
type PhotoItem = {
  id: string;
  uri: string;
  caption: string;
  base64?: string;
};

type UseAuthReturn = {
  user?: { fullName?: string } | null;
  token?: string | null;
};

/* If you use tailwind className on RN elements, casting to `any` prevents TS errors.
   If you don't use tailwind, you can remove these aliases and use the original components. */
// const V: any = View;
// const T: any = Text;
// const TO: any = TouchableOpacity;
// const Img: any = Image;
// const TI: any = TextInput;
// const KASV: any = KeyboardAwareScrollView;

const ReportForm: React.FC = () => {
  const { user, token } = useAuth() as unknown as UseAuthReturn;
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  // Using useLocalSearchParams() from expo-router; params may be string | string[] | undefined
  const params = useLocalSearchParams() as Record<string, any>;
  const {
    projectName,
    company,
    projectId,
    teamLeaders,
    teamMembers,
    vendors: vendorsParam,
    totalLabor: totalLaborParam,
  } = params || {};

  const teamLeadersStr = Array.isArray(teamLeaders)
    ? teamLeaders[0]
    : teamLeaders;
  const teamMembersStr = Array.isArray(teamMembers)
    ? teamMembers[0]
    : teamMembers;

  const leaders = (() => {
    try {
      return teamLeadersStr ? JSON.parse(teamLeadersStr) : [];
    } catch {
      return [];
    }
  })();

  const members = (() => {
    try {
      return teamMembersStr ? JSON.parse(teamMembersStr) : [];
    } catch {
      return [];
    }
  })();

  const vendors: any[] = (() => {
    try {
      return vendorsParam ? JSON.parse(vendorsParam) : [];
    } catch {
      return [];
    }
  })();

  const totalLabor = totalLaborParam ? parseInt(totalLaborParam, 10) : 0;

  const STORAGE_KEY = `@saved_photos_${projectId || "default"}`;

  const uriToBase64 = async (uri: string): Promise<string> => {
    // readAsStringAsync returns the file content as base64 with this encoding option
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // using jpeg as default — if you support png, you can inspect extension
    return `data:image/jpeg;base64,${base64}`;
  };
  // const localImageToBase64 = async (image: any) => {
  //   try {
  //     const asset = Asset.fromModule(image);
  //     await asset.downloadAsync(); // ensure the asset is available

  //     // ✅ Use the local URI from the asset (works in dev & production)
  //     const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });

  //     return `data:image/png;base64,${base64}`;
  //   } catch (err) {
  //     console.warn("⚠️ Error converting logo to base64:", err);
  //     return ""; // prevent PDF break if fails
  //   }
  // };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const dynamicCompress = photos.length > 15 ? 0.3 : 0.5;

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: dynamicCompress, format: ImageManipulator.SaveFormat.JPEG },
      );
      return manipResult.uri;
    } catch (error) {
      console.warn("Image compression failed:", error);
      return uri; // fallback
    }
  };

  const savePhotos = async (arr: PhotoItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("Failed to save photos to AsyncStorage", e);
    }
  };

  const pickImage = async () => {
    try {
      setLoadingImages(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.3,
      });

      if (!result.canceled && (result as any).assets?.length > 0) {
        const assets = (result as any).assets as Array<any>;

        for (const asset of assets) {
          const newPhoto: PhotoItem = {
            id: uuid.v4().toString(),
            uri: asset.uri,
            caption: "",
          };

          // Add each image one by one to state
          setPhotos((prev) => {
            const updated = [...prev, newPhoto];
            savePhotos(updated); // save to AsyncStorage
            return updated;
          });

          // Optional: give the UI a tiny break to render
          await new Promise((r) => setTimeout(r, 50));
        }
      }
    } catch (e) {
      console.error("pickImage error:", e);
      Alert.alert("Error", "Could not pick image.");
    } finally {
      setLoadingImages(false);
    }
  };

  const takePhoto = async () => {
    try {
      // 1️⃣ Ask for camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      // 2️⃣ If permission is denied → show alert & stop
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "To take photos, please allow camera access in your phone settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      // 3️⃣ Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.3,
      });

      // 4️⃣ Handle response
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const newPhoto: PhotoItem = {
          id: uuid.v4().toString(),
          uri: asset.uri,
          caption: "",
        };

        const updated = [...photos, newPhoto];
        setPhotos(updated);
        savePhotos(updated);
      }
    } catch (e) {
      console.error("takePhoto error:", e);
      Alert.alert("Error", "Could not take photo.");
    }
  };

  const updateCaption = (id: string, caption: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, caption } : p));
    setPhotos(updated);
    savePhotos(updated);
  };

  const removePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    savePhotos(updated);
  };

  useEffect(() => {
    const loadSavedPhotos = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setPhotos(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load saved photos", e);
      }
    };
    loadSavedPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const loadLogoBase64 = async () => {
      try {
        const companyStr = Array.isArray(company) ? company[0] : company;
        let selectedLogo: number;

        // ✅ Use require instead of import
        if (
          typeof companyStr === "string" &&
          companyStr.toLowerCase() === "wp"
        ) {
          selectedLogo = require("../assets/images/logoWPcrop.png");
        } else if (
          typeof companyStr === "string" &&
          companyStr.toLowerCase() === "wal"
        ) {
          selectedLogo = require("../assets/images/logoWALL.png");
        } else {
          selectedLogo = require("../assets/images/logoW.png");
        }

        let base64 = await getBase64ImageFromAsset(selectedLogo);

        if (!base64 || base64.length < 100) {
          console.warn("⚠️ Main logo load failed, trying fallback");
          base64 = await getBase64ImageFromAsset(
            require("../assets/images/react-logo.png"),
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        setLogoBase64(base64);
      } catch (err) {
        console.error("❌ Failed to load company logo:", err);
        const fallback = await getBase64ImageFromAsset(
          require("../assets/images/react-logo.png"),
        );
        setLogoBase64(fallback);
      }
    };

    loadLogoBase64();
  }, [company]);

  // -------------------- 🧩 PDF GENERATION IN BATCHES --------------------
  const handleSubmit = async () => {
    try {
      setUploading(true);
      // console.log(logoBase64);
      if (!logoBase64 || logoBase64.length < 100) {
        Toast.show({
          type: "info",
          text1: "Loading logo...",
          text2: "Please wait a moment and try again.",
        });
        await new Promise((resolve) => setTimeout(resolve, 300)); // give it a short delay
        return;
      }

      setUploading(true);

      const createdBy = user?.fullName || "Unknown";

      // Inside handleSubmit()

      // --- Convert logo to Base64 safely ---

      // Convert photos to base64 with visible progress
      const photosWithBase64: PhotoItem[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const compressedUri = await compressImage(p.uri);
        const base64 = await uriToBase64(compressedUri);
        photosWithBase64.push({ ...p, base64 });
        setProgress(((i + 1) / photos.length) * 100);
      }

      const today = new Date();
      const dateStr = today.toLocaleDateString();
      const timeStr = today.toLocaleTimeString();

      // Split into batches to prevent memory overload
      const batchSize = 4;
      const batches = [];
      for (let i = 0; i < photosWithBase64.length; i += batchSize) {
        batches.push(photosWithBase64.slice(i, i + batchSize));
      }

      // ------------------ HTML START ------------------
      let htmlParts = [];

      // --- PAGE 1: PROJECT INFO ---
      htmlParts.push(`
      <div class="page">
        <div class="header-right">
         <img src="${logoBase64}" style="width:160px;height:auto;object-fit:contain;" />

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
    `);

      // --- CONDITIONAL: LABOR REPORT PAGE ---
      if (vendors.length > 0) {
        htmlParts.push(`
        <div class="page">
          <div class="header-left">
            <div><strong>Project:</strong> ${projectName || ""}</div>
            <div><strong>Created By:</strong> ${createdBy || ""}</div>
          </div>
          <div class="header-right">
         <img src="${logoBase64}" style="width:160px;height:auto;object-fit:contain;" />

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
                </tr>`,
              )
              .join("")}
            <tr>
              <td colspan="3" style="text-align:right;font-weight:bold;">Total Labors</td>
              <td><strong>${totalLabor}</strong></td>
            </tr>
          </table>
        </div>
      `);
      }

      // --- PHOTO BATCHES ---
      for (const batch of batches) {
        for (const p of batch) {
          htmlParts.push(`
          <div class="page photo">
            <div class="header-left">
              <div><strong>Project:</strong> ${projectName || ""}</div>
              <div><strong>Created By:</strong> ${createdBy || ""}</div>
            </div>
            <div class="header-right">
            <img src="${logoBase64}" style="width:160px;height:auto;object-fit:contain;" />

            </div>

       <div style="
  width: 94%;
  height: 66vh;
  border: 2px solid #000;
  border-radius: 8px;
  margin: 20px auto 0 auto;
  padding: 6px;
  overflow: hidden;
  text-align: center;   /* optional: centers the image */
">
  <img src="${p.base64}" style="
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    display: block;
    margin: 0 auto;      /* centers the image horizontally */
  " />
</div>


            <div class="caption" style=" text-align: left;
  margin-top: 6px;
  width: 94%;         /* match the image width */
  display: block;      /* force block */
  padding: 0 0 0 12px;  /* top right bottom left */
  font-size: 18px;
  color: #222;
  font-weight: 500;
  white-space: pre-wrap;
  word-wrap: break-word;">
              <p style="margin: 0;  padding: 0 0 0 12px;  /* top right bottom left */;">${
                p.caption?.trimStart() || ""
              }</p>
            </div>
          </div>
        `);
        }
      }

      // --- WRAP ALL PAGES ---
      const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              position: relative;
            }
            .page {
              page-break-after: always;
              position: relative;
              padding: 120px 20px 40px 20px;
              box-sizing: border-box;
              height: 100vh;
            }
            .header-left {
              position: fixed;
              top: 20px;
              left: 20px;
              font-size: 16px;
              font-weight: bold;
              color: #000;
              line-height: 1.5;
              background: white;
              padding: 8px 12px;
            }
            .header-right {
              position: fixed;
              top: 20px;
              right: 20px;
            }
            .header-right img {
              width: 180px;
              height: auto;
            }
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
            .photo {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
              height: 100%;
            }
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
        <body>${htmlParts.join("")}</body>
      </html>
    `;

      console.log("✅ Checking logoBase64 length:", logoBase64?.length);

      if (
        !logoBase64 ||
        !logoBase64.startsWith("data:image") ||
        logoBase64.length < 100
      ) {
        console.error("❌ Logo not loaded properly or missing.");
        Alert.alert(
          "Logo Error",
          "Unable to load the company logo. Please reopen the report screen or check your logo asset file.",
        );
        Toast.show({
          type: "error",
          text1: "Logo Missing",
          text2: "Could not load logo image. Try again.",
          position: "bottom",
        });
        setUploading(false);
        return; // stop PDF generation
      }

      // ------------------ GENERATE PDF ------------------
      const { uri } = await Print.printToFileAsync({ html });
      const newFileName = `DPR_${
        projectName || "Project"
      }_${getFormattedDate()}.pdf`;
      const newUri = `${FileSystem.cacheDirectory}${newFileName}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });

      //TO DIRECTLY UPLOAD
      // 🔹 Prepare FormData for backend upload
      const formData = new FormData();
      formData.append("projectName", projectName);
      formData.append("projectId", projectId);
      formData.append("createdBy", createdBy);

      formData.append("file", {
        uri: newUri,
        name: newFileName,
        type: "application/pdf",
      } as any);

      // 🔹 Upload to your backend (which sends it to object storage)
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

        // Optional: navigate after delay
        setTimeout(() => {
          router.push({
            pathname: "/dprs",
            params: { projectId },
          });
        }, 300);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Upload failed",
          position: "bottom",
        });
      }

      // 🔹 Cleanup after upload
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem("reportData");
      setPhotos([]);
      try {
        await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
          idempotent: true,
        });
      } catch (e) {
        console.warn("Cache cleanup failed", e);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert(
        "Upload Error",
        err?.response?.data?.error || err?.message || "Something went wrong.",
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload DPR",
        position: "bottom",
      });
    } finally {
      setUploading(false);
    }

    //FOR DOWNLOAD IN LOCAL STORAGE
    //   console.log("PDF generated at:", newUri);

    //   // // Optional sharing
    //   if (await Sharing.isAvailableAsync()) {
    //     await Sharing.shareAsync(newUri, {
    //       mimeType: "application/pdf",
    //       dialogTitle: "Share or Save Photo Report",
    //       UTI: "com.adobe.pdf",
    //     });
    //   } else {
    //     Alert.alert("PDF generated", `Saved at: ${newUri}`);
    //   }

    //   Toast.show({
    //     type: "success",
    //     text1: "PDF Generated",
    //     text2: "Photo report saved locally.",
    //     position: "bottom",
    //   });
    // } catch (err: any) {
    //   console.error("PDF generation error:", err);
    //   Alert.alert("Error", err?.message || "Failed to generate PDF.");
    // } finally {
    //   setUploading(false);
    //   try {
    //     await FileSystem.deleteAsync(
    //       FileSystem.cacheDirectory + "ImageManipulator",
    //       {
    //         idempotent: true,
    //       }
    //     );
    //   } catch (e) {
    //     console.warn("Cleanup failed:", e);
    //   }
    // }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-bold text-white ml-4">
              Daily Progress Report
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        className="flex-1 p-4 "
        enableOnAndroid={true}
        extraHeight={120} // space above keyboard
        keyboardOpeningTime={0} // avoids flicker on Android
        enableAutomaticScroll={true}
        contentContainerStyle={{ paddingBottom: 120 }} // space for submit button
      >
        <View className="flex-row justify-around mb-6">
          <TouchableOpacity
            onPress={takePhoto}
            className="bg-indigo-500 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text className="text-white ml-2 font-semibold">Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="bg-green-500 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="images" size={20} color="#fff" />
            <Text className="text-white ml-2 font-semibold">Gallery</Text>
          </TouchableOpacity>
        </View>

        {loadingImages && (
          <View className="flex-row justify-center items-center my-4">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="ml-2 text-gray-700 font-semibold">
              Loading images...
            </Text>
          </View>
        )}

        {photos.map((item) => (
          <View
            key={item.id}
            className="bg-white rounded-2xl shadow p-3 mb-4 relative"
          >
            <Image
              source={{ uri: item.uri }}
              className="w-full"
              style={{ height: undefined, aspectRatio: 1 }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Write caption..."
              placeholderTextColor="#888"
              value={item.caption}
              onChangeText={(t: any) => updateCaption(item.id, t)}
              multiline
              className="border rounded-2xl px-4 py-3 bg-gray-50 mt-2"
            />
            <TouchableOpacity
              onPress={() => removePhoto(item.id)}
              className="absolute top-3 right-3 bg-red-500 p-2 rounded-full"
            >
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading || photos.length === 0}
          className={`mt-6 p-4 rounded-2xl flex-row justify-center items-center ${
            uploading || photos.length === 0 ? "bg-gray-400" : "bg-red-500"
          }`}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-semibold ml-2">
                Processing {progress.toFixed(0)}%
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="file-image-outline"
                size={22}
                color="#fff"
              />
              <Text className="text-white font-semibold ml-2">
                Upload Report
              </Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default ReportForm;
