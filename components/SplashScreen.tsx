import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import thuhrohLogo from "@/assets/images/thuhrohLogo.png";

const { width, height } = Dimensions.get("window");

const SplashScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ["#1A1A1A", "#0D0D0D"] : ["#6366F1", "#8B5CF6"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={thuhrohLogo}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Optional: Add a subtle loading indicator or text if needed */}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: "center",
    alignItems: "center",
    // Premium shadow for the logo container
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
  },
  logo: {
    width: "100%",
    height: "100%",
    tintColor: "#fff", // Force logo to be white on the gradient background
  },
});

export default SplashScreen;
