import { usePlan } from '@/lib/plans/PlanContext';
import { Feature, getUpgradeMessage, PLAN_LABELS, getMinimumPlan } from '@/lib/plans/features';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** If true, renders a blocked placeholder instead of hiding */
  showBlocked?: boolean;
}

/** Wraps content that requires a specific plan feature */
export function FeatureGate({ feature, children, showBlocked = true }: FeatureGateProps) {
  const { canAccess } = usePlan();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (!showBlocked) return null;

  const minPlan = getMinimumPlan(feature);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Funcionalidade Bloqueada</h2>
      <p className="text-muted-foreground max-w-md">
        {getUpgradeMessage(feature)}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
        Disponível no plano <span className="font-semibold text-foreground">{PLAN_LABELS[minPlan]}</span>
      </div>
    </div>
  );
}
