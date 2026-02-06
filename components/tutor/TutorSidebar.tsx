/**
 * Tutor sidebar navigation – web-friendly instructor dashboard
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Glows, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IconName = 'house.fill' | 'book.fill' | 'person.circle';

interface NavItem {
  icon: IconName;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: 'house.fill', label: 'Dashboard', path: '/(tutor)/dashboard' },
  { icon: 'book.fill', label: 'Create Course', path: '/(tutor)/create-course' },
  { icon: 'person.circle', label: 'Edit Profile', path: '/(tutor)/edit-profile' },
];

export function TutorSidebar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();
  const pathname = usePathname() || '';

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '22' }]}>
          <IconSymbol name="book.fill" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.brandText, { color: colors.text }]}>Instructor</Text>
      </View>

      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const currentPath = pathname || '';
          const isActive =
            currentPath === item.path ||
            currentPath.includes(item.path) ||
            (item.path === '/(tutor)/dashboard' && (currentPath === '/(tutor)' || currentPath.endsWith('dashboard')));

          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => handleNavigate(item.path)}
              style={[
                styles.navItem,
                isActive && { backgroundColor: colors.surfaceElevated },
                isActive && Platform.OS === 'web' && Glows.primarySoft,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isActive ? colors.primary + '22' : 'transparent' },
                ]}
              >
                <IconSymbol
                  name={item.icon}
                  size={22}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? colors.text : colors.textSecondary },
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    borderRightWidth: 1,
    height: '100%',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        flexShrink: 0,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    ...Typography.h3,
    fontSize: 18,
  },
  navContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    ...Typography.body,
    flex: 1,
    fontSize: 15,
  },
  navLabelActive: {
    fontWeight: '600',
  },
});
