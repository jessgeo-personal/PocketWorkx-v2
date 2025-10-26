// src/components/ScreenLayout.tsx

import React, { useState, createContext, useContext } from 'react';
import { View, StyleSheet, Image, SafeAreaView } from 'react-native';
import SlidingMenu from './SlidingMenu';
import FloatingMenuButton from './FloatingMenuButton';
import { colors, sectionColors } from '../utils/theme';
import logo from '../assets/logo.png';

interface ScreenLayoutProps {
  children: React.ReactNode;
}

// Section theme configuration
export const sectionTheme = {
  netWorth: sectionColors.netWorth,
  cash: sectionColors.cash,
  accounts: sectionColors.cash,        // accounts treated same as cash
  liabilities: sectionColors.liabilities,
  investments: sectionColors.investments,
  receivables: sectionColors.investments, // same as investments
  other: sectionColors.allOthers,
};

// Create context for section colors
export const SectionThemeContext = createContext(sectionTheme);

// Custom hook to use section theme
export const useSectionTheme = () => useContext(SectionThemeContext);

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

return (
    <SectionThemeContext.Provider value={sectionTheme}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.content}>{children}</View>

        <FloatingMenuButton onPress={toggleMenu} isMenuOpen={isMenuVisible} />
        <SlidingMenu visible={isMenuVisible} onClose={closeMenu} />
      </SafeAreaView>
    </SectionThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 120,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  logo: {
    width: 200,
    height: 100,
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout;
