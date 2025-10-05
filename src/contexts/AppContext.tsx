import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  isFirstLaunch: boolean;
  setIsFirstLaunch: (value: boolean) => void;
  markAppAsLaunched: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        // أول مرة يتم تشغيل التطبيق
        setIsFirstLaunch(true);
      } else {
        // تم تشغيل التطبيق من قبل
        setIsFirstLaunch(false);
      }
    } catch (error) {
      // First launch check error handled silently
      // في حالة الخطأ، نفترض أنه أول تشغيل
      setIsFirstLaunch(true);
    } finally {
      setLoading(false);
    }
  };

  const markAppAsLaunched = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      // App state save error handled silently
    }
  };

  const value: AppContextType = {
    isFirstLaunch,
    setIsFirstLaunch,
    markAppAsLaunched,
    loading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};




