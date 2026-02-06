/**
 * Tutor layout – web: sidebar + main content; native: stack only
 */

import { TutorSidebar } from '@/components/tutor/TutorSidebar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TutorLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TutorSidebar />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="create-course" />
            <Stack.Screen name="edit-course" />
            <Stack.Screen name="edit-profile" />
          </Stack>
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="create-course" />
      <Stack.Screen name="edit-course" />
      <Stack.Screen name="edit-profile" />
    </Stack>
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
    minWidth: 0,
    ...Platform.select({
      web: {
        overflow: 'auto',
      },
    }),
  },
});
