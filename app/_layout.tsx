import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { Ionicons } from "@expo/vector-icons";
import {
  AlertCircleIcon,
  ArchiveArrowDownIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  File02Icon,
  Home01Icon,
  ProfileIcon,
  UserGroup03Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import {
  Redirect,
  Slot,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

import {
  Poppins_400Regular,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
      <Toast />
    </AuthProvider>
  );
}

function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { isAuthenticated, authLoading, user, logout } = useAuth();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  const colorScheme = useColorScheme(); // returns "dark" or "light"
  const isDarkMode = colorScheme === "dark";

  // 🔍 Debug: Check what user data is available
  // console.log("🔍 User in AppLayout:", JSON.stringify(user, null, 2));

  // Memoize drawer items (safe to calculate even if not used)
  const drawerItems = useMemo(() => {
    const items = [
      {
        name: "dashboard",
        label: "Dashboard",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={Home01Icon} size={size} color={color} />
        ),
      },
      {
        name: "projects",
        label: "Projects",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={File02Icon} size={size} color={color} />
        ),
      },
      {
        name: "masterProjectList",
        label: "Project List",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={ProfileIcon} size={size} color={color} />
        ),
      },
      {
        name: "centralEmployeeDirectory",
        label: "Employee Directory",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={UserMultiple02Icon} size={size} color={color} />
        ),
      },
      {
        name: "centralUserDirectory",
        label: "Central Directory",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={UserGroup03Icon} size={size} color={color} />
        ),
      },
      {
        name: "appSupport",
        label: "App Support",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={AlertCircleIcon} size={size} color={color} />
        ),
      },
    ];

    if (user?.role === "admin") {
      items.push(
        {
          name: "usage",
          label: "Usage",
          icon: ({ color, size }: any) => (
            <HugeiconsIcon
              icon={ArchiveArrowDownIcon}
              size={size}
              color={color}
            />
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

  // ------------------ AUTH GUARD ------------------

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Just let the render return <Redirect /> or Slot, but we can also imperatively push if needed.
      // However, relying on the return below is safer to avoid JUMP_TO errors.
    }
  }, [authLoading, isAuthenticated, segments]);

  // Redirect authenticated users away from auth screens
  useEffect(() => {
    if (authLoading) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      router.replace("/projects");
    }
  }, [authLoading, isAuthenticated, segments]);

  // ------------------ LOADER ------------------
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ------------------ AUTH PAGES ------------------
  if (!isAuthenticated) {
    // If we are not in the (auth) group, we should redirect to login
    // We check segments to avoid infinite redirect loops if we are already there
    const inAuthGroup = segments[0] === "(auth)";
    if (!inAuthGroup) {
      return <Redirect href="/(auth)/login" />;
    }

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    );
  }

  // Safeguard: If authenticated but somehow strict checking needed
  // But let's keep the user object check
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ------------------ SAFEGUARD FOR ROUTING ------------------
  // If we are authenticated but the URL is still pointing to an auth screen,
  // we render the Slot (keeping the Login screen visible) until the router redirects.
  // This prevents the Drawer from detecting an invalid route ("JUMP_TO" error)
  // and avoids a jarring "Loading" spinner flash.
  if (isAuthenticated && segments[0] === "(auth)") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    );
  }

  // Extract CustomDrawerContent as a proper component or render prop
  const CustomDrawerContent = (props: any) => {
    // Helper Use active route to highlight
    const currentRouteName = props.state?.routes[props.state.index]?.name;

    return (
      <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
        {/* Header: Brand / Close */}
        <View className="pt-12 px-6 pb-6 flex-row justify-between items-center">
          <View className="flex-row items-center">
            {/* Logo placeholder */}
            <View className="w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center mr-3">
              <Text className="text-white font-bold text-lg">T</Text>
            </View>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">
              Thuhroh
            </Text>
          </View>
          <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={24}
              color={isDarkMode ? "#919191" : "#454545"}
            />
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <View className="flex-1 px-3 py-2">
          {drawerItems.map((item) => {
            const isActive = currentRouteName === item.name;
            // Determine arrow color
            const arrowColor = isDarkMode
              ? "#919191" // gray for dark mode
              : "#454545"; // default for light mode

            return (
              <TouchableOpacity
                key={item.name}
                className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl  ${
                  isActive ? "bg-indigo-50  dark:bg-[#27215880]" : "transparent"
                }`}
                onPress={() => router.push(`/${item.name}`)}
              >
                <View className="flex-row items-center">
                  <View>
                    {item.icon({
                      color: isActive
                        ? "#5B4CCC" // Indigo-600 when active
                        : isDarkMode
                        ? "#919191" // Gray for dark mode when inactive
                        : "#454545", // Default gray for light mode when inactive
                      size: 24,
                    })}
                  </View>
                  <Text
                    className={`ml-4 text-base  ${
                      isActive
                        ? "text-indigo-600 dark:text-[#5B4CCC] font-poppinsMedium"
                        : "text-[#454545] dark:text-[#919191] font-poppins"
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>

                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={24}
                  color={arrowColor}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom: User Profile */}
        <View className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center flex-1"
            onPress={() => router.push("/profile")}
          >
            <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-600 items-center justify-center border-2 border-indigo-200 dark:border-[#252525]">
              <Text className="text-indigo-600 dark:text-white font-bold text-lg">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <View className="ml-3 flex-1">
              <Text
                className="text-gray-900 dark:text-white font-semibold text-base"
                numberOfLines={1}
              >
                {user?.fullName || "Guest User"}
              </Text>
              <Text className="text-gray-500 text-xs">
                {user?.designation || "Viewer"}
              </Text>
            </View>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={24}
              color={isDarkMode ? "#919191" : "#454545"}
            />
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
          const isMainDrawerRoute =
            drawerItems.some((item) => item.name === route.name) ||
            route.name === "profile";

          const commonOptions = {
            swipeEnabled: true,
            swipeEdgeWidth: 70,
            drawerType: "slide" as const,
            overlayColor: "transparent",
            drawerStyle: {
              width: "80%" as any,
              shadowColor: "#000",
              shadowOffset: { width: 5, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 20,
              backgroundColor: "#1A1A1A",
            },
            sceneContainerStyle: {
              backgroundColor: "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: -5, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 20,
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
            options={{
              headerShown: item.name === "dashboard" ? false : true,
              title: item.label,
            }}
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
