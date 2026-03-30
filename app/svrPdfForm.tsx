import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  Camera01Icon,
  Edit03Icon,
  Image03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import uuid from "react-native-uuid";
import api from "../lib/api";
import { SvrPhoto, useSvrStore } from "../store/svrStore";
import { useAuth } from "./../context/AuthContext";

const { width } = Dimensions.get("window");

const getBase64ImageFromAsset = async (
  imageModule: number,
): Promise<string> => {
  try {
    const asset = Asset.fromModule(imageModule);
    await asset.downloadAsync(); // Download if not present

    let localUri = asset.localUri;
    const docDir = FileSystem.documentDirectory;
    if (!localUri || !localUri.startsWith("file://")) {
      // In production, asset.localUri may be undefined, so copy asset.uri to local FS
      if (!docDir) throw new Error("Document directory not available");
      const dest = docDir + asset.name;
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

const cleanupLocalPhotos = async (photos: PhotoItem[]) => {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) return;

  for (const p of photos) {
    try {
      if (p.uri?.startsWith(docDir)) {
        await FileSystem.deleteAsync(p.uri, { idempotent: true });
      }
    } catch {}
  }
};

const getFormattedDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = today.toLocaleString("default", { month: "short" });
  const year = today.getFullYear();
  return `${day}_${month}_${year}`;
};

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

const SVRPhotoReport: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, any>;
  const { user, token } = useAuth() as unknown as UseAuthReturn;
  const {
    projectName,
    company,
    projectId,
    teamLeaders,
    teamMembers,
    svrEntries, // JSON string from previous page
    attendees,
    caseStudyRemarks,
    mode,
  } = params || {};

  const isDarkMode = useColorScheme() === "dark";

  // console.log(caseStudyRemarks);
  // console.log(params);

  const {
    photosByProject,
    setPhotos,
    addPhoto,
    removePhoto,
    updatePhoto,
    clearPhotos,
  } = useSvrStore();
  const insets = useSafeAreaInsets();
  const projectIdStr = (projectId as string) || "default";
  const photos = useMemo(
    () => photosByProject[projectIdStr] || [],
    [photosByProject, projectIdStr],
  );

  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [showCaptionError, setShowCaptionError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const thumbnailListRef = useRef<any>(null);
  const isProgrammaticScroll = useRef(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const captionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Auto-focus when index changes IF keyboard was already open
  useEffect(() => {
    if (isKeyboardVisible) {
      InteractionManager.runAfterInteractions(() => {
        captionInputRef.current?.focus();
      });
    }
  }, [currentIndex, isKeyboardVisible]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Use useCallback to stabilize the visibility handler
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && !isProgrammaticScroll.current) {
      const nextIndex = viewableItems[0].index || 0;
      setCurrentIndex(nextIndex);

      // Also scroll thumbnail strip to keep active thumbnail visible
      thumbnailListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, []);

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

  const svr: any[] = (() => {
    try {
      return svrEntries ? JSON.parse(svrEntries) : [];
    } catch {
      return [];
    }
  })();

  const attendeeList: any[] = (() => {
    try {
      return attendees ? JSON.parse(attendees) : [];
    } catch {
      return [];
    }
  })();

  const STORAGE_KEY = `@svr_photos_${projectId || "default"}`;

  const uriToBase64 = useCallback(async (uri: string): Promise<string> => {
    // readAsStringAsync returns the file content as base64 with this encoding option
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // using jpeg as default — if you support png, you can inspect extension
    return `data:image/jpeg;base64,${base64}`;
  }, []);

  const compressImage = useCallback(async (uri: string): Promise<string> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Smaller width for thumbnails/previews
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
      );

      // Move from temporary cache to persistent document directory
      const destDir = `${FileSystem.documentDirectory}svr/compressed/`;
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destPath = `${destDir}Compressed_${uuid.v4().toString()}.jpg`;
      await FileSystem.copyAsync({ from: manipResult.uri, to: destPath });

      // Clean up temporary ImageManipulator cache file
      await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });

      return destPath;
    } catch (error) {
      console.warn("Image compression failed:", error);
      return uri;
    }
  }, []);

  const saveImageToDocuments = useCallback(
    async (tempUri: string, id: string) => {
      const fileName = `svr_${id}.jpg`;
      const dest = `${FileSystem.documentDirectory}svr/photos/${fileName}`;

      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}svr/photos`,
        { intermediates: true },
      );

      await FileSystem.copyAsync({
        from: tempUri,
        to: dest,
      });

      return dest;
    },
    [],
  );

  const savePhotos = useCallback(
    async (arr: PhotoItem[]) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        console.warn("Failed to save photos", e);
      }
    },
    [STORAGE_KEY],
  );

  const updateCaption = useCallback(
    (id: string, caption: string) => {
      updatePhoto(projectIdStr, id, { caption });
      if (showCaptionError === id && caption.trim().length > 0) {
        setShowCaptionError(null);
      }
    },
    [projectIdStr, updatePhoto, showCaptionError],
  );

  const removePhotoItem = useCallback(
    (id: string) => {
      removePhoto(projectIdStr, id);
      if (currentIndex >= photos.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    },
    [projectIdStr, removePhoto, currentIndex, photos.length],
  );

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.3,
      });

      if (!result.canceled && (result as any).assets?.length > 0) {
        setLoadingImages(true);
        const assets = (result as any).assets as Array<any>;
        const BATCH_SIZE = 1; // Load one by one for instantaneous feedback
        let currentPhotos = [...photos]; // keep track of local state

        setTimeout(async () => {
          try {
            for (let i = 0; i < assets.length; i += BATCH_SIZE) {
              const batch = assets.slice(i, i + BATCH_SIZE);
              const processedBatch: PhotoItem[] = [];

              for (const asset of batch) {
                const photoId = uuid.v4().toString();
                try {
                  const compressed = await compressImage(asset.uri);
                  const persistedUri = await saveImageToDocuments(
                    compressed,
                    photoId,
                  );
                  processedBatch.push({
                    id: photoId,
                    uri: persistedUri,
                    caption: "",
                  });
                } catch (e) {
                  console.warn("Compression fallback", e);
                  processedBatch.push({
                    id: photoId,
                    uri: asset.uri,
                    caption: "",
                  });
                }
              }

              // Append newly processed batch to the current list incrementally
              currentPhotos = [...currentPhotos, ...processedBatch];
              setPhotos(projectIdStr, currentPhotos);

              // Yield briefly to UI thread
              await new Promise((r) => setTimeout(r, 50));
            }
          } catch (batchError) {
            console.error("Batch processing error:", batchError);
          } finally {
            setLoadingImages(false);
          }
        }, 50);
      }
    } catch (e) {
      console.error("pickImage error:", e);
      Alert.alert("Error", "Could not pick image.");
      setLoadingImages(false);
    }
  }, [projectIdStr, photos, setPhotos, compressImage, saveImageToDocuments]);

  const takePhoto = useCallback(async () => {
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

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.3,
      });

      if (!result.canceled && (result as any).assets?.length > 0) {
        const asset = (result as any).assets[0];
        const photoId = uuid.v4().toString();

        // ⚡ COMPRESS BEFORE SAVING
        const compressed = await compressImage(asset.uri);
        const persistedUri = await saveImageToDocuments(compressed, photoId);

        const newPhoto: PhotoItem = {
          id: photoId,
          uri: persistedUri,
          caption: "",
        };

        addPhoto(projectIdStr, newPhoto);
      }
    } catch (e) {
      console.error("takePhoto error:", e);
      Alert.alert("Error", "Could not take photo.");
    }
  }, [projectIdStr, addPhoto, compressImage, saveImageToDocuments]);

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

      // 0. Validation: All images must have a caption
      for (let i = 0; i < photos.length; i++) {
        if (!photos[i].caption || photos[i].caption.trim().length === 0) {
          setUploading(false);
          setCurrentIndex(i);
          setShowCaptionError(photos[i].id);
          flatListRef.current?.scrollToIndex({ index: i, animated: true });

          Toast.show({
            type: "error",
            text1: "Validation",
            text2: "Please add caption for all images.",
            position: "bottom",
          });
          return;
        }
      }

      if (!logoBase64 || logoBase64.length < 100) {
        Toast.show({
          type: "info",
          text1: "Loading logo...",
          text2: "Please wait a moment and try again.",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUploading(false);
        return;
      }

      // 1. Storage Pre-Check
      const freeStore = await FileSystem.getFreeDiskStorageAsync();
      if (freeStore < 50 * 1024 * 1024) {
        // 50MB safety
        Alert.alert(
          "Low Storage",
          "You need at least 50MB of free space to generate this report.",
        );
        setUploading(false);
        return;
      }

      const createdBy = user?.fullName || "Unknown";

      // --- Optimized Image Processing with Batching for Low-End Devices ---
      let photosWithBase64: (SvrPhoto & { base64: string })[] | null = [];
      const PROCESSING_BATCH_SIZE = 1; // Ultra-safe: 1 at a time for low-end logic

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        try {
          const compressedUri = await compressImage(p.uri);
          const b64 = await uriToBase64(compressedUri);

          if (photosWithBase64) {
            photosWithBase64.push({ ...p, base64: b64 });
          }

          // 2. Yield to UI thread every image
          await new Promise((r) => setTimeout(r, 50));
        } catch (err) {
          console.error(`Failed to process image ${p.id}:`, err);
        }

        setProgress(((i + 1) / photos.length) * 100);
      }

      const { PdfEngine } = require("../lib/PdfEngine");
      const engine = new PdfEngine({
        projectName: projectName || "",
        createdBy: createdBy,
        company: company || "",
        logoBase64: logoBase64!,
      });

      engine.addCoverPage({
        leaders,
        members,
        mode,
        attendees: attendeeList,
        svrEntries: svr,
        caseStudyRemarks,
      });

      if (photosWithBase64) {
        for (const p of photosWithBase64) {
          engine.addPhotoPage({
            base64: p.base64,
            caption: p.caption,
          });
        }
        // 3. NULLIFY Base64 early to free up RAM
        photosWithBase64 = null;
      }

      const uri = await engine.finalize();

      const newFileName = `SVR_${projectName || "Project"}_${getFormattedDate()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}svr/pdfs/${newFileName}`;
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}svr/pdfs`,
        { intermediates: true },
      );
      await FileSystem.moveAsync({ from: uri, to: newUri });

      // Sharing logic for offline use
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share SVR Report",
          UTI: "com.adobe.pdf",
        });
      }

      // Optional upload
      if (token && Platform.OS !== "web") {
        const formData = new FormData();
        formData.append("projectName", projectName || "");
        formData.append("projectId", projectId || "");
        formData.append("createdBy", createdBy);
        formData.append("mode", mode || "");
        formData.append("file", {
          uri: newUri,
          name: newFileName,
          type: "application/pdf",
        } as any);

        // --- Accumulate searchable text ---
        let searchableText: string[] = [];
        photos.forEach((p) => {
          if (p.caption) searchableText.push(p.caption);
        });

        if (attendeeList && Array.isArray(attendeeList)) {
          attendeeList.forEach((a: any) => {
            if (a.attendeeName) searchableText.push(a.attendeeName);
            if (a.organization) searchableText.push(a.organization);
          });
        }

        if (svr && Array.isArray(svr)) {
          svr.forEach((e: any) => {
            if (e.agenda) searchableText.push(e.agenda);
            if (e.discussion) searchableText.push(e.discussion);
          });
        }

        if (caseStudyRemarks && typeof caseStudyRemarks === "string") {
          searchableText.push(caseStudyRemarks);
        }

        formData.append("captions", JSON.stringify(searchableText));

        try {
          await api.post("/svr", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          });
          Toast.show({
            type: "success",
            text1: "Uploaded",
            text2: "Successfully synced with server",
          });
        } catch (e) {
          console.warn("Upload failed but PDF saved locally", e);
        }
      }

      // Success cleanup
      await cleanupLocalPhotos(photos);
      clearPhotos(projectIdStr);
      const docDir = FileSystem.documentDirectory;
      if (docDir) {
        const path = `${docDir}svr_draft_${projectId || "default"}.json`;
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
      await FileSystem.deleteAsync(
        FileSystem.cacheDirectory + "ImageManipulator",
        { idempotent: true },
      );

      Toast.show({
        type: "success",
        text1: "Report Complete",
        text2: "PDF saved in storage.",
      });

      setTimeout(() => {
        router.push(
          // @ts-ignore
          `/svrs?projectId=${projectId}&projectName=${projectName}&company=${company}`,
        );
      }, 500);
    } catch (err: any) {
      console.error("Report generation error:", err);
      Alert.alert("Error", err?.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: SvrPhoto; index: number }) => (
      <View style={{ width }} className="px-4">
        <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-[16px]  p-2">
          <View
            className="relative  rounded-[12px]  overflow-hidden"
            style={{ height: 300 }}
          >
            <ExpoImage
              source={item.uri}
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
              contentFit="cover"
              transition={350}
              cachePolicy="memory-disk"
            />
            <View className="absolute top-3 left-3 bg-white/20  px-3 py-1 rounded-full">
              <Text className="text-black  text-sm font-poppinsMedium">
                {index + 1} of {photos.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removePhotoItem(item.id)}
              className="absolute top-3 right-3 bg-white/50  p-1 rounded-full "
            >
              <Ionicons
                name="close"
                size={16}
                color={isDarkMode ? "#000" : "#000"}
                strokeWidth={3}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/annotateImage",
                  params: {
                    imageUri: item.uri,
                    issueIndex: "-1",
                    svrPhotoId: item.id,
                    projectId: projectIdStr,
                  },
                })
              }
              className="absolute bottom-3 right-3 bg-[#2F76E6]/90 px-4 py-1 rounded-xl flex-row items-center"
            >
              <HugeiconsIcon icon={Edit03Icon} size={14} color="#fff" />
              <Text className="text-white ml-2 font-poppins text-[14px]">
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [width, photos.length, projectIdStr, removePhotoItem, router],
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000000]">
      <View className="pt-16 pb-6 px-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text className="text-xl font-dmSemiBold text-black dark:text-white ml-2">
            SVR
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }} // no extra padding if the keyboard is closed
        >
          <View className="px-4 mt-4">
            {/* <View className="flex-row justify-around mb-6">
              <TouchableOpacity
                onPress={takePhoto}
                className="bg-indigo-500 px-6 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text className="text-white ml-2 font-dmSemiBold">Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                className="bg-green-500 px-6 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="images" size={20} color="#fff" />
                <Text className="text-white ml-2 font-dmSemiBold">Gallery</Text>
              </TouchableOpacity>
            </View> */}

            {loadingImages && (
              <View className="flex-row justify-center items-center my-4">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="ml-2 text-black dark:text-white font-dmBold">
                  Processing images...
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mb-3">
              <Text className=" font-dmSemiBold text-black dark:text-white">
                Report Images ({photos.length})
              </Text>
              {/* {photos.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    clearPhotos(projectIdStr);
                    setCurrentIndex(0);
                  }}
                >
                  <Text className="text-red-500 font-dmMedium">Clear All</Text>
                </TouchableOpacity>
              )} */}
            </View>

            {photos.length === 0 && (
              <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-3xl p-10 items-center border border-dashed border-[#E0E5EB] dark:border-[#262626] mb-6">
                <Ionicons
                  name="images-outline"
                  size={48}
                  color={isDarkMode ? "#5B5B5B" : "#E0E5EB"}
                />
                <Text className="text-black dark:text-white mt-4 font-dmMedium text-center">
                  Upload site images to document today's progress
                </Text>
              </View>
            )}
          </View>

          {/* ... carousel logic ... */}

          {photos.length > 0 && (
            <View>
              <FlatList
                ref={flatListRef}
                data={photos}
                extraData={photos} // important for re-renders
                horizontal
                pagingEnabled
                keyboardShouldPersistTaps="always"
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderCarouselItem}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                className="mb-4"
                initialNumToRender={width > 0 ? 3 : 1}
                windowSize={5}
                maxToRenderPerBatch={5}
                removeClippedSubviews={false} // Prevents disappearing items on Android
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onMomentumScrollEnd={() => {
                  isProgrammaticScroll.current = false;
                }}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise((resolve) =>
                    setTimeout(resolve, 500),
                  );
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  });
                }}
              />

              <View
                style={{
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  paddingTop: 24,
                  flex: 1,
                }}
              >
                {/* Thumbnail Preview Strip */}
                <View className="mb-4">
                  <Text
                    className={`px-5 text-sm font-poppinsMedium mb-3 ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Viewing ({currentIndex + 1}/{photos.length})
                  </Text>
                  <DraggableFlatList
                    ref={thumbnailListRef}
                    data={photos}
                    horizontal
                    keyboardShouldPersistTaps="always"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    keyExtractor={(item) => item.id + "_thumb"}
                    onScrollToIndexFailed={(info) => {
                      thumbnailListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                        viewPosition: 0.5,
                      });
                    }}
                    onDragEnd={({ data }) => {
                      setPhotos(projectIdStr, data);
                    }}
                    renderItem={({ item, getIndex, drag, isActive }) => {
                      const index = getIndex();
                      return (
                        <ScaleDecorator>
                          <TouchableOpacity
                            onLongPress={drag}
                            disabled={isActive}
                            onPress={() => {
                              if (index === undefined) return;
                              isProgrammaticScroll.current = true;
                              setCurrentIndex(index);
                              flatListRef.current?.scrollToIndex({
                                index,
                                animated: true,
                              });
                              thumbnailListRef.current?.scrollToIndex({
                                index,
                                animated: true,
                                viewPosition: 0.5,
                              });
                            }}
                            className={`rounded-[16px] overflow-hidden border-[2px] mr-3 ${
                              index === currentIndex
                                ? "border-indigo-600"
                                : "border-transparent"
                            }`}
                            style={{
                              width: 64,
                              height: 64,
                              opacity: isActive ? 0.8 : 1,
                            }}
                          >
                            <ExpoImage
                              source={item.uri}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 12,
                              }}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          </TouchableOpacity>
                        </ScaleDecorator>
                      );
                    }}
                  />
                </View>

                {photos[currentIndex] && (
                  <View className="px-4 mb-3">
                    <TextInput
                      ref={captionInputRef}
                      placeholder="Describe the image..."
                      placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                      value={photos[currentIndex].caption}
                      onChangeText={(t) =>
                        updateCaption(photos[currentIndex].id, t)
                      }
                      multiline
                      textAlignVertical="top" //for placeholder on the top left
                      className={`rounded-2xl bg-[#FFF] dark:bg-[#000] px-4 py-3 font-poppins border ${
                        showCaptionError === photos[currentIndex].id
                          ? "border-red-500"
                          : "border-transparent"
                      } ${
                        isDarkMode
                          ? " text-white"
                          : " text-black"
                      }`}
                      style={{ minHeight: 80 }}
                    />
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View
          className={`px-4 ${
            photos.length === 0
              ? "bg-transparent"
              : "bg-[#F0F3F7] dark:bg-[#1A1A1A]"
          }`}
          style={{
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <TouchableOpacity
              onPress={() => setIsPickerVisible(true)}
              className="flex-1 border border-black dark:border-white bg-transparent rounded-2xl h-[48px] justify-center items-center"
              activeOpacity={0.7}
            >
              <Text
                className={`font-poppins text-lg ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Add Image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={photos.length === 0 || uploading}
              className="flex-1 overflow-hidden rounded-2xl h-[48px]"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  uploading
                    ? ["#9CA3AF", "#9CA3AF", "#9CA3AF"]
                    : photos.length === 0
                      ? isDarkMode
                        ? ["#2F2F2F", "#2F2F2F", "#2F2F2F"]
                        : ["#BBBBBB", "#BBBBBB", "#BBBBBB"]
                      : ["#5B4CCC", "#6347C2", "#8056D1"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-full flex-row justify-center items-center"
              >
                {uploading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-[#fff] font-dmBold text-base ml-2">
                      {progress.toFixed(0)}%
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`${
                      photos.length === 0
                        ? "dark:text-[#919191] text-[#777777]"
                        : "text-white"
                    } font-poppins text-lg`}
                  >
                    Submit
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/20 justify-end"
          onPress={() => setIsPickerVisible(false)}
        >
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-t-[24px] px-4 pt-6 pb-12 ">
            <View className="flex-row justify-between gap-2">
              <TouchableOpacity
                onPress={() => {
                  setIsPickerVisible(false);
                  setTimeout(takePhoto, 300);
                }}
                className="flex-1 bg-[#FFF] dark:bg-[#000] rounded-[16px] py-2 items-center "
              >
                <HugeiconsIcon
                  icon={Camera01Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Text className="mt-2 font-poppins text-black dark:text-white text-sm">
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsPickerVisible(false);
                  setTimeout(pickImage, 300);
                }}
                className="flex-1 bg-[#FFF] dark:bg-[#000] rounded-[16px] py-2 items-center"
              >
                <HugeiconsIcon
                  icon={Image03Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Text className="mt-2 font-poppins text-black dark:text-white text-sm">
                  Select Image
                </Text>
              </TouchableOpacity>
            </View>

            {/* <TouchableOpacity
              onPress={() => setIsPickerVisible(false)}
              className="mt-8 py-4 bg-white/50 rounded-2xl"
            >
              <Text className="text-center font-poppins text-gray-500 text-base">
                Cancel
              </Text>
            </TouchableOpacity> */}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SVRPhotoReport;
