// src/app/_layout.tsx - UPDATED ROOT LAYOUT
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // No headers - navigation through menu only
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="cash" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="crypto" />
      <Stack.Screen name="loans" />
      <Stack.Screen name="credit-cards" />
      <Stack.Screen name="receivables" />
      <Stack.Screen name="investments" />
      <Stack.Screen name="liquidity" />
      <Stack.Screen name="liabilities" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="cashflow" />
      <Stack.Screen name="trends" />
      <Stack.Screen name="investments-receivables" />
    </Stack>
  );
}