/**
 * 📍 Stepper Component
 * Multi-step form navigation for complex flows
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepPress?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onStepPress }: StepperProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isClickable = onStepPress && (isCompleted || isActive);

        return (
          <View key={index} style={styles.stepContainer}>
            {/* Step Circle */}
            <TouchableOpacity
              onPress={() => isClickable && onStepPress?.(index)}
              disabled={!isClickable}
              style={[
                styles.stepCircle,
                {
                  backgroundColor: isCompleted
                    ? colors.primary
                    : isActive
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={isClickable ? 0.7 : 1}
            >
              {isCompleted ? (
                <Text style={[styles.checkIcon, { color: colors.text }]}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color: isActive ? colors.text : colors.textSecondary,
                    },
                  ]}
                >
                  {stepNumber}
                </Text>
              )}
            </TouchableOpacity>

            {/* Step Info */}
            <View style={styles.stepInfo}>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isActive ? colors.text : colors.textSecondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
              {step.description && (
                <Text
                  style={[
                    styles.stepDescription,
                    { color: colors.textTertiary },
                  ]}
                >
                  {step.description}
                </Text>
              )}
            </View>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      stepNumber < currentStep ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumber: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingTop: Spacing.xs,
  },
  stepLabel: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.bodySmall,
  },
  connector: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: 40,
    zIndex: 0,
  },
});

