'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface NutritionAccordionContextType {
  expandedItemId: string;
  setExpandedItemId: (id: string) => void;
  hideAllergenTags: boolean;
  setHideAllergenTags: (value: boolean) => void;
}

const NutritionAccordionContext = createContext<NutritionAccordionContextType | undefined>(undefined);

export function NutritionAccordionProvider({ children }: { children: ReactNode }) {
  const [expandedItemId, setExpandedItemId] = useState<string>("");
  const [hideAllergenTags, _setHideAllergenTags] = useLocalStorage<boolean>({
    key: 'hideAllergenTags',
    initialValue: false,
    expiryInMs: 30 * 24 * 60 * 60 * 1000, // 1 month
  });
  const setHideAllergenTags = (value: boolean) => _setHideAllergenTags(value);

  return (
    <NutritionAccordionContext.Provider value={{ expandedItemId, setExpandedItemId, hideAllergenTags, setHideAllergenTags }}>
      {children}
    </NutritionAccordionContext.Provider>
  );
}

export function useNutritionAccordion() {
  const context = useContext(NutritionAccordionContext);
  if (!context) {
    throw new Error('useNutritionAccordion must be used within NutritionAccordionProvider');
  }
  return context;
}
