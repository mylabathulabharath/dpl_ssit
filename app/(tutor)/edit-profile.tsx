import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getTrainerProfile, upsertTrainerProfile } from '@/services/trainer-service';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile, user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    try {
      if (user?.uid) {
        const profile = await getTrainerProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName || '');
          setCredentials(profile.credentials || '');
          setBio(profile.bio || '');
        } else if (userProfile?.displayName) {
          setDisplayName(userProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (userProfile?.displayName) {
        setDisplayName(userProfile.displayName);
      }
    }
  };
  
  const handleSave = async () => {
    if (!user?.uid || !displayName.trim()) return;
    
    setLoading(true);
    try {
      await upsertTrainerProfile(
        user.uid,
        displayName.trim(),
        credentials.trim() || undefined,
        bio.trim() || undefined
      );
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
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
        {/* Header */}
        <View style={[styles.header, Platform.OS === 'web' && styles.headerWeb]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: colors.text,
                fontSize: 20,
              },
            ]}
          >
            Edit Profile
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'web' && styles.scrollContentWeb,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={Platform.OS === 'web' ? styles.contentWrapWeb : undefined}>
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginBottom: Spacing.xs,
                },
              ]}
            >
              Display Name *
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
              placeholder="Enter your display name"
              placeholderTextColor={colors.textTertiary}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
          
          {/* Credentials */}
          <View style={styles.inputGroup}>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginBottom: Spacing.xs,
                },
              ]}
            >
              Credentials (Optional)
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
              placeholder="e.g., AWS Certified Cloud Practitioner, Solutions Architect, Developer"
              placeholderTextColor={colors.textTertiary}
              value={credentials}
              onChangeText={setCredentials}
            />
            <ThemedText
              style={[
                Typography.caption,
                {
                  color: colors.textTertiary,
                  marginTop: Spacing.xs,
                  fontSize: 12,
                },
              ]}
            >
              This will be displayed on your course pages
            </ThemedText>
          </View>
          
          {/* Bio */}
          <View style={styles.inputGroup}>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginBottom: Spacing.xs,
                },
              ]}
            >
              Bio (Optional)
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Tell students about yourself..."
              placeholderTextColor={colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          
          <Button
            title="Save Profile"
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            disabled={!displayName.trim()}
          />
          
          <View style={{ height: Spacing.xxl }} />
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerWeb: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  scrollContentWeb: {
    padding: Spacing.xl,
  },
  contentWrapWeb: {
    maxWidth: Layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  input: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    ...Typography.body,
  },
  textArea: {
    minHeight: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    ...Typography.body,
  },
});

