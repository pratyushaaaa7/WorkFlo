import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
// import Toast from "react-native-toast-message";
import Activity from "@/types/ILRActivity";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as FileSystem from "expo-file-system"; // for mobile download
import * as Sharing from "expo-sharing";

// import { exportILRsToExcel } from "../utils/ilrExcel";

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
    firmName: string;
    name: string;
  }[];

  status: "Open" | "Closed";
  createdBy: { _id: string; username: string; fullName: string }; // 👈 add this
  createdAt: string; // 👈 add this
  delayDays?: number; // 👈 add this
};

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [ilrs, setIlrs] = useState<ILR[]>([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<"All" | "Open" | "Closed">("All"); // 👈 filter state

  useEffect(() => {
    const fetchILRs = async () => {
      if (!token || !projectId) return;
      try {
        setLoading(true);
        const res = await api.get(`/ilrs/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIlrs(res.data);
        // console.log(res.data)
        // console.log(JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchILRs();
  }, [token, projectId]);

  const handleDownloadExcel = async () => {
    if (!parsedILRs || parsedILRs.length === 0) return;

    try {
      setIsDownloadingExcel(true);

      const payload = {
        ilrs: parsedILRs,
        projectName,
        accountName: auth?.user?.fullName,
        company,
      };

      const response = await api.post("/ilrs/ilrs-download", payload, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const fileName = `ILRs_${projectName}.xlsx`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const blobToBase64 = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

        const base64data = await blobToBase64(response.data);
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Share ILRs Excel",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (err) {
      console.error("Failed to download Excel:", err);
      alert("Failed to download Excel");
    } finally {
      setIsDownloadingExcel(false);
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
            createdBy: item.createdBy?.fullName,
            createdAt: item.createdAt,
            ilrNumber: item.ilrNumber,
          };
          // console.log("ILR Card params:", params);
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
            {item.ilrNumber}. {item.description}{" "}
            {/* <Text className="text-red-500">Delay: {item.delayDays} days</Text> */}
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

  // Inside your ILRs component
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const filteredILRs = ilrs.filter((ilr) => {
    // 1️⃣ Filter by status
    if (filter !== "All" && ilr.status !== filter) return false;

    // 2️⃣ Filter by date range
    const target = new Date(ilr.targetDate);
    if (startDate && target < startDate) return false;
    if (endDate && target > endDate) return false;

    // 3️⃣ Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const responsibilityMatch = ilr.responsibility.some((r) =>
        (r.name || "").toLowerCase().includes(q)
      );
      const descriptionMatch = ilr.description.toLowerCase().includes(q);
      // Add more fields if needed, like ilrNumber
      const ilrNumberMatch = ilr.ilrNumber.toString().includes(q);

      if (!responsibilityMatch && !descriptionMatch && !ilrNumberMatch)
        return false;
    }

    return true; // keep this ILR
  });

  const parsedILRs = filteredILRs.map((ilr) => ({
    ...ilr,
    responsibility: ilr.responsibility.map((r) => ({
      ...r,
      individualName: r.name || "", // 👈 map "name" into "individualName"
    })),
    activities:
      typeof ilr.activities === "string"
        ? JSON.parse(ilr.activities)
        : ilr.activities || [],
  }));

  // State to track PDF download
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const handleDownloadILRsPDF = async () => {
    if (!ilrs || ilrs.length === 0) return;

    try {
      setIsDownloadingPDF(true);

      const payload = {
        ilrs: parsedILRs,
        projectName,
        accountName: auth?.user?.fullName ?? "Unknown",
        company,
      };

      const response = await api.post("/ilrs/ilrs-download/pdf", payload, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const fileName = `ILRs_${projectName}.pdf`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const blobToBase64 = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

        const base64data = await blobToBase64(response.data);
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share ILRs PDF",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (err) {
      console.error("Failed to download ILRs PDF:", err);
      alert("Failed to download ILRs PDF");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
          className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md"
          // style={{
          //   shadowColor: "#000",
          //   shadowOffset: { width: 0, height: 3 },
          //   shadowOpacity: 0.25,
          //   shadowRadius: 4,
          //   elevation: 6,
          //   zIndex: 10,
          // }}
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
              {/* {projectName} */}
              ILRs
            </Text>
          </TouchableOpacity>

          {/* Download Excel */}
          <TouchableOpacity
            disabled={isDownloadingExcel}
            className="px-2 mr-2 rounded-full bg-white/20"
            onPress={handleDownloadExcel}
          >
            {isDownloadingExcel ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons
                name="microsoft-excel"
                size={24}
                color="white"
              />
            )}
          </TouchableOpacity>

          {/* Download PDF */}
          <TouchableOpacity
            disabled={isDownloadingPDF}
            className="px-2 mr-2 rounded-full bg-white/20"
            onPress={handleDownloadILRsPDF}
          >
            {isDownloadingPDF ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={26}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Status filter pills */}
      <View className="px-4 mt-3 gap-2">
        {/* Top Row: Status Pills + Reset Button */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-3">
            {["All", "Open", "Closed"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f as "All" | "Open" | "Closed")}
                className={`px-4 py-2 rounded-full  ${
                  filter === f
                    ? "bg-indigo-600"
                    : "bg-white border border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === f ? "text-white" : "text-gray-800"
                  }`}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            onPress={() => {
              setFilter("All");
              setStartDate(null);
              setEndDate(null);
              setSearchQuery("");
            }}
            className="px-3 py-2 bg-blue-100 rounded-xl flex-row items-center shadow-sm"
          >
            <Ionicons name="refresh" size={18} color="blue" />
            <Text className="ml-1 text-blue-600 font-medium text-sm">
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Range Pickers */}
        <View className="flex-row justify-between gap-3">
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-300 flex-row items-center justify-between"
            onPress={() => setShowStartPicker(true)}
          >
            <Text className={`text-gray-600`}>
              {startDate ? startDate.toLocaleDateString() : "Start Date"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-300 flex-row items-center justify-between"
            onPress={() => setShowEndPicker(true)}
          >
            <Text className={`text-gray-600`}>
              {endDate ? endDate.toLocaleDateString() : "End Date"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-300 flex-row items-center px-3 ">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search by issue subject or responsibility..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-700"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Pickers Modals */}
        <DateTimePickerModal
          isVisible={showStartPicker}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setShowStartPicker(false);
          }}
          onCancel={() => setShowStartPicker(false)}
        />

        <DateTimePickerModal
          isVisible={showEndPicker}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setShowEndPicker(false);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
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
          bottom: 44,
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
