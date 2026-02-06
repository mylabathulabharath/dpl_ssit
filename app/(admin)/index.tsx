/**
 * 🏠 Admin Dashboard
 * Overview of platform statistics
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdminButton } from '@/components/admin/button';
import { useRouter } from 'expo-router';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    universities: 0,
    colleges: 0,
    partneredColleges: 0,
    branches: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load universities
      const universitiesSnapshot = await getDocs(collection(db, 'universities'));
      const universitiesCount = universitiesSnapshot.size;

      // Load colleges
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      const collegesCount = collegesSnapshot.size;

      // Load partnered colleges
      const partneredQuery = query(collection(db, 'colleges'), where('is_partnered', '==', true));
      const partneredSnapshot = await getDocs(partneredQuery);
      const partneredCount = partneredSnapshot.size;

      // Load branches
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      const branchesCount = branchesSnapshot.size;

      setStats({
        universities: universitiesCount,
        colleges: collegesCount,
        partneredColleges: partneredCount,
        branches: branchesCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { label: 'Total Universities', value: stats.universities.toString(), icon: '🏛' },
    { label: 'Total Colleges', value: stats.colleges.toString(), icon: '🎓' },
    { label: 'Partnered Colleges', value: stats.partneredColleges.toString(), icon: '🤝' },
    { label: 'Total Branches', value: stats.branches.toString(), icon: '📚' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Platform Overview
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <AdminButton
              label="Add University"
              onPress={() => router.push('/(admin)/universities?action=add')}
              variant="primary"
              fullWidth
            />
            <AdminButton
              label="Add College"
              onPress={() => router.push('/(admin)/colleges?action=add')}
              variant="secondary"
              fullWidth
            />
            <AdminButton
              label="View Partners"
              onPress={() => router.push('/(admin)/partners')}
              variant="secondary"
              fullWidth
            />
            <AdminButton
              label="Bulk Import Courses"
              onPress={() => router.push('/(admin)/bulk-import')}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
});

