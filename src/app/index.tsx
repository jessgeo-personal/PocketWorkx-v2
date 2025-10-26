// src/app/index.tsx - DEFAULT ROUTE
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/home" />;
}