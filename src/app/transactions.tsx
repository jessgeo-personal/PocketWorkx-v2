// src/app/transactions.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import TransactionsModal from '../components/modals/TransactionsModal';
import { Colors } from '../utils/theme';
import type { FilterCriteria } from '../types/transactions';

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    assetType?: string; 
    filterType?: string; 
    assetLabel?: string; 
  }>();

  // Build FilterCriteria from URL parameters
  const filter: FilterCriteria = {
    assetType: (params.assetType as any) || 'cash',
    filterType: (params.filterType as any) || 'all',
    assetLabel: params.assetLabel || 'Transactions',
  };

  return (
    <ScreenLayout>
      <SafeAreaView style={styles.container}>
        {/* Page header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{filter.assetLabel}</Text>
            <View style={{ width: 24 }} />
        </View>
        
        {/* Reuse the TransactionsModal as full-screen content */}
        <View style={styles.contentContainer}>
          <TransactionsModal
            visible={true}
            onClose={() => router.back()}
            params={{ filterCriteria: filter }}
          />
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.primary 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.main,
  },
  backButton: {
    padding: 8,
  },
  title: { 
    fontWeight: '700', 
    fontSize: 18, 
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});

export default TransactionsPage;
