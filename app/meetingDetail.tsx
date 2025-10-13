import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
// import { exportMinutesToExcel } from "../utils/momExcel";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str
    .split(" ") // split string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize each word
    .join(" "); // join words back into a single string
};

const handleDownloadMinutes = async (
  meeting: any,
  projectName: any,
  accountName: any,
  company: any,
  token: any
) => {
  try {
    const payload = {
      meeting,
      projectName,
      accountName,
      company,
    };

    const response = await api.post("/minutes/export/minutes", payload, {
      responseType: "blob", // important for binary files
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fileName = `Meeting_${meeting.meetingNumber}_Minutes.xlsx`;

    if (Platform.OS === "web") {
      // --- Web: download via anchor tag ---
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // --- Mobile: convert blob → base64, write to cache, then share ---
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
        dialogTitle: "Share Meeting Minutes",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("Failed to download minutes:", err);
    alert("Failed to download minutes");
  }
};

const MinutesDetail = () => {
  // Get local params from previous screen
  const {
    meetingId,
    meetingNumber,
    meetingDate,
    meetingTime,
    meetingVenue,
    projectName,
    company,
  } = useLocalSearchParams();
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/minutes/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeeting(res.data);
        // console.log(JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) fetchMeeting();
  }, [meetingId, token]);

  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}

      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
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
          {/* Back Button + Title */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              {projectName} Meeting #{meetingNumber}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isDownloading} // disable press while downloading
            className={`px-2 mr-2 rounded-full bg-white/20 active:bg-white/50"
          }`}
            onPress={async () => {
              if (!meeting) return;
              setIsDownloading(true);
              try {
                await handleDownloadMinutes(
                  meeting,
                  projectName,
                  auth?.user?.fullName ?? "Unknown",
                  company,
                  token
                );
              } finally {
                setIsDownloading(false);
              }
            }}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons
                name="microsoft-excel"
                size={26}
                color="white"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isDownloading}
            className={`px-2 mr-2 rounded-full bg-white/20`}
            onPress={async () => {
              if (!meeting) return;
              setIsDownloading(true);
              try {
                // --- PDF download ---
                const payload = {
                  meeting,
                  projectName,
                  accountName: auth?.user?.fullName ?? "Unknown",
                  company,
                };

                const response = await api.post(
                  "/minutes/export/minutes/pdf",
                  payload,
                  {
                    responseType: "blob",
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                const fileName = `Meeting_${meeting.meetingNumber}_Minutes.pdf`;

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
                    dialogTitle: "Share Meeting Minutes (PDF)",
                    UTI: "com.adobe.pdf",
                  });
                }
              } catch (err) {
                console.error("Failed to download PDF minutes:", err);
                alert("Failed to download PDF minutes");
              } finally {
                setIsDownloading(false);
              }
            }}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons
                name={"file-pdf-box"}
                size={28}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="p-2">
        {/* Date & Time */}
        <View className="bg-white rounded-2xl p-5 mb-3 shadow-md border border-gray-100">
          {/* Date & Time Row */}
          <View className="flex-row justify-between items-center">
            {/* Date */}
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#1F2937" />
              <Text className="ml-2 text-gray-800 font-medium">
                {new Date(
                  Array.isArray(meetingDate) ? meetingDate[0] : meetingDate
                ).toLocaleDateString()}
              </Text>
            </View>

            {/* Time */}
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#1F2937" />
              <Text className="ml-2 text-gray-800 font-medium">
                {meetingTime}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-200 my-3" />

          {/* Venue */}
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#1F2937" />
            <Text className="ml-2 text-gray-700">{meetingVenue}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meeting ? (
          <>
            {/* Attendees */}
            <View className="bg-white p-4 rounded-2xl shadow mb-2">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Attendees
              </Text>
              {meeting.attendees.map((attendee: any) => (
                <View
                  key={attendee._id}
                  className="border-t border-gray-200 py-2 flex-row justify-between"
                >
                  <View>
                    <Text className="font-medium text-gray-700">
                      {attendee.attendeeName}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {attendee.designation} | {attendee.organization}
                    </Text>
                  </View>
                  <Text className="text-gray-400">{attendee.phone}</Text>
                </View>
              ))}
            </View>

            {/* Minutes */}
            {meeting.minutes.map((minute: any) => (
              <TouchableOpacity
                key={minute._id}
                onPress={() =>
                  router.push({
                    pathname: "/minuteDetail",
                    params: {
                      id: minute._id,
                      meetingId: meeting._id,
                      serialNo: minute.serialNo,
                      issueSubject: minute.issueSubject,
                      description: minute.description ?? "",
                      raisedBy: JSON.stringify(minute.raisedBy),
                      responsibility: JSON.stringify(minute.responsibility),
                      responsibilityForInfo: minute.responsibilityForInfo
                        ? "true"
                        : "false",
                      targetDate: minute.targetDate,
                      targetDateForInfo: minute.targetDateForInfo
                        ? "true"
                        : "false",
                      status: minute.status,
                      remarks: minute.remarks ?? "",
                    },
                  })
                }
                activeOpacity={0.7}
                className="border border-gray-200 bg-white rounded-xl p-3 mb-3"
              >
                <Text className="font-bold text-indigo-600 mb-1">
                  {minute.serialNo}. {minute.issueSubject}
                </Text>
                {minute.description && (
                  <Text className="text-gray-700 mb-1">
                    {minute.description}
                  </Text>
                )}
                <Text className="text-gray-500 text-sm">
                  Raised By:{" "}
                  {minute.raisedBy
                    .map((r: any) => capitalizeFirst(r.name))
                    .join(", ")}
                </Text>
                <Text className="text-gray-500 text-sm">
                  Responsible:{" "}
                  {minute.responsibilityForInfo
                    ? "For Information"
                    : minute.responsibility
                        .map((r: any) => capitalizeFirst(r.name))
                        .join(", ")}
                </Text>
                <Text className="text-gray-500 text-sm">
                  Status:{" "}
                  <Text
                    className={`${
                      minute.status === "open"
                        ? "text-red-500"
                        : minute.status === "closed"
                        ? "text-green-500"
                        : "text-yellow-500"
                    } font-semibold`}
                  >
                    {minute.status.toUpperCase()}
                  </Text>
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <Text className="text-center mt-10 text-gray-500">
            Meeting not found
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default MinutesDetail;
