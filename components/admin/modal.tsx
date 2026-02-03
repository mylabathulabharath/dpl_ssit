/**
 * 🪟 Modal Component
 * Reusable modal for admin forms and dialogs
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Glows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AdminModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function AdminModal({
  visible,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
}: AdminModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  const sizeStyles = {
    small: { width: '90%', maxWidth: 400 },
    medium: { width: '90%', maxWidth: 600 },
    large: { width: '95%', maxWidth: 900 },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface },
            sizeStyles[size],
            Platform.OS === 'web' && Glows.card,
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
            >
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    borderRadius: Radius.xl,
    maxHeight: '90%',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h2,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
    maxHeight: 500,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
});

