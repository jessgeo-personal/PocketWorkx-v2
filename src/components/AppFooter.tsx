// src/components/AppFooter.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../utils/theme';
import { useOnboarding } from './onboarding/OnboardingManager'; // adjust relative path if needed

// Centralized version and copyright info
const APP_VERSION = '1.0.1';
const COPYRIGHT_TEXT = 'All rights reserved. PocketWorkx';

export const AppFooter: React.FC = () => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { onMenuButtonPressed } = useOnboarding(); // NEW

  const handleMenuPress = () => {
    // Notify onboarding for menu_tutorial → slidingmenu_tutorial
    onMenuButtonPressed(); // NEW
    setMenuVisible(true);
  };

  return (
    <>
      {/* ...other footer UI... */}
      <TouchableOpacity
        accessibilityLabel="Open Menu"
        onPress={handleMenuPress} // UPDATED
        activeOpacity={0.9}
        style={styles.menuButton}
      >
        {/* round grey menu icon as before */}
      </TouchableOpacity>

      <SlidingMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
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
