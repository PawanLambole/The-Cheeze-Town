import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, ChevronRight } from 'lucide-react-native';
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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>CHEEZE</Text>
              <Text style={styles.appNameHighlight}>TOWN</Text>
            </View>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            {/* Role Switcher */}
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'manager' && styles.roleButtonActive]}
                onPress={() => setRole('manager')}
              >
                <Text style={[styles.roleButtonText, role === 'manager' && styles.roleButtonTextActive]}>
                  {t('login.manager')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
                onPress={() => setRole('owner')}
              >
                <Text style={[styles.roleButtonText, role === 'owner' && styles.roleButtonTextActive]}>
                  {t('login.owner')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'chef' && styles.roleButtonActive]}
                onPress={() => setRole('chef')}
              >
                <Text style={[styles.roleButtonText, role === 'chef' && styles.roleButtonTextActive]}>
                  Chef
                </Text>
              </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  appNameHighlight: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: Colors.dark.secondary,
    borderRadius: Layout.radius.l,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Layout.radius.m,
  },
  roleButtonActive: {
    backgroundColor: '#333', // Slightly lighter than secondary
  },
  roleButtonText: {
    fontSize: 14,
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
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 60,
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
    paddingVertical: 18,
    borderRadius: Layout.radius.xl,
    marginTop: 16,
    gap: 8,
    ...Layout.shadow.medium,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
});
