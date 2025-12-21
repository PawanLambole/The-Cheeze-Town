import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, ChevronRight, User, Crown, ChefHat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Layout, Spacing } from '@/constants/Theme';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'chef'>('manager');

  const handleLogin = () => {
    if (role === 'owner') {
      router.push('/owner');
    } else if (role === 'chef') {
      // @ts-ignore
      router.push('/chef');
    } else {
      router.push('/manager');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.dark.background, '#1A1A1A']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Branding */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo.jpeg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.appTitle}>The Cheeze Town</Text>
            <Text style={styles.tagline}>Restaurant Management System</Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            {/* Role Switcher */}
            <View style={styles.roleSelectorContainer}>
              {/* Owner - Top Row */}
              <TouchableOpacity
                style={[styles.roleButtonWide, role === 'owner' && styles.roleButtonActive]}
                onPress={() => setRole('owner')}
                activeOpacity={0.8}
              >
                <Crown size={20} color={role === 'owner' ? Colors.dark.primary : '#666'} />
                <Text style={[styles.roleButtonText, styles.ownerButtonText, role === 'owner' && styles.ownerButtonTextActive]}>
                  {t('login.owner')}
                </Text>
              </TouchableOpacity>

              {/* Manager & Chef - Bottom Row */}
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'manager' && styles.roleButtonActive]}
                  onPress={() => setRole('manager')}
                >
                  <User size={18} color={role === 'manager' ? Colors.dark.primary : Colors.dark.textSecondary} />
                  <Text style={[styles.roleButtonText, role === 'manager' && styles.roleButtonTextActive]}>
                    {t('login.manager')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'chef' && styles.roleButtonActive]}
                  onPress={() => setRole('chef')}
                >
                  <ChefHat size={18} color={role === 'chef' ? Colors.dark.primary : Colors.dark.textSecondary} />
                  <Text style={[styles.roleButtonText, role === 'chef' && styles.roleButtonTextActive]}>
                    Chef
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('login.email')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('login.password')}
                placeholderTextColor={Colors.dark.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.dark.primary, '#FFA000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>{t('login.login')}</Text>
                <ChevronRight color="#000" size={20} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  formCard: {
    width: '100%',
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 184, 19, 0.1)',
    ...Layout.shadow.large,
  },
  roleSelectorContainer: {
    marginBottom: 20,
    gap: 10,
  },
  roleButtonWide: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.dark.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  ownerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  ownerButtonTextActive: {
    color: Colors.dark.primary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.dark.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleButtonActive: {
    backgroundColor: Colors.dark.background,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  roleButtonTextActive: {
    color: Colors.dark.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.secondary,
    borderRadius: Layout.radius.xl,
    paddingHorizontal: 18,
    marginBottom: 14,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: Colors.dark.text,
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: Layout.radius.xl,
    marginTop: 12,
    gap: 8,
    ...Layout.shadow.medium,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
});
