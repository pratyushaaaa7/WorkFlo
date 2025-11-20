import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/images/bita.png";
import Icon from "react-native-vector-icons/Feather"; // Feather for eye icon
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const { login } = useAuth();
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
      const { token, user } = response.data;
      await login(token, user);

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
        position: "bottom",
      });
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
    <LinearGradient
      colors={["#6366F1", "#8B5CF6"]}
      className="flex-1"
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 30}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Animated.View
          style={{ transform: [{ scale: logoScale }] }}
          className="mb-8 items-center"
        >
          <View className="bg-slate-950 rounded-full p-5 shadow-md shadow-black/10">
            <Image source={Logo} className="w-20 h-20" resizeMode="contain" />
          </View>
          <Text className="text-white text-2xl mt-20 font-medium">
            Login to your account
          </Text>
        </Animated.View>

        {/* Login Form */}
        <View className="bg-white w-full p-6 rounded-3xl shadow-lg shadow-black/10">
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            className="border border-gray-300 text-black w-full px-4 py-3 mb-4 rounded-xl text-base"
            placeholderTextColor="#999"
          />

          {/* Password with toggle */}
          <View className="relative mb-2">
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              className="border border-gray-300 text-black w-full px-4 py-3 pr-12 rounded-xl text-base"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setSecureText(!secureText)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Icon
                name={secureText ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`${
              loading ? "bg-indigo-400" : "bg-indigo-600"
            } py-3 rounded-xl w-full mt-4 items-center active:scale-95`}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Login</Text>
            )}
          </Pressable>
        </View>

        {/* Footer Disclaimer */}
        <View className="mt-10 items-center">
          <Text className="text-white text-xs text-center">
            © 2025 WTech. All rights reserved.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
