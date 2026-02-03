/**
 * 🖼️ Image Upload Component
 * Handles image selection and preview for logos/photos
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdminButton } from './button';
import { FormInput } from './form-input';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (uri: string) => void;
  required?: boolean;
}

export function ImageUpload({ label, value, onChange, required = false }: ImageUploadProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const [uploading, setUploading] = useState(false);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // For web, show URL input option
      setShowUrlInput(true);
      return;
    }

    try {
      // For native, use expo-image-picker (if installed)
      // For now, fallback to URL input
      setShowUrlInput(true);
    } catch (error) {
      console.error('Error picking image:', error);
      setShowUrlInput(true);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={{ color: colors.accent }}>*</Text>}
      </Text>

      {showUrlInput && !value ? (
        <View style={styles.urlInputContainer}>
          <FormInput
            label="Image URL"
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="https://example.com/image.png"
            keyboardType="default"
            autoCapitalize="none"
          />
          <View style={styles.urlActions}>
            <AdminButton
              label="Cancel"
              onPress={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              variant="ghost"
              size="small"
            />
            <AdminButton
              label="Use URL"
              onPress={handleUrlSubmit}
              variant="primary"
              size="small"
            />
          </View>
        </View>
      ) : value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewActions}>
            <AdminButton
              label="Change"
              onPress={pickImage}
              variant="secondary"
              size="small"
            />
            <AdminButton
              label="Remove"
              onPress={removeImage}
              variant="danger"
              size="small"
            />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          <Text style={[styles.uploadIcon, { color: colors.textSecondary }]}>📷</Text>
          <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
            Tap to add image URL
          </Text>
          <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>
            Enter image URL or upload file (web: URL, mobile: file picker)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  uploadText: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  uploadHint: {
    ...Typography.bodySmall,
  },
  previewContainer: {
    gap: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: '#1F2937',
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  urlInputContainer: {
    gap: Spacing.md,
  },
  urlActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'flex-end',
  },
});

