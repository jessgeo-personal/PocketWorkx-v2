// src/app/receivables.tsx
import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Receivable, 
  Money 
} from '../types/finance';
import { formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';

const ReceivablesScreen: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([
    {
      id: '1',
      type: 'loan_given',
      partyName: 'Rajesh Kumar',
      partyContact: {
        phone: '+91 98765 43210',
        email: 'rajesh@email.com',
        address: 'Mumbai, Maharashtra',
      },
      amount: { amount: 50000, currency: 'INR' },
      description: 'Personal loan for medical emergency',
      dueDate: new Date('2025-12-15'),
      reminderDates: [new Date('2025-11-15'), new Date('2025-12-01')],
      status: 'pending',
      documents: ['promissory_note.pdf'],
      interestRate: 8.5,
      // Required enhanced fields
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-01-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '2',
      type: 'advance',
      partyName: 'ABC Construction Ltd',
      amount: { amount: 125000, currency: 'INR' },
      description: 'Advance payment for renovation work',
      dueDate: new Date('2025-11-30'),
      reminderDates: [],
      status: 'overdue',
      documents: ['contract.pdf', 'payment_receipt.pdf'],
      // Required enhanced fields
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-06-01'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '3',
      type: 'invoice',
      partyName: 'Tech Solutions Pvt Ltd',
      amount: { amount: 75000, currency: 'INR' },
      description: 'Consulting services invoice #INV-2025-001',
      dueDate: new Date('2025-11-20'),
      reminderDates: [new Date('2025-11-10')],
      status: 'pending',
      documents: ['invoice_001.pdf'],
      // Required enhanced fields
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-09-20'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
  ]);

  const totalReceivables = receivables.reduce((sum, item) => sum + item.amount.amount, 0);
  const overdueCount = receivables.filter(item => item.status === 'overdue').length;
  const pendingCount = receivables.filter(item => item.status === 'pending').length;

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#FF9800',
      overdue: '#E74C3C',
      completed: '#27AE60',
      partial: '#2196F3',
      written_off: '#9E9E9E',
    };
    return colors[status as keyof typeof colors] || '#666666';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      invoice: 'receipt',
      loan_given: 'trending-up',
      advance: 'payment',
      deposit: 'account-balance',
      other: 'attach-money',
    };
    return icons[type as keyof typeof icons] || 'attach-money';
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Receivables</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <LinearGradient
        colors={['#009688', '#00BCD4']}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>Total Receivables</Text>
        <Text style={styles.summaryAmount}>
          {formatCompactCurrency(totalReceivables, 'INR')}
        </Text>
      </LinearGradient>
      
      <View style={styles.statusCards}>
        <View style={[styles.statusCard, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.statusCount}>{pendingCount}</Text>
          <Text style={styles.statusLabel}>Pending</Text>
        </View>
        <View style={[styles.statusCard, { borderLeftColor: '#E74C3C' }]}>
          <Text style={styles.statusCount}>{overdueCount}</Text>
          <Text style={styles.statusLabel}>Overdue</Text>
        </View>
      </View>
    </View>
  );

  const renderReceivableCard = (receivable: Receivable) => {
    const daysUntilDue = getDaysUntilDue(receivable.dueDate);
    const isOverdue = daysUntilDue < 0;

    return (
      <TouchableOpacity key={receivable.id} style={styles.receivableCard}>
        <View style={styles.receivableHeader}>
          <View style={styles.receivableLeft}>
            <View style={styles.typeIcon}>
              <MaterialIcons 
                name={getTypeIcon(receivable.type) as any} 
                size={24} 
                color="#009688" 
              />
            </View>
            <View style={styles.receivableDetails}>
              <Text style={styles.partyName}>{receivable.partyName}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {receivable.description}
              </Text>
              <Text style={styles.receivableType}>
                {receivable.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.receivableRight}>
            <Text style={styles.amount}>
              {formatCompactCurrency(receivable.amount.amount, receivable.amount.currency)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receivable.status) }]}>
              <Text style={styles.statusText}>{receivable.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.receivableFooter}>
          <View style={styles.dueDateContainer}>
            <MaterialIcons 
              name="schedule" 
              size={16} 
              color={isOverdue ? '#E74C3C' : '#666666'} 
            />
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              {isOverdue 
                ? `Overdue by ${Math.abs(daysUntilDue)} days`
                : `Due in ${daysUntilDue} days`
              }
            </Text>
          </View>
          
          {receivable.interestRate && (
            <Text style={styles.interestRate}>
              {receivable.interestRate}% p.a.
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderSummaryCards()}
          
          <View style={styles.receivablesContainer}>
            <Text style={styles.sectionTitle}>Your Receivables</Text>
            {receivables.map(renderReceivableCard)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#009688',
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  receivablesContainer: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  receivableCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  receivableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receivableLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receivableDetails: {
    flex: 1,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  receivableType: {
    fontSize: 10,
    color: '#009688',
    fontWeight: '600',
  },
  receivableRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  receivableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  overdue: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  interestRate: {
    fontSize: 12,
    color: '#009688',
    fontWeight: '500',
  },
});

export default ReceivablesScreen;