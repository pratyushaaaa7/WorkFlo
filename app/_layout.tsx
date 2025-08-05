
import { Drawer } from 'expo-router/drawer';
import "../global.css";


export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home' }} />
      <Drawer.Screen name="explore" options={{ drawerLabel: 'Explore' }} />
    </Drawer>
  );
}
