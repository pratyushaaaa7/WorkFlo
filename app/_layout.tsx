import '../global.css';  // For TailwindCSS (keep this)
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Adjust path accordingly

export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutWithAuth />
    </AuthProvider>
  );
}

function LayoutWithAuth() {
  const router = useRouter();
  const segments = useSegments() as string[];

  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false); // No need to check AsyncStorage here anymore, AuthContext handles it
  }, []);

  useEffect(() => {
    if (!loading) {
      const inDrawer = segments[0] === '(drawer)';
      const inLogin = segments[0] === 'login';

      if (!isAuthenticated && !inLogin) {
        router.replace('/login');
      } else if (isAuthenticated && !inDrawer) {
        router.replace('/(drawer)');
      }
    }
  }, [loading, isAuthenticated, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
