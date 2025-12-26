import * as Crypto from 'expo-crypto';

// Polyfill for crypto-js
const polyfillCrypto = () => {
  if (!global.crypto) {
    // @ts-ignore
    global.crypto = {};
  }
  if (!global.crypto.getRandomValues) {
    // @ts-ignore
    global.crypto.getRandomValues = (array) => {
      // @ts-ignore
      return Crypto.getRandomValues(array as any);
    };
  }
};
polyfillCrypto();
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationSettingsProvider } from '@/contexts/NotificationSettingsContext';
import '@/i18n'; // Initialize i18n

function RootLayoutNav() {
  const { isAuthenticated, loading, userData } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
      // Redirect logic for authenticated users is now handled in login/index.tsx
      // to allow for role verification before redirecting.
    }
  }, [isAuthenticated, loading, segments, userData]);

  return (
    <>
      <StatusBar
        style="light"
        backgroundColor="transparent"
        translucent={true}
      />
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

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <NotificationSettingsProvider>
        <RootLayoutNav />
      </NotificationSettingsProvider>
    </AuthProvider>
  );
}
