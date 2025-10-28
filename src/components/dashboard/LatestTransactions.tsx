import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { formatCurrency } from '../../utils/currency';

export type Txn = { id: string; title: string; date: string; status: 'Success'|'Pending'|'Failed'; amount: number; currency: 'INR' };
type Props = { title?: string; transactions: Txn[] };

const LatestTransactions: React.FC<Props> = ({ title = 'Latest Transactions', transactions }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.list}>
      {transactions.map(txn => (
        <View key={txn.id} style={styles.row}>
          <View style={styles.left}>
            <View style={styles.icon}><MaterialIcons name="receipt-long" size={20} color={Colors.white} /></View>
            <View style={styles.details}>
              <Text style={styles.tTitle}>{txn.title}</Text>
              <Text style={styles.meta}>{txn.date} • {txn.status}</Text>
            </View>
          </View>
          <Text style={[styles.amount, txn.amount < 0 ? styles.debit : styles.credit]}>
            {formatCurrency(Math.abs(txn.amount), txn.currency)}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  list: {
    backgroundColor: Colors.background.secondary, borderRadius: 12, paddingVertical: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border.main },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  details: { flex: 1 },
  tTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  meta: { fontSize: 11, color: Colors.text.tertiary },
  amount: { fontSize: 14, fontWeight: '700' },
  debit: { color: '#EF4444' },
  credit: { color: '#10B981' },
});

export default LatestTransactions;
