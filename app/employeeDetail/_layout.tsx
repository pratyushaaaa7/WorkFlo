import { Stack } from "expo-router";
import React from "react";

export default function EmployeeDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        dangerouslySingular={({ params }: any) => params?.userId}
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
