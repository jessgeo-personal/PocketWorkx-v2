// src/components/FloatingActionButton.tsx

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { colors } from '../utils/theme';

interface Props {
  onPress: () => void;
}

const FloatingActionButton: React.FC<Props> = ({ onPress }) => {
  const { colors: themeColors } = useTheme();

  return (
    <TouchableOpacity style={[styles.fab, { backgroundColor: themeColors.primary || colors.secondary }]} onPress={onPress}>
      <Ionicons name="add" size={24} color={themeColors.background || colors.background} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default FloatingActionButton;