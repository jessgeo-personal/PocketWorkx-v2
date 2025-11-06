// src/app/home.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../utils/theme';
import { formatCurrency } from '../utils/currency';
import { computeTotals } from '../selectors/totals';
import { useStorage } from '../services/storage/StorageProvider';
import AppFooter from '../components/AppFooter';
import ComingSoonModal from '../components/modals/ComingSoonModal';
import { useOnboarding } from '../components/onboarding/OnboardingManager';


// Import the logo image
const LogoImage = require('../assets/logo.png');

interface DashboardData {
  liquidCash: number;
  netWorth: number;
  totalLiabilities: number;
  investmentsReceivables: number;
  userName: string;
  userEmail: string;
}

interface Transaction {
  id: string;
  merchant: string;
  date: Date;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  type: 'debit' | 'credit';
  assetType: 'cash' | 'account' | 'loan' | 'credit_card'; // NEW
  assetSource: string; // NEW: e.g., "Wallet", "HDFC Salary ****1234"
}


const HomeScreen: React.FC = () => {
  const router = useRouter();
  // Hook into global storage
  const { state } = useStorage();
  const { currentStep, onQuickActionsOpened, onAddCashChosen, startOnboarding } = useOnboarding();

  // Use centralized totals computation
  const {
    totalCash,
    totalBankAccounts,
    totalLoans,
    totalCreditCards,
    totalFixedIncome,
    totalFixedIncomeByCurrency,
    totalMarketInvestments,    // NEW: Market Investments subtotal
    totalInvestments,
    totalPhysicalAssets,
    totalCrypto,
    netWorth,
    totalLiquidity,
  } = computeTotals(state ?? undefined, { includeCryptoInLiquidity: false });



  // Use centralized cash calculation (liquidCash kept for backward compatibility)
  const liquidCash = totalCash;

  // Total liabilities = loans + credit cards
  const totalLiabilities = totalLoans + totalCreditCards;

  // Formula text for UI display
  const totalLiquidityFormulaText = 'Cash + Bank Accounts';
  const totalLiabilitiesFormulaText = 'Loans + Credit Cards';

  // Live calculations from actual data using centralized totals
  const dashboardData = useMemo(() => ({  
      liquidCash,
      netWorth,
      totalLiabilities,
      investmentsReceivables: totalInvestments, // Use computed value
      userName: 'Donna',
      userEmail: 'hello@reallygreatsite.com',
  }), [liquidCash, netWorth, totalLiabilities, totalInvestments]);


  // Build unified recent transactions from cash + accounts
  const recentTransactions = useMemo((): Transaction[] => {
    const cashEntries = (state?.cashEntries ?? []) as Array<{
      id: string;
      description?: string;
      amount: { amount: number; currency: string };
      timestamp: string | Date;
      cashCategory?: string;
      type: string;
    }>;

    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      accountNumberMasked: string;
      transactions?: Array<{
        id: string;
        datetime: string | Date;
        amount: { amount: number; currency: string };
        description: string;
        type: string;
        status?: string;
      }>;
    }>;

    const cashTxns = cashEntries.map(e => ({
      id: e.id,
      merchant: e.description || 'Cash Transaction',
      date: new Date(e.timestamp),
      amount: e.amount.amount,
      status: 'success' as const,
      type: e.amount.amount >= 0 ? 'credit' as const : 'debit' as const,
      assetType: 'cash' as const,
      assetSource: e.cashCategory || 'Cash', // Show which cash category
    }));

    const accountTxns = accounts.flatMap(acc => 
      (acc.transactions ?? []).map(tx => ({
        id: tx.id,
        merchant: tx.description || 'Bank Transaction',
        date: new Date(tx.datetime),
        amount: tx.amount.amount,
        status: (tx.status === 'completed' ? 'success' : 'pending') as 'success' | 'pending' | 'failed',
        type: tx.amount.amount >= 0 ? 'credit' as const : 'debit' as const,
        assetType: 'account' as const,
        assetSource: `${acc.nickname} ${acc.accountNumberMasked}`, // Show which account
      }))
    );

    return [...cashTxns, ...accountTxns]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6); // Latest 6 transactions
  }, [state]);


  const [refreshing, setRefreshing] = useState(false);

  // Add help modal state
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  // Add quick actions modal state
  const [isQuickActionsModalVisible, setIsQuickActionsModalVisible] = useState(false);
  // Add coming soon modal state
  const [isComingSoonModalVisible, setIsComingSoonModalVisible] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [comingSoonDescription, setComingSoonDescription] = useState('');


  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const showComingSoon = (feature: string, description: string) => {
    setComingSoonFeature(feature);
    setComingSoonDescription(description);
    setIsComingSoonModalVisible(true);
  };
  //const renderLogoHeader = () => (
  //  <View style={styles.logoHeader}>
  //    <Image 
  //      source={LogoImage} 
  //      style={styles.logoLarge}
  //      resizeMode="contain"
  //    />
  //  </View>
  //);

  const renderWelcomeHeader = () => (
    <View style={styles.headerContainer}>
      {/* Need Help card - clickable */}
      <TouchableOpacity 
        style={styles.helpCardCompact}
        onPress={() => {
          setIsHelpModalVisible(false); // Close help modal if open
          startOnboarding(); // Start onboarding tutorial
        }}

      >
        <Text style={styles.helpTextCompact}>Need Help?</Text>
        <Text style={styles.helpSubtextCompact}>Quick start guide</Text>
      </TouchableOpacity>
      
      {/* Logo section */}
      <View style={styles.logoPositionedCompact}>
        <Image 
          source={LogoImage} 
          style={styles.logoCompact}
          resizeMode="contain"
        />
      </View>
    </View>
  );


  // const renderTopQuickActions = () => (
  //   <View style={styles.topQuickActionsContainer}>
  //     <Text style={styles.topQuickActionsTitle}>Quick Actions</Text>
  //     <View style={styles.topQuickActionsGrid}>
  //       <TouchableOpacity 
  //         style={styles.topQuickActionButton}
  //         onPress={() => router.push({ pathname: '/cash', params: { openModal: 'expense' } })}
  //       >
  //         <Feather name="credit-card" size={24} color="#FFFFFF" />
  //         <Text style={styles.topQuickActionText}>Record Expense</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity 
  //         style={styles.topQuickActionButton}
  //         onPress={() => router.push({ pathname: '/accounts', params: { openModal: 'debit' } })}
  //       >
  //         <Feather name="minus-circle" size={24} color="#FFFFFF" />
  //         <Text style={styles.topQuickActionText}>Add Debit Card/UPI Expense</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );


  const renderPrimaryBalance = () => (
    <TouchableOpacity 
      style={styles.primaryBalanceCard}
      activeOpacity={0.9}
      onPress={() => router.push('/analytics')}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.primaryLabel}>Your Total Net Worth</Text>
        <Feather name="chevron-right" size={20} color={Colors.text.secondary} />
      </View>
      <Text style={[
        styles.primaryAmount,
        netWorth < 0 && styles.negativeNetWorth
      ]}>
        {formatCurrency(netWorth, 'INR')}
      </Text>
      <Text style={styles.tapHint}>
        Formula: (Bank Accounts + Crypto + Investments + Physical Assets) − (Loans + Credit Cards)
      </Text>
    </TouchableOpacity>
  );


  const renderMetricsGrid = () => (
    <View style={styles.metricsGrid}>
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/liquidity')}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.metricLabel}>Total Liquidity</Text>
          <Feather name="chevron-right" size={18} color={Colors.text.secondary} />
        </View>
        <Text style={styles.metricAmount}>
          {formatCurrency(totalLiquidity, 'INR')}
        </Text>
        <Text style={styles.metricFormula}>
          {totalLiquidityFormulaText}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/liabilities')}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.metricLabel}>Your total liabilities</Text>
          <Feather name="chevron-right" size={18} color={Colors.text.secondary} />
        </View>
        <Text style={[styles.metricAmount, { color: Colors.error.main }]}>
          {formatCurrency(totalLiabilities, 'INR')}
        </Text>
        <Text style={styles.metricFormula}>
          {totalLiabilitiesFormulaText}
        </Text>
      </TouchableOpacity>

      {/* ADD this Fixed Income card immediately after the above */}
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/fixed-income')}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.metricLabel}>Fixed Income Deposits</Text>
          <Feather name="chevron-right" size={18} color={Colors.text.secondary} />
        </View>

        {(() => {
          // Calculate counts by type and currency
          const entries = ((state?.fixedIncomeEntries ?? []) as any[]);
          const getCountsByCurrency = (currency: string) => {
            const filtered = entries.filter(fi => (fi?.currentValue?.currency || 'INR') === currency);
            return {
              fd: filtered.filter(fi => fi?.instrumentType === 'fd').length,
              rd: filtered.filter(fi => fi?.instrumentType === 'rd').length,
              nre: filtered.filter(fi => fi?.instrumentType === 'nre').length,
              nro: filtered.filter(fi => fi?.instrumentType === 'nro').length,
              fcnr: filtered.filter(fi => fi?.instrumentType === 'fcnr').length,
              company_deposit: filtered.filter(fi => fi?.instrumentType === 'company_deposit').length,
            };
          };

          const renderCountPills = (counts: any) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4, gap: 4 }}>
              {counts.fd > 0 && (
                <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#1976D2', fontWeight: '600' }}>{counts.fd} FD</Text>
                </View>
              )}
              {counts.rd > 0 && (
                <View style={{ backgroundColor: '#E8F5E8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#2E7D32', fontWeight: '600' }}>{counts.rd} RD</Text>
                </View>
              )}
              {counts.nre > 0 && (
                <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#F57C00', fontWeight: '600' }}>{counts.nre} NRE</Text>
                </View>
              )}
              {counts.nro > 0 && (
                <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#F57C00', fontWeight: '600' }}>{counts.nro} NRO</Text>
                </View>
              )}
              {counts.fcnr > 0 && (
                <View style={{ backgroundColor: '#F3E5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#7B1FA2', fontWeight: '600' }}>{counts.fcnr} FCNR</Text>
                </View>
              )}
              {counts.company_deposit > 0 && (
                <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: '#C62828', fontWeight: '600' }}>{counts.company_deposit} Company</Text>
                </View>
              )}
            </View>
          );

          return (
            <>
            {/* INR block with amount and pills in same row */}
            {totalFixedIncome > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.metricLabel, { textAlign: 'left', marginBottom: 4 }]}>₹ Deposits</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.metricAmount, { color: '#1976D2', flex: 1 }]}>
                    {formatCurrency(totalFixedIncome, 'INR')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {(() => {
                      const counts = getCountsByCurrency('INR');
                      return (
                        <>
                          {counts.fd > 0 && (
                            <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#1976D2', fontWeight: '600' }}>{counts.fd} FD</Text>
                            </View>
                          )}
                          {counts.rd > 0 && (
                            <View style={{ backgroundColor: '#E8F5E8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#2E7D32', fontWeight: '600' }}>{counts.rd} RD</Text>
                            </View>
                          )}
                          {counts.nre > 0 && (
                            <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#F57C00', fontWeight: '600' }}>{counts.nre} NRE</Text>
                            </View>
                          )}
                          {counts.nro > 0 && (
                            <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#F57C00', fontWeight: '600' }}>{counts.nro} NRO</Text>
                            </View>
                          )}
                          {counts.company_deposit > 0 && (
                            <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#C62828', fontWeight: '600' }}>{counts.company_deposit} Company</Text>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </View>
              </View>
            )}

            {/* USD block with amount and pills in same row */}
            {totalFixedIncomeByCurrency['USD'] > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.metricLabel, { textAlign: 'left', marginBottom: 4 }]}>$ Deposits</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.metricAmount, { flex: 1 }]}>
                    {`$${totalFixedIncomeByCurrency['USD'].toLocaleString()}`}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {(() => {
                      const counts = getCountsByCurrency('USD');
                      return (
                        <>
                          {counts.fcnr > 0 && (
                            <View style={{ backgroundColor: '#F3E5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#7B1FA2', fontWeight: '600' }}>{counts.fcnr} FCNR</Text>
                            </View>
                          )}
                          {counts.company_deposit > 0 && (
                            <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#C62828', fontWeight: '600' }}>{counts.company_deposit} Company</Text>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </View>
              </View>
            )}

            {/* EUR block with amount and pills in same row */}
            {totalFixedIncomeByCurrency['EUR'] > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.metricLabel, { textAlign: 'left', marginBottom: 4 }]}>€ Deposits</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.metricAmount, { flex: 1 }]}>
                    {`€${totalFixedIncomeByCurrency['EUR'].toLocaleString()}`}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {(() => {
                      const counts = getCountsByCurrency('EUR');
                      return (
                        <>
                          {counts.fcnr > 0 && (
                            <View style={{ backgroundColor: '#F3E5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 9, color: '#7B1FA2', fontWeight: '600' }}>{counts.fcnr} FCNR</Text>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </View>
              </View>
            )}


              <Text style={[styles.metricFormula, { marginTop: 8 }]}>
                FDs + RDs + NRE/FCNR + Company Deposits
              </Text>
            </>
          );
        })()}
      </TouchableOpacity>




      {/* Market Investments */}
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/investments')}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.metricLabel}>Market Investments</Text>
          <Feather name="chevron-right" size={18} color={Colors.text.secondary} />
        </View>
        <Text style={styles.metricAmount}>
          {formatCurrency(totalMarketInvestments, 'INR')}
        </Text>
        <Text style={styles.metricFormula}>
          Stocks + Mutual Funds + Bonds + Commodities
        </Text>
      </TouchableOpacity>
    </View>
  );


  const renderLatestTransactions = () => (
    <View style={styles.transactionsSection}>
      <Text style={styles.sectionTitle}>Latest Transactions</Text>
      <View style={styles.transactionsList}>
        {recentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.merchantName}>{transaction.merchant}</Text>
              <Text style={styles.transactionDate}>
                {transaction.date.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              {/* NEW: Asset type and source */}
              <Text style={styles.assetInfo}>
                {transaction.assetType === 'cash' ? '💰 ' : '🏦 '}{transaction.assetSource}
              </Text>
            </View>
            <View style={styles.transactionRight}>
              <View 
                style={[
                  styles.statusBadge,
                  { backgroundColor: transaction.status === 'success' ? Colors.success.light : Colors.error.light }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText,
                    { color: transaction.status === 'success' ? Colors.success.dark : Colors.error.dark }
                  ]}
                >
                  {transaction.status === 'success' ? 'Success' : transaction.status === 'pending' ? 'Pending' : 'Failed'}
                </Text>
              </View>
              {/* NEW: Color-coded amounts with proper sign */}
              <Text 
                style={[
                  styles.transactionAmount, 
                  { 
                    color: transaction.type === 'credit' ? '#27AE60' : '#E74C3C' // Green for credit, red for debit
                  }
                ]}
              >
                {transaction.type === 'debit' ? '-' : '+'}
                {formatCurrency(Math.abs(transaction.amount), 'INR')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <TouchableOpacity 
        style={styles.quickActionsButton}
        onPress={() => {
          setIsQuickActionsModalVisible(true);
          onQuickActionsOpened(); // notify onboarding: QA opened
        }}
        activeOpacity={0.9}
      >

        <View style={styles.quickActionsButtonContent}>
          <Feather name="zap" size={24} color="#FFFFFF" />
          <Text style={styles.quickActionsButtonText}>Quick Actions</Text>
          <Feather name="chevron-right" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );


  const renderHelpModal = () => (
    <Modal
      visible={isHelpModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsHelpModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          width: '90%',
          maxHeight: '80%',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#E0E0E0',
            backgroundColor: '#FFFFFF',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>
              Welcome to PocketWorkx! 💰
            </Text>
            <TouchableOpacity onPress={() => setIsHelpModalVisible(false)}>
              <Feather name="x" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {/* Body (scrollable) */}
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 16 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#8B5CF6',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Track your cash, bank accounts & net worth in one place
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>
                🏠 Home Screen Guide:
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Use Quick Actions to record expenses or add cash instantly</Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Tap any balance card to see detailed transactions</Text>
              <Text style={{ fontSize: 13, color: '#666666' }}>• Your net worth is calculated automatically</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>
                💵 Cash Management:
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Add physical cash you have (wallet, home safe, car)</Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Record expenses when you spend cash</Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Move cash between locations</Text>
              <Text style={{ fontSize: 13, color: '#666666' }}>• Deposit cash to your bank accounts</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>
                🏦 Bank Accounts:
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Add all your bank accounts for complete tracking</Text>
              <Text style={{ fontSize: 13, color: '#666666', marginBottom: 6 }}>• Record debit card & UPI expenses directly</Text>
              <Text style={{ fontSize: 13, color: '#666666' }}>• View transaction history and export to CSV</Text>
            </View>

            <View style={{ backgroundColor: '#F7D94C', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 13, color: '#1A1A1A', fontWeight: '600', textAlign: 'center' }}>
                💡 Tip: Start by adding some cash and a bank account, then record a few transactions to see how it works!
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            padding: 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E0E0E0',
            backgroundColor: '#FFFFFF',
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#8B5CF6',
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 10,
                alignSelf: 'center',
              }}
              onPress={() => setIsHelpModalVisible(false)}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Got it!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderQuickActionsModal = () => (
    <Modal
      visible={isQuickActionsModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsQuickActionsModalVisible(false)}
    >
      <View style={styles.quickActionsModalOverlay}>
        <View style={styles.quickActionsModalContent}>
          <View style={{ height: 6, alignItems: 'center', paddingTop: 6 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.main }} />
          </View>
          {/* Header */}
          <View style={styles.quickActionsModalHeader}>
            <View style={styles.modalHeaderContent}>
              <Feather name="zap" size={24}  /> 
              <Text style={styles.quickActionsModalTitle}>Quick Actions</Text>
              <TouchableOpacity onPress={() => setIsQuickActionsModalVisible(false)}>
                <Feather name="x" size={24} />
              </TouchableOpacity>
            </View>
          </View>


          {/* Body */}
          <ScrollView 
            style={styles.quickActionsModalBody} 
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: Colors.background.primary }}>
            {/* Cash Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                
                <Text style={styles.sectionDividerText}>💰 Cash </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonCash]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                        onAddCashChosen(); // notify onboarding: Add Cash chosen
                    router.push({ pathname: '/cash', params: { openModal: 'add' } });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="plus-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add Cash</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonCash]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push({ pathname: '/cash', params: { openModal: 'expense' } });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="minus-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Record Expense</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bank Accounts Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                
                <Text style={styles.sectionDividerText}>🏦 Bank Accounts </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonAccounts]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push('/accounts');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="plus-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add Account</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonAccounts]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push({ pathname: '/accounts', params: { openModal: 'debit' } });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="credit-card" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Record Debit/UPI</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Credit Cards Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                
                <Text style={styles.sectionDividerText}>💳 Credit Cards </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push('/credit-cards');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="plus-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add Card</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push({ pathname: '/credit-cards', params: { openModal: 'charge' } });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="shopping-cart" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Record Charge</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push({ pathname: '/credit-cards', params: { openModal: 'payment' } });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="check-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Make Payment</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fixed Income Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>🏦 Fixed Income </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonFixed]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push('/fixed-income');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="trending-up" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add Bank Deposits</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonFixed]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push('/fixed-income');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="dollar-sign" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add FCNR Deposits</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loans Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>🏠 Loans </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonLoans]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    router.push('/loans');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="plus-circle" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Add Loan</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonLoans]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    showComingSoon('Record EMI Payment', 'Quickly record your monthly EMI payments and track loan balances.');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="calendar" size={20} color={Colors.white} />
                    <Text style={styles.modalActionText}>Record EMI</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>


            {/* Data Import Actions */}
            <View style={styles.actionGroup}>
              <View style={styles.sectionDivider}>
                
                <Text style={styles.sectionDividerText}>📊 Data Import </Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.actionGroupGrid}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonImport]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    showComingSoon('Receipt Scanner', 'Use your camera to automatically extract transaction data from receipts and bills.');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="camera" size={42} color={Colors.white} />
                    <Text style={styles.modalActionText}>Scan Receipts</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonImport]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    showComingSoon('Statement Upload', 'Upload PDF or image bank statements for automatic transaction import.');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="upload" size={42} color={Colors.white} />
                    <Text style={styles.modalActionText}>Upload Statements</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonImport]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    showComingSoon('SMS Scanner', 'Automatically detect and import transactions from bank SMS notifications.');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="message-circle" size={42} color={Colors.white} />
                    <Text style={styles.modalActionText}>Scan SMS</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalActionButtonImport]}
                  onPress={() => {
                    setIsQuickActionsModalVisible(false);
                    showComingSoon('Email Scanner', 'Import transactions from bank email statements and e-receipts.');
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.modalActionInner}>
                    <Feather name="mail" size={42} color={Colors.white} />
                    <Text style={styles.modalActionText}>Scan Emails</Text>
                  </View>
                </TouchableOpacity>

              </View>
            </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );



  return (
    <ScreenLayout>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeHeader()}
        {renderQuickActions()}
        {renderPrimaryBalance()}
        {renderMetricsGrid()}
        {renderLatestTransactions()}
        <AppFooter />
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {renderHelpModal()}
      {renderQuickActionsModal()}
      <ComingSoonModal
        visible={isComingSoonModalVisible}
        onClose={() => setIsComingSoonModalVisible(false)}
        feature={comingSoonFeature}
        description={comingSoonDescription}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary, // golden
  },
  
  headerContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm, // Reduced top padding
    marginBottom: Spacing.md, // Reduced bottom margin
  },

  // NEW: Compact Help card - smaller, right-aligned, above logo
  helpCardCompact: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    maxWidth: '60%',
    ...Shadows.base,
  },
  helpTextCompact: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#8B5CF6',
    marginBottom: Spacing.xs,
    textAlign: 'right',
  },
  helpSubtextCompact: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
  },


  // UPDATED: Logo section - reduced height and spacing
  logoPositionedCompact: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xs, // Much smaller bottom margin
  },
  logoCompact: {
    width: 400, // Reduced from 400
    height: 250, // Reduced from 250
  },

  // Remove these old styles (they're replaced by compact versions):
  // logoPositioned: { ... },
  // logoLarge: { ... },
  // welcomeHeader: { ... },
  // welcomeText: { ... },
  // emailText: { ... },

  primaryBalanceCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm, // Small top margin since header is compact
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.md,
  },

  primaryAmount: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  negativeNetWorth: {
  color: '#E74C3C', // Red for negative net worth
  },
  primaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  metricsGrid: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  metricAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.info.main,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
    padding: Spacing.base,
    ...Shadows.base,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transactionLeft: {
    flex: 1,
  },
  merchantName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md, // tighter at top
    marginTop: Spacing.sm,
  },
  //quickActionsGrid: {
    //backgroundColor: Colors.background.card,
    //borderRadius: BorderRadius.xl,
    //padding: Spacing.base,
    //...Shadows.base,
  ///},
  ///quickActionItem: {
  ///  flexDirection: 'row',
  ///  alignItems: 'center',
  ///  paddingVertical: Spacing.md,
  ///  paddingHorizontal: Spacing.md,
  ///  borderRadius: BorderRadius.md,
  ///  marginBottom: Spacing.sm,
  ///},
  //primaryAction: {
  //  backgroundColor: Colors.accent,
  //  marginBottom: 0,
  //},
  //quickActionText: {
   // fontSize: Typography.fontSize.sm,
  //  color: Colors.text.secondary,
  //  marginLeft: Spacing.md,
  //  fontWeight: Typography.fontWeight.medium,
  //},
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
  assetInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  // topQuickActionsContainer: {
  //   paddingHorizontal: Spacing.base,
  //   marginBottom: Spacing.lg,
  // },
  // topQuickActionsTitle: {
  //   fontSize: Typography.fontSize.lg,
  //   fontWeight: Typography.fontWeight.semibold,
  //   color: Colors.text.primary,
  //   marginBottom: Spacing.base,
  //   textAlign: 'center',
  // },
  // topQuickActionsGrid: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   gap: Spacing.sm,
  // },
  // topQuickActionButton: {
  //   flex: 1,
  //   backgroundColor: '#8B5CF6', // Purple accent per design guidelines
  //   padding: Spacing.lg,
  //   borderRadius: BorderRadius.xl,
  //   alignItems: 'center',
  //   ...Shadows.md,
  //   minHeight: 80,
  //   justifyContent: 'center',
  // },
  // topQuickActionText: {
  //   color: '#FFFFFF',
  //   fontSize: Typography.fontSize.sm,
  //   fontWeight: Typography.fontWeight.semibold,
  //   marginTop: Spacing.sm,
  //   textAlign: 'center',
  //   lineHeight: 16, // Better text wrapping for long button text
  // },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    ...Shadows.md,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },
  helpModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  // helpModalScroll: {
  //   flex: 1,
  // },
  helpModalBody: {
    padding: Spacing.lg,
  },
  helpIntro: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  helpSection: {
    marginBottom: Spacing.lg,
  },
  helpSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  helpBullet: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  helpTip: {
    backgroundColor: '#F7D94C',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  helpTipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  helpModalFooter: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.light,
  },
  helpGotItButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
  },
  helpGotItText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  // accountBalanceCard: {
  //   backgroundColor: Colors.background.card,
  //   marginHorizontal: Spacing.base,
  //   marginBottom: Spacing.xl,
  //   marginTop: Spacing.sm, // Small gap after primary balance
  //   padding: Spacing.lg,
  //   borderRadius: BorderRadius.xl,
  //   alignItems: 'center',
  //   ...Shadows.base, // Slightly less shadow than primary card
  // },
  // accountBalanceAmount: {
  //   fontSize: Typography.fontSize['2xl'], // Smaller than primary
  //   fontWeight: Typography.fontWeight.bold,
  //   color: '#1976D2', // Blue for bank accounts
  //   textAlign: 'center',
  //   marginBottom: Spacing.xs,
  // },
  // accountBalanceLabel: {
  //   fontSize: Typography.fontSize.sm,
  //   color: Colors.text.secondary,
  //   textAlign: 'center',
  // },
  metricFormula: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  quickActionsButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadows.md,
  },
  quickActionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionsButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  quickActionsModalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: 'flex-end',
    zIndex: 1000, // Lower than onboarding clouds
  },
  quickActionsModalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    minHeight: '80%',
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    zIndex: 1000, // Lower than onboarding clouds
    elevation: 10, // Lower Android elevation
  },
  quickActionsModalHeader: {
    backgroundColor: Colors.background.primary, // purple header matching button
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,   // reduce top padding to remove perceived gap
    paddingBottom: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  quickActionsModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  quickActionsModalBody: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.primary, // golden
  },

  actionGroup: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionGroupTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  actionGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    //gap: Spacing.sm,
    marginBottom: Spacing.sm,     // better spacing under each row
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalActionButton: {
    backgroundColor: Colors.accentDark,     // pocketworkx purple
    borderRadius: BorderRadius.xl,
    width: '48%',
    height: 100,                        // target ~200px height
    marginBottom: Spacing.md,
    // Stronger 3D effect:
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  modalActionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,                    // space between icon and text (RN 0.73+ supports gap)
  },
  modalActionText: {
    fontSize: Typography.fontSize.base,   // larger readable text
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 4,
  },
  sectionDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1F2937',
    marginRight: 12,
  },
  sectionDividerText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.primary,
    fontWeight: '700',
    //textTransform: 'uppercase',
  },
  // Add right below modalActionButton (do NOT remove modalActionButton)
  modalActionButtonCash: {
    backgroundColor: '#2ECC71', // matches Total Liquid Cash tone
  },
  modalActionButtonAccounts: {
    backgroundColor: '#1976D2', // matches Total Bank Accounts tone (Blue)
  },
  modalActionButtonLoans: {
    backgroundColor: '#D32F2F', // Red color to match loan/liability theme
  },
  modalActionButtonFixed: {
    backgroundColor: '#1565C0', // Red color to match fixed income theme
  },
  modalActionButtonImport: {
    backgroundColor: '#9C27B0', // Red color to match fixed income theme
  }

});

export default HomeScreen;