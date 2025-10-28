import React from 'react';
import { Stack } from 'expo-router';
import { StorageProvider } from '../services/storage/StorageProvider';

export default function RootLayout() {
  return (
    <StorageProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </StorageProvider>
  );
}