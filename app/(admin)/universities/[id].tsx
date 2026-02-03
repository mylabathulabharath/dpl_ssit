/**
 * 🎓 University Branches Management
 * Manage branches (CSE, ECE, etc.) for a specific university
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DataTable, Column } from '@/components/admin/data-table';
import { AdminButton } from '@/components/admin/button';
import { AdminModal } from '@/components/admin/modal';
import { FormInput } from '@/components/admin/form-input';
import { Select } from '@/components/admin/select';
import { Branch, BranchFormData, University } from '@/types/admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';

export default function UniversityBranchesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();

  const [university, setUniversity] = useState<University | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (id) {
      loadUniversity();
      loadBranches();
    }
  }, [id]);

  const loadUniversity = async () => {
    // TODO: Load university from Firestore
    // For now, mock data
    setUniversity({ id: id!, name: 'Sample University', chairman_name: '', contact_numbers: [], createdAt: '' });
  };

  const loadBranches = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'branches'), where('university_id', '==', id));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Branch[];
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBranch(null);
    setModalVisible(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setModalVisible(true);
  };

  const toggleStatus = async (branch: Branch) => {
    try {
      await updateDoc(doc(db, 'branches', branch.id), {
        status: branch.status === 'active' ? 'inactive' : 'active',
      });
      loadBranches();
    } catch (error) {
      console.error('Error updating branch status:', error);
    }
  };

  const columns: Column<Branch>[] = [
    {
      key: 'code',
      label: 'Branch Code',
      render: (item) => (
        <Text style={{ color: colors.text, ...Typography.body, fontWeight: '600' }}>{item.code}</Text>
      ),
    },
    {
      key: 'name',
      label: 'Branch Name',
      render: (item) => (
        <Text style={{ color: colors.text, ...Typography.body }}>{item.name}</Text>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'active' ? colors.success + '20' : colors.textTertiary + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === 'active' ? colors.success : colors.textSecondary,
              },
            ]}
          >
            {item.status === 'active' ? '✓ Active' : '○ Inactive'}
          </Text>
        </View>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 250,
      render: (item) => (
        <View style={styles.actions}>
          <AdminButton
            label={item.status === 'active' ? 'Deactivate' : 'Activate'}
            onPress={() => toggleStatus(item)}
            variant="secondary"
            size="small"
          />
          <AdminButton
            label="Edit"
            onPress={() => handleEdit(item)}
            variant="secondary"
            size="small"
          />
        </View>
      ),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AdminButton
              label="← Back"
              onPress={() => router.back()}
              variant="ghost"
              size="small"
            />
            <Text style={[styles.title, { color: colors.text }]}>
              {university?.name || 'University'} - Branches
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage branches (CSE, ECE, etc.) for this university
            </Text>
          </View>
          <AdminButton label="➕ Add Branch" onPress={handleAdd} variant="primary" />
        </View>

        {/* Table */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        ) : (
          <DataTable
            data={branches}
            columns={columns}
            emptyMessage="No branches found. Add your first branch (e.g., CSE, ECE) to get started."
          />
        )}

        {/* Add/Edit Modal */}
        <AdminModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingBranch ? 'Edit Branch' : 'Add Branch'}
          footer={null}
        >
          <BranchForm
            branch={editingBranch}
            universityId={id!}
            onSave={async (data) => {
              try {
                if (editingBranch) {
                  await updateDoc(doc(db, 'branches', editingBranch.id), {
                    ...data,
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  await addDoc(collection(db, 'branches'), {
                    ...data,
                    university_id: id!,
                    createdAt: new Date().toISOString(),
                  });
                }
                setModalVisible(false);
                loadBranches();
              } catch (error) {
                console.error('Error saving branch:', error);
                throw error;
              }
            }}
          />
        </AdminModal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});

// Branch Form Component
function BranchForm({
  branch,
  universityId,
  onSave,
}: {
  branch: Branch | null;
  universityId: string;
  onSave: (data: BranchFormData) => Promise<void>;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const [formData, setFormData] = useState<BranchFormData>({
    university_id: universityId,
    code: branch?.code || '',
    name: branch?.name || '',
    description: branch?.description || '',
    status: branch?.status || 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Branch code is required (e.g., CSE, ECE)';
    } else if (formData.code.length > 10) {
      newErrors.code = 'Branch code should be short (max 10 characters)';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving branch:', error);
      Alert.alert('Error', 'Failed to save branch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: Spacing.lg }}>
      <FormInput
        label="Branch Code"
        value={formData.code}
        onChangeText={(text) => {
          setFormData({ ...formData, code: text.toUpperCase() });
          if (errors.code) setErrors({ ...errors, code: '' });
        }}
        placeholder="e.g., CSE, ECE, ME, CE"
        required
        error={errors.code}
        autoCapitalize="characters"
      />

      <FormInput
        label="Branch Name"
        value={formData.name}
        onChangeText={(text) => {
          setFormData({ ...formData, name: text });
          if (errors.name) setErrors({ ...errors, name: '' });
        }}
        placeholder="e.g., Computer Science and Engineering"
        required
        error={errors.name}
      />

      <FormInput
        label="Description (Optional)"
        value={formData.description || ''}
        onChangeText={(text) => {
          setFormData({ ...formData, description: text });
        }}
        placeholder="Enter branch description"
        multiline
        numberOfLines={4}
      />

      <Select
        label="Status"
        value={formData.status}
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
        required
      />

      <View style={{ marginTop: Spacing.lg }}>
        <AdminButton
          label={saving ? 'Saving...' : branch ? 'Save Changes' : 'Create Branch'}
          onPress={handleSave}
          variant="primary"
          loading={saving}
          fullWidth
        />
      </View>
    </View>
  );
}

