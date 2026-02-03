/**
 * 🏛 Admin Layout
 * Main layout for admin panel with sidebar
 */

import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        overflow: 'auto',
      },
    }),
  },
});

