import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ViewShot from "react-native-view-shot";

import { useDprStore } from "../store/dprStore";
import { useSvrStore } from "../store/svrStore";
import { useTempImageStore } from "../store/tempImageStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#FFFFFF"];
const BRUSH_SIZES = [3, 5, 8, 12];

interface StrokePath {
  d: string;
  color: string;
  strokeWidth: number;
}

export default function AnnotateImage() {
  const router = useRouter();
  const { imageUri, issueIndex, svrPhotoId, dprPhotoId, projectId } =
    useLocalSearchParams<{
      imageUri: string;
      issueIndex: string;
      svrPhotoId?: string;
      dprPhotoId?: string;
      projectId?: string;
    }>();

  const updateImageForIssue = useTempImageStore(
    (state) => state.updateImageForIssue,
  );
  const updateSvrPhoto = useSvrStore((state) => state.updatePhoto);
  const updateDprPhoto = useDprStore((state) => state.updatePhoto);

  const viewShotRef = useRef<ViewShot>(null);

  // Drawing state
  const [paths, setPaths] = useState<StrokePath[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedBrushSize, setSelectedBrushSize] = useState(BRUSH_SIZES[1]);

  // Reset drawing state when a different image is opened
  useEffect(() => {
    setPaths([]);
    activePathRef.current = "";
    currentPathRef.current?.setNativeProps({ d: "" });
  }, [imageUri]);

  // Refs to avoid stale closures in PanResponder
  const activePathRef = useRef<string>("");
  const currentPathRef = useRef<any>(null); // Ref for direct native prop updates
  const selectedColorRef = useRef(selectedColor);
  const selectedBrushSizeRef = useRef(selectedBrushSize);
  selectedColorRef.current = selectedColor;
  selectedBrushSizeRef.current = selectedBrushSize;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const d = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        activePathRef.current = d;
        currentPathRef.current?.setNativeProps({ d });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        activePathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        currentPathRef.current?.setNativeProps({ d: activePathRef.current });
      },
      onPanResponderRelease: () => {
        const finished = activePathRef.current;
        if (finished) {
          setPaths((prev) => [
            ...prev,
            {
              d: finished,
              color: selectedColorRef.current,
              strokeWidth: selectedBrushSizeRef.current,
            },
          ]);
        }
        activePathRef.current = "";
        currentPathRef.current?.setNativeProps({ d: "" });
      },
    }),
  ).current;

  const handleSave = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();

        // ⚡ Ensure the annotated image is saved to the persistent document directory
        const destDir = `${FileSystem.documentDirectory}annotated/`;
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        const destPath = `${destDir}Annotated_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: uri, to: destPath });

        if (svrPhotoId && projectId) {
          // Update SVR Store with persistent URI and projectId
          updateSvrPhoto(projectId, svrPhotoId, { uri: destPath });
        } else if (dprPhotoId && projectId) {
          // Update DPR Store with persistent URI and projectId
          updateDprPhoto(projectId, dprPhotoId, { uri: destPath });
        } else if (svrPhotoId) {
          // Fallback if projectId missing but svrPhotoId exists
          updateSvrPhoto("default", svrPhotoId, { uri: destPath });
        } else if (dprPhotoId) {
          // Fallback if projectId missing but dprPhotoId exists
          updateDprPhoto("default", dprPhotoId, { uri: destPath });
        } else {
          // Standard issue update with persistent URI
          updateImageForIssue(Number(issueIndex), imageUri, destPath);
        }

        router.back();
      }
    } catch (err) {
      console.error("Failed to capture image:", err);
    }
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
    activePathRef.current = "";
    currentPathRef.current?.setNativeProps({ d: "" });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Up</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas — only this gets captured */}
      <View style={styles.canvasWrapper}>
        <ViewShot
          ref={viewShotRef}
          options={{
            format: "jpg",
            quality: 0.9,
            fileName: `Annotated_Image_${Date.now()}`,
          }}
          style={styles.viewShot}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            <Svg height="100%" width="100%">
              {paths.map((p, i) => (
                <Path
                  key={i}
                  d={p.d}
                  stroke={p.color}
                  strokeWidth={p.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Current drawing path */}
              <Path
                ref={currentPathRef}
                d=""
                stroke={selectedColor}
                strokeWidth={selectedBrushSize}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </ViewShot>
      </View>

      {/* Bottom Toolbar */}
      <View style={styles.toolbar}>
        {/* Undo & Clear */}
        <View style={styles.toolRow}>
          <TouchableOpacity
            onPress={handleUndo}
            style={styles.actionBtn}
            disabled={paths.length === 0}
          >
            <Ionicons
              name="arrow-undo"
              size={22}
              color={paths.length === 0 ? "#555" : "white"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={styles.actionBtn}
            disabled={paths.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={paths.length === 0 ? "#555" : "#EF4444"}
            />
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        <View style={styles.toolRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotActive,
              ]}
            />
          ))}
        </View>

        {/* Brush Size Picker */}
        <View style={styles.toolRow}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => setSelectedBrushSize(size)}
              style={[
                styles.brushBtn,
                selectedBrushSize === size && styles.brushBtnActive,
              ]}
            >
              <View
                style={[
                  styles.brushDot,
                  {
                    width: size + 6,
                    height: size + 6,
                    borderRadius: (size + 6) / 2,
                    backgroundColor:
                      selectedBrushSize === size ? selectedColor : "#888",
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#111",
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  doneText: {
    color: "#3B82F6",
    fontSize: 17,
    fontWeight: "700",
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  viewShot: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4,
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  toolbar: {
    backgroundColor: "#111",
    paddingBottom: 34,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  toolRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotActive: {
    borderColor: "#fff",
    transform: [{ scale: 1.2 }],
  },
  brushBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  brushBtnActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  brushDot: {
    backgroundColor: "#888",
  },
});
