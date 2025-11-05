import React from 'react';
import { Stack } from 'expo-router';
import { StorageProvider } from '../services/storage/StorageProvider';
import { OnboardingProvider } from '../components/onboarding/OnboardingManager';

export default function RootLayout() {
  return (
    <StorageProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </OnboardingProvider>
    </StorageProvider>
  );
}
