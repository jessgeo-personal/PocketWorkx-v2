// src/components/PasswordInputModal.tsx

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../utils/theme';

interface PasswordInputModalProps {
  visible: boolean;
  fileName: string;
  attempt: number;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const PasswordInputModal: React.FC<PasswordInputModalProps> = ({
  visible,
  fileName,
  attempt,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(password);
    setPassword('');
  };

  const handleCancel = () => {
    onCancel();
    setPassword('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Enter Password</Text>
          <Text style={styles.fileName}>{fileName}</Text>
          <Text style={styles.attemptText}>Attempt {attempt}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  fileName: {
    fontSize: 14,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  attemptText: {
    fontSize: 12,
    marginBottom: 16,
    color: colors.textSecondary,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
  },
  submitText: {
    color: colors.background,
    fontSize: 16,
  },
});

export default PasswordInputModal;
