import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function DrawerLayout() {
  const { isAuthenticated , loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading ]);

    if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


  if (!isAuthenticated) return null;

  return (
    <Drawer>
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

      <Drawer.Screen
        name="ilrForm"
        options={{
          drawerLabel: "ILR Form",
           title: "ILR Form", 
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="createProject"
        
        options={{
          drawerLabel: "Create Project",
           title: "Create Project", 
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />

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
    </Drawer>
  );
}
