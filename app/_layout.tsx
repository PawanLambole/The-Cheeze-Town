import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import '@/i18n'; // Initialize i18n

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#121212' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="manager" options={{ headerShown: false }} />
        <Stack.Screen name="owner" options={{ headerShown: false }} />
        <Stack.Screen name="menu/index" options={{ headerShown: false }} />
        <Stack.Screen name="inventory/index" options={{ headerShown: false }} />
        <Stack.Screen name="chef" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
