// src/components/onboarding/OnboardingManager.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../utils/theme';
import { useStorage } from '../../services/storage/StorageProvider';

type OnboardingStep = 
  | 'welcome'
  | 'menu_tutorial'        // Point to menu button, disable Continue
  | 'slidingmenu_tutorial' // Point to Home button in sliding menu, disable Continue
  | 'quickactions_tutorial'// Point to Quick Actions button, disable Continue  
  | 'addcash_tutorial'     // Point to Add Cash button in modal, disable Continue
  | 'cashmodal_tutorial'   // Point to form in cash modal, disable Continue
  | 'cash_completion'      // Show completion message with End Tutorial button
  | 'completed';


interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  nextStep: () => void;
  skipTutorial: () => void;
  isOnboardingActive: boolean;
  onMenuButtonPressed: () => void;      // NEW
  onHomeButtonPressed: () => void;      // NEW  
  onQuickActionsOpened: () => void;
  onAddCashChosen: () => void;
  onAddCashModalOpened: () => void;
  onCashEntryAdded: () => void;         // NEW
  startOnboarding: () => void;
}


// src/components/onboarding/OnboardingManager.tsx
const OnboardingContext = createContext<OnboardingContextType>({
  currentStep: null,
  nextStep: () => {},
  skipTutorial: () => {},
  isOnboardingActive: false,
  // NEW defaults to satisfy interface
  onMenuButtonPressed: () => {},
  onHomeButtonPressed: () => {},
  onQuickActionsOpened: () => {},
  onAddCashChosen: () => {},
  onAddCashModalOpened: () => {},
  onCashEntryAdded: () => {},
  startOnboarding: () => {},
});


export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, save } = useStorage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  // ADD THIS DIAGNOSTIC EFFECT HERE
  useEffect(() => {
    if (currentStep) {
      console.log('[Onboarding] step →', currentStep);
    }
  }, [currentStep]);
  
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
        setCurrentStep('slidingmenu_tutorial');
        break;
      case 'slidingmenu_tutorial':
        setCurrentStep('quickactions_tutorial');
        break;
      case 'quickactions_tutorial':
        setCurrentStep('addcash_tutorial');
        break;
      case 'addcash_tutorial':
        setCurrentStep('cashmodal_tutorial');
        break;
      case 'cashmodal_tutorial':
        setCurrentStep('cash_completion');
        break;
      case 'cash_completion':
        completeOnboarding();
        break;
    }
  };


  const skipTutorial = () => completeOnboarding();

  // Event-driven notifiers (updated for new flow)
  // src/components/onboarding/OnboardingManager.tsx
  const onMenuButtonPressed = () => {
    console.log('[OnboardingManager] onMenuButtonPressed called, currentStep:', currentStep);
    
    setCurrentStep(prev => {
      console.log('[OnboardingManager] setState prev:', prev);
      if (prev === 'menu_tutorial') {
        console.log('[OnboardingManager] Advancing menu_tutorial → slidingmenu_tutorial');
        return 'slidingmenu_tutorial';
      }
      console.log('[OnboardingManager] Not advancing, staying at:', prev);
      return prev;
    });
  };


  const onHomeButtonPressed = () => {
    if (currentStep === 'slidingmenu_tutorial') {
      setCurrentStep('quickactions_tutorial');
    }
  };
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

  const onCashEntryAdded = () => {
    if (currentStep === 'cashmodal_tutorial') {
      setCurrentStep('cash_completion');
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
        onMenuButtonPressed,         // NEW
        onHomeButtonPressed,         // NEW
        onQuickActionsOpened,
        onAddCashChosen,
        onAddCashModalOpened,
        onCashEntryAdded,           // NEW
        startOnboarding,
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
      {/* Hide the Home-layer cloud when SlidingMenu is the active tutorial target */}
      {currentStep !== 'slidingmenu_tutorial'
        && currentStep !== 'addcash_tutorial'
        && currentStep !== 'cashmodal_tutorial'
        && <ConversationCloud />}
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
        // Position above bottom center menu button (don't block it)
        setPos({ x: width / 2 - 150, y: height - 220 });
        break;
      case 'slidingmenu_tutorial':
        // Position above Home button in sliding menu (top area of screen when menu is open)
        setPos({ x: width / 2 - 150, y: height * 0.10 });
        break;
      case 'quickactions_tutorial':
        // UPDATED: Position BELOW Quick Actions button and point upward to it
        setPos({ x: width / 2 - 150, y: height * 0.55 }); // Moved down from 0.35 to 0.45
        break;
      case 'addcash_tutorial':
        // Position for Add Cash button in Quick Actions modal (upper area)
        setPos({ x: width / 2 - 150, y: height * 0.65 });
        break;
      case 'cashmodal_tutorial':
        // Position for Cash modal form (center screen)
        setPos({ x: width / 2 - 150, y: height * 0.10 });
        break;
      case 'cash_completion':
        // Position above the Wallet card on cash.tsx
        setPos({ x: width / 2 - 150, y: height * 0.47 });
        break;
    }
  };



  

  const getMessage = () => {
    switch (currentStep) {
      case 'menu_tutorial':
        return 'To jump to different sections of the app at anytime, click this Menu button to continue.';
      case 'slidingmenu_tutorial':
        return 'Jump to any section on the site from this Menu. Click the Home button to return to the main page.';
      case 'quickactions_tutorial':
        return 'Quick Actions is where you have access to all of your options. Start your journey here. Click QuickActions.';
      case 'addcash_tutorial':
        return 'Lets start here by adding cash in your pocket into the app. Click AddCash.';
      case 'cashmodal_tutorial':
        return 'Fill in the amount, choose Wallet and click Save. The cash should show up under Wallet on your screen.';
      case 'cash_completion':
        return 'Your Wallet reflects the cash you have in hand. Use RecordExpense to add any cash transactions you make.\n\nContinue to explore the app to track your bank accounts, credit cards, fixed deposits and more. Thanks for taking the tutorial!';
      default:
        return '';
    }
  };


  const isGated = currentStep === 'menu_tutorial' 
    || currentStep === 'slidingmenu_tutorial'
    || currentStep === 'quickactions_tutorial' 
    || currentStep === 'addcash_tutorial' 
    || currentStep === 'cashmodal_tutorial';


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
      
      {/* UPDATED: Conditional pointer triangle - upward for quickactions_tutorial */}
      {currentStep === 'quickactions_tutorial' ? (
        <View style={styles.cloudPointerUp} pointerEvents="none" />
      ) : (
        <View style={styles.cloudPointer} pointerEvents="none" />
      )}
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
    zIndex: 9999999999999, // INCREASED from 99999 to 999999
    maxWidth: 300,
    elevation: 100, // INCREASED from 30 to 50 (Android highest elevation)
  },

  cloudBubble: { 
    backgroundColor: Colors.background.card, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.xl, 
    borderWidth: 2, 
    borderColor: '#8B5CF6', 
    ...Shadows.md,
    zIndex: 9999999999, // INCREASED from 99999 to 999999
    elevation: 105, // INCREASED from 35 to 55 (Higher elevation for Android)
  },

  cloudMessage: { fontSize: Typography.fontSize.base, color: Colors.text.primary, lineHeight: 22, marginBottom: Spacing.md },
  cloudFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cloudCancelButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm },
  cloudCancelText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
  cloudContinueButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, backgroundColor: '#8B5CF6' },
  cloudContinueText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  
  // EXISTING: Downward pointing triangle (for most steps)
  cloudPointer: { 
    position: 'absolute', 
    bottom: -8, 
    left: '50%', 
    marginLeft: -8, 
    width: 0, 
    height: 0, 
    borderLeftWidth: 8, 
    borderRightWidth: 8, 
    borderTopWidth: 8, 
    borderLeftColor: 'transparent', 
    borderRightColor: 'transparent', 
    borderTopColor: '#8B5CF6' 
  },
  
  // NEW: Upward pointing triangle (for quickactions_tutorial)
  cloudPointerUp: { 
    position: 'absolute', 
    top: -8, 
    left: '50%', 
    marginLeft: -8, 
    width: 0, 
    height: 0, 
    borderLeftWidth: 8, 
    borderRightWidth: 8, 
    borderBottomWidth: 8, 
    borderLeftColor: 'transparent', 
    borderRightColor: 'transparent', 
    borderBottomColor: '#8B5CF6' 
  },
});
