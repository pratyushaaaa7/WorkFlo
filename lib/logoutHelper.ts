import { authRef } from "../context/AuthContext";
import { router } from "expo-router";

export const logoutUser = () => {
  if (authRef.current?.logout) {
    authRef.current.logout();     // Proper logout
  } else {
    console.log("⚠️ AuthRef not ready, forcing navigation");
    router.replace("/login");
  }
};
