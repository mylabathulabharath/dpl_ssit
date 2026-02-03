/**
 * 🏛 Universities Management
 * List, add, and edit universities
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DataTable, Column } from '@/components/admin/data-table';
import { AdminButton } from '@/components/admin/button';
import { AdminModal } from '@/components/admin/modal';
import { FormInput } from '@/components/admin/form-input';
import { ImageUpload } from '@/components/admin/image-upload';
import { ContactNumbers } from '@/components/admin/contact-numbers';
import { University, UniversityFormData } from '@/types/admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export default function UniversitiesPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'universities'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as University[];
      setUniversities(data);
    } catch (error) {
      console.error('Error loading universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUniversity(null);
    setModalVisible(true);
  };

  const handleEdit = (university: University) => {
    setEditingUniversity(university);
    setModalVisible(true);
  };

  const handleViewCourses = (university: University) => {
    router.push(`/(admin)/universities/${university.id}`);
  };

  const columns: Column<University>[] = [
    {
      key: 'logo',
      label: 'Logo',
      width: 80,
      render: (item) => (
        <View style={styles.logoContainer}>
          {item.logo ? (
            <Text style={styles.logoPlaceholder}>🖼️</Text>
          ) : (
            <Text style={styles.logoPlaceholder}>🏛</Text>
          )}
        </View>
      ),
    },
    {
      key: 'name',
      label: 'University Name',
      render: (item) => (
        <Text style={{ color: colors.text, ...Typography.body }}>{item.name}</Text>
      ),
    },
    {
      key: 'chairman_name',
      label: 'Chairman',
      render: (item) => (
        <Text style={{ color: colors.textSecondary, ...Typography.bodySmall }}>
          {item.chairman_name}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 200,
      render: (item) => (
        <View style={styles.actions}>
          <AdminButton
            label="Edit"
            onPress={() => handleEdit(item)}
            variant="secondary"
            size="small"
          />
          <AdminButton
            label="Branches"
            onPress={() => handleViewCourses(item)}
            variant="primary"
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
            <Text style={[styles.title, { color: colors.text }]}>Universities</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage universities and their branches
            </Text>
          </View>
          <AdminButton label="➕ Add University" onPress={handleAdd} variant="primary" />
        </View>

        {/* Table */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        ) : (
          <DataTable
            data={universities}
            columns={columns}
            emptyMessage="No universities found. Add your first university to get started."
          />
        )}

        {/* Add/Edit Modal */}
        <AdminModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingUniversity ? 'Edit University' : 'Add University'}
          footer={null}
        >
          <UniversityForm
            university={editingUniversity}
            onSave={async (data) => {
              try {
                if (editingUniversity) {
                  await updateDoc(doc(db, 'universities', editingUniversity.id), {
                    ...data,
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  await addDoc(collection(db, 'universities'), {
                    ...data,
                    createdAt: new Date().toISOString(),
                  });
                }
                setModalVisible(false);
                loadUniversities();
              } catch (error) {
                console.error('Error saving university:', error);
                throw error;
              }
            }}
          />
        </AdminModal>
      </View>
    </ScrollView>
  );
}

// University Form Component
function UniversityForm({
  university,
  onSave,
}: {
  university: University | null;
  onSave: (data: UniversityFormData) => Promise<void>;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const [formData, setFormData] = useState<UniversityFormData>({
    name: university?.name || '',
    chairman_name: university?.chairman_name || '',
    logo: university?.logo || '',
    chairman_photo: university?.chairman_photo || '',
    contact_numbers: university?.contact_numbers || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'University name is required';
    }
    
    if (!formData.chairman_name.trim()) {
      newErrors.chairman_name = 'Chairman name is required';
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
      console.error('Error saving university:', error);
      Alert.alert('Error', 'Failed to save university. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <FormInput
        label="University Name"
        value={formData.name}
        onChangeText={(text) => {
          setFormData({ ...formData, name: text });
          if (errors.name) setErrors({ ...errors, name: '' });
        }}
        placeholder="Enter university name"
        required
        error={errors.name}
      />

      <FormInput
        label="Chairman Name"
        value={formData.chairman_name}
        onChangeText={(text) => {
          setFormData({ ...formData, chairman_name: text });
          if (errors.chairman_name) setErrors({ ...errors, chairman_name: '' });
        }}
        placeholder="Enter chairman name"
        required
        error={errors.chairman_name}
      />

      <ImageUpload
        label="University Logo"
        value={formData.logo}
        onChange={(uri) => setFormData({ ...formData, logo: uri })}
      />

      <ImageUpload
        label="Chairman Photo"
        value={formData.chairman_photo}
        onChange={(uri) => setFormData({ ...formData, chairman_photo: uri })}
      />

      <ContactNumbers
        label="Contact Numbers"
        numbers={formData.contact_numbers}
        onChange={(numbers) => setFormData({ ...formData, contact_numbers: numbers })}
      />

      <View style={styles.formActions}>
        <AdminButton
          label={saving ? 'Saving...' : university ? 'Save Changes' : 'Create University'}
          onPress={handleSave}
          variant="primary"
          loading={saving}
          fullWidth
        />
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  formLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  formInput: {
    ...Typography.body,
    padding: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 44,
  },
  formActions: {
    marginTop: Spacing.lg,
  },
});

