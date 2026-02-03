import { ThemedText } from '@/components/themed-text';
import { UserMenu } from '@/components/user-menu';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <ThemedText
          style={[
            Typography.h1,
            {
              color: '#1C1D1F',
              fontSize: 24,
              fontWeight: '700',
            },
          ]}
        >
          Account
        </ThemedText>
        <UserMenu />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText
          style={[
            Typography.body,
            {
              color: '#6A6F73',
            },
          ]}
        >
          Account settings and preferences
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
});

