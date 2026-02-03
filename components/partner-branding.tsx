/**
 * 🎨 Partner Branding Component
 * Dynamically displays college logo and name when in partner mode
 * Used throughout the student UI to show white-label branding
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { usePartner } from '@/contexts/partner-context';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PartnerBrandingProps {
  variant?: 'header' | 'full' | 'compact';
  showName?: boolean;
}

export function PartnerBranding({ variant = 'header', showName = true }: PartnerBrandingProps) {
  const { partnerContext, isPartnerMode } = usePartner();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  if (!isPartnerMode || !partnerContext) {
    // Default branding - show Cohort Launchpad logo
    return (
      <View style={styles.container}>
        <Text style={[styles.defaultLogo, { color: colors.primary }]}>🚀</Text>
        {showName && (
          <Text style={[styles.defaultName, { color: colors.text }]}>Cohort Launchpad</Text>
        )}
      </View>
    );
  }

  const { college } = partnerContext;
  const appName = `${college.name} Digital Library`;

  return (
    <View style={styles.container}>
      {college.logo ? (
        <Image source={{ uri: college.logo }} style={styles.logo} resizeMode="contain" />
      ) : (
        <View style={[styles.logoPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={styles.logoPlaceholderText}>🎓</Text>
        </View>
      )}
      {showName && (
        <Text
          style={[
            variant === 'full' ? styles.fullName : styles.name,
            { color: colors.text },
          ]}
          numberOfLines={1}
        >
          {appName}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  defaultLogo: {
    fontSize: 24,
  },
  defaultName: {
    ...Typography.h3,
    fontWeight: '700',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 20,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
    maxWidth: 200,
  },
  fullName: {
    ...Typography.h3,
    fontWeight: '700',
  },
});

