import { Stack } from 'expo-router';
import { Colors } from '@/constants/Theme';

export default function ChefLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.dark.background },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
    );
}
