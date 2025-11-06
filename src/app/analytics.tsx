// src/app/analytics.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../utils/theme';
import {
  exportAccountsCsv,
  exportTransactionsCsv,
} from '../services/exportService';


export default function AnalyticsScreen() {
  const [isExporting, setIsExporting] = useState(false);

  const onExportAccounts = async () => {
    setIsExporting(true);
    try {
      const result = await exportAccountsCsv();
      if (result.success) {
        Alert.alert('Success', 'Accounts exported successfully!');
      } else {
        Alert.alert('Error', 'Failed to export accounts');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while exporting accounts');
    } finally {
      setIsExporting(false);
    }
  };

  const onExportTransactions = async () => {
    setIsExporting(true);
    try {
      const result = await exportTransactionsCsv();
      if (result.success) {
        Alert.alert('Success', 'Transactions exported successfully!');
      } else {
        Alert.alert('Error', 'Failed to export transactions');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while exporting transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Analytics & Reports</Text>
      <Text style={styles.headerSubtitle}>Export your financial data</Text>
    </View>
  );

  const renderExportCard = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    iconColor: string
  ) => (
    <TouchableOpacity 
      style={[styles.exportCard, isExporting && styles.disabledCard]}
      onPress={onPress}
      disabled={isExporting}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Feather name={icon as any} size={24} color={Colors.white} />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Feather 
          name={isExporting ? "loader" : "download"} 
          size={20} 
          color={Colors.text.secondary} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderComingSoonSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Coming Soon</Text>
      
      <View style={styles.comingSoonCard}>
        <Feather name="bar-chart-2" size={32} color={Colors.text.secondary} />
        <Text style={styles.comingSoonTitle}>Advanced Analytics</Text>
        <Text style={styles.comingSoonDescription}>
          Detailed spending insights, category breakdowns, and financial trends will be available soon.
        </Text>
      </View>
      
      <View style={styles.comingSoonCard}>
        <Feather name="pie-chart" size={32} color={Colors.text.secondary} />
        <Text style={styles.comingSoonTitle}>Portfolio Analysis</Text>
        <Text style={styles.comingSoonDescription}>
          Asset allocation charts and investment performance tracking coming in the next update.
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Export</Text>
          
          {renderExportCard(
            'Export Accounts',
            'Download all account information as CSV',
            'database',
            onExportAccounts,
            Colors.info.main
          )}
          
          {renderExportCard(
            'Export Transactions',
            'Download transaction history as CSV',
            'list',
            onExportTransactions,
            Colors.success.main
          )}
        </View>
        
        {renderComingSoonSection()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  section: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  exportCard: {
    backgroundColor: Colors.background.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  cardRight: {
    padding: Spacing.sm,
  },
  comingSoonCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comingSoonDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
});