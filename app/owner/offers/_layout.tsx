import { Stack } from 'expo-router';
import { Colors } from '@/constants/Theme';

export default function OffersLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="create" options={{ headerShown: false }} />
        </Stack>
    );
}
