/**
 * 📋 Select/Dropdown Component
 * Reusable select dropdown for admin forms
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, FlatList } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  required = false,
  error,
  disabled = false,
}: SelectProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={{ color: colors.accent }}>*</Text>}
      </Text>
      
      {Platform.OS === 'web' ? (
        // Web: Use native select
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: colors.surfaceElevated,
            color: colors.text,
            border: `1px solid ${error ? colors.accent : colors.border}`,
            fontSize: '16px',
            outline: 'none',
            minHeight: '44px',
          }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} style={{ backgroundColor: colors.surfaceElevated }}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        // Native: Use TouchableOpacity with modal
        <>
          <TouchableOpacity
            style={[
              styles.select,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: error ? colors.accent : colors.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectText,
                {
                  color: selectedOption ? colors.text : colors.textTertiary,
                },
              ]}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
          
          <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsOpen(false)}
            >
              <View
                style={[styles.modalContent, { backgroundColor: colors.surface }]}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {label || 'Select an option'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: value === item.value ? colors.primary + '20' : 'transparent',
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        onChange(item.value);
                        setIsOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: value === item.value ? colors.primary : colors.text,
                            fontWeight: value === item.value ? '600' : '400',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {value === item.value && (
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                        No options available
                      </Text>
                    </View>
                  }
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}

      {error && <Text style={[styles.errorText, { color: colors.accent }]}>{error}</Text>}
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
  select: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    ...Typography.body,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  optionText: {
    ...Typography.body,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
  },
});

