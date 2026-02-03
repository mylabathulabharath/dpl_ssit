import { ThemedText } from '@/components/themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
            Wishlist
          </ThemedText>
          <ThemedText
            style={[
              Typography.body,
              {
                color: '#6A6F73',
                marginTop: Spacing.sm,
              },
            ]}
          >
            Your saved courses
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
});

