/**
 * 📞 Contact Numbers Manager
 * Dynamic add/remove contact numbers
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FormInput } from './form-input';
import { AdminButton } from './button';

interface ContactNumbersProps {
  label: string;
  numbers: string[];
  onChange: (numbers: string[]) => void;
}

export function ContactNumbers({ label, numbers, onChange }: ContactNumbersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  const addNumber = () => {
    onChange([...numbers, '']);
  };

  const removeNumber = (index: number) => {
    onChange(numbers.filter((_, i) => i !== index));
  };

  const updateNumber = (index: number, value: string) => {
    const updated = [...numbers];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <AdminButton
          label="➕ Add"
          onPress={addNumber}
          variant="secondary"
          size="small"
        />
      </View>

      {numbers.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No contact numbers added. Click "Add" to add one.
          </Text>
        </View>
      ) : (
        <View style={styles.numbersList}>
          {numbers.map((number, index) => (
            <View key={index} style={styles.numberItem}>
              <View style={styles.numberInput}>
                <FormInput
                  label={`Contact ${index + 1}`}
                  value={number}
                  onChangeText={(text) => updateNumber(index, text)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.accent + '20' }]}
                onPress={() => removeNumber(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.removeIcon, { color: colors.accent }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  numbersList: {
    gap: Spacing.md,
  },
  numberItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  numberInput: {
    flex: 1,
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24, // Align with input field
  },
  removeIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
});

