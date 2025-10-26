import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import BottomMenuButton from '../ui/BottomMenuButton';
import BottomMenu from '../navigation/BottomMenu';
import ComingSoonModal from '../ui/ComingSoonModal';
import { Colors } from '../../utils/theme';

interface AppLayoutProps {
  children: React.ReactNode;
  currentScreen?: string;
  onNavigate?: (screen: string) => void;
}

export default function AppLayout({
  children,
  currentScreen = 'home',
  onNavigate = () => {},
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  // Load Inter fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Set status bar style
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(Colors.primary, true);
    }
  }, []);

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const handleNavigate = (screen: string) => {
    // Handle coming soon features
    if (screen === 'coming-soon-crypto') {
      setComingSoonFeature('Crypto');
      setComingSoonVisible(true);
      return;
    }
    
    // Handle other coming soon features based on screen
    const comingSoonFeatures: Record<string, string> = {
      'coming-soon-email': 'Email Integration',
      'coming-soon-pdf': 'PDF Processing',
      'coming-soon-ocr': 'Receipt OCR',
      'coming-soon-analytics': 'Advanced Analytics',
    };
    
    if (comingSoonFeatures[screen]) {
      setComingSoonFeature(comingSoonFeatures[screen]);
      setComingSoonVisible(true);
      return;
    }
    
    // Handle normal navigation
    onNavigate(screen);
    setMenuVisible(false);
  };

  const handleComingSoonClose = () => {
    setComingSoonVisible(false);
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />
      
      {/* Main Content */}
      <View style={[
        styles.content,
        {
          paddingTop: insets.top,
        },
      ]}>
        {children}
      </View>
      
      {/* Bottom Menu Button */}
      <BottomMenuButton
        onPress={handleMenuToggle}
        isMenuOpen={menuVisible}
      />
      
      {/* Bottom Sliding Menu */}
      <BottomMenu
        visible={menuVisible}
        onClose={handleMenuClose}
        onNavigate={handleNavigate}
        currentScreen={currentScreen}
      />
      
      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={comingSoonVisible}
        onClose={handleComingSoonClose}
        feature={comingSoonFeature}
        description={
          comingSoonFeature === 'Crypto'
            ? 'Cryptocurrency features will be available shortly. Track bank accounts, loans, credit cards, and investments today.'
            : `${comingSoonFeature} will be available in the next update. Continue using manual entry and SMS processing for now.`
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  
  content: {
    flex: 1,
  },
});
