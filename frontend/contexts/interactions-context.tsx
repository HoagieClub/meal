'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface InteractionData {
  liked?: boolean | null;
  favorited?: boolean;
}

interface MetricsData {
  likeCount: number;
  dislikeCount: number;
  averageLikeScore?: number;
}

interface InteractionsContextValue {
  interactions: Record<string, InteractionData>;
  metrics: Record<string, MetricsData>;
  updateInteraction: (id: string, patch: Partial<InteractionData>) => void;
  updateMetrics: (id: string, patch: Partial<MetricsData>) => void;
}

const InteractionsContext = createContext<InteractionsContextValue>({
  interactions: {},
  metrics: {},
  updateInteraction: () => {},
  updateMetrics: () => {},
});

export const InteractionsProvider = ({
  children,
  initialInteractions,
  initialMetrics,
}: {
  children: React.ReactNode;
  initialInteractions: Record<string, any> | null | undefined;
  initialMetrics: Record<string, any> | null | undefined;
}) => {
  const [interactions, setInteractions] = useState<Record<string, InteractionData>>({});
  const [metrics, setMetrics] = useState<Record<string, MetricsData>>({});

  // Sync when API data first arrives
  useEffect(() => {
    if (initialInteractions && Object.keys(initialInteractions).length > 0) {
      setInteractions(initialInteractions);
    }
  }, [initialInteractions]);

  useEffect(() => {
    if (initialMetrics && Object.keys(initialMetrics).length > 0) {
      setMetrics(initialMetrics);
    }
  }, [initialMetrics]);

  const updateInteraction = (id: string, patch: Partial<InteractionData>) => {
    setInteractions(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const updateMetrics = (id: string, patch: Partial<MetricsData>) => {
    setMetrics(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return (
    <InteractionsContext.Provider value={{ interactions, metrics, updateInteraction, updateMetrics }}>
      {children}
    </InteractionsContext.Provider>
  );
};

export const useInteractionsContext = () => useContext(InteractionsContext);
