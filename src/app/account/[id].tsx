// src/app/account/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ScreenLayout from '../../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/currency';
import {
  fetchAccountById,
  addTransaction,
  Account,
  Transaction,
} from '../../services/accountService';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import { ProcessedTransaction } from '../../services/FileProcessorService';

type AccountWithTx = Account & { transactions: Transaction[] };

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [account, setAccount] = useState<AccountWithTx | null>(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) loadAccount(id);
  }, [id]);

  const loadAccount = async (accountId: string) => {
    setLoading(true);
    try {
      const fullAcct = await fetchAccountById(accountId);
      setAccount(fullAcct);
    } catch (error) {
      Alert.alert('Error', 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!account) return;
    setRefreshing(true);
    await loadAccount(account.id);
    setRefreshing(false);
  };

  const handleParsed = async (parsed: ProcessedTransaction[]) => {
    if (!account) return;
    try {
      for (const tx of parsed) {
        await addTransaction(account.id, {
          accountId: account.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          category: tx.category,
        });
      }
      await loadAccount(account.id);
      Alert.alert('Success', `${parsed.length} transactions added`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transactions');
    }
  };

  const renderAccountHeader = () => {
    if (!account) return null;
    
    return (
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.nickname}</Text>
          <Text style={styles.bankName}>{account.bankName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/account/${account.id}/edit`)}
        >
          <Feather name="edit-2" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderBalanceCard = () => {
    if (!account) return null;
    
    return (
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[
          styles.balanceAmount,
          { color: account.balance >= 0 ? Colors.success.main : Colors.error.main }
        ]}>
          {formatCurrency(account.balance, account.currency)}
        </Text>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setUploadVisible(true)}
      >
        <Feather name="upload" size={20} color={Colors.accent} />
        <Text style={styles.actionButtonText}>Upload Statement</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => Alert.alert('Coming Soon', 'Manual transaction entry will be available soon')}
      >
        <Feather name="plus" size={20} color={Colors.accent} />
        <Text style={styles.actionButtonText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransactionItem = (item: Transaction) => {
    const isDebit = item.type === 'DEBIT';
    return (
      <View key={item.id} style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          {item.category && (
            <Text style={styles.transactionCategory}>{item.category}</Text>
          )}
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: isDebit ? Colors.error.main : Colors.success.main }
          ]}>
            {isDebit ? '-' : '+'}{formatCurrency(item.amount, account?.currency || 'INR')}
          </Text>
        </View>
      </View>
    );
  };

  const renderTransactionsList = () => {
    if (!account || !account.transactions?.length) {
      return (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={Colors.text.secondary} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Upload a statement or add transactions manually</Text>
        </View>
      );
    }

    return (
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionsList}>
          {account.transactions.slice(0, 10).map(renderTransactionItem)}
        </View>
        {account.transactions.length > 10 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Transactions</Text>
            <Feather name="chevron-right" size={16} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading account details...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!account) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={Colors.error.main} />
          <Text style={styles.errorText}>Account not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => id && loadAccount(id)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderAccountHeader()}
        {renderBalanceCard()}
        {renderActionButtons()}
        {renderTransactionsList()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <DocumentUploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onParsed={handleParsed}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error.main,
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  bankName: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  editButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    ...Shadows.base,
  },
  balanceCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.base,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  transactionsSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  transactionsList: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    ...Shadows.base,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  transactionCategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent,
    backgroundColor: Colors.grey[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent,
    marginRight: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
});