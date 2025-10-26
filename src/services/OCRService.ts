// src/services/OCRService.ts - FIXED VERSION
import { OCRResult } from '../types/finance';

export async function performOCR(imageUri: string): Promise<OCRResult> {
  try {
    // Since react-native-text-recognition is causing issues, 
    // let's disable OCR for now and return a placeholder
    console.log('📄 OCR requested for:', imageUri);
    console.log('📄 OCR disabled - using text-based parsing only');
    
    return { 
      text: '', // Empty text - rely on PDF text extraction
      confidence: 0.0 
    };
  } catch (error: any) {
    console.error('📄 OCR failed:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

// Alternative OCR function if we want to implement later
export async function performOCRWhenFixed(imageUri: string): Promise<OCRResult> {
  try {
    // This is what the code SHOULD do when OCR library works:
    // const TextRecognition = require('react-native-text-recognition');
    // const resultLines: string[] = await TextRecognition.recognize(imageUri);
    // const text = resultLines.join(' ');
    // return { text, confidence: 0.8 };
    
    return { text: '', confidence: 0.0 };
  } catch (error: any) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}