import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 justify-center items-center px-6 bg-white"
    >
      <Text className="text-3xl font-bold mb-8">WTech Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        className="border w-full px-3 py-2 mb-4 rounded"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border w-full px-3 py-2 mb-6 rounded"
      />

      <Pressable onPress={handleLogin} className="bg-blue-600 py-3 rounded w-full items-center">
        <Text className="text-white font-bold text-lg">Login</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
