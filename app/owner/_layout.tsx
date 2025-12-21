import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, BarChart3, Package, Users, Settings, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';

export default function OwnerTabLayout() {
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.dark.tint,
                tabBarInactiveTintColor: Colors.dark.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.dark.card,
                    borderTopWidth: 1,
                    borderTopColor: Colors.dark.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Overview',
                    tabBarIcon: ({ size, color }) => (
                        <Home size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ size, color }) => (
                        <BarChart3 size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory',
                    tabBarIcon: ({ size, color }) => (
                        <Package size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="staff"
                options={{
                    title: 'Staff',
                    tabBarIcon: ({ size, color }) => (
                        <Users size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ size, color }) => (
                        <User size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    href: null,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="tables"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="staff/[id]"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
