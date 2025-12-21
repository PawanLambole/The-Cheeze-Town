import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, User, UtensilsCrossed, PlusCircle, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';

export default function TabLayout() {
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
          title: t('manager.navigation.home'),
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('manager.navigation.menu'),
          tabBarIcon: ({ size, color }) => (
            <UtensilsCrossed size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          title: t('manager.navigation.createOrder'),
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                top: Platform.OS === 'ios' ? -5 : -10,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: Colors.dark.primary,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: Colors.dark.primary,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
                borderWidth: 4,
                borderColor: Colors.dark.background,
              }}>
              <PlusCircle size={30} color="#000000" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: t('manager.navigation.staff'),
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('manager.navigation.profile'),
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
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
        name="purchases"
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
        name="revenue"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
