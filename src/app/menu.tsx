// src/app/menu.tsx - FIXED VERSION with visible group titles
import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  badge?: string;
}

const MenuScreen: React.FC = () => {
  const router = useRouter();

  const menuGroups: MenuGroup[] = [
    {
      title: 'Accounts',
      items: [
        {
          id: 'cash',
          title: 'Cash',
          icon: 'account-balance-wallet',
          onPress: () => console.log('Cash')
        },
        {
          id: 'accounts',
          title: 'Accounts',
          icon: 'account-balance',
          onPress: () => console.log('Accounts')
        },
        {
          id: 'crypto',
          title: 'Crypto Assets',
          icon: 'currency-bitcoin',
          onPress: () => console.log('Crypto Assets')
        }
      ]
    },
    {
      title: 'Liabilities',
      items: [
        {
          id: 'loans',
          title: 'Loans',
          icon: 'home',
          onPress: () => console.log('Loans')
        },
        {
          id: 'credit-cards',
          title: 'Credit Cards',
          icon: 'credit-card',
          onPress: () => console.log('Credit Cards')
        }
      ]
    },
    {
      title: 'Investments',
      items: [
        {
          id: 'receivables',
          title: 'Receivables',
          icon: 'receipt',
          onPress: () => console.log('Receivables')
        },
        {
          id: 'investments',
          title: 'Investments',
          icon: 'trending-up',
          onPress: () => console.log('Investments')
        }
      ]
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: 'dashboard',
          onPress: () => console.log('Dashboard')
        },
        {
          id: 'transactions',
          title: 'Transactions',
          icon: 'receipt-long',
           onPress: () => router.push('/transactions?assetType=cash&filterType=all&assetLabel=All%20Liquid%20Cash')
        },
        {
          id: 'trends',
          title: 'Trends',
          icon: 'analytics',
          onPress: () => console.log('Trends')
        },
        {
          id: 'cashflow',
          title: 'Cashflow',
          icon: 'water-drop',
          onPress: () => console.log('Cashflow')
        }
      ]
    },
    {
      title: 'Quick Actions',
      items: [
        {
          id: 'add-account',
          title: 'Add Account',
          icon: 'add-circle',
          onPress: () => console.log('Add Account')
        },
        {
          id: 'add-crypto',
          title: 'Add Crypto Acct',
          icon: 'add-circle-outline',
          onPress: () => console.log('Add Crypto Account')
        },
        {
          id: 'scan-receipts',
          title: 'Scan receipts',
          icon: 'qr-code-scanner',
          onPress: () => console.log('Scan receipts')
        },
        {
          id: 'upload-statements',
          title: 'Upload Statements',
          icon: 'upload-file',
          onPress: () => console.log('Upload Statements')
        },
        {
          id: 'scan-sms',
          title: 'Scan SMS for transactions',
          icon: 'message',
          onPress: () => console.log('Scan SMS')
        },
        {
          id: 'scan-emails',
          title: 'Scan Emails for transactions',
          icon: 'email',
          onPress: () => console.log('Scan Emails')
        },
        {
          id: 'add-cash',
          title: 'Add Cash',
          icon: 'add',
          onPress: () => console.log('Add Cash')
        }
      ]
    }
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, isLast && styles.lastMenuItem]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemIcon}>
        <MaterialIcons name={item.icon} size={24} color="#4A90E2" />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <MaterialIcons name="chevron-right" size={20} color="#CCCCCC" />
    </TouchableOpacity>
  );

  const renderMenuGroup = (group: MenuGroup, groupIndex: number) => (
    <View key={`${group.title}-${groupIndex}`} style={styles.menuGroup}>
      {/* Group Title - Make it more visible */}
      <View style={styles.groupTitleContainer}>
        <Text style={styles.groupTitle}>{group.title}</Text>
      </View>
      
      {/* Group Items Container */}
      <View style={styles.groupContainer}>
        {group.items.map((item, index) => 
          renderMenuItem(item, index === group.items.length - 1)
        )}
      </View>
    </View>
  );

  // Debug version - Add this temporarily to test
// Replace the return statement in menu.tsx with this simplified version

return (
  <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
    <View style={{ padding: 20, backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>MENU DEBUG</Text>
    </View>
    
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Test Group 1 */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10 }}>
        ACCOUNTS
      </Text>
      <View style={{ backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 20 }}>
        <Text>Cash</Text>
        <Text>Accounts</Text>
        <Text>Crypto Assets</Text>
      </View>

      {/* Test Group 2 */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10 }}>
        LIABILITIES
      </Text>
      <View style={{ backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 20 }}>
        <Text>Loans</Text>
        <Text>Credit Cards</Text>
      </View>

      {/* Test Group 3 */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10 }}>
        INVESTMENTS
      </Text>
      <View style={{ backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginBottom: 20 }}>
        <Text>Receivables</Text>
        <Text>Investments</Text>
      </View>
    </ScrollView>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  menuGroup: {
    marginTop: 20,
  },
  groupTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MenuScreen;