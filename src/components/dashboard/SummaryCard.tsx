import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../utils/theme';

type Props = { label: string; valueText: string; accentColor?: string };

const SummaryCard: React.FC<Props> = ({ label, valueText, accentColor = Colors.accent }) => (
  <View style={styles.wrapper}>
    <View style={styles.shadow}>
      <View style={styles.card}>
        <Text style={styles.value}>{valueText}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { width: '48%', marginBottom: 16 },
  shadow: {
    borderRadius: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, overflow: 'hidden',
  },
  card: { backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 16 },
  accentBar: { height: 4, width: '100%' },
  value: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, marginBottom: 6 },
  label: { fontSize: 12, color: Colors.text.secondary },
});

export default SummaryCard;
