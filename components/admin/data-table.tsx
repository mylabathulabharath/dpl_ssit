/**
 * 📊 Data Table Component
 * Reusable table for displaying admin data
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: number | string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowPress?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowPress,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
          {columns.map((column, index) => (
            <View
              key={column.key as string}
              style={[
                styles.headerCell,
                index === 0 && styles.firstCell,
                index === columns.length - 1 && styles.lastCell,
                column.width && { width: column.width },
              ]}
            >
              <Text style={[styles.headerText, { color: colors.textSecondary }]}>
                {column.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((item, rowIndex) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onRowPress?.(item)}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              rowIndex === data.length - 1 && styles.lastRow,
            ]}
            activeOpacity={onRowPress ? 0.7 : 1}
          >
            {columns.map((column, colIndex) => (
              <View
                key={column.key as string}
                style={[
                  styles.cell,
                  colIndex === 0 && styles.firstCell,
                  colIndex === columns.length - 1 && styles.lastCell,
                  column.width && { width: column.width },
                ]}
              >
                {column.render ? (
                  column.render(item)
                ) : (
                  <Text style={[styles.cellText, { color: colors.text }]}>
                    {String(item[column.key as keyof T] ?? '')}
                  </Text>
                )}
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        minWidth: '100%',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headerCell: {
    padding: Spacing.md,
    minWidth: 120,
    flex: 1,
  },
  cell: {
    padding: Spacing.md,
    minWidth: 120,
    flex: 1,
    justifyContent: 'center',
  },
  firstCell: {
    paddingLeft: Spacing.lg,
  },
  lastCell: {
    paddingRight: Spacing.lg,
  },
  headerText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    ...Typography.body,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    ...Typography.body,
  },
});

