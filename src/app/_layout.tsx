import React from 'react';
import { Stack } from 'expo-router';
import { StorageProvider } from '../services/storage/StorageProvider';
import { OnboardingProvider } from '../components/onboarding/OnboardingManager';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StorageProvider>
        <OnboardingProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </OnboardingProvider>
      </StorageProvider>
    </ErrorBoundary>
  );
}
