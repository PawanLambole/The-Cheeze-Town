import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '@/constants/Theme';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <ChevronRight size={20} color={Colors.dark.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Navigate to login screen - exit from tab navigator
    // When inside tabs, we need to navigate to root index
    // Use push first to navigate, then replace to ensure it sticks
    router.push('/');
    setTimeout(() => {
      router.push('/');
    }, 50);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#000000" />
            </View>
          </View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileRole}>Manager</Text>
          <Text style={styles.profileEmail}>john.doe@cheezetown.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Mail size={20} color={Colors.dark.textSecondary} />}
              title="Email"
              subtitle="john.doe@cheezetown.com"
              onPress={() => console.log('Email pressed')}
            />
            <SettingItem
              icon={<Phone size={20} color={Colors.dark.textSecondary} />}
              title="Phone"
              subtitle="+91 98765 43210"
              onPress={() => console.log('Phone pressed')}
            />
            <SettingItem
              icon={<MapPin size={20} color={Colors.dark.textSecondary} />}
              title="Location"
              subtitle="Main Branch"
              onPress={() => console.log('Location pressed')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.textSecondary} />}
              title="Notifications"
              subtitle="Manage notification settings"
              onPress={() => console.log('Notifications pressed')}
            />
            <SettingItem
              icon={<Lock size={20} color={Colors.dark.textSecondary} />}
              title="Security"
              subtitle="Change password & security settings"
              onPress={() => console.log('Security pressed')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<HelpCircle size={20} color={Colors.dark.textSecondary} />}
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => console.log('Help pressed')}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: Colors.dark.card,
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingsList: {
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.dark.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    paddingBottom: 24,
  },
});
