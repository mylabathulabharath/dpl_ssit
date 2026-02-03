import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { PartnerProvider } from '@/contexts/partner-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/components/logo';
import { LottieLoader } from '@/components/lottie-loader';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];
    const inStudentGroup = currentRoute === '(student)';
    const inTutorGroup = currentRoute === '(tutor)';
    const inAdminGroup = currentRoute === '(admin)' || currentRoute === 'admin';
    const inAuthScreen = currentRoute === 'login' || currentRoute === 'signup';
    const inCourseRoute = currentRoute === 'course';

    if (!user || !userProfile) {
      // User is not signed in - redirect to login if not already there
      // Allow course routes for preview (optional - you can remove this if you want courses to require auth)
      if (!inAuthScreen && !inCourseRoute) {
        router.replace('/login');
      }
    } else {
      // User is signed in
      if (inAuthScreen) {
        // Redirect based on role
        if (userProfile.role === 'admin') {
          router.replace('/(admin)');
        } else if (userProfile.role === 'tutor') {
          router.replace('/(tutor)/dashboard');
        } else {
          // Students go to tabs (home screen with bottom navigation)
          router.replace('/(tabs)');
        }
      } else {
        // Ensure user is in correct group based on role
        // Allow course routes for all authenticated users
        if (inCourseRoute) {
          // Allow navigation to course routes
          return;
        }
        if (userProfile.role === 'admin' && !inAdminGroup) {
          router.replace('/(admin)');
        } else if (userProfile.role === 'tutor' && !inTutorGroup && currentRoute !== '(tabs)') {
          router.replace('/(tutor)/dashboard');
        } else if (userProfile.role === 'student' && !inStudentGroup && currentRoute !== '(tabs)') {
          // Students should be in tabs, not student dashboard
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, userProfile, loading, segments]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Logo variant="large" style={styles.loadingLogo} />
        <LottieLoader size={200} style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(tutor)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="course/[id]/lesson/[lessonId]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    marginBottom: 32,
  },
  loadingSpinner: {
    marginTop: 16,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <PartnerProvider>
        <RootLayoutNav />
      </PartnerProvider>
    </AuthProvider>
  );
}
