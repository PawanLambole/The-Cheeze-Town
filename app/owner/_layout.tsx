import { View, Platform, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, ShoppingCart, Package, Users, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OwnerTabLayout() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

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
                    height: Platform.OS === 'web' ? 70 : 60 + insets.bottom,
                    paddingBottom: Platform.OS === 'web' ? 10 : insets.bottom + 8,
                    paddingTop: Platform.OS === 'web' ? 8 : 8,
                    display: 'flex',
                    position: Platform.OS === 'web' ? 'fixed' : 'relative',
                    bottom: Platform.OS === 'web' ? 0 : undefined,
                    left: Platform.OS === 'web' ? 0 : undefined,
                    right: Platform.OS === 'web' ? 0 : undefined,
                    zIndex: Platform.OS === 'web' ? 99999 : undefined,
                    overflow: Platform.OS === 'web' ? 'visible' : undefined,
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: Platform.OS === 'web' ? 11 : 12,
                    fontWeight: '600',
                    marginTop: Platform.OS === 'web' ? 2 : 0,
                },
                tabBarItemStyle: Platform.OS === 'web' ? {
                    height: 60,
                    paddingVertical: 4,
                } : undefined,
                tabBarActiveBackgroundColor: Platform.OS === 'web' ? 'transparent' : undefined,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('navigation.home'),
                    tabBarIcon: ({ size, color }) => (
                        <Home size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="purchases"
                options={{
                    title: t('owner.purchases'),
                    tabBarIcon: ({ size, color }) => (
                        <ShoppingCart size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="create-order"
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: ({ focused }) => (
                        <View
                            style={{
                                top: Platform.OS === 'web' ? -15 : (Platform.OS === 'ios' ? -5 : -10),
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: '#000000',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: Platform.OS !== 'web' ? Colors.dark.primary : undefined,
                                shadowOffset: Platform.OS !== 'web' ? {
                                    width: 0,
                                    height: 4,
                                } : undefined,
                                shadowOpacity: Platform.OS !== 'web' ? 0.3 : undefined,
                                shadowRadius: Platform.OS !== 'web' ? 4 : undefined,
                                elevation: Platform.OS === 'android' ? 5 : undefined,
                                borderWidth: 4,
                                borderColor: Colors.dark.background,
                                ...(Platform.OS === 'web' && {
                                    boxShadow: `0 4px 8px rgba(251, 191, 36, 0.3)`,
                                }),
                                overflow: 'hidden',
                            }}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: t('manager.navigation.inventory'),
                    tabBarIcon: ({ size, color }) => (
                        <Package size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="staff"
                options={{
                    title: t('owner.staff'),
                    tabBarIcon: ({ size, color }) => (
                        <Users size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('settings.title'),
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
                name="tables/[id]"
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
            <Tabs.Screen
                name="revenue"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="order-history"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="payment-history"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="offers"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
