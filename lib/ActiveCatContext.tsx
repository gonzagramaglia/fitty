import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Represents the shape of the ActiveCatContext.
 * Provides the ID of the currently selected cat, a function to change it, 
 * and a loading state indicating if the initial fetch is complete.
 */
/**
 * Represents the shape of the ActiveCatContext.
 * Provides the ID of the currently selected cat, a function to change it,
 * a loading state indicating if the initial fetch is complete,
 * and centralized guest modal state to prevent duplicate modal rendering.
 */
type ActiveCatContextType = {
  /** The ID of the currently active cat profile. */
  activeCatId: string | null;
  /** Updates the active cat ID and persists it to AsyncStorage. */
  setActiveCatId: (id: string | null) => Promise<void>;
  /** The ID of the currently selected health check for detail view. */
  selectedCheckId: string | null;
  /** Sets the selected health check ID for navigation to detail view. */
  setSelectedCheckId: (id: string | null) => void;
  /** Whether the initial cat data fetch is still in progress. */
  isLoading: boolean;
  /** Shows the centralized guest limit modal with an optional custom message. */
  showGuestModal: (message?: string) => void;
  /** Whether the guest limit modal is currently visible. */
  guestModalVisible: boolean;
  /** The message displayed in the guest limit modal. */
  guestModalMessage: string;
  /** Hides the guest limit modal. */
  hideGuestModal: () => void;
  /** Shows the processing-in-progress modal. */
  showProcessingModal: () => void;
  /** Whether the processing modal is currently visible. */
  processingModalVisible: boolean;
  /** Hides the processing modal. */
  hideProcessingModal: () => void;
};

/**
 * React Context for managing the globally active cat across the application.
 */
const ActiveCatContext = createContext<ActiveCatContextType>({
  activeCatId: null,
  setActiveCatId: async () => {},
  selectedCheckId: null,
  setSelectedCheckId: () => {},
  isLoading: true,
  showGuestModal: () => {},
  guestModalVisible: false,
  guestModalMessage: '',
  hideGuestModal: () => {},
  showProcessingModal: () => {},
  processingModalVisible: false,
  hideProcessingModal: () => {},
});

/**
 * Provider component that wraps the application to supply the ActiveCatContext.
 * It automatically fetches the most recently created cat for the authenticated user
 * on mount and sets it as the active cat by default.
 *
 * @param children - The React nodes to be rendered within the provider.
 */
export const ActiveCatProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeCatId, setActiveCatIdState] = useState<string | null>(null);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [guestModalMessage, setGuestModalMessage] = useState('');

  const showGuestModal = useCallback((message?: string) => {
    setGuestModalMessage(message || "You cannot perform more scans in this simulated experience. For the real Fitty experience, please log in with a Google account.");
    setGuestModalVisible(true);
  }, []);

  const hideGuestModal = useCallback(() => {
    setGuestModalVisible(false);
  }, []);

  const [processingModalVisible, setProcessingModalVisible] = useState(false);

  const showProcessingModal = useCallback(() => {
    setProcessingModalVisible(true);
  }, []);

  const hideProcessingModal = useCallback(() => {
    setProcessingModalVisible(false);
  }, []);

  useEffect(() => {
    const loadActiveCat = async () => {
      try {
        const storedId = await AsyncStorage.getItem('active_cat_id');
        if (storedId) {
          setActiveCatIdState(storedId);
        } else {
          // If no stored ID, try to fetch the first cat from Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data } = await supabase
              .from('cats')
              .select('id')
              .eq('user_id', session.user.id)
              .limit(1)
              .maybeSingle();
              
            if (data?.id) {
              await AsyncStorage.setItem('active_cat_id', data.id);
              setActiveCatIdState(data.id);
            }
          }
        }
      } catch (e) {
        console.error('Error loading active cat:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveCat();
  }, []);

  const setActiveCatId = useCallback(async (id: string | null) => {
    if (id) {
      await AsyncStorage.setItem('active_cat_id', id);
    } else {
      await AsyncStorage.removeItem('active_cat_id');
    }
    setActiveCatIdState(id);
  }, []);

  const value = useMemo(
    () => ({ activeCatId, setActiveCatId, selectedCheckId, setSelectedCheckId, isLoading, showGuestModal, guestModalVisible, guestModalMessage, hideGuestModal, showProcessingModal, processingModalVisible, hideProcessingModal }),
    [activeCatId, setActiveCatId, selectedCheckId, isLoading, showGuestModal, guestModalVisible, guestModalMessage, hideGuestModal, showProcessingModal, processingModalVisible, hideProcessingModal]
  );

  return (
    <ActiveCatContext.Provider value={value}>
      {children}
    </ActiveCatContext.Provider>
  );
};

/**
 * Custom hook to consume the ActiveCatContext.
 * 
 * @returns The ActiveCatContextType containing activeCatId, setActiveCatId, and isLoading.
 */
export const useActiveCat = () => useContext(ActiveCatContext);
