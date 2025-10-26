// src/components/SlidingMenu.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../utils/theme';

interface SlidingMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SlidingMenu: React.FC<SlidingMenuProps> = ({ visible, onClose }) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const menuGroups: MenuGroup[] = [
    {
      title: 'Accounts',
      items: [
        { id: '1', title: 'Cash', route: '/cash', icon: 'account-balance-wallet', color: colors.primary },
        { id: '2', title: 'Accounts', route: '/accounts', icon: 'account-balance', color: colors.secondary },
        { id: '3', title: 'Crypto Assets', route: '/crypto', icon: 'currency-bitcoin', color: colors.primary },
      ],
    },
    {
      title: 'Liabilities',
      items: [
        { id: '4', title: 'Loans', route: '/loans', icon: 'trending-down', color: colors.error },
        { id: '5', title: 'Credit Cards', route: '/credit-cards', icon: 'credit-card', color: colors.secondary },
      ],
    },
    {
      title: 'Investments',
      items: [
        { id: '6', title: 'Receivables', route: '/receivables', icon: 'receipt', color: colors.secondary },
        { id: '7', title: 'Investments', route: '/investments', icon: 'trending-up', color: colors.primary },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { id: '8', title: 'Dashboard', route: '/dashboard', icon: 'dashboard', color: colors.secondary },
        { id: '9', title: 'Trends', route: '/trends', icon: 'show-chart', color: colors.primary },
        { id: '15', title: 'Cashflow', route: '/cashflow', icon: 'swap-horiz', color: colors.secondary },
      ],
    },
    {
      title: 'Quick Actions',
      items: [
        { id: '11', title: 'Liquidity', route: '/liquidity', icon: 'water-drop', color: colors.primary },
        { id: '12', title: 'Liabilities', route: '/liabilities', icon: 'remove-circle', color: colors.error },
        { id: '13', title: 'Investments & Receivables', route: '/investments-receivables', icon: 'pie-chart', color: colors.secondary },
        { id: '14', title: 'Analytics', route: '/analytics', icon: 'analytics', color: colors.secondary },
      ],
    },
  ];

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleMenuItemPress = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuItemPress(item.route)} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <MaterialIcons name={item.icon} size={24} color={colors.background} />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderMenuGroup = (group: MenuGroup) => (
    <View key={group.title} style={styles.menuGroup}>
      <Text style={styles.groupTitle}>{group.title}</Text>
      <View style={styles.groupGrid}>{group.items.map(renderMenuItem)}</View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.menuContainer, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.appName}>Pocket</Text>
          <Text style={styles.appNameAccent}>Workx</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {menuGroups.map(renderMenuGroup)}
        </ScrollView>
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  appNameAccent: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
    marginLeft: 4,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  menuGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  menuItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  menuItemText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
  },
});

export default SlidingMenu;
