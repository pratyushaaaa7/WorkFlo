import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

type TokenPayload = {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
};

export default function HomeScreen() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded: TokenPayload = jwtDecode(token);
        setUsername(decoded.username);  // Get username from token
      }
    };
    fetchUsername();
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold">Welcome!</Text>
      {username && (
        <Text className="text-lg mt-2">Hello, {username}</Text>
      )}
    </View>
  );
}
