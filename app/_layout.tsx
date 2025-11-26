import "../global.css"; // For TailwindCSS (keep this)
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from "../context/AuthContext"; // Adjust path accordingly
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutWithAuth />
      <Toast />
    </AuthProvider>
  );
}

function LayoutWithAuth() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
  console.log("🔹 Current segments:", segments);
}, [segments]);


  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   console.log("🔁 RootLayout mounted → waiting for auth load");
  //   setLoading(false);
  // }, []);

  useEffect(() => {
    // if (loading) return;
    if (authLoading) return;

    const current = segments.join("/");
    // console.log("🧭 NAVIGATION CHECK:", {
    //   currentSegment: current,
    //   isAuthenticated,
    // });

    if (!isAuthenticated) {
      if (current !== "login") {
        console.log("➡️ Redirecting to /login (not authenticated)");
        router.replace("/login");
      }
    } else {
      if (current === "login" || current === "") {
        console.log("➡️ Redirecting to /projects (authenticated)");
        router.replace("/(drawer)/projects");
      }
    }
  }, [authLoading, isAuthenticated, segments]);

  // if (loading) {
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
