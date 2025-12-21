import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Bell, Lock, Globe, DollarSign, Printer, Database, Info, LogOut, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { Colors } from '@/constants/Theme';

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
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
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
            trackColor={{ false: Colors.dark.secondary, true: Colors.dark.primary }}
            thumbColor="#1E1E1E"
          />
        )}
        {showArrow && !hasSwitch && <ChevronRight size={20} color={Colors.dark.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
  };

  const handleLogout = () => {
    // Navigate to login screen (ensure exit from any stack)
    router.push('/');
    setTimeout(() => router.navigate('/'), 0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('manager.settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('manager.settings.language')}</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.languageLeft}>
                <Languages size={20} color={Colors.dark.textSecondary} style={styles.settingIcon} />
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
                <Languages size={20} color={Colors.dark.textSecondary} style={styles.settingIcon} />
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
              icon={<Bell size={20} color={Colors.dark.textSecondary} />}
              title="Push Notifications"
              subtitle="Receive order and update notifications"
              hasSwitch
              switchValue={notificationsEnabled}
              onSwitchChange={setNotificationsEnabled}
              showArrow={false}
            />
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.textSecondary} />}
              title="Sound"
              subtitle="Play sound for new orders"
              hasSwitch
              switchValue={soundEnabled}
              onSwitchChange={setSoundEnabled}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Settings</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Globe size={20} color={Colors.dark.textSecondary} />}
              title="Restaurant Info"
              subtitle="Name, address, and contact details"
              onPress={() => console.log('Restaurant info')}
            />
            <SettingItem
              icon={<DollarSign size={20} color={Colors.dark.textSecondary} />}
              title="Tax Settings"
              subtitle="Configure tax rates and types"
              value="5%"
              onPress={() => console.log('Tax settings')}
            />
            <SettingItem
              icon={<Printer size={20} color={Colors.dark.textSecondary} />}
              title="Auto Print Bills"
              subtitle="Automatically print bills after payment"
              hasSwitch
              switchValue={autoPrintEnabled}
              onSwitchChange={setAutoPrintEnabled}
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Lock size={20} color={Colors.dark.textSecondary} />}
              title="Two-Factor Authentication"
              subtitle="Add an extra layer of security"
              onPress={() => console.log('2FA')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Database size={20} color={Colors.dark.textSecondary} />}
              title="Backup Data"
              subtitle="Create a backup of your data"
              onPress={() => console.log('Backup')}
            />
            <SettingItem
              icon={<Database size={20} color={Colors.dark.textSecondary} />}
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={() => console.log('Clear cache')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Info size={20} color={Colors.dark.textSecondary} />}
              title={t('manager.settings.version')}
              value="1.0.0"
              showArrow={false}
            />
            <SettingItem
              icon={<Info size={20} color={Colors.dark.textSecondary} />}
              title="Terms of Service"
              onPress={() => console.log('Terms')}
            />
            <SettingItem
              icon={<Info size={20} color={Colors.dark.textSecondary} />}
              title="Privacy Policy"
              onPress={() => console.log('Privacy')}
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
    </SafeAreaView>
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
  settingTextContainer: {
    flex: 1,
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
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginRight: 8,
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 40,
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
