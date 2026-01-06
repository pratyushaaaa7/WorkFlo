import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Slot, usePathname, useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
      <Toast />
    </AuthProvider>
  );
}

function AppLayout() {
  // 1. Hooks (must be at top level)
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { isAuthenticated, authLoading, user } = useAuth();

  // Memoize drawer items (safe to calculate even if not used)
  const drawerItems = useMemo(() => {
    const items = [
      {
        name: "profile",
        label: "Profile",
        icon: ({ color, size }: any) => (
          <Ionicons name="person-circle-outline" size={size} color={color} />
        ),
      },
      {
        name: "projects",
        label: "Projects",
        icon: ({ color, size }: any) => (
          <Ionicons name="briefcase-outline" size={size} color={color} />
        ),
      },
      {
        name: "appSupport",
        label: "App Support",
        icon: ({ color, size }: any) => (
          <Ionicons name="construct-outline" size={size} color={color} />
        ),
      },
      {
        name: "masterProjectList",
        label: "Project List",
        icon: ({ color, size }: any) => (
          <Ionicons name="list-outline" size={size} color={color} />
        ),
      },
      {
        name: "centralUserDirectory",
        label: "Central Directory",
        icon: ({ color, size }: any) => (
          <Ionicons name="people-outline" size={size} color={color} />
        ),
      },
      {
        name: "centralEmployeeDirectory",
        label: "Employee Directory",
        icon: ({ color, size }: any) => (
          <MaterialCommunityIcons
            name="account-tie-outline"
            size={size}
            color={color}
          />
        ),
      },
    ];

    if (user?.role === "admin") {
      items.push(
        {
          name: "usage",
          label: "Usage",
          icon: ({ color, size }: any) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        },
        {
          name: "registerUser",
          label: "Register User",
          icon: ({ color, size }: any) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
        }
      );
    }
    return items;
  }, [user?.role]);

  // Redirect if not authenticated
  useEffect(() => {
    // Check if user is already in (auth) group to avoid loop
    const inAuthGroup = segments[0] === "(auth)";

    if (!authLoading && !isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, authLoading, segments]);

  // Redirect to default page after login
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      (pathname === "/" || pathname === "/(auth)/login")
    ) {
      router.replace("/projects");
    }
  }, [isAuthenticated, authLoading, pathname]);

  // Extract CustomDrawerContent as a proper component or render prop
  const CustomDrawerContent = (props: any) => {
    // Helper Use active route to highlight
    const currentRouteName = props.state?.routes[props.state.index]?.name;

    return (
      <View className="flex-1 bg-[#1A1A1A]">
        {/* Header: Brand / Close */}
        <View className="pt-12 px-6 pb-6 flex-row justify-between items-center">
          <View className="flex-row items-center">
            {/* Logo placeholder */}
            <View className="w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center mr-3">
              <Text className="text-white font-bold text-lg">T</Text>
            </View>
            <Text className="text-white text-2xl font-bold tracking-tight">
              Thuhroh
            </Text>
          </View>
          <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <View className="flex-1 px-3 py-2">
          {drawerItems.map((item) => {
            const isActive = currentRouteName === item.name;
            const activeColor = isActive ? "#818cf8" : "#9CA3AF";

            return (
              <TouchableOpacity
                key={item.name}
                className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl ${
                  isActive ? "bg-[#252525]" : "transparent"
                }`}
                onPress={() => router.push(`/${item.name}`)}
              >
                <View className="flex-row items-center">
                  <View className={isActive ? "opacity-100" : "opacity-60"}>
                    {item.icon({ color: activeColor, size: 22 })}
                  </View>
                  <Text
                    className={`ml-4 text-base font-medium ${
                      isActive ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={activeColor}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom: User Profile */}
        <View className="p-4 border-t border-gray-800 bg-[#1A1A1A]">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push("/profile")}
          >
            <View className="w-12 h-12 rounded-full bg-indigo-600 items-center justify-center border-2 border-[#252525]">
              <Text className="text-white font-bold text-lg">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold text-base">
                {user?.username || "Guest User"}
              </Text>
              <Text className="text-gray-500 text-xs">
                {user?.role || "Viewer"}
              </Text>
            </View>

            <TouchableOpacity
              className="p-2 bg-[#252525] rounded-full"
              onPress={() => {
                router.replace("/(auth)/login");
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 2. Conditional Renders

  // Loader while auth is loading
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // While not authenticated → just render Slot (auth pages)
  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    );
  }

  // 3. Main Drawer Render
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        backBehavior="history"
        screenOptions={({ route }) => {
          const isMainDrawerRoute = drawerItems.some(
            (item) => item.name === route.name
          );

          const commonOptions = {
            swipeEnabled: true,
            swipeEdgeWidth: 100,
            drawerType: "slide" as const,
            overlayColor: "transparent",
            drawerStyle: {
              width: "80%",
              // iOS Shadow
              shadowColor: "#000",
              shadowOffset: { width: 5, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              // Android Shadow
              elevation: 20,
              backgroundColor: "#1A1A1A",
            },
          };

          // If not a main drawer route, hide the global header
          // so the individual screen can show its own header
          if (!isMainDrawerRoute) {
            return { ...commonOptions, headerShown: false };
          }

          return {
            ...commonOptions,
            headerShown: true,
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
            headerBackground: () => (
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={StyleSheet.absoluteFill}
              />
            ),
          };
        }}
      >
        {drawerItems.map((item) => (
          <Drawer.Screen
            key={item.name}
            name={item.name}
            options={{ headerShown: true, title: item.label }}
          />
        ))}
        {/* 'otherPage' removed as it caused a warning. 
            All other routes will be auto-handled by Drawer with the global screenOptions logic above. */}
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
  },
});

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
