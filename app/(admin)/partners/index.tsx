/**
 * 🤝 Partnered Colleges Management
 * MOST IMPORTANT FEATURE - White-label behavior control
 * Preview and manage partnered colleges
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Colors, Typography, Spacing, Radius, Glows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DataTable, Column } from '@/components/admin/data-table';
import { AdminButton } from '@/components/admin/button';
import { usePartner } from '@/contexts/partner-context';
import { College, University, Branch } from '@/types/admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function PartnersPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();
  const { setPartnerCollege, clearPartnerContext, partnerContext } = usePartner();

  const [colleges, setColleges] = useState<College[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load ALL colleges (not just partnered ones)
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      const collegesData = collegesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as College[];
      setColleges(collegesData);

      // Load universities
      const universitiesSnapshot = await getDocs(collection(db, 'universities'));
      const universitiesData = universitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as University[];
      setUniversities(universitiesData);

      // Load all branches
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      const branchesData = branchesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Branch[];
      setAllBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePartnership = async (college: College) => {
    try {
      // Ensure we're working with a boolean
      const currentStatus = Boolean(college.is_partnered);
      const newPartnershipStatus = !currentStatus;
      
      console.log(`Toggling partnership for ${college.name}: ${currentStatus} -> ${newPartnershipStatus}`);
      
      await updateDoc(doc(db, 'colleges', college.id), {
        is_partnered: newPartnershipStatus,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state immediately for better UX
      setColleges((prev) =>
        prev.map((c) =>
          c.id === college.id ? { ...c, is_partnered: newPartnershipStatus } : c
        )
      );
      
      // Clear partner context if the active college is unpartnered
      if (partnerContext?.college?.id === college.id && !newPartnershipStatus) {
        clearPartnerContext();
      }
    } catch (error) {
      console.error('Error updating partnership:', error);
      // Reload data on error to ensure consistency
      loadData();
    }
  };

  const handlePreview = (college: College) => {
    const university = universities.find((u) => u.id === college.university_id);
    const branches = allBranches.filter((b) => 
      college.offered_branches?.includes(b.id) && b.university_id === college.university_id
    );
    
    if (university) {
      setPartnerCollege(college, university, branches);
      // Navigate to student view with partner context
      router.push('/(tabs)');
    }
  };

  const columns: Column<College>[] = [
    {
      key: 'logo',
      label: 'Logo',
      width: 80,
      render: (item) => (
        <View style={styles.logoContainer}>
          {item.logo ? (
            <Text style={styles.logoPlaceholder}>🖼️</Text>
          ) : (
            <Text style={styles.logoPlaceholder}>🎓</Text>
          )}
        </View>
      ),
    },
    {
      key: 'name',
      label: 'College Name',
      render: (item) => (
        <Text style={{ color: colors.text, ...Typography.body }}>{item.name}</Text>
      ),
    },
    {
      key: 'university_id',
      label: 'University',
      render: (item) => {
        const university = universities.find((u) => u.id === item.university_id);
        return (
          <Text style={{ color: colors.textSecondary, ...Typography.bodySmall }}>
            {university?.name || 'Unknown'}
          </Text>
        );
      },
    },
    {
      key: 'offered_branches',
      label: 'Branches',
      render: (item) => (
        <Text style={{ color: colors.textSecondary, ...Typography.bodySmall }}>
          {item.offered_branches?.length || 0} branches
        </Text>
      ),
    },
    {
      key: 'is_partnered',
      label: 'Partner Status',
      render: (item) => {
        // Ensure boolean value
        const isPartnered = Boolean(item.is_partnered);
        return (
          <Switch
            value={isPartnered}
            onValueChange={() => togglePartnership(item)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
            ios_backgroundColor={colors.border}
          />
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 200,
      render: (item) => (
        <AdminButton
          label="👁 Preview as College"
          onPress={() => handlePreview(item)}
          variant="primary"
          size="small"
        />
      ),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Partnered Colleges</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage white-label behavior. When a college is partnered, the platform transforms
              into their branded digital library.
            </Text>
          </View>
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.infoIcon, { color: colors.primary }]}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              White-Label Behavior
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              When a college is marked as partnered, the entire platform dynamically changes:
              app logo becomes college logo, app name becomes "{'{'}College Name{'}'} Digital Library",
              and only that college's courses are shown. No reloads, no duplicate apps.
            </Text>
          </View>
        </View>

        {/* Active Partner Context Indicator */}
        {partnerContext && (
          <View
            style={[
              styles.activeContext,
              {
                backgroundColor: colors.success + '20',
                borderColor: colors.success,
              },
            ]}
          >
            <Text style={[styles.activeContextText, { color: colors.text }]}>
              🎯 Currently previewing as: <Text style={{ fontWeight: '700' }}>{partnerContext.college.name}</Text>
            </Text>
            <AdminButton
              label="Exit Preview"
              onPress={() => {
                clearPartnerContext();
                router.push('/(admin)');
              }}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        {/* Table */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        ) : (
          <DataTable
            data={colleges}
            columns={columns}
            emptyMessage="No colleges found. Add colleges first in the Colleges section."
          />
        )}

        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: colors.surface }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            How Partner Mode Works
          </Text>
          <View style={styles.instructionsList}>
            <InstructionItem
              number="1"
              text="Mark a college as partnered using the toggle switch"
              colors={colors}
            />
            <InstructionItem
              number="2"
              text="Click 'Preview as College' to see the white-label experience"
              colors={colors}
            />
            <InstructionItem
              number="3"
              text="The platform transforms: logo, name, and courses change dynamically"
              colors={colors}
            />
            <InstructionItem
              number="4"
              text="Exit preview to return to admin view"
              colors={colors}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function InstructionItem({
  number,
  text,
  colors,
}: {
  number: string;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.instructionItem}>
      <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
        <Text style={[styles.instructionNumberText, { color: colors.text }]}>{number}</Text>
      </View>
      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    lineHeight: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  activeContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  activeContextText: {
    ...Typography.body,
    flex: 1,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    fontSize: 24,
  },
  instructions: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
  },
  instructionsTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  instructionText: {
    ...Typography.body,
    flex: 1,
    paddingTop: 4,
  },
});

