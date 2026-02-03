/**
 * 🎓 Colleges Management
 * Step-based flow for adding colleges
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DataTable, Column } from '@/components/admin/data-table';
import { AdminButton } from '@/components/admin/button';
import { AdminModal } from '@/components/admin/modal';
import { Stepper } from '@/components/admin/stepper';
import { FormInput } from '@/components/admin/form-input';
import { ImageUpload } from '@/components/admin/image-upload';
import { ContactNumbers } from '@/components/admin/contact-numbers';
import { Select } from '@/components/admin/select';
import { Checkbox } from '@/components/admin/checkbox';
import { College, University, Branch, CollegeFormData } from '@/types/admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';

export default function CollegesPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const router = useRouter();

  const [colleges, setColleges] = useState<College[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    loadColleges();
    loadUniversities();
  }, []);

  const loadColleges = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'colleges'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as College[];
      setColleges(data);
    } catch (error) {
      console.error('Error loading colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as University[];
      setUniversities(data);
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  const handleAdd = () => {
    setEditingCollege(null);
    setCurrentStep(1);
    setModalVisible(true);
  };

  const handleEdit = (college: College) => {
    setEditingCollege(college);
    setCurrentStep(1);
    setModalVisible(true);
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
      key: 'is_partnered',
      label: 'Partner Status',
      render: (item) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.is_partnered ? colors.success + '20' : colors.textTertiary + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.is_partnered ? colors.success : colors.textSecondary,
              },
            ]}
          >
            {item.is_partnered ? '✓ Partnered' : '○ Not Partnered'}
          </Text>
        </View>
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
            <Text style={[styles.title, { color: colors.text }]}>Colleges</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage colleges and their course offerings
            </Text>
          </View>
          <AdminButton label="➕ Add College" onPress={handleAdd} variant="primary" />
        </View>

        {/* Table */}
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        ) : (
          <DataTable
            data={colleges}
            columns={columns}
            emptyMessage="No colleges found. Add your first college to get started."
          />
        )}

        {/* Add/Edit Modal with Stepper */}
        <AdminModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setCurrentStep(1);
          }}
          title={editingCollege ? 'Edit College' : 'Add College'}
          size="large"
          footer={null}
        >
          <CollegeForm
            college={editingCollege}
            universities={universities}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onCancel={() => {
              setModalVisible(false);
              setCurrentStep(1);
            }}
            onSave={async (data) => {
              try {
                if (editingCollege) {
                  await updateDoc(doc(db, 'colleges', editingCollege.id), {
                    ...data,
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  await addDoc(collection(db, 'colleges'), {
                    ...data,
                    createdAt: new Date().toISOString(),
                  });
                }
                setModalVisible(false);
                setCurrentStep(1);
                loadColleges();
              } catch (error) {
                console.error('Error saving college:', error);
                throw error;
              }
            }}
          />
        </AdminModal>
      </View>
    </ScrollView>
  );
}

// College Form with Stepper
function CollegeForm({
  college,
  universities,
  currentStep,
  onStepChange,
  onCancel,
  onSave,
}: {
  college: College | null;
  universities: University[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onCancel: () => void;
  onSave: (data: CollegeFormData) => Promise<void>;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>(
    college?.university_id || ''
  );
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<CollegeFormData>({
    university_id: college?.university_id || '',
    name: college?.name || '',
    logo: college?.logo || '',
    chairman_name: college?.chairman_name || '',
    chairman_photo: college?.chairman_photo || '',
    contact_numbers: college?.contact_numbers || [],
    offered_branches: college?.offered_branches || [],
    is_partnered: college?.is_partnered || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const steps = [
    { label: 'Select University', description: 'Choose the parent university' },
    { label: 'College Details', description: 'Enter college information' },
    { label: 'Select Branches', description: 'Choose offered branches (CSE, ECE, etc.)' },
  ];

  // Load branches when university is selected
  React.useEffect(() => {
    if (selectedUniversityId && currentStep >= 3) {
      loadBranches();
    }
  }, [selectedUniversityId, currentStep]);

  // Update form data when university changes
  React.useEffect(() => {
    setFormData({ ...formData, university_id: selectedUniversityId, offered_branches: [] });
  }, [selectedUniversityId]);

  const loadBranches = async () => {
    try {
      const q = query(collection(db, 'branches'), where('university_id', '==', selectedUniversityId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Branch[];
      setAvailableBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!selectedUniversityId) {
        newErrors.university_id = 'Please select a university';
      }
    } else if (step === 2) {
      if (!formData.name.trim()) {
        newErrors.name = 'College name is required';
      }
      if (!formData.chairman_name.trim()) {
        newErrors.chairman_name = 'Chairman name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      onStepChange(Math.min(currentStep + 1, 3));
    }
  };

  const handleSave = async () => {
    if (!validateStep(3)) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving college:', error);
      Alert.alert('Error', 'Failed to save college. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBranch = (branchId: string) => {
    const current = formData.offered_branches;
    if (current.includes(branchId)) {
      setFormData({ ...formData, offered_branches: current.filter((id) => id !== branchId) });
    } else {
      setFormData({ ...formData, offered_branches: [...current, branchId] });
    }
  };

  return (
    <View style={styles.formContainer}>
      <Stepper steps={steps} currentStep={currentStep} onStepPress={onStepChange} />

      <View style={styles.stepContent}>
        {currentStep === 1 && (
          <View style={styles.stepView}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Select University</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Choose the university this college belongs to. This determines which courses are
              available.
            </Text>
            <Select
              label="University"
              value={selectedUniversityId}
              options={universities.map((u) => ({ label: u.name, value: u.id }))}
              onChange={(value) => {
                setSelectedUniversityId(value);
                setFormData({ ...formData, university_id: value, offered_courses: [] });
                if (errors.university_id) setErrors({ ...errors, university_id: '' });
              }}
              placeholder="Select a university"
              required
              error={errors.university_id}
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepView}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>College Details</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Enter the college name, logo, chairman details, and contact information.
            </Text>
            <FormInput
              label="College Name"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Enter college name"
              required
              error={errors.name}
            />
            <ImageUpload
              label="College Logo"
              value={formData.logo}
              onChange={(uri) => setFormData({ ...formData, logo: uri })}
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
              label="Chairman Photo"
              value={formData.chairman_photo}
              onChange={(uri) => setFormData({ ...formData, chairman_photo: uri })}
            />
            <ContactNumbers
              label="Contact Numbers"
              numbers={formData.contact_numbers}
              onChange={(numbers) => setFormData({ ...formData, contact_numbers: numbers })}
            />
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepView}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Select Branches</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {selectedUniversityId
                ? `Select which branches (CSE, ECE, etc.) this college offers from the university branch list. (${availableBranches.length} available)`
                : 'Please select a university first to see available branches.'}
            </Text>
            {selectedUniversityId ? (
              <View style={styles.coursesList}>
                {availableBranches.length === 0 ? (
                  <View style={[styles.emptyCourses, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.emptyCoursesText, { color: colors.textTertiary }]}>
                      No branches available for this university. Add branches (CSE, ECE, etc.) to the university first.
                    </Text>
                  </View>
                ) : (
                  availableBranches.map((branch) => (
                    <Checkbox
                      key={branch.id}
                      label={`${branch.code} - ${branch.name}`}
                      checked={formData.offered_branches.includes(branch.id)}
                      onToggle={() => toggleBranch(branch.id)}
                    />
                  ))
                )}
              </View>
            ) : (
              <View style={[styles.emptyCourses, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.emptyCoursesText, { color: colors.textTertiary }]}>
                  No university selected. Go back to step 1.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Footer Navigation */}
      <View style={styles.formFooter}>
        <AdminButton
          label="Cancel"
          onPress={onCancel}
          variant="ghost"
          disabled={saving}
        />
        <View style={styles.footerNav}>
          {currentStep > 1 && (
            <AdminButton
              label="← Previous"
              onPress={() => onStepChange(Math.max(currentStep - 1, 1))}
              variant="secondary"
              disabled={saving}
            />
          )}
          {currentStep < 3 ? (
            <AdminButton
              label="Next →"
              onPress={handleNext}
              variant="primary"
              disabled={saving}
            />
          ) : (
            <AdminButton
              label={saving ? 'Saving...' : 'Save College'}
              onPress={handleSave}
              variant="primary"
              loading={saving}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// Form Footer with Navigation (kept for reference, but not used)
function CollegeFormFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onCancel,
  onSave,
  saving,
}: {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <View style={styles.footer}>
      <AdminButton label="Cancel" onPress={onCancel} variant="ghost" disabled={saving} />
      <View style={styles.footerNav}>
        {currentStep > 1 && (
          <AdminButton label="← Previous" onPress={onPrev} variant="secondary" disabled={saving} />
        )}
        {currentStep < totalSteps ? (
          <AdminButton label="Next →" onPress={onNext} variant="primary" disabled={saving} />
        ) : (
          <AdminButton
            label={saving ? 'Saving...' : 'Save College'}
            onPress={onSave}
            variant="primary"
            loading={saving}
          />
        )}
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
  formContainer: {
    gap: Spacing.xl,
  },
  stepContent: {
    marginTop: Spacing.lg,
  },
  stepView: {
    gap: Spacing.md,
  },
  stepTitle: {
    ...Typography.h3,
  },
  stepDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  placeholder: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    padding: Spacing.lg,
    backgroundColor: '#1F2937',
    borderRadius: Radius.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNav: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  coursesList: {
    marginTop: Spacing.md,
    maxHeight: 400,
  },
  emptyCourses: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  emptyCoursesText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
});

