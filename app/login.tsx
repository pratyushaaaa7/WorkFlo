import { View, Text, TextInput, Pressable, Alert, Platform, Image, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token } = response.data;
      await login(token);
      Alert.alert('Login Success');
    } catch (err: any) {
      console.log(err.response?.data);
      Alert.alert('Login Failed', err.response?.data?.message || 'Error');
    }
  };

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      className="flex-1"
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 30}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ transform: [{ scale: logoScale }] }} className="mb-10 items-center">
          {/* <Image source={require('../assets/logo.png')} className="w-24 h-24 mb-3" /> */}
          <Text className="text-white text-4xl font-extrabold">WTech</Text>
          <Text className="text-white text-base mt-1">Login to your account</Text>
        </Animated.View>

        <View className="bg-white w-full p-6 rounded-3xl shadow-lg">
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            className="border border-gray-300 w-full px-4 py-3 mb-4 rounded-xl text-base"
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="border text-black border-gray-300 w-full px-4 py-3 mb-6 rounded-xl text-base"
            placeholderTextColor="#999"
          />

          <Pressable
            onPress={handleLogin}
            className="bg-blue-600 py-3 rounded-xl w-full items-center active:scale-95"
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text className="text-white font-semibold text-lg">Login</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
