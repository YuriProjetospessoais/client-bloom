import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useTenant } from '@/lib/tenant/TenantContext';
import { CompanyPlan, Feature, hasFeatureAccess, getUpgradeMessage } from './features';

interface PlanContextType {
  plan: CompanyPlan | null;
  canAccess: (feature: Feature) => boolean;
  upgradeMessage: (feature: Feature) => string;
}

const PlanContext = createContext<PlanContextType>({
  plan: null,
  canAccess: () => false,
  upgradeMessage: () => '',
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading } = useTenant();

  // Keep a stable reference to the last known plan so re-renders
  // during transient loading states don't flash permissions open/closed
  const lastKnownPlan = useRef<CompanyPlan | null>(null);

  const value = useMemo(() => {
    const currentPlan = tenant?.plan as CompanyPlan | null ?? null;

    // Update the ref only when we have a real value
    if (currentPlan) {
      lastKnownPlan.current = currentPlan;
    }

    // Use the current plan if available, otherwise fall back to last known
    // During loading, keep the previous plan to avoid unlocking features
    const effectivePlan = currentPlan ?? (isLoading ? lastKnownPlan.current : null);

    return {
      plan: effectivePlan,
      canAccess: (feature: Feature) => hasFeatureAccess(effectivePlan, feature),
      upgradeMessage: (feature: Feature) => getUpgradeMessage(feature),
    };
  }, [tenant, isLoading]);

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
