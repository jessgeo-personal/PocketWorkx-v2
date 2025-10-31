// src/components/modals/TransactionsModal.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { useStorage } from '../../services/storage/StorageProvider';
import type { TransactionRecord, FilterCriteria, TransactionModalParams, AccountTransaction } from '../../types/transactions';
import { exportTransactionsToCSV } from '../../utils/csvExport';

type Props = {
  visible: boolean;
  onClose: () => void;
  params: TransactionModalParams;
};

const PAGE_SIZE = 20;

// Add this helper function after imports and before getAssetIcon
const parseAccountLabel = (label?: string) => {
  try {
    const obj = JSON.parse(label || '');
    if (obj && typeof obj === 'object') {
      return obj as { 
        nickname?: string; 
        accountType?: string; 
        last4?: string; 
        bankName?: string; 
      };
    }
  } catch {}
  return null;
};


// ADD these GENERIC helper functions for all asset types:
const getAssetIcon = (assetType: string, assetLabel: string) => {
  const label = assetLabel?.toLowerCase() || '';
  const type = assetType?.toLowerCase() || '';
  
  // Cash categories
  if (type === 'cash') {
    if (label.includes('wallet')) return 'account-balance-wallet';
    if (label.includes('home')) return 'home';
    if (label.includes('car')) return 'directions-car';
    if (label.includes('safe')) return 'security';
    return 'place'; // default cash icon
  }
  
  // Bank accounts (updated)
  if (type === 'account') {
    // Parse JSON label from accounts.tsx
    const parsed = parseAccountLabel(assetLabel);
    if (parsed?.accountType) {
      if (parsed.accountType === 'savings') return 'savings';
      if (parsed.accountType === 'current') return 'account-balance';
      if (parsed.accountType === 'salary') return 'work';
      if (parsed.accountType === 'other') return 'account-balance-wallet';
    }
    return 'account-balance';
  }

  
  // Loans (future)
  if (type === 'loan') {
    if (label.includes('home') || label.includes('mortgage')) return 'home';
    if (label.includes('car') || label.includes('auto')) return 'directions-car';
    if (label.includes('personal')) return 'person';
    return 'trending-up'; // default loan icon
  }
  
  // Credit cards (future)
  if (type === 'credit_card') {
    return 'credit-card';
  }
  
  // Default fallback
  return 'account-balance-wallet';
};

// Add this function after parseAccountLabel
const getBankColorFromParsed = (parsed: any) => {
  if (!parsed?.bankName) return '#1976D2'; // default blue
  const b = parsed.bankName.toLowerCase();
  if (b.includes('icici')) return '#F37021';
  if (b.includes('hdfc')) return '#0054A6';
  if (b.includes('sbi')) return '#1E88E5';
  if (b.includes('axis')) return '#AE275F';
  if (b.includes('kotak')) return '#0066CC';
  return '#1976D2'; // fallback blue
};

const getAssetColor = (assetType: string, assetLabel: string) => {
  const label = assetLabel?.toLowerCase() || '';
  const type = assetType?.toLowerCase() || '';
  
  // Cash categories (keep current colors)
  if (type === 'cash') {
    if (label.includes('wallet')) return '#4CAF50';
    if (label.includes('home')) return '#2196F3';
    if (label.includes('car')) return '#FF9800';
    if (label.includes('safe')) return '#795548';
    return '#666666'; // default cash color
  }
  
  // Bank accounts (future) - different color scheme
  if (type === 'account') {
    if (label.includes('savings')) return '#1976D2'; // blue
    if (label.includes('current')) return '#388E3C'; // green
    if (label.includes('fd')) return '#7B1FA2'; // purple
    return '#1976D2'; // default account color
  }
  
  // Loans (future) - red/orange tones
  if (type === 'loan') {
    if (label.includes('home')) return '#D32F2F'; // red
    if (label.includes('car')) return '#F57C00'; // orange
    if (label.includes('personal')) return '#E64A19'; // deep orange
    return '#D32F2F'; // default loan color
  }
  
  // Credit cards (future) - purple tones
  if (type === 'credit_card') {
    return '#8B5CF6'; // purple accent color
  }
  
  // Default fallback
  return '#666666';
};

const getBalanceLabel = (assetType: string, filterType: string) => {
  if (filterType === 'all') {
    // Asset-type-specific "All" labels
    switch (assetType) {
      case 'cash': return 'Total Liquid Cash';
      case 'account': return 'Total Bank Accounts';
      case 'loan': return 'Total Outstanding Loans';
      case 'credit_card': return 'Total Credit Card Balances';
      case 'investment': return 'Total Investments';
      case 'crypto': return 'Total Crypto Holdings';
      default: return 'Total Balance';
    }
  } else {
    // Asset-type-specific category/individual labels
    switch (assetType) {
      case 'cash': return 'Category Total';
      case 'account': {
          // For individual accounts, show the specific account name
          if (filterType === 'category') {
            // Try to parse account details from assetLabel (this requires access to params)
            // For now, return generic label - enhanced version needs params access
            return 'Account Balance';
          }
          return 'Account Balance';
        }
      case 'loan': return 'Outstanding Balance';
      case 'credit_card': return 'Card Balance';
      case 'investment': return 'Investment Value';
      case 'crypto': return 'Holding Value';
      default: return 'Balance';
    }
  }
};



const TransactionsModal: React.FC<Props> = ({ visible, onClose, params }) => {
  const { state } = useStorage();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // 1) Build unified transactions from state (EXTEND for multiple asset types)
  const allTransactions: TransactionRecord[] = useMemo(() => {
    let combined: TransactionRecord[] = [];

    // CASH transactions (existing)
    if (params.filterCriteria.assetType === 'cash') {
      const cashEntries = (state?.cashEntries ?? []) as any[];
      combined = cashEntries.map((e) => ({
        id: e.id,
        datetime: new Date(e.timestamp),
        amount: { amount: e.amount?.amount ?? 0, currency: 'INR' },
        description: e.description ?? '',
        notes: e.notes,
        cashCategory: e.cashCategory,
        expenseCategory: e.expenseCategory,
        type: e.type,
        assetType: 'cash',
        assetId: e.cashCategory,
        assetLabel: e.cashCategory,
      })) as TransactionRecord[];
    }

    
    // ACCOUNTS transactions - Now reading real AccountTransaction data
    else if (params.filterCriteria.assetType === 'account') {
      const accounts = (state?.accounts ?? []) as any[];
      combined = accounts.flatMap((account) => {
        const packedLabel = JSON.stringify({
          nickname: account.nickname,
          accountType: account.type,
          last4: (account.accountNumberMasked || '').slice(-4).replace('*', ''),
          bankName: account.bankName,
        });

        // Build base real transaction rows for this account
        const realTransactions = (account.transactions ?? []).map((tx: any) => ({
          id: tx.id,
          datetime: new Date(tx.datetime),
          amount: { amount: tx.amount.amount, currency: tx.amount.currency },
          description: tx.description,
          notes: tx.notes,
          type: tx.type,
          assetType: 'account',
          assetId: account.id,
          assetLabel: packedLabel,
          bankName: account.bankName,
          accountType: account.type,
          accountStatus: account.status ?? 'active',
        })) as unknown as TransactionRecord[];

        // If the current modal view is for a specific account (category filter),
        // include a synthetic Opening Balance row as the earliest transaction if missing.
        const isSpecificAccountView =
          params.filterCriteria.assetType === 'account' &&
          params.filterCriteria.filterType === 'category' &&
          params.filterCriteria.assetLabel === packedLabel;

        // Compute opening only for the requested account
        if (isSpecificAccountView) {
          // Sum all transactions amounts (they can be pos/neg)
          const txSum = realTransactions.reduce((sum, t) => sum + (t.amount?.amount ?? 0), 0);
          const currentBalance = account.balance?.amount ?? 0;
          const openingAmount = currentBalance - txSum;

          // Only add Opening Balance row if it does not already exist by description/type
          const hasOpeningRow = realTransactions.some(
            t => t.type === 'ACCT_OPENING_BAL' || (t.description ?? '').toLowerCase().includes('opening balance')
          );

          if (!hasOpeningRow) {
            const openingRow = {
              id: `${account.id}-opening-balance`,
              datetime: realTransactions.length > 0
                ? new Date(new Date(realTransactions[realTransactions.length - 1].datetime).getTime() - 1000)
                : new Date(account.lastSynced ? new Date(account.lastSynced).getTime() - 1000 : Date.now() - 1000),
              amount: { amount: openingAmount, currency: 'INR' },
              description: 'Opening Balance',
              notes: `${account.bankName} • ${account.type?.toUpperCase?.()} • ${account.accountNumberMasked}`,
              type: 'ACCT_OPENING_BAL',
              assetType: 'account',
              assetId: account.id,
              assetLabel: packedLabel,
              bankName: account.bankName,
              accountType: account.type,
              accountStatus: account.status ?? 'active',
            } as TransactionRecord;
            // Include opening row at the end; the global sorter will handle order
            return [...realTransactions, openingRow];
          }
        }

        // Default return: only real transactions
        return realTransactions;

      });
    }


    // Future asset types (loans, credit cards, etc.)
    // Add more else-if blocks here for other asset types

    return combined;
  }, [state, params.filterCriteria.assetType]);

  // 2) Apply filter (UPDATED to use allTransactions instead of allCash)
  const filtered = useMemo(() => {
    const { filterCriteria } = params;
    if (!filterCriteria) return allTransactions;

    if (filterCriteria.filterType === 'all') {
      return allTransactions.sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
    }
    
    if (filterCriteria.filterType === 'category' && filterCriteria.assetLabel) {
      return allTransactions
        .filter((t) => {
          // For cash: filter by cashCategory
          if (filterCriteria.assetType === 'cash') {
            return (t.cashCategory || '') === filterCriteria.assetLabel;
          }
          // For accounts: filter by assetLabel (account display name)
          if (filterCriteria.assetType === 'account') {
            // For accounts, t.assetLabel should also be the same packed JSON string for exact match
            return t.assetLabel === filterCriteria.assetLabel;
          }
          // Add other asset type filters here
          return false;
        })
        .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
    }
    
    return allTransactions;
  }, [params, allTransactions]);

  //2.1) filtered balance - Account balance should show current balance, not sum of transactions
  const filteredBalance = useMemo(() => {
    // For individual account views, show the actual account balance
    if (params.filterCriteria.assetType === 'account' && params.filterCriteria.filterType === 'category') {
      const accounts = (state?.accounts ?? []) as any[];
      const account = accounts.find(acc => {
        const packedLabel = JSON.stringify({
          nickname: acc.nickname,
          accountType: acc.type,
          last4: (acc.accountNumberMasked || '').slice(-4).replace('*', ''),
          bankName: acc.bankName,
        });
        return packedLabel === params.filterCriteria.assetLabel;
      });
      return account?.balance?.amount ?? 0;
    }
  
  // For other views, sum the transactions
  return filtered.reduce((sum, transaction) => sum + transaction.amount.amount, 0);
}, [filtered, params.filterCriteria, state?.accounts]);


  // 3) Pagination
  const paged = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const canLoadMore = paged.length < filtered.length;

  const handleLoadMore = () => {
    if (canLoadMore) setPage((p) => p + 1);
  };

  const resetPaging = useCallback(() => setPage(1), []);
  React.useEffect(() => { resetPaging(); }, [params?.filterCriteria, resetPaging]);

 // 4) Export CSV - DEBUG VERSION
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      // DEBUG: Log what we're trying to export
      console.log('=== CSV Export Debug ===');
      console.log('Filtered transactions count:', filtered.length);
      console.log('Filter criteria:', params.filterCriteria);
      
      if (filtered.length === 0) {
        console.log('No transactions to export');
        return;
      }
      
      console.log('First transaction:', filtered[0]);
      
      const result = await exportTransactionsToCSV(filtered, params.filterCriteria);
      console.log('Export result:', result);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  // 5) Render item
  const renderItem = ({ item }: { item: TransactionRecord }) => {
    const negative = item.amount.amount < 0;
    return (
      <View style={styles.txCard}>
        <View style={styles.txRow}>
          <Text style={styles.txDesc}>{item.description || '—'}</Text>
          <Text style={[styles.txAmt, negative && styles.negative]}>{formatINR(item.amount.amount)}</Text>
        </View>
        <View style={styles.txRow}>
          <Text style={styles.txMeta}>
            {new Date(item.datetime).toLocaleString('en-IN')}
          </Text>
          {!!item.cashCategory && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.cashCategory}</Text>
            </View>
          )}
          {!!item.bankName && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.bankName}</Text>
            </View>
          )}
        </View>
        {!!item.expenseCategory && (
          <Text style={styles.txNote}>Category: {item.expenseCategory}</Text>
        )}
        {!!item.notes && <Text style={styles.txNote}>Notes: {item.notes}</Text>}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Show icon for categories/specific assets, not for "All" views */}
              {(() => {
                const { filterCriteria } = params;
                const isAccountCategory = filterCriteria.assetType === 'account' && filterCriteria.filterType === 'category';
                const parsed = isAccountCategory ? parseAccountLabel(filterCriteria.assetLabel) : null;

                // Build label for display
                const displayTitle = isAccountCategory && parsed
                  ? `${parsed.nickname ?? 'Account'} ${parsed.last4 ? `****${parsed.last4}` : ''}`.trim()
                  : (filterCriteria.assetLabel || 'Transactions');

                // Pick icon/color
                const color = isAccountCategory && parsed 
                  ? getBankColorFromParsed(parsed)
                  : getAssetColor(
                      filterCriteria.assetType,
                      filterCriteria.assetLabel || ''
                    );
                const icon = getAssetIcon(
                  filterCriteria.assetType,
                  isAccountCategory && parsed ? (parsed.accountType ?? parsed.nickname ?? '') : (filterCriteria.assetLabel || '')
                );

                return (
                  <>
                    {filterCriteria.filterType === 'category' && (
                      <View style={[styles.headerIcon, { backgroundColor: color }]}>
                        <MaterialIcons name={icon as any} size={20} color="#FFFFFF" />
                      </View>
                    )}
                    <Text style={styles.title}>{displayTitle}</Text>
                  </>
                );
              })()}
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleExportCSV}
                style={[styles.primaryBtn, exporting && styles.disabledBtn]}
                disabled={exporting}
              >
                <MaterialIcons name="file-download" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{exporting ? 'Exporting…' : 'Download CSV'}</Text>
              </TouchableOpacity>

              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>
                  {getBalanceLabel(params.filterCriteria.assetType, params.filterCriteria.filterType)}
                </Text>
                <Text style={[
                  styles.balanceAmount,
                  filteredBalance < 0 && styles.negativeBalance
                ]}>
                  {formatINR(filteredBalance)}
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={paged}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              canLoadMore ? (
                <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const formatINR = (value: number): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(value));
  } catch {
    const abs = Math.abs(Math.round(value));
    const sign = value < 0 ? '-' : '';
    const str = abs.toString();
    const lastThree = str.substring(str.length - 3);
    const other = str.substring(0, str.length - 3);
    const result = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (other ? ',' : '') + lastThree;
    return `${sign}₹${result}`;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background.primary, // golden base per design
    maxHeight: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.main,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  actions: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexDirection: 'row' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  listContent: { padding: 16, paddingBottom: 24 },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  txDesc: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  txAmt: { fontSize: 16, fontWeight: '700', color: '#27AE60' },
  negative: { color: '#E74C3C' },
    // ADD THIS MISSING STYLE:
  txMeta: { 
    fontSize: 12, 
    color: Colors.text.secondary,
    fontWeight: '400'
  },

  chip: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 12, color: Colors.text.primary },
  txNote: { fontSize: 12, color: Colors.text.secondary },
  loadMore: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.main,
  },
  headerContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  balanceContainer: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27AE60',
  },
  negativeBalance: {
    color: '#E74C3C',
  },
  loadMoreText: { color: Colors.text.primary, fontWeight: '600' },
});

export default TransactionsModal;
