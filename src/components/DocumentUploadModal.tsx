// src/components/DocumentUploadModal.tsx

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  parseStatementFile,
  parseStatementFiles,
} from '../services/StatementParserService';
import { ProcessedTransaction } from '../services/FileProcessorService';

interface DocumentUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onParsed: (transactions: ProcessedTransaction[]) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  visible,
  onClose,
  onParsed,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Local types for picker results
  type DocSuccess = {
    type: 'success';
    uri: string;
    name: string;
    size?: number;
  };
  type DocCancel = { type: 'cancel' };
  type DocResult = DocSuccess | DocCancel;

  const pickSingleFile = async () => {
    setError(null);
    const raw = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    // Force casting via unknown to avoid overlap errors
    const res = (raw as unknown) as DocResult;
    if (res.type === 'success') {
      setProcessing(true);
      const result = await parseStatementFile(res.uri);
      setProcessing(false);
      if (result.success) {
        onParsed(result.transactions);
        onClose();
      } else {
        setError(result.error ?? 'Failed to parse file.');
      }
    }
  };

  const pickMultipleFiles = async () => {
    setError(null);
    const raw = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    const res = (raw as unknown) as DocResult;
    if (res.type === 'success') {
      setProcessing(true);
      const result = await parseStatementFiles([res.uri]);
      setProcessing(false);
      if (result.success) {
        onParsed(result.transactions);
        onClose();
      } else {
        setError(result.error ?? 'Failed to parse files.');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Upload Statement CSV</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={styles.button}
            onPress={pickSingleFile}
            disabled={processing}
          >
            <Text style={styles.buttonText}>
              {processing ? 'Processing…' : 'Upload Single CSV'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={pickMultipleFiles}
            disabled={processing}
          >
            <Text style={styles.buttonText}>
              {processing ? 'Processing…' : 'Upload Multiple CSVs'}
            </Text>
          </TouchableOpacity>
          <Button title="Cancel" onPress={onClose} disabled={processing} />
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
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default DocumentUploadModal;
