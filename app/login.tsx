import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { LottieLoader } from '@/components/lottie-loader';
import { useAuth } from '@/contexts/auth-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signIn(email.trim(), password);
      // Navigation will happen automatically via auth state change
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.logoContainer}>
              <Logo variant="large" />
            </Animated.View>
            
            {/* Header */}
            <View style={styles.header}>
              <ThemedText
                style={[
                  Typography.display,
                  {
                    color: colors.text,
                    fontSize: 36,
                    lineHeight: 44,
                    marginBottom: Spacing.sm,
                  },
                ]}
              >
                Welcome Back
              </ThemedText>
              <ThemedText
                style={[
                  Typography.bodyLarge,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Sign in to continue your learning journey
              </ThemedText>
            </View>
            
            {/* Form */}
            <View style={styles.form}>
              {/* Email/Username Input */}
              <Animated.View entering={FadeInDown.duration(600).delay(100)}>
                <View style={styles.inputContainer}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textSecondary,
                        marginBottom: Spacing.xs,
                      },
                    ]}
                  >
                    Email or Username
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: error && !email.trim() ? '#EF4444' : colors.border,
                      },
                    ]}
                    placeholder="Enter your email or username"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="default"
                    autoComplete="username"
                  />
                </View>
              </Animated.View>
              
              {/* Password Input */}
              <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                <View style={styles.inputContainer}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textSecondary,
                        marginBottom: Spacing.xs,
                      },
                    ]}
                  >
                    Password
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: error && !password.trim() ? '#EF4444' : colors.border,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                </View>
              </Animated.View>
              
              {/* Error Message */}
              {error && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: '#EF4444',
                        marginTop: Spacing.sm,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {error}
                  </ThemedText>
                </Animated.View>
              )}
              
              {/* Login Button */}
              <Animated.View entering={FadeInDown.duration(600).delay(300)}>
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={loading}
                />
              </Animated.View>
              
              {/* Signup Link */}
              <Animated.View entering={FadeInDown.duration(600).delay(400)}>
                <TouchableOpacity
                  onPress={() => router.push('/signup')}
                  style={styles.signupLink}
                >
                  <ThemedText
                    style={[
                      Typography.body,
                      {
                        color: colors.textSecondary,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    Don't have an account?{' '}
                    <ThemedText
                      style={[
                        Typography.body,
                        {
                          color: colors.accent,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Create one
                    </ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              </Animated.View>

              {/* Admin Login Hint */}
              <Animated.View entering={FadeInDown.duration(600).delay(500)}>
                <View style={styles.adminHint}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textTertiary,
                        textAlign: 'center',
                        fontStyle: 'italic',
                      },
                    ]}
                  >
                    Admin: username "admin", password "admin"
                  </ThemedText>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    ...Typography.body,
  },
  signupLink: {
    marginTop: Spacing.md,
  },
  adminHint: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
});

