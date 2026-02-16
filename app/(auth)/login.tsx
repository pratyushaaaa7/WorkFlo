import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather"; // Feather for eye icon

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss(); // ✅ Close keyboard immediately when button is pressed
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { username, password });
      console.log("Login response:", response.data); // 👈 see exactly what backend returns
      // console.log(
      //   "User object from API:",
      //   JSON.stringify(response.data.user, null, 2)
      // ); // 🔍 Detailed user inspection
      const { token, user } = response.data;
      // console.log("User object from API:", JSON.stringify(user, null, 2));
      await login(token, user);

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
        position: "bottom",
      });
      // 🔥 FIX: Redirect handled by RootLayout (Wait for auth state to update)
      // router.replace("/projects");
    } catch (err: any) {
      console.log(err.response?.data);

      const errorMessage =
        err.response?.data?.message || err.message || "Something went wrong";
      console.log(errorMessage);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: errorMessage, // Will show "Invalid credentials" if that's returned
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        flexGrow: 1,
        // justifyContent: "center",
        paddingHorizontal: 16,
      }}
      className="bg-white dark:bg-black"
      enableOnAndroid
      extraScrollHeight={Platform.OS === "ios" ? 20 : 30}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full mt-24">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-black dark:text-white text-[24px] font-dmBold mb-2">
            Login to your Account
          </Text>
        </View>

        {/* Username Field */}
        <View className="mb-6">
          <Text className="text-black dark:text-white text-base font-poppinsMedium mb-3 ml-1">
            Username
          </Text>
          <TextInput
            placeholder="e.g. W001"
            value={username}
            onChangeText={setUsername}
            className="bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white w-full px-5 py-4 rounded-2xl text-base font-poppins"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
          />
        </View>

        {/* Password Field */}
        <View className="mb-8">
          <Text className="text-black dark:text-white text-base font-poppinsMedium mb-3 ml-1">
            Password
          </Text>
          <View className="relative">
            <TextInput
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] text-black dark:text-white w-full px-5 py-4 rounded-2xl text-base font-poppins"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            />
            <TouchableOpacity
              onPress={() => setSecureText(!secureText)}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
            >
              <Icon
                name={secureText ? "eye-off" : "eye"}
                size={22}
                color={isDarkMode ? "#FFFFFF" : "#000000"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="py-4 rounded-2xl w-full overflow-hidden active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <LinearGradient
            colors={
              loading
                ? ["#A5B4FC", "#A5B4FC"] // light indigo when loading
                : ["#5B4CCC", "#6347C2", "#8056D1"] // gradient when active
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-dmSemiBold text-lg">Log In</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
