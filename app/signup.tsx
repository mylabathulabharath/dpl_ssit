import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Select } from '@/components/admin/select';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { University, College, Branch } from '@/types/admin';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { signUp } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tutorCode, setTutorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // University/College/Branch selection (only for students)
  const [universities, setUniversities] = useState<University[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  
  // Load universities on mount
  useEffect(() => {
    loadUniversities();
  }, []);
  
  // Load colleges when university is selected
  useEffect(() => {
    if (selectedUniversityId) {
      loadColleges(selectedUniversityId);
      setSelectedCollegeId('');
      setSelectedBranchId('');
    }
  }, [selectedUniversityId]);
  
  // Load branches when college is selected
  useEffect(() => {
    if (selectedCollegeId && colleges.length > 0) {
      const college = colleges.find((c) => c.id === selectedCollegeId);
      if (college) {
        loadBranches(selectedCollegeId);
        setSelectedBranchId('');
      }
    } else {
      setBranches([]);
      setSelectedBranchId('');
    }
  }, [selectedCollegeId, colleges]);
  
  const loadUniversities = async () => {
    try {
      setLoadingData(true);
      const snapshot = await getDocs(collection(db, 'universities'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as University[];
      setUniversities(data);
    } catch (error) {
      console.error('Error loading universities:', error);
    } finally {
      setLoadingData(false);
    }
  };
  
  const loadColleges = async (universityId: string) => {
    try {
      setLoadingData(true);
      const q = query(collection(db, 'colleges'), where('university_id', '==', universityId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as College[];
      setColleges(data);
    } catch (error) {
      console.error('Error loading colleges:', error);
    } finally {
      setLoadingData(false);
    }
  };
  
  const loadBranches = async (collegeId: string) => {
    try {
      setLoadingData(true);
      const college = colleges.find((c) => c.id === collegeId);
      if (college && college.university_id) {
        const q = query(collection(db, 'branches'), where('university_id', '==', college.university_id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Branch[];
        // Filter to only show branches offered by this college
        const offeredBranches = data.filter((branch) => 
          college.offered_branches?.includes(branch.id)
        );
        setBranches(offeredBranches);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // For students, require university, college, and branch
    const isStudent = !tutorCode.trim() || tutorCode.trim() !== 'TUTOR';
    if (isStudent && (!selectedUniversityId || !selectedCollegeId || !selectedBranchId)) {
      setError('Please select your university, college, and branch');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signUp(
        email.trim(),
        password,
        name.trim(),
        tutorCode.trim() || undefined,
        isStudent ? selectedUniversityId : undefined,
        isStudent ? selectedCollegeId : undefined,
        isStudent ? selectedBranchId : undefined
      );
      // Navigation will happen automatically via auth state change
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
                Create Account
              </ThemedText>
              <ThemedText
                style={[
                  Typography.bodyLarge,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Start your learning journey today
              </ThemedText>
            </View>
            
            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
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
                    Full Name
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: error && !name.trim() ? '#EF4444' : colors.border,
                      },
                    ]}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </Animated.View>
              
              {/* Email Input */}
              <Animated.View entering={FadeInDown.duration(600).delay(150)}>
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
                    Email
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
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
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
                    placeholder="Create a password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                  />
                </View>
              </Animated.View>
              
              {/* Tutor Code Input */}
              <Animated.View entering={FadeInDown.duration(600).delay(250)}>
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
                    Tutor Code (Optional)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Enter TUTOR to become an instructor"
                    placeholderTextColor={colors.textTertiary}
                    value={tutorCode}
                    onChangeText={setTutorCode}
                    autoCapitalize="characters"
                  />
                  <ThemedText
                    style={[
                      Typography.caption,
                      {
                        color: colors.textTertiary,
                        marginTop: Spacing.xs,
                      },
                    ]}
                  >
                    Leave empty to sign up as a student
                  </ThemedText>
                </View>
              </Animated.View>
              
              {/* University/College/Branch Selection (only for students) */}
              {(!tutorCode.trim() || tutorCode.trim() !== 'TUTOR') && (
                <>
                  <Animated.View entering={FadeInDown.duration(600).delay(300)}>
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
                        University *
                      </ThemedText>
                      <Select
                        label=""
                        value={selectedUniversityId}
                        options={universities.map((u) => ({ label: u.name, value: u.id }))}
                        onChange={setSelectedUniversityId}
                        placeholder="Select your university"
                        required
                        disabled={loadingData}
                      />
                    </View>
                  </Animated.View>
                  
                  {selectedUniversityId && (
                    <Animated.View entering={FadeInDown.duration(600).delay(350)}>
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
                          College *
                        </ThemedText>
                        <Select
                          label=""
                          value={selectedCollegeId}
                          options={colleges.map((c) => ({ label: c.name, value: c.id }))}
                          onChange={setSelectedCollegeId}
                          placeholder="Select your college"
                          required
                          disabled={loadingData || !selectedUniversityId}
                        />
                      </View>
                    </Animated.View>
                  )}
                  
                  {selectedCollegeId && (
                    <Animated.View entering={FadeInDown.duration(600).delay(400)}>
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
                          Branch *
                        </ThemedText>
                        <Select
                          label=""
                          value={selectedBranchId}
                          options={branches.map((b) => ({ label: `${b.code} - ${b.name}`, value: b.id }))}
                          onChange={setSelectedBranchId}
                          placeholder="Select your branch (CSE, ECE, etc.)"
                          required
                          disabled={loadingData || !selectedCollegeId}
                        />
                      </View>
                    </Animated.View>
                  )}
                </>
              )}
              
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
              
              {/* Signup Button */}
              <Animated.View entering={FadeInDown.duration(600).delay(300)}>
                <Button
                  title="Create Account"
                  onPress={handleSignup}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={loading}
                />
              </Animated.View>
              
              {/* Login Link */}
              <Animated.View entering={FadeInDown.duration(600).delay(400)}>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  style={styles.loginLink}
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
                    Already have an account?{' '}
                    <ThemedText
                      style={[
                        Typography.body,
                        {
                          color: colors.accent,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Sign in
                    </ThemedText>
                  </ThemedText>
                </TouchableOpacity>
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
    gap: Spacing.md,
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
  loginLink: {
    marginTop: Spacing.md,
  },
});

