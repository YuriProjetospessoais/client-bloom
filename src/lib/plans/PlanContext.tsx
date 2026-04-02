import React, { createContext, useContext, useMemo } from 'react';
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
  const { tenant } = useTenant();

  const value = useMemo(() => {
    const plan = (tenant as any)?.plan as CompanyPlan | null ?? null;
    return {
      plan,
      canAccess: (feature: Feature) => hasFeatureAccess(plan, feature),
      upgradeMessage: (feature: Feature) => getUpgradeMessage(feature),
    };
  }, [tenant]);

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
