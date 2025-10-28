import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../utils/theme';

type Props = { name: string; email: string };

const WelcomeHeader: React.FC<Props> = ({ name, email }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Text style={styles.brandPrimary}>Pocket</Text>
      <Text style={styles.brandAccent}>Workx</Text>
    </View>
    <Text style={styles.title}>Welcome Back, {name}</Text>
    <Text style={styles.subtitle}>{email}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  brandPrimary: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  brandAccent: { fontSize: 20, fontWeight: '800', color: Colors.accent, marginLeft: 4 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  subtitle: { fontSize: 12, color: Colors.text.secondary },
});

export default WelcomeHeader;
