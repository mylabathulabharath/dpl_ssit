/**
 * 🤝 Partner Context
 * Manages white-label behavior when a college is partnered
 * Dynamically changes app branding, logo, name, and course filtering
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { College, University, Branch, PartnerContext as IPartnerContext } from '@/types/admin';

interface PartnerContextType {
  partnerContext: IPartnerContext | null;
  setPartnerCollege: (college: College | null, university: University | null, branches: Branch[]) => void;
  clearPartnerContext: () => void;
  isPartnerMode: boolean;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [partnerContext, setPartnerContextState] = useState<IPartnerContext | null>(null);

  // Load from storage on mount (for persistence)
  useEffect(() => {
    // In a real app, load from AsyncStorage or similar
    // For now, we'll keep it in memory
  }, []);

  const setPartnerCollege = (college: College | null, university: University | null, branches: Branch[]) => {
    if (college && university) {
      const context: IPartnerContext = {
        college,
        university,
        branches,
      };
      setPartnerContextState(context);
      // Persist to storage
      // await AsyncStorage.setItem('partnerContext', JSON.stringify(context));
    } else {
      setPartnerContextState(null);
      // await AsyncStorage.removeItem('partnerContext');
    }
  };

  const clearPartnerContext = () => {
    setPartnerContextState(null);
    // await AsyncStorage.removeItem('partnerContext');
  };

  const isPartnerMode = partnerContext !== null;

  return (
    <PartnerContext.Provider
      value={{
        partnerContext,
        setPartnerCollege,
        clearPartnerContext,
        isPartnerMode,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartner() {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

