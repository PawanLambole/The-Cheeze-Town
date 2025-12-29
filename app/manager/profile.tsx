
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Edit,
  X,
  Settings,
} from 'lucide-react-native';
import { supabase } from '@/services/database';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Colors } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
        <View style={styles.settingTextContainer}>
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
  const { t } = useTranslation();
  const { signOut, userData, loading } = useAuth();
  const insets = useSafeAreaInsets();

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    email: userData?.email || '',
  });

  const handleEditOpen = () => {
    setFormData({
      name: userData?.name || '',
      phone: userData?.phone || '',
      email: userData?.email || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!userData?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.name,
          phone: formData.phone
        })
        .eq('id', userData.id);

      if (error) throw error;

      Alert.alert(t('common.success'), t('messages.profileUpdated'));
      setShowEditModal(false);
      // Ideally trigger a refresh of userData here, but for now we rely on real-time or subsequent fetches
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), t('errors.unexpected'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = userData?.name || 'User';
  const displayRole = userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Staff';
  const displayEmail = userData?.email || '';
  const displayPhone = userData?.phone || 'Not provided';

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner': return '#8B5CF6';
      case 'manager': return '#3B82F6';
      case 'chef': return Colors.dark.primary;
      case 'waiter': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t('manager.profile.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={48} color={Colors.dark.text} />
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData?.role || 'staff') }]}>
                <Text style={styles.roleText}>{displayRole}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.headerEditButton} onPress={handleEditOpen}>
              <Edit size={20} color={Colors.dark.primary} />
            </TouchableOpacity>
          </View>


        </View>

        <View style={styles.settingsContainer}>
          {/* Account Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('manager.profile.accountInfo')}</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingItem
              icon={<Mail size={20} color={Colors.dark.primary} />}
              title={t('manager.profile.emailAddress')}
              subtitle={displayEmail}
              onPress={() => { }}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Phone size={20} color={Colors.dark.primary} />}
              title={t('manager.profile.phoneNumber')}
              subtitle={displayPhone}
              onPress={() => { }}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<MapPin size={20} color={Colors.dark.primary} />}
              title={t('manager.profile.location')}
              subtitle={t('manager.profile.mainBranch')}
              onPress={() => { }}
              showArrow={false}
            />
          </View>

          {/* General Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('manager.profile.general')}</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingItem
              icon={<Settings size={20} color={Colors.dark.primary} />}
              title={t('manager.navigation.settings')}
              subtitle={t('manager.profile.appPreferences')}
              onPress={() => {
                const settingsPath = userData?.role === 'owner' ? '/owner/settings' : '/manager/settings';
                router.push(settingsPath);
              }}
            />
            <View style={styles.separator} />
            <SettingItem
              icon={<Bell size={20} color={Colors.dark.primary} />}
              title={t('settings.notifications')}
              subtitle={t('manager.profile.manageNotifications')}
              onPress={() => {
                const settingsPath = userData?.role === 'owner' ? '/owner/settings' : '/manager/settings';
                router.push(settingsPath);
              }}
            />
          </View>

          {/* Support Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('manager.profile.support')}</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingItem
              icon={<HelpCircle size={20} color={Colors.dark.primary} />}
              title={t('manager.profile.helpSupport')}
              onPress={() => { }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('manager.profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('settings.version')} 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('manager.profile.updateProfile')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('manager.profile.fullName')}</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('manager.profile.emailAddress')}</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
                placeholder="Enter your email"
                placeholderTextColor={Colors.dark.textSecondary}
              />
              <Text style={styles.helperText}>{t('manager.profile.emailReadOnly')}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('manager.profile.phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{t('manager.profile.saveChanges')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.dark.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.dark.card,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.dark.background,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  settingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: 52,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    paddingBottom: 40,
    opacity: 0.5,
  },
  headerEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  disabledInput: {
    opacity: 0.7,
    backgroundColor: Colors.dark.secondary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
