import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

type ActiveCatContextType = {
  activeCatId: string | null;
  setActiveCatId: (id: string | null) => Promise<void>;
  isLoading: boolean;
};

const ActiveCatContext = createContext<ActiveCatContextType>({
  activeCatId: null,
  setActiveCatId: async () => {},
  isLoading: true,
});

export const ActiveCatProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeCatId, setActiveCatIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const setActiveCatId = async (id: string | null) => {
    if (id) {
      await AsyncStorage.setItem('active_cat_id', id);
    } else {
      await AsyncStorage.removeItem('active_cat_id');
    }
    setActiveCatIdState(id);
  };

  return (
    <ActiveCatContext.Provider value={{ activeCatId, setActiveCatId, isLoading }}>
      {children}
    </ActiveCatContext.Provider>
  );
};

export const useActiveCat = () => useContext(ActiveCatContext);
