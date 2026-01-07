// // app/(auth)/_layout.tsx
// // import "../global.css";
// import { Slot, useRouter, useSegments, usePathname } from "expo-router";
// import { useEffect, useState } from "react";
// import { ActivityIndicator, View, Platform } from "react-native";
// import { AuthProvider, useAuth } from "../../context/AuthContext"; // Adjust path
// import Toast from "react-native-toast-message";
// import { GestureHandlerRootView } from "react-native-gesture-handler";

// export default function AuthLayout() {
//   return (
//     <AuthProvider>
//       <LayoutWithAuth />
//       <Toast />
//     </AuthProvider>
//   );
// }

// function LayoutWithAuth() {
//   const router = useRouter();
//   const segments = useSegments();
//   const pathname = usePathname();
//   const { isAuthenticated, authLoading } = useAuth();
//   const [iosRedirected, setIosRedirected] = useState(false);

//   // Android redirects
//   useEffect(() => {
//     if (Platform.OS !== "android") return;
//     if (authLoading) return;

//     const current = segments.join("/");

//     if (!isAuthenticated) {
//       if (current !== "login") {
//         router.replace("/(auth)/login");
//       }
//     } else {
//       if (current === "login" || current === "") {
//         router.replace("/projects"); // Redirect to default page after login
//       }
//     }
//   }, [authLoading, isAuthenticated, segments]);

//   // iOS redirects
//   useEffect(() => {
//     if (Platform.OS !== "ios") return;
//     if (authLoading) return;
//     if (iosRedirected) return;

//     if (!isAuthenticated) {
//       if (pathname !== "/(auth)/login") {
//         router.replace("/(auth)/login");
//       }
//       return;
//     }

//     if (isAuthenticated && pathname === "/") {
//       router.replace("/projects"); // Redirect default after login
//       setIosRedirected(true);
//     }
//   }, [authLoading, isAuthenticated, pathname, iosRedirected]);

//   // Show loader while auth state is loading
//   if (authLoading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Slot />
//     </GestureHandlerRootView>
//   );
// }


import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function AuthLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
