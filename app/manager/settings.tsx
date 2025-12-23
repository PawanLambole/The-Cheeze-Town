import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Bell, Lock, Globe, IndianRupee, Printer, Database, Info, LogOut, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { Colors } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { notificationPreferences } from '@/services/notificationPreferences';
import { orderNotificationService } from '@/services/orderNotificationService';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true, value, hasSwitch, switchValue, onSwitchChange }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={hasSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>{icon}</View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {hasSwitch && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#3F3F46', true: Colors.dark.primary }}
            thumbColor={switchValue ? '#FFFFFF' : '#F4F4F5'}
          />
        )}
        {showArrow && !hasSwitch && <ChevronRight size={18} color={Colors.dark.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
}

interface SettingsScreenProps {
  showHeader?: boolean;
  isOwner?: boolean;
}

export default function SettingsScreen({ showHeader = true, isOwner = true }: SettingsScreenProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bannerNotificationsEnabled, setBannerNotificationsEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  // Load notification preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await notificationPreferences.get();
    setPushNotificationsEnabled(prefs.pushEnabled);
    setSoundEnabled(prefs.soundEnabled);
    setBannerNotificationsEnabled(prefs.bannerEnabled);
  };

  const handlePushToggle = async (value: boolean) => {
    setPushNotificationsEnabled(value);
    await notificationPreferences.update('pushEnabled', value);
    await orderNotificationService.updatePreferences({
      pushEnabled: value,
      soundEnabled,
      bannerEnabled: bannerNotificationsEnabled,
    });
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await notificationPreferences.update('soundEnabled', value);
    await orderNotificationService.updatePreferences({
      pushEnabled: pushNotificationsEnabled,
      soundEnabled: value,
      bannerEnabled: bannerNotificationsEnabled,
    });
  };

  const handleBannerToggle = async (value: boolean) => {
    setBannerNotificationsEnabled(value);
    await notificationPreferences.update('bannerEnabled', value);
    await orderNotificationService.updatePreferences({
      pushEnabled: pushNotificationsEnabled,
      soundEnabled,
      bannerEnabled: value,
    });
  };

  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('manager.settings.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('manager.settings.language')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.languageLeft}>
                <Languages size={20} color={Colors.dark.primary} style={styles.settingIcon} />
                <Text style={styles.languageText}>{t('manager.settings.english')}</Text>
              </View>
              {i18n.language === 'en' && (
                <View style={styles.selectedDot} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => handleLanguageChange('mr')}
            >
              <View style={styles.languageLeft}>
                <Languages size={20} color={Colors.dark.primary} style={styles.settingIcon} />
                <Text style={styles.languageText}>{t('manager.settings.marathi')}</Text>
              </View>
              {i18n.language === 'mr' && (
                <View style={styles.selectedDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('manager.settings.notifications')}</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.primary} />}
              title="Push Notifications"
              subtitle="Receive order and update notifications"
              hasSwitch
              switchValue={pushNotificationsEnabled}
              onSwitchChange={handlePushToggle}
              showArrow={false}
            />
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.primary} />}
              title="Banner Notifications"
              subtitle="Show pop-up banner for new orders"
              hasSwitch
              switchValue={bannerNotificationsEnabled}
              onSwitchChange={handleBannerToggle}
              showArrow={false}
            />
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.primary} />}
              title="Sound"
              subtitle="Play sound for new orders"
              hasSwitch
              switchValue={soundEnabled}
              onSwitchChange={handleSoundToggle}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Settings</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Globe size={20} color={Colors.dark.primary} />}
              title="Restaurant Info"
              subtitle="Name, address, and contact details"
              onPress={() => Alert.alert('Coming Soon', 'Restaurant Info editing will be available in the next update.')}
            />
            {!isOwner && (
              <SettingItem
                icon={<IndianRupee size={20} color={Colors.dark.primary} />}
                title="Tax Settings"
                subtitle="Configure tax rates and types"
                value="5%"
                onPress={() => Alert.alert('Coming Soon', 'Tax Settings will be available in the next update.')}
              />
            )}
            <SettingItem
              icon={<Printer size={20} color={Colors.dark.primary} />}
              title="Auto Print Bills"
              subtitle="Automatically print bills after payment"
              hasSwitch
              switchValue={autoPrintEnabled}
              onSwitchChange={setAutoPrintEnabled}
              showArrow={false}
            />
          </View>
        </View>

        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.settingsList}>
              <SettingItem
                icon={<Lock size={20} color={Colors.dark.primary} />}
                title="Two-Factor Authentication"
                subtitle="Add an extra layer of security"
                onPress={() => Alert.alert('Coming Soon', '2FA implementation is in progress.')}
              />
            </View>
          </View>
        )}

        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Storage</Text>
            <View style={styles.settingsList}>
              <SettingItem
                icon={<Database size={20} color={Colors.dark.primary} />}
                title="Backup Data"
                subtitle="Create a backup of your data"
                onPress={() => Alert.alert('Backup', 'Backup feature coming soon.')}
              />
              <SettingItem
                icon={<Database size={20} color={Colors.dark.primary} />}
                title="Clear Cache"
                subtitle="Free up storage space"
                onPress={() => {
                  Alert.alert(
                    'Clear Cache',
                    'Are you sure you want to clear the app cache?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully') }
                    ]
                  );
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Info size={20} color={Colors.dark.primary} />}
              title="Terms of Service"
              onPress={() => Alert.alert('Terms', 'Terms of Service will be displayed here.')}
            />
            <SettingItem
              icon={<Info size={20} color={Colors.dark.primary} />}
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Privacy Policy will be displayed here.')}
            />
            <SettingItem
              icon={<Info size={20} color={Colors.dark.primary} />}
              title={t('manager.settings.version')}
              value="1.0.0"
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('manager.profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Primary color with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  logoutSection: {
    marginTop: 32,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginLeft: 16,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
  },
});
