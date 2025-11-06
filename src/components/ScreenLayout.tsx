// src/components/ScreenLayout.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import SlidingMenu from './SlidingMenu';
import { Colors } from '../utils/theme';
import { useOnboarding } from './onboarding/OnboardingManager';


interface ScreenLayoutProps {
  children: React.ReactNode;
  showMenuButton?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ 
  children, 
  showMenuButton = true 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { onMenuButtonPressed } = useOnboarding(); // NEW

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      
      <View style={styles.content}>
        {children}
      </View>

      {showMenuButton && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            console.log('[ScreenLayout] Menu button pressed, calling onMenuButtonPressed');
            onMenuButtonPressed(); // NEW - advance onboarding step
            setMenuVisible(true);
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="menu" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      <SlidingMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.grey[600],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default ScreenLayout;
