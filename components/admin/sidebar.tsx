/**
 * 🧭 Admin Sidebar Navigation
 * Icon-first, collapsible sidebar for admin panel
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Glows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NavItem {
  icon: string; // Material Symbol name
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/(admin)' },
  { icon: 'account_balance', label: 'Universities', path: '/(admin)/universities' },
  { icon: 'school', label: 'Colleges', path: '/(admin)/colleges' },
  { icon: 'handshake', label: 'Partnered Colleges', path: '/(admin)/partners' },
  { icon: 'settings', label: 'Settings', path: '/(admin)/settings' },
];

export function AdminSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();
  const pathname = usePathname() || '';

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      {/* Logo/Brand */}
      <View style={styles.header}>
        {!collapsed && (
          <Text style={[styles.brandText, { color: colors.text }]}>Cohort Launchpad</Text>
        )}
        <Text style={[styles.brandIcon, { color: colors.primary }]}>🚀</Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const currentPath = pathname || '';
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
          
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
              {/* Icon placeholder - in real app, use Material Symbols */}
              <View style={[styles.iconContainer, { backgroundColor: isActive ? colors.primary : 'transparent' }]}>
                <Text style={[styles.icon, { color: isActive ? colors.text : colors.textSecondary }]}>
                  {getIconEmoji(item.icon)}
                </Text>
              </View>
              {!collapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? colors.text : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Helper to get emoji for icons (replace with actual Material Symbols in production)
function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    dashboard: '🏠',
    account_balance: '🏛',
    school: '🎓',
    handshake: '🤝',
    settings: '⚙️',
  };
  return iconMap[iconName] || '•';
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    borderRightWidth: 1,
    height: '100%',
    ...Platform.select({
      web: {
        minHeight: '100vh',
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
  brandText: {
    ...Typography.h3,
    flex: 1,
  },
  brandIcon: {
    fontSize: 24,
  },
  navContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
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
  icon: {
    fontSize: 20,
  },
  navLabel: {
    ...Typography.body,
    flex: 1,
  },
});

