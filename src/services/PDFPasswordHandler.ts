// src/services/PDFPasswordHandler.ts
import * as FileSystem from 'expo-file-system/legacy';

export interface PDFPasswordResult {
  success: boolean;
  content?: string;
  isPasswordProtected?: boolean;
  error?: string;
}

export class PDFPasswordHandler {
  async readPDFWithPassword(fileUri: string, password?: string): Promise<PDFPasswordResult> {
    try {
      console.log('🔐 Reading PDF with password support:', fileUri);
      
      // First, try to read without password
      let localUri = fileUri;
      
      // For content:// URIs, copy to cache first
      if (fileUri.startsWith('content://')) {
        const fileName = `temp_${Date.now()}.pdf`;
        localUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: fileUri, to: localUri });
      }

      // Read as base64
      const b64Content = await FileSystem.readAsStringAsync(localUri, { 
        encoding: FileSystem.EncodingType.Base64 
      });

      // Check if PDF is password protected by looking for encryption markers
      const isEncrypted = this.isPDFEncrypted(b64Content);
      
      if (isEncrypted && !password) {
        console.log('🔐 PDF is password protected, password required');
        // Clean up temp file if created
        if (fileUri.startsWith('content://')) {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }
        return {
          success: false,
          isPasswordProtected: true,
          error: 'Password required'
        };
      }

      if (isEncrypted && password) {
        console.log('🔐 Attempting to unlock PDF with password');
        // In a real implementation, you'd use a PDF library like react-native-pdf-lib
        // or pdf-lib to decrypt the PDF with the password
        // For now, we'll simulate password validation
        const isPasswordCorrect = await this.validatePDFPassword(b64Content, password);
        
        if (!isPasswordCorrect) {
          // Clean up temp file if created
          if (fileUri.startsWith('content://')) {
            await FileSystem.deleteAsync(localUri, { idempotent: true });
          }
          return {
            success: false,
            isPasswordProtected: true,
            error: 'Incorrect password'
          };
        }
      }

      console.log('🔐 PDF read successfully, content length:', b64Content.length);
      
      // Clean up temp file if created
      if (fileUri.startsWith('content://')) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      }
      
      return {
        success: true,
        content: b64Content,
        isPasswordProtected: isEncrypted
      };
      
    } catch (error: any) {
      console.error('🔐 PDF read failed:', error);
      return {
        success: false,
        error: `Failed to read PDF: ${error.message}`
      };
    }
  }

  private isPDFEncrypted(base64Content: string): boolean {
    try {
      // Convert base64 to binary string to check for encryption markers
      const binaryString = atob(base64Content);
      
      // Look for encryption indicators in PDF structure
      // PDFs use /Encrypt dictionary for password protection
      const encryptionMarkers = [
        '/Encrypt',
        '/Filter /Standard',
        '/Filter/Standard',
        'endobj'
      ];
      
      // Simple check - look for encryption markers
      const hasEncryptionMarkers = encryptionMarkers.some(marker => 
        binaryString.includes(marker)
      );
      
      // Additional check for PDF trailer with Encrypt reference
      const hasEncryptReference = binaryString.includes('/Encrypt ') || 
                                  binaryString.includes('/Encrypt\n') ||
                                  binaryString.includes('/Encrypt\r');
      
      return hasEncryptionMarkers && hasEncryptReference;
    } catch (error) {
      console.warn('🔐 Could not check PDF encryption status:', error);
      // If we can't check, assume it might be encrypted if read fails later
      return false;
    }
  }

  private async validatePDFPassword(base64Content: string, password: string): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Use a PDF library like pdf-lib or react-native-pdf-lib
      // 2. Attempt to decrypt the PDF with the provided password
      // 3. Return true if successful, false if password is wrong
      
      // For demo purposes, let's simulate password validation
      // This is a placeholder - replace with actual PDF decryption
      console.log('🔐 Validating password for encrypted PDF');
      
      // Simulate some common passwords being correct
      const commonPasswords = ['password', '123456', 'admin', 'user'];
      
      // For demo, accept some common passwords or if password length > 3
      if (commonPasswords.includes(password.toLowerCase()) || password.length > 3) {
        console.log('🔐 Password validation successful (simulated)');
        return true;
      }
      
      console.log('🔐 Password validation failed (simulated)');
      return false;
    } catch (error) {
      console.error('🔐 Password validation error:', error);
      return false;
    }
  }
}