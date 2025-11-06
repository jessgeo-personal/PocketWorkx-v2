// src/components/ui/VersionFooter.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../utils/theme';

interface VersionFooterProps {
  style?: any;
  centered?: boolean;
}

const VersionFooter: React.FC<VersionFooterProps> = ({ 
  style, 
  centered = true 
}) => {
  return (
    <View style={[styles.container, centered && styles.centered, style]}>
      <Text style={styles.versionText}>
        All rights reserved. PocketWorkx v1.1
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  centered: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    opacity: 0.7,
  },
});

export default VersionFooter;
