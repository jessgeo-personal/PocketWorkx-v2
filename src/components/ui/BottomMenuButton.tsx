import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../utils/theme';

interface BottomMenuButtonProps {
  onPress: () => void;
  isMenuOpen?: boolean;
}

export default function BottomMenuButton({
  onPress,
  isMenuOpen = false,
}: BottomMenuButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + Spacing.base,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isMenuOpen && styles.buttonActive,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Feather
          name={isMenuOpen ? 'x' : 'menu'}
          size={20}
          color={Colors.text.light}
        />
        <Text style={styles.buttonText}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  
  button: {
    backgroundColor: Colors.grey[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minHeight: Layout.bottomMenu.buttonHeight,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  
  buttonActive: {
    backgroundColor: Colors.accent,
  },
  
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.light,
  },
});
