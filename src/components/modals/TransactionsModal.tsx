// src/components/modals/TransactionsModal.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { useStorage } from '../../services/storage/StorageProvider';
import type { TransactionRecord, FilterCriteria, TransactionModalParams } from '../../types/transactions';
import { exportTransactionsToCSV } from '../../utils/csvExport';

type Props = {
  visible: boolean;
  onClose: () => void;
  params: TransactionModalParams;
};

const PAGE_SIZE = 20;

const TransactionsModal: React.FC<Props> = ({ visible, onClose, params }) => {
  const { state } = useStorage();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // 1) Build unified transactions from state for CASH only for now (extend later)
  const allCash: TransactionRecord[] = useMemo(() => {
    const cashEntries = (state?.cashEntries ?? []) as any[];
    return cashEntries.map((e) => ({
      id: e.id,
      datetime: new Date(e.timestamp),
      amount: { amount: e.amount?.amount ?? 0, currency: 'INR' },
      description: e.description ?? '',
      notes: e.notes,
      cashCategory: e.cashCategory,
      expenseCategory: e.expenseCategory,
      type: e.type,
      assetType: 'cash',
      assetId: e.cashCategory, // use category as grouping id for now
      assetLabel: e.cashCategory,
    })) as TransactionRecord[];
  }, [state?.cashEntries]);

  // 2) Apply filter
  const filtered = useMemo(() => {
    const { filterCriteria } = params;
    if (!filterCriteria) return allCash;
    if (filterCriteria.assetType !== 'cash') return []; // will extend with other assets later

    if (filterCriteria.filterType === 'all') {
      return allCash.sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
    }
    if (filterCriteria.filterType === 'category' && filterCriteria.assetLabel) {
      return allCash
        .filter((t) => (t.cashCategory || '') === filterCriteria.assetLabel)
        .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
    }
    return allCash;
  }, [params, allCash]);

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
            <Text style={styles.title}>
              {params.filterCriteria.assetLabel || 'Transactions'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleExportCSV}
              style={[styles.primaryBtn, exporting && styles.disabledBtn]}
              disabled={exporting}
            >
              <MaterialIcons name="file-download" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{exporting ? 'Exporting…' : 'Download CSV'}</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
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
  loadMoreText: { color: Colors.text.primary, fontWeight: '600' },
});

export default TransactionsModal;
