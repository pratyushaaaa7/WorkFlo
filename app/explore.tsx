import { Text, View, StyleSheet } from 'react-native';

export const options = {
  drawerLabel: 'Explore Page',  // Sidebar label
};

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',  // white background
  },
  text: {
    fontSize: 24,  // equivalent to 'text-2xl'
    fontWeight: 'bold',
    color: '#22c55e',  // Tailwind's 'text-green-500'
  },
});
