// src/components/onboarding/OnboardingManager.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../utils/theme';
import { useStorage } from '../../services/storage/StorageProvider';

type OnboardingStep = 
  | 'welcome'
  | 'menu_tutorial' 
  | 'quickactions_tutorial'
  | 'addcash_tutorial'
  | 'cashmodal_tutorial'
  | 'completed';

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  nextStep: () => void;
  skipTutorial: () => void;
  isOnboardingActive: boolean;
  onQuickActionsOpened: () => void;
  onAddCashChosen: () => void;
  onAddCashModalOpened: () => void;
  startOnboarding: () => void; // NEW: for on-demand restart
}

const OnboardingContext = createContext<OnboardingContextType>({
  currentStep: null,
  nextStep: () => {},
  skipTutorial: () => {},
  isOnboardingActive: false,
  onQuickActionsOpened: () => {},
  onAddCashChosen: () => {},
  onAddCashModalOpened: () => {},
  startOnboarding: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, save } = useStorage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  useEffect(() => {
    // Start once storage is loaded
    if (state === null) return;
    const isCompleted = (state as any)?.onboardingCompleted;
    if (!isCompleted) {
      setCurrentStep('welcome');
      setIsOnboardingActive(true);
    }
  }, [state]);

  const completeOnboarding = async () => {
    try {
      await save((draft: any) => ({
        ...draft,
        onboardingCompleted: true,
      }));
    } catch (_) {}
    setCurrentStep('completed');
    setIsOnboardingActive(false);
  };

  const nextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('menu_tutorial');
        break;
      case 'menu_tutorial':
        setCurrentStep('quickactions_tutorial');
        break;
      case 'quickactions_tutorial':
        setCurrentStep('addcash_tutorial');
        break;
      case 'addcash_tutorial':
        setCurrentStep('cashmodal_tutorial');
        break;
      case 'cashmodal_tutorial':
        completeOnboarding();
        break;
    }
  };

  const skipTutorial = () => completeOnboarding();

  // Event-driven notifiers (primary path)
  const onQuickActionsOpened = () => {
    if (currentStep === 'quickactions_tutorial') {
      setCurrentStep('addcash_tutorial');
    }
  };

  const onAddCashChosen = () => {
    if (currentStep === 'addcash_tutorial') {
      setCurrentStep('cashmodal_tutorial');
    }
  };

  const onAddCashModalOpened = () => {
    // Keep cloud visible; completion occurs when user adds cash (cash screen calls nextStep)
  };

  const startOnboarding = () => {
  setCurrentStep('welcome');
  setIsOnboardingActive(true);
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        currentStep, 
        nextStep, 
        skipTutorial, 
        isOnboardingActive,
        onQuickActionsOpened,
        onAddCashChosen,
        onAddCashModalOpened,
        startOnboarding, // NEW
      }}
    >
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
};

const OnboardingOverlay: React.FC = () => {
  const { currentStep, nextStep, skipTutorial } = useOnboarding();

  const renderWelcomeModal = () => (
    <Modal
      visible={currentStep === 'welcome'}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>Welcome to PocketWorkx! 🎉</Text>
            <Text style={styles.welcomeSubtitle}>
              Your secure personal finance app
            </Text>
          </View>
          <View style={styles.welcomeBody}>
            <Text style={styles.welcomeMessage}>
              Click here to find your way around PocketWorkx and get started with tracking your finances.
            </Text>
          </View>
          <View style={styles.welcomeFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={skipTutorial}>
              <Text style={styles.cancelButtonText}>Skip Tutorial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {renderWelcomeModal()}
      <ConversationCloud />
    </>
  );
};

const ConversationCloud: React.FC = () => {
  const { currentStep, nextStep, skipTutorial } = useOnboarding();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const fade = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStep && currentStep !== 'welcome' && currentStep !== 'completed') {
      positionForStep();
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [currentStep]);

  const positionForStep = () => {
    const { width, height } = Dimensions.get('window');
    switch (currentStep) {
      case 'menu_tutorial':
      // Position well ABOVE the bottom-center menu button so it never blocks it
      // Previously: setPos({ x: width / 2 - 150, y: height - 180 });
      // Move it up ~40px
        setPos({ x: width / 2 - 150, y: height - 220 });
        break;
      case 'quickactions_tutorial':
        // Position HIGHER ABOVE Quick Actions button to avoid covering it
        // Move from 45% to 35% from top to ensure full visibility
        setPos({ x: width / 2 - 150, y: height * 0.35 }); // Changed from 0.45 to 0.35
        break;
      case 'addcash_tutorial':
        // Position for Add Cash button in Quick Actions modal
        // Modal is bottom-sheet style, position in upper area  
        setPos({ x: width / 2 - 150, y: height * 0.20 }); // Changed from 0.25 to 0.20 (higher)
        break;
      case 'cashmodal_tutorial':
        // Position for Cash modal (center screen)
        setPos({ x: width / 2 - 150, y: height * 0.10 }); // Changed from 0.15 to 0.10 (higher)
        break;
      }
  };


  

  const getMessage = () => {
    switch (currentStep) {
      case 'menu_tutorial':
        return 'To jump to different sections of the app at anytime, click this Menu button';
      case 'quickactions_tutorial':
        return 'Quick Actions is where you have access to all of your options. Start your journey here. Click QuickActions.';
      case 'addcash_tutorial':
        return 'Lets start here by adding cash in your pocket into the app. Click AddCash.';
      case 'cashmodal_tutorial':
        return 'Count and add the amount in your wallet here, and click the \'Add Cash\' button.';
      default:
        return '';
    }
  };

  const isGated = currentStep === 'addcash_tutorial' || currentStep === 'cashmodal_tutorial';

  if (!currentStep || currentStep === 'welcome' || currentStep === 'completed') return null;

  return (
    <Animated.View 
      style={[
        styles.cloudWrap,
        { 
          opacity: fade,
          left: pos.x,
          top: pos.y,
        }
      ]} 
      pointerEvents="none" // wrapper never blocks touches
    >
      <View style={styles.cloudBubble} pointerEvents="auto">
        <Text style={styles.cloudMessage}>{getMessage()}</Text>
        
        <View style={styles.cloudFooter}>
          <TouchableOpacity style={styles.cloudCancelButton} onPress={skipTutorial}>
            <Text style={styles.cloudCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cloudContinueButton, isGated && { opacity: 0.4 }]} 
            onPress={!isGated ? nextStep : undefined}
            disabled={isGated}
          >
            <Text style={styles.cloudContinueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Pointer triangle */}
      <View style={styles.cloudPointer} pointerEvents="none" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { backgroundColor: Colors.background.card, borderRadius: BorderRadius.xl, width: '85%', maxWidth: 400, ...Shadows.md },
  welcomeHeader: { padding: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  welcomeTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  welcomeSubtitle: { fontSize: Typography.fontSize.base, color: '#8B5CF6', fontWeight: Typography.fontWeight.semibold, textAlign: 'center' },
  welcomeBody: { padding: Spacing.xl },
  welcomeMessage: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  welcomeFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border.light },
  cancelButton: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.main },
  cancelButtonText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, fontWeight: Typography.fontWeight.medium },
  continueButton: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md, backgroundColor: '#8B5CF6' },
  continueButtonText: { fontSize: Typography.fontSize.base, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  cloudWrap: { 
    position: 'absolute', 
    zIndex: 999999, // INCREASED from 99999 to 999999
    maxWidth: 300,
    elevation: 50, // INCREASED from 30 to 50 (Android highest elevation)
  },

  cloudBubble: { 
    backgroundColor: Colors.background.card, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.xl, 
    borderWidth: 2, 
    borderColor: '#8B5CF6', 
    ...Shadows.md,
    zIndex: 999999, // INCREASED from 99999 to 999999
    elevation: 55, // INCREASED from 35 to 55 (Higher elevation for Android)
  },



  cloudMessage: { fontSize: Typography.fontSize.base, color: Colors.text.primary, lineHeight: 22, marginBottom: Spacing.md },
  cloudFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cloudCancelButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm },
  cloudCancelText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
  cloudContinueButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, backgroundColor: '#8B5CF6' },
  cloudContinueText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  cloudPointer: { position: 'absolute', bottom: -8, left: '50%', marginLeft: -8, width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#8B5CF6' },
});
