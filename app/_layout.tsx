import thuhrohLogo from "@/assets/images/thuhrohLogo.png";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
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
import { Slot, useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  LogBox,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";


import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/CustomToast";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import { useUsageTracking } from "../hooks/useUsageTracking";

const CustomDrawerContent = (props: any) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { user } = useAuth();

  const currentRouteName = props.state?.routes[props.state.index]?.name;

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      <View className="pt-12 px-6 pb-6 flex-row justify-between items-center">
        <View className="flex-row items-center">
          {/* <Image
            source={isDarkMode ? logoDark : logoLight}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          /> */}
          <View className="w-8 h-8 rounded-lg  items-center justify-center mr-3">
            {/* <Text className="text-white font-bold text-lg">T</Text> */}
            <Image
              source={thuhrohLogo}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
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

      <View className="flex-1 px-3 py-2">
        {props.drawerItems.map((item: any) => {
          const isActive = currentRouteName === item.name;
          const arrowColor = isDarkMode ? "#919191" : "#454545";

          return (
            <TouchableOpacity
              key={item.name}
              className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl  ${
                isActive ? "bg-indigo-50  dark:bg-[#27215880]" : "transparent"
              }`}
              onPress={() => router.push(`/${item.name}` as any)}
            >
              <View className="flex-row items-center flex-1">
                <View style={{ flexShrink: 0 }}>
                  {item.icon({
                    color: isActive
                      ? "#5B4CCC"
                      : isDarkMode
                        ? "#919191"
                        : "#454545",
                    size: 24,
                  })}
                </View>
                <Text
                  className={`ml-4 text-base ${
                    isActive
                      ? "text-indigo-600 dark:text-[#5B4CCC] font-poppinsMedium"
                      : "text-[#454545] dark:text-[#919191] font-poppins"
                  }`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
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

      <View className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => props.navigation.navigate("profile")}
        >
          <GlobalAvatar
            name={user?.fullName || user?.username || "Guest"}
            size={48}
            fontSize={18}
            borderRadius={16}
          />

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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="dark-content"
          />
          <AppLayout />
          <Toast config={toastConfig} />
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

function AppLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, authLoading, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // 🚀 Start Usage Tracking
  useUsageTracking();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

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
        label: "My Projects",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={File02Icon} size={size} color={color} />
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
      items.push({
        name: "masterProjectList",
        label: "Project List",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon icon={ProfileIcon} size={size} color={color} />
        ),
      });

      items.push({
        name: "usage",
        label: "Usage",
        icon: ({ color, size }: any) => (
          <HugeiconsIcon
            icon={ArchiveArrowDownIcon}
            size={size}
            color={color}
          />
        ),
      });
    }
    return items;
  }, [user?.role]);

  // Auth Guard
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, segments]);

  if (authLoading || !fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If authenticated but no user object yet, show loader
  if (isAuthenticated && !user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent {...props} drawerItems={drawerItems} />
        )}
        backBehavior="history"
        screenOptions={({ route }) => {
          const isMainDrawerRoute = drawerItems.some(
            (item) => item.name === route.name,
          );

          const commonOptions = {
            swipeEnabled: true,
            swipeEdgeWidth: 70, // 👈 Controls the swipe trigger width from the edge
            drawerType: "slide" as const,
            overlayColor: "rgba(0,0,0,0.5)",
            drawerStyle: {
              width: "80%" as any,
              backgroundColor: isDarkMode ? "#0d0d0d" : "#F6F8FA",
            },
            sceneContainerStyle: {
              backgroundColor: isDarkMode ? "#0d0d0d" : "#ffffff",
            },
          };

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
              headerShown: [
                "dashboard",
                "usage",
                "appSupport",
                "centralUserDirectory",
                "projects",
                "centralEmployeeDirectory",
                "masterProjectList",
              ].includes(item.name)
                ? false
                : true,
              title: item.label,
            }}
          />
        ))}
        <Drawer.Screen
          name="profile"
          options={{
            headerShown: false,
            title: "Profile",
          }}
        />
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
