import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';

type Action = { id: string; icon: string; label: string; onPress?: () => void };
type Props = { title?: string; actions: Action[] };

const QuickActions: React.FC<Props> = ({ title = 'Quick Actions', actions }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.grid}>
      {actions.map(a => (
        <TouchableOpacity key={a.id} style={styles.button} activeOpacity={0.85} onPress={a.onPress}>
          <MaterialIcons name={a.icon as any} size={24} color={Colors.accent} />
          <Text style={styles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  button: {
    width: '48%', backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  label: { marginTop: 8, fontSize: 12, color: Colors.text.primary },
});

export default QuickActions;
