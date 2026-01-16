import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Edit, Plus } from 'lucide-react';
import { PlanModal, Plan } from '@/components/modals/PlanModal';

const initialPlans: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    description: 'Ideal para pequenos negócios',
    maxUsers: 5,
    features: [
      'Até 5 usuários',
      'CRM básico',
      'Agendamento',
      'Alertas de retorno',
      'Suporte por email',
    ],
    companies: 45,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    name: 'Professional',
    price: 'R$ 197',
    period: '/mês',
    description: 'Para negócios em crescimento',
    maxUsers: 15,
    features: [
      'Até 15 usuários',
      'CRM completo',
      'Agendamento avançado',
      'Alertas inteligentes',
      'Relatórios',
      'Suporte prioritário',
    ],
    companies: 52,
    popular: true,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 'R$ 397',
    period: '/mês',
    description: 'Para grandes operações',
    maxUsers: 50,
    features: [
      'Até 50 usuários',
      'CRM ilimitado',
      'API access',
      'White label',
      'Relatórios avançados',
      'Suporte 24/7',
      'Gerente dedicado',
    ],
    companies: 27,
    color: 'from-orange-500 to-orange-600',
  },
];

export default function PlansPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleNewPlan = () => {
    setSelectedPlan(null);
    setPlanModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPlanModalOpen(true);
  };

  const handleSavePlan = (planData: Partial<Plan>) => {
    if (planData.id) {
      setPlans(plans.map(p => p.id === planData.id ? { ...p, ...planData } : p));
    } else {
      const newPlan: Plan = {
        ...planData as Plan,
        id: Date.now(),
        companies: 0,
        color: 'from-blue-500 to-blue-600',
      };
      setPlans([...plans, newPlan]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.plans}</h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos de assinatura</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewPlan}>
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`glass-card relative overflow-hidden ${plan.popular ? 'ring-2 ring-primary' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-2`}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Empresas ativas</span>
                <span className="font-semibold text-foreground">{plan.companies}</span>
              </div>
              
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                className="w-full gap-2 mt-4"
                onClick={() => handleEditPlan(plan)}
              >
                <Edit className="w-4 h-4" />
                Editar Plano
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlanModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
