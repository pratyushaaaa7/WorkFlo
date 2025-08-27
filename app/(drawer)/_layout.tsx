import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
// import { View, ActivityIndicator } from "react-native";

export default function DrawerLayout() {
  const { isAuthenticated, user } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Drawer
      screenOptions={{
        headerTintColor: "#fff", // title & icon color
        headerTitleStyle: { fontWeight: "bold" },
        headerBackground: () => (
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "User Profile",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 
      <Drawer.Screen
        name="ilrForm"
        options={{
          drawerLabel: "ILR Form",
          title: "ILR Form",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      /> */}

      {/* <Drawer.Screen
        name="createProject"
        options={{
          drawerLabel: "Create Project",
          title: "Create Project",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      /> */}

      {user?.role === "admin" ? (
        <Drawer.Screen
          name="registerUser"
          options={{
            drawerLabel: "Register User",
            title: "Register User",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-add-outline" size={size} color={color} />
            ),
          }}
        />
      ) : (
        <Drawer.Screen
          name="registerUser"
          options={{
            // hide from drawer but still accessible if navigated directly
            drawerItemStyle: { display: "none" },
          }}
        />
      )}

      <Drawer.Screen
        name="projects"
        options={{
          drawerLabel: "Projects",
          title: "Projects",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="masterProjectList"
        options={{
          drawerLabel: "Project List",
          title: "Master Project List",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
