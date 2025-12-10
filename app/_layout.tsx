import "../global.css"; // For TailwindCSS (keep this)
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Platform } from "react-native";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from "../context/AuthContext"; // Adjust path accordingly
import Toast from "react-native-toast-message";
import { usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler"; 

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
  const pathname = usePathname();
  const { isAuthenticated, authLoading } = useAuth();
  const [iosRedirected, setIosRedirected] = useState(false);

  //   useEffect(() => {
  //   console.log("🔹 Current segments:", segments);
  // }, [segments]);

  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   console.log("🔁 RootLayout mounted → waiting for auth load");
  //   setLoading(false);
  // }, []);

  // useEffect(() => {
  //   // if (loading) return;
  //   if (authLoading) return;

  //   const current = segments.join("/");
  //   // console.log("🧭 NAVIGATION CHECK:", {
  //   //   currentSegment: current,
  //   //   isAuthenticated,
  //   // });

  //   if (!isAuthenticated) {
  //     if (current !== "login") {
  //       console.log("➡️ Redirecting to /login (not authenticated)");
  //       router.replace("/login");
  //     }
  //   } else {
  //     if (current === "login" || current === "") {
  //       console.log("➡️ Redirecting to /projects (authenticated)");
  //       router.replace("/(drawer)/projects");
  //     }
  //   }
  // }, [authLoading, isAuthenticated, segments]);

  // ANDROID → your original working code
  useEffect(() => {
    if (Platform.OS !== "android") return; // Only run on Android
    if (authLoading) return;

    const current = segments.join("/");

    console.log("ANDROID redirect check →", { current, isAuthenticated });

    if (!isAuthenticated) {
      if (current !== "login") {
        console.log("➡️ ANDROID: Redirect → /login");
        router.replace("/login");
      }
    } else {
      if (current === "login" || current === "") {
        console.log("➡️ ANDROID: Redirect → /projects");
        router.replace("/(drawer)/projects");
      }
    }
  }, [authLoading, isAuthenticated, segments]);

  // IOS → pathname-based logic
  // useEffect(() => {
  //   if (Platform.OS !== "ios") return;
  //   if (authLoading || iosRedirected) return;

  //   console.log("IOS redirect check →", { pathname, isAuthenticated });

  //   // NOT AUTHENTICATED
  //   if (!isAuthenticated) {
  //     if (pathname !== "/login") {
  //       console.log("➡️ IOS: Redirect → /login");
  //       router.replace("/login");
  //       setIosRedirected(true); // prevent future redirects
  //     }
  //     return;
  //   }

  //   // AUTHENTICATED → redirect only if at root
  //   if (isAuthenticated && pathname === "/") {
  //     console.log("➡️ IOS: Redirect → /projects");
  //     router.replace("/(drawer)/projects");
  //     setIosRedirected(true); // prevent future redirects
  //   }
  // }, [authLoading, isAuthenticated, pathname, iosRedirected]);

// iOS FIX — Run redirect ONLY when authLoading is finished
useEffect(() => {
  if (Platform.OS !== "ios") return;

  // Wait until AuthContext finishes loading
  if (authLoading) return;

  console.log("iOS Redirect Check:", {
    pathname,
    isAuthenticated,
  });

  // 1️⃣ NOT AUTHENTICATED → Always go to /login
  if (!isAuthenticated) {
    if (pathname !== "/login") {
      console.log("➡️ iOS Redirect to /login");
      router.replace("/login");
    }
    return;
  }

  // 2️⃣ AUTHENTICATED → Redirect ONLY if user is on the root "/"
  if (isAuthenticated && pathname === "/") {
    console.log("➡️ iOS Redirect to /projects");
    router.replace("/(drawer)/projects");
  }
}, [authLoading, isAuthenticated, pathname]);


  // if (loading) {
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}

//--------------------------

// import "../global.css";
// import { Slot, useRouter, useSegments } from "expo-router";
// import { useEffect } from "react";
// import { ActivityIndicator, View } from "react-native";
// import { AuthProvider, useAuth } from "../context/AuthContext";
// import Toast from "react-native-toast-message";
// import DrawerLayout from "./(drawer)/_layout";

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <LayoutWithAuth />
//       <Toast />
//     </AuthProvider>
//   );
// }

// function LayoutWithAuth() {
//   const router = useRouter();
//   const segments = useSegments() as string[];
//   const { isAuthenticated, authLoading } = useAuth();
//   const current = segments.join("/");

//   useEffect(() => {
//     if (authLoading) return;

//     if (!isAuthenticated) {
//       if (current !== "login") router.replace("/login");
//       return;
//     }

//     if (current === "" || current === "login") {
//       setTimeout(() => {
//         router.replace("/(drawer)/projects");
//       }, 50);
//     }
//   }, [authLoading, isAuthenticated, current]);

//   if (authLoading)
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );

//   return <Slot />;
// }
