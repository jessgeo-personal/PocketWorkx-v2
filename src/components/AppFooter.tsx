// src/components/AppFooter.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../utils/theme';

// Centralized version and copyright info
const APP_VERSION = '1.0.1';
const COPYRIGHT_TEXT = 'All rights reserved. PocketWorkx';

const AppFooter: React.FC = () => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>
        {COPYRIGHT_TEXT} v{APP_VERSION}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AppFooter;
