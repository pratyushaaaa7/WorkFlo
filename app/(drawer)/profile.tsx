import { View, Text, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';  // <-- Import useAuth

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();  // <-- Get logout function from AuthContext
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUsername = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<TokenPayload>(token);
          setUsername(decoded.username);
        } catch (err) {
          console.error('Failed to decode token', err);
        }
      }
    };
    fetchUsername();
  }, []);

  const handleLogout = async () => {
    await logout();  // <-- Use AuthContext's logout function to update global auth state
    Alert.alert('Logged Out');
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        Profile
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Logged in as: {username}
      </Text>
      <Pressable
        onPress={handleLogout}
        style={{
          backgroundColor: 'red',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
      </Pressable>
    </View>
  );
}
