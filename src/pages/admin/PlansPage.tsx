import { usePlan } from '@/lib/plans/PlanContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Lock } from 'lucide-react';
import {
  PLAN_LABELS, PLAN_COLORS, PLAN_FEATURES, FEATURE_LABELS,
  PLAN_PRICING, CompanyPlan, Feature
} from '@/lib/plans/features';

const ALL_PLANS: CompanyPlan[] = ['start', 'pro', 'enterprise'];

export default function PlansPage() {
  const { plan } = usePlan();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Plano</h1>
        <p className="text-muted-foreground mt-1">
          Visualize seu plano atual e funcionalidades disponíveis
        </p>
      </div>

      {plan && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Plano Atual</CardTitle>
              <Badge className={PLAN_COLORS[plan]}>{PLAN_LABELS[plan]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              R$ {PLAN_PRICING[plan].base}/mês + R$ {PLAN_PRICING[plan].perBarber} por barbeiro
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ALL_PLANS.map((p) => {
          const isCurrent = p === plan;
          const features = PLAN_FEATURES[p];
          return (
            <Card
              key={p}
              className={`glass-card transition-all ${isCurrent ? 'ring-2 ring-primary shadow-lg' : 'opacity-70'}`}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-xl">{PLAN_LABELS[p]}</CardTitle>
                  {isCurrent && <Badge className="bg-primary/20 text-primary">Ativo</Badge>}
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">
                  R$ {PLAN_PRICING[p].base}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-xs text-muted-foreground">+ R$ {PLAN_PRICING[p].perBarber} por barbeiro</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {features.map((feature: Feature) => {
                    const hasIt = plan ? PLAN_FEATURES[plan].includes(feature) : false;
                    return (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        {hasIt ? (
                          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className={hasIt ? 'text-foreground' : 'text-muted-foreground'}>
                          {FEATURE_LABELS[feature]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Para alterar seu plano, entre em contato com o suporte.
      </p>
    </div>
  );
}
