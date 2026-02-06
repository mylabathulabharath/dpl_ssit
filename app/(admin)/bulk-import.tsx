/**
 * app/(admin)/bulk-import.tsx
 * Bulk course import from Excel
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { AdminButton } from '@/components/admin/button';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import {
  parseExcelFile,
  validateCourses,
  importCourses,
  generateExcelTemplate,
  ParsedCourse,
} from '@/services/excel-import-service';

export default function BulkImportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { user, userProfile } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{
    success: boolean;
    coursesCreated: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Excel import is only available on web platform');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const selectedFile = (e.target as HTMLInputElement).files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        await handleParseFile(selectedFile);
      }
    };
    input.click();
  };

  const handleParseFile = async (selectedFile: File) => {
    setIsParsing(true);
    setValidationErrors([]);
    setParsedCourses([]);
    setImportResult(null);

    try {
      const courses = await parseExcelFile(selectedFile);
      const { valid, errors } = validateCourses(courses);

      setParsedCourses(valid);
      setValidationErrors(errors);

      if (valid.length === 0) {
        Alert.alert(
          'Validation Failed',
          'No valid courses found in the Excel file. Please check the errors and try again.'
        );
      } else if (errors.length > 0) {
        Alert.alert(
          'Validation Warnings',
          `Found ${valid.length} valid courses, but ${errors.length} errors were detected. Check the errors below.`
        );
      }
    } catch (error: any) {
      Alert.alert('Parse Error', error?.message || 'Failed to parse Excel file');
      setValidationErrors([error?.message || 'Failed to parse Excel file']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Template download is only available on web platform');
      return;
    }

    try {
      const blob = await generateExcelTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'course-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate template: ${error?.message}`);
    }
  };

  const handleImport = async () => {
    if (!user?.uid || !userProfile?.displayName) {
      Alert.alert('Error', 'You must be logged in to import courses');
      return;
    }

    if (parsedCourses.length === 0) {
      Alert.alert('Error', 'No valid courses to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedCourses.length });
    setImportResult(null);

    try {
      const result = await importCourses(
        parsedCourses,
        user.uid,
        userProfile.displayName,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );

      setImportResult(result);

      if (result.success && result.errors.length === 0) {
        Alert.alert(
          'Success',
          `Successfully imported ${result.coursesCreated} course(s)!`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          result.success ? 'Partial Success' : 'Import Failed',
          `Created ${result.coursesCreated} course(s). ${result.errors.length} error(s) occurred.`
        );
      }
    } catch (error: any) {
      Alert.alert('Import Error', error?.message || 'Failed to import courses');
      setImportResult({
        success: false,
        coursesCreated: 0,
        errors: [error?.message || 'Unknown error'],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Bulk Course Import</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Import multiple courses from Excel file
            </ThemedText>
          </View>

          {/* Template Download */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={styles.sectionTitle}>Step 1: Download Template</ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Download the Excel template to see the required format
            </ThemedText>
            <TouchableOpacity
              style={[styles.templateButton, { backgroundColor: colors.primary }]}
              onPress={handleDownloadTemplate}
            >
              <ThemedText style={styles.templateButtonText}>Download Template</ThemedText>
            </TouchableOpacity>
          </View>

          {/* File Upload */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={styles.sectionTitle}>Step 2: Upload Excel File</ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Select an Excel file (.xlsx) with course data
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isParsing && styles.uploadButtonDisabled,
              ]}
              onPress={handleFileSelect}
              disabled={isParsing}
            >
              {isParsing ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <ThemedText style={[styles.uploadButtonText, { marginLeft: Spacing.sm }]}>
                    Parsing...
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.uploadButtonText}>
                  {file ? file.name : 'Select Excel File'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.error }]}>
                Validation Errors ({validationErrors.length})
              </ThemedText>
              <ScrollView style={styles.errorsList} nestedScrollEnabled>
                {validationErrors.map((error, index) => (
                  <ThemedText key={index} style={[styles.errorText, { color: colors.error }]}>
                    • {error}
                  </ThemedText>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Preview */}
          {parsedCourses.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={styles.sectionTitle}>
                Preview ({parsedCourses.length} course(s))
              </ThemedText>
              <ScrollView style={styles.previewList} nestedScrollEnabled>
                {parsedCourses.map((course, index) => (
                  <View
                    key={index}
                    style={[styles.previewItem, { borderColor: colors.border }]}
                  >
                    <ThemedText style={styles.previewCourseTitle}>{course.title}</ThemedText>
                    <ThemedText style={[styles.previewCourseDescription, { color: colors.textSecondary }]}>
                      {course.description}
                    </ThemedText>
                    <ThemedText style={[styles.previewCourseMeta, { color: colors.textTertiary }]}>
                      {course.topics.length} topic(s) • {course.category} • {course.language}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Import Progress */}
          {isImporting && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={styles.sectionTitle}>Importing...</ThemedText>
              <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {importProgress.current} of {importProgress.total} courses
              </ThemedText>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(importProgress.current / importProgress.total) * 100}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Import Result */}
          {importResult && (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: importResult.success
                    ? colors.completed + '20'
                    : colors.error + '20',
                  borderColor: importResult.success ? colors.completed : colors.error,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { color: importResult.success ? colors.completed : colors.error },
                ]}
              >
                {importResult.success ? 'Import Complete' : 'Import Failed'}
              </ThemedText>
              <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Created {importResult.coursesCreated} course(s)
              </ThemedText>
              {importResult.errors.length > 0 && (
                <ScrollView style={styles.errorsList} nestedScrollEnabled>
                  {importResult.errors.map((error, index) => (
                    <ThemedText key={index} style={[styles.errorText, { color: colors.error }]}>
                      • {error}
                    </ThemedText>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Import Button */}
          {parsedCourses.length > 0 && !isImporting && (
            <View style={styles.actions}>
              <AdminButton
                title={`Import ${parsedCourses.length} Course(s)`}
                onPress={handleImport}
                variant="primary"
                fullWidth
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  templateButton: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  templateButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadButton: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    ...Typography.bodyMedium,
  },
  errorsList: {
    maxHeight: 200,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  previewList: {
    maxHeight: 300,
    marginTop: Spacing.sm,
  },
  previewItem: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  previewCourseTitle: {
    ...Typography.heading4,
    marginBottom: Spacing.xs,
  },
  previewCourseDescription: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  previewCourseMeta: {
    ...Typography.caption,
  },
  progressBar: {
    height: 8,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.sm,
  },
  actions: {
    marginTop: Spacing.lg,
  },
});

