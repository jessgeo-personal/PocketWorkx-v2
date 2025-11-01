// src/app/crypto.tsx
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
  CryptoHolding,
  Money
} from '../types/finance';
import { formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';  // ← Added
import AppFooter from '../components/AppFooter';


const CryptoScreen: React.FC = () => {
  const [cryptoAssets, setCryptoAssets] = useState<CryptoHolding[]>([
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.078,
      averagePurchasePrice: { amount: 4600000, currency: 'INR' },
      currentPrice: { amount: 5000000, currency: 'INR' },
      currentValue: { amount: 5390000, currency: 'INR' },
      exchange: 'WazirX',
      walletType: 'exchange',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2023-01-01'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 2.5,
      averagePurchasePrice: { amount: 180000, currency: 'INR' },
      currentPrice: { amount: 200000, currency: 'INR' },
      currentValue: { amount: 500000, currency: 'INR' },
      exchange: 'CoinDCX',
      walletType: 'exchange',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2023-02-01'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '3',
      symbol: 'SOL',
      name: 'Solana',
      quantity: 10.5,
      averagePurchasePrice: { amount: 11000, currency: 'INR' },
      currentPrice: { amount: 12000, currency: 'INR' },
      currentValue: { amount: 126000, currency: 'INR' },
      exchange: 'Binance',
      walletType: 'exchange',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2023-03-01'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
  ]);

  const totalValue = cryptoAssets.reduce((sum, asset) => sum + asset.currentValue.amount, 0);
  const totalInvested = cryptoAssets.reduce((sum, asset) => sum + asset.averagePurchasePrice.amount * asset.quantity, 0);
  const totalChange24h = totalValue - totalInvested;

  const getCryptoIcon = (symbol: string) => {
    const icons = {
      BTC: '₿',
      ETH: 'Ξ',
      SOL: '◎',
      ADA: '₳',
      DOT: '●',
    };
    return icons[symbol as keyof typeof icons] || '₹';
  };

  const getCryptoColor = (symbol: string) => {
    const colors = {
      BTC: '#F7931A',
      ETH: '#627EEA',
      SOL: '#9945FF',
      ADA: '#0033AD',
      DOT: '#E6007A',
    };
    return colors[symbol as keyof typeof colors] || '#4A90E2';
  };

  const calculateChangePercent = (current: Money, average: Money, quantity: number) => {
    const invested = average.amount * quantity;
    return ((current.amount - invested) / invested) * 100;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Crypto Assets</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTotalCard = () => (
    <LinearGradient
      colors={['#9945FF', '#8A2BE2']}
      style={styles.totalCard}
    >
      <Text style={styles.totalLabel}>Total Crypto Value</Text>
      <Text style={styles.totalAmount}>
        {formatCompactCurrency(totalValue, 'INR')}
      </Text>
      <View style={styles.changeContainer}>
        <MaterialIcons
          name={totalChange24h >= 0 ? "trending-up" : "trending-down"}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.changeText}>
          {totalChange24h >= 0 ? '+' : ''}{formatCompactCurrency(Math.abs(totalChange24h), 'INR')} (24h)
        </Text>
      </View>
    </LinearGradient>
  );

  const renderCryptoCard = (asset: CryptoHolding) => {
    const invested = asset.averagePurchasePrice.amount * asset.quantity;
    const changePercent = calculateChangePercent(asset.currentValue, asset.averagePurchasePrice, asset.quantity);

    return (
      <TouchableOpacity key={asset.id} style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <View style={styles.assetLeft}>
            <View style={[styles.cryptoIcon, { backgroundColor: getCryptoColor(asset.symbol) }]}>
              <Text style={styles.cryptoSymbol}>{getCryptoIcon(asset.symbol)}</Text>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetQuantity}>{asset.quantity} {asset.symbol}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.valueAmount}>
            {formatCompactCurrency(asset.currentValue.amount, asset.currentValue.currency)}
          </Text>
          <View style={styles.priceChangeContainer}>
            <MaterialIcons
              name={changePercent >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color={changePercent >= 0 ? "#27AE60" : "#E74C3C"}
            />
            <Text style={[styles.priceChange, { color: changePercent >= 0 ? "#27AE60" : "#E74C3C" }]}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.assetFooter}>
          <Text style={styles.investedAmount}>
            Invested: {formatCompactCurrency(invested, 'INR')}
          </Text>
          {asset.exchange && (
            <Text style={styles.exchangeText}>via {asset.exchange}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="add-circle" size={24} color="#9945FF" />
          <Text style={styles.actionText}>Add Crypto Acct</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="pie-chart" size={24} color="#9945FF" />
          <Text style={styles.actionText}>Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="trending-up" size={24} color="#9945FF" />
          <Text style={styles.actionText}>Trade</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="history" size={24} color="#9945FF" />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout>  {/* ← Added */}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderTotalCard()}
          {renderQuickActions()}
          <View style={styles.assetsContainer}>
            <Text style={styles.sectionTitle}>Your Crypto Assets</Text>
            {cryptoAssets.map(renderCryptoCard)}
          </View>
          <AppFooter />
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
    backgroundColor: '#9945FF',
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  totalCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    opacity: 0.9,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '47%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#333333',
    marginTop: 8,
    textAlign: 'center',
  },
  assetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 100, // Extra space for floating button
  },
  assetCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cryptoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cryptoSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  assetDetails: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  assetSymbol: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  assetQuantity: {
    fontSize: 12,
    color: '#999999',
  },
  moreButton: {
    padding: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  investedAmount: {
    fontSize: 12,
    color: '#666666',
  },
  exchangeText: {
    fontSize: 10,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export { CryptoScreen as default };

