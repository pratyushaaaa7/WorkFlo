// import "../global.css"; // For TailwindCSS (keep this)
// import { Slot, useRouter, useSegments } from "expo-router";
// import { useEffect, useState } from "react";
// import { ActivityIndicator, View } from "react-native";
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AuthProvider, useAuth } from "../context/AuthContext"; // Adjust path accordingly
// import Toast from "react-native-toast-message";

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

// //   useEffect(() => {
// //   console.log("🔹 Current segments:", segments);
// // }, [segments]);


//   // const [loading, setLoading] = useState(true);

//   // useEffect(() => {
//   //   console.log("🔁 RootLayout mounted → waiting for auth load");
//   //   setLoading(false);
//   // }, []);

//   useEffect(() => {
//     // if (loading) return;
//     if (authLoading) return;

//     const current = segments.join("/");
//     // console.log("🧭 NAVIGATION CHECK:", {
//     //   currentSegment: current,
//     //   isAuthenticated,
//     // });

//     if (!isAuthenticated) {
//       if (current !== "login") {
//         console.log("➡️ Redirecting to /login (not authenticated)");
//         router.replace("/login");
//       }
//     } else {
//       if (current === "login" || current === "") {
//         console.log("➡️ Redirecting to /projects (authenticated)");
//         router.replace("/(drawer)/projects");
//       }
//     }
//   }, [authLoading, isAuthenticated, segments]);

//   // if (loading) {
//   if (authLoading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return <Slot />;
// }


//--------------------------

import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import DrawerLayout from "./(drawer)/_layout";

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
  const current = segments.join("/");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      if (current !== "login") router.replace("/login");
      return;
    }

    if (current === "" || current === "login") {
      setTimeout(() => {
        router.replace("/(drawer)/projects");
      }, 50);
    }
  }, [authLoading, isAuthenticated, current]);

  if (authLoading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );

  return <Slot />;
}
