import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../utils/theme';

interface BottomMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MENU_HEIGHT = screenHeight * 0.8; // 80% of screen height

const menuItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'cash', label: 'Cash', icon: 'dollar-sign' },
  { id: 'accounts', label: 'Accounts', icon: 'credit-card' },
  { id: 'crypto', label: 'Crypto Assets', icon: 'trending-up', comingSoon: true },
  { id: 'loans', label: 'Loans', icon: 'file-text' },
  { id: 'cards', label: 'Credit Cards', icon: 'credit-card' },
  { id: 'receivables', label: 'Receivables', icon: 'arrow-down-circle' },
  { id: 'investments', label: 'Investments', icon: 'pie-chart' },
  { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
  { id: 'liquidity', label: 'Liquidity', icon: 'droplet' },
  { id: 'liabilities', label: 'Liabilities', icon: 'minus-circle' },
  { id: 'cashflow', label: 'Cashflow', icon: 'activity' },
];

export default function BottomMenu({
  visible,
  onClose,
  onNavigate,
  currentScreen,
}: BottomMenuProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(MENU_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MENU_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleItemPress = (item: typeof menuItems[0]) => {
    if (item.comingSoon) {
      // Will trigger coming soon modal from parent
      onNavigate('coming-soon-crypto');
    } else {
      onNavigate(item.id);
    }
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Menu Container */}
      <Animated.View
        style={[
          styles.container,
          {
            height: MENU_HEIGHT,
            paddingBottom: insets.bottom,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Feather name="x" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          indicatorStyle="default"
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                currentScreen === item.id && styles.activeMenuItem,
              ]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Feather
                  name={item.icon as any}
                  size={20}
                  color={
                    currentScreen === item.id
                      ? Colors.accent
                      : Colors.text.primary
                  }
                />
              </View>
              
              <Text
                style={[
                  styles.menuItemText,
                  currentScreen === item.id && styles.activeMenuItemText,
                ]}
              >
                {item.label}
              </Text>
              
              {item.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              )}
              
              <Feather
                name="chevron-right"
                size={16}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.modal,
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.xl,
  },
  
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.grey[300],
    borderRadius: BorderRadius.xs,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  
  closeButton: {
    padding: Spacing.sm,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  
  activeMenuItem: {
    backgroundColor: Colors.accentLight + '15',
  },
  
  menuItemIcon: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  
  menuItemText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  
  activeMenuItemText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.accent,
  },
  
  comingSoonBadge: {
    backgroundColor: Colors.warning.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning.dark,
  },
});
