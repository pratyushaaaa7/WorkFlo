import { Drawer } from "expo-router/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

      {/* <Drawer.Screen
        name="myDashboard"
        options={{
          drawerLabel: "My Dashboard",
          title: "My Dashboard",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={size}
              color={color}
            />
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
          name="usage"
          options={{
            drawerLabel: "Usage",
            title: "Usage",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="document-text-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      ) : (
        <Drawer.Screen
          name="usage"
          options={{
            drawerItemStyle: { display: "none" }, // hide from drawer
          }}
        />
      )}

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
        name="appSupport"
        options={{
          drawerLabel: "App Support",
          title: "App Support",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color="black" />
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
      <Drawer.Screen
        name="centralUserDirectory"
        options={{
          drawerLabel: "Central Directory",
          title: "Central Directory",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="centralEmployeeDirectory"
        options={{
          drawerLabel: "Employee Directory",
          title: "Employee Directory",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-tie-outline" // 👔 internal staff
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Drawer>
  );
}
