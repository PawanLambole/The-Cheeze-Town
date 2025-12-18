import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Bell, Lock, Globe, DollarSign, Printer, Database, Info, LogOut, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';

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
            trackColor={{ false: '#E5E7EB', true: '#FDB813' }}
            thumbColor="#FFFFFF"
          />
        )}
        {showArrow && !hasSwitch && <ChevronRight size={20} color="#9CA3AF" />}
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
          <ArrowLeft size={24} color="#1F2937" />
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
                <Languages size={20} color="#6B7280" style={styles.settingIcon} />
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
                <Languages size={20} color="#6B7280" style={styles.settingIcon} />
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
              icon={<Bell size={20} color="#6B7280" />}
              title="Push Notifications"
              subtitle="Receive order and update notifications"
              hasSwitch
              switchValue={notificationsEnabled}
              onSwitchChange={setNotificationsEnabled}
              showArrow={false}
            />
            <SettingItem
              icon={<Bell size={20} color="#6B7280" />}
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
              icon={<Globe size={20} color="#6B7280" />}
              title="Restaurant Info"
              subtitle="Name, address, and contact details"
              onPress={() => console.log('Restaurant info')}
            />
            <SettingItem
              icon={<DollarSign size={20} color="#6B7280" />}
              title="Tax Settings"
              subtitle="Configure tax rates and types"
              value="5%"
              onPress={() => console.log('Tax settings')}
            />
            <SettingItem
              icon={<Printer size={20} color="#6B7280" />}
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
              icon={<Lock size={20} color="#6B7280" />}
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => console.log('Change password')}
            />
            <SettingItem
              icon={<Lock size={20} color="#6B7280" />}
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
              icon={<Database size={20} color="#6B7280" />}
              title="Backup Data"
              subtitle="Create a backup of your data"
              onPress={() => console.log('Backup')}
            />
            <SettingItem
              icon={<Database size={20} color="#6B7280" />}
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
              icon={<Info size={20} color="#6B7280" />}
              title={t('manager.settings.version')}
              value="1.0.0"
              showArrow={false}
            />
            <SettingItem
              icon={<Info size={20} color="#6B7280" />}
              title="Terms of Service"
              onPress={() => console.log('Terms')}
            />
            <SettingItem
              icon={<Info size={20} color="#6B7280" />}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
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
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
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
    borderBottomColor: '#E5E7EB',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 16,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FDB813',
  },
});
