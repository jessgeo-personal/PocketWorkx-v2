// src/components/AppFooter.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SlidingMenu from './SlidingMenu';
import { Colors, Spacing, Typography } from '../utils/theme';
import { useOnboarding } from './onboarding/OnboardingManager';

const AppFooter: React.FC = () => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { onMenuButtonPressed } = useOnboarding();

  const handleMenuPress = () => {
    // Step 1: request step advance synchronously
    onMenuButtonPressed();

    // Step 2: open menu on the next frame to allow cloud to unmount/remount
    requestAnimationFrame(() => {
      console.log('[Onboarding] Opening SlidingMenu after advancing to slidingmenu_tutorial');
      setMenuVisible(true);
    });
  };


  return (
    <>
      {/* Persistent bottom-center round menu button */}
      <View pointerEvents="box-none" style={styles.footerContainer}>
        <TouchableOpacity
          accessibilityLabel="Open Menu"
          onPress={handleMenuPress}
          activeOpacity={0.9}
          style={styles.menuButton}
        >
          <MaterialIcons name="menu" size={28} color="#333333" />
        </TouchableOpacity>
        {/* Optional caption/help under button (kept subtle) */}
        <Text style={styles.footerText}>Menu</Text>
      </View>

      {/* Sliding Menu */}
      <SlidingMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: Platform.select({ ios: 24, android: 24, default: 24 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    // allow overlaying above content
    zIndex: 100,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB', // grey button background
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  footerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default AppFooter;
