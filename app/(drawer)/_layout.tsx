import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function DrawerLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login'); // Force redirect to login if not authenticated
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Don't render the drawer until auth check passes
  }

  return (
    <Drawer>
     
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

       <Drawer.Screen
        name="ilrForm"
        options={{
          drawerLabel: 'ILR Form',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />


    </Drawer>
  );
}
