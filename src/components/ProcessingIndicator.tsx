// src/components/ProcessingIndicator.tsx

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ProcessingProgress } from '../types/finance';
import { colors } from '../utils/theme';

interface ProcessingIndicatorProps {
  progress: ProcessingProgress;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ progress }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stepText}>{progress.currentStep}</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress.progress}%` }]} />
      </View>
      <Text style={styles.percentageText}>{progress.progress}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  stepText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  progressBarBackground: {
    width: '80%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  percentageText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ProcessingIndicator;
