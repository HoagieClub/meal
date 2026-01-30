'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NutritionAccordionContextType {
  expandedItemId: string;
  setExpandedItemId: (id: string) => void;
}

const NutritionAccordionContext = createContext<NutritionAccordionContextType | undefined>(undefined);

export function NutritionAccordionProvider({ children }: { children: ReactNode }) {
  const [expandedItemId, setExpandedItemId] = useState<string>("");

  return (
    <NutritionAccordionContext.Provider value={{ expandedItemId, setExpandedItemId }}>
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
