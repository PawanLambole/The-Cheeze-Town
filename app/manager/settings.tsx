import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Lock, Globe, IndianRupee, Printer, Database, Info, LogOut, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { Colors } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { UpdateChecker } from '@/components/UpdateChecker';

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



  const insets = useSafeAreaInsets();



  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
  };

  const handleLogout = async () => {
    Alert.alert(
      t('manager.profile.logout'),
      t('common.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manager.profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
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
          <Text style={styles.sectionTitle}>{t('manager.settings.businessSettings')}</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Globe size={20} color={Colors.dark.primary} />}
              title={t('manager.settings.restaurantInfo')}
              subtitle={t('manager.settings.restaurantInfoSubtitle')}
              onPress={() => Alert.alert(t('manager.settings.comingSoon'), t('manager.settings.featureComingSoon'))}
            />
            {!isOwner && (
              <SettingItem
                icon={<IndianRupee size={20} color={Colors.dark.primary} />}
                title={t('manager.settings.taxSettings')}
                subtitle={t('manager.settings.taxSettingsSubtitle')}
                value="5%"
                onPress={() => Alert.alert(t('manager.settings.comingSoon'), t('manager.settings.featureComingSoon'))}
              />
            )}

          </View>
        </View>

        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('manager.settings.security')}</Text>
            <View style={styles.settingsList}>
              <SettingItem
                icon={<Lock size={20} color={Colors.dark.primary} />}
                title={t('manager.settings.twoFactor')}
                subtitle={t('manager.settings.twoFactorSubtitle')}
                onPress={() => Alert.alert(t('manager.settings.comingSoon'), t('manager.settings.featureComingSoon'))}
              />
            </View>
          </View>
        )}

        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('manager.settings.dataStorage')}</Text>
            <View style={styles.settingsList}>
              <SettingItem
                icon={<Database size={20} color={Colors.dark.primary} />}
                title={t('manager.settings.backupData')}
                subtitle={t('manager.settings.backupSubtitle')}
                onPress={() => Alert.alert(t('manager.settings.comingSoon'), t('manager.settings.featureComingSoon'))}
              />
              <SettingItem
                icon={<Database size={20} color={Colors.dark.primary} />}
                title={t('manager.settings.clearCache')}
                subtitle={t('manager.settings.clearCacheSubtitle')}
                onPress={() => {
                  Alert.alert(
                    t('manager.settings.clearCache'),
                    t('common.confirm'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.submit'), style: 'destructive', onPress: () => Alert.alert(t('common.success'), t('manager.settings.clearCacheSubtitle')) } // Reusing subtitle/success for simplicity or adding specific success msg
                    ]
                  );
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('manager.settings.about')}</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon={<Info size={20} color={Colors.dark.primary} />}
              title={t('manager.settings.termsOfService')}
              onPress={() => Alert.alert(t('manager.settings.termsOfService'), t('manager.settings.featureComingSoon'))}
            />
            <SettingItem
              icon={<Info size={20} color={Colors.dark.primary} />}
              title={t('manager.settings.privacyPolicy')}
              onPress={() => Alert.alert(t('manager.settings.privacyPolicy'), t('manager.settings.featureComingSoon'))}
              showArrow={false}
            />
          </View>

          <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
            <UpdateChecker />
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
