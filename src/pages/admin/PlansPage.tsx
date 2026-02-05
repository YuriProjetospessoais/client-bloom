 import { useLanguage } from '@/lib/i18n/LanguageContext';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Check, Users, Crown, Rocket, MessageCircle } from 'lucide-react';
 
 const plans = [
   {
     id: 'starter',
     name: 'Starter',
     price: 'R$ 97',
     period: '/mês',
     description: 'Ideal para barbearias iniciantes',
     maxUsers: 5,
     features: [
       'Até 5 usuários',
       'CRM básico',
       'Agendamento',
       'Alertas de retorno',
       'Suporte por email',
     ],
     url: 'https://pay.kiwify.com.br/r4UKRO0',
     icon: Users,
     buttonText: 'Assinar Starter',
   },
   {
     id: 'professional',
     name: 'Professional',
     price: 'R$ 197',
     period: '/mês',
     description: 'Para barbearias em crescimento',
     maxUsers: 15,
     features: [
       'Até 15 usuários',
       'CRM completo',
       'Agendamento avançado',
       'Alertas inteligentes',
       'Relatórios',
       'Suporte prioritário',
     ],
     url: 'https://pay.kiwify.com.br/JPB4fzK',
     icon: Crown,
     popular: true,
     buttonText: 'Assinar Professional',
   },
   {
     id: 'enterprise',
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
     url: 'https://wa.me/5534993349333?text=Ol%C3%A1,%20quero%20saber%20mais%20sobre%20o%20Plano%20Enterprise.%20',
     icon: Rocket,
     buttonText: 'Falar com consultor',
     isWhatsApp: true,
   },
 ];
 
 export default function PlansPage() {
   const { t } = useLanguage();
 
   const handleSelectPlan = (url: string) => {
     window.open(url, '_blank');
   };
 
   return (
     <div className="space-y-6">
       <div className="text-center max-w-2xl mx-auto">
         <h1 className="text-3xl font-bold text-foreground">{t.nav.plans}</h1>
         <p className="text-muted-foreground mt-2">
           Escolha o plano ideal para sua barbearia e comece a transformar seus relacionamentos com clientes
         </p>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
         {plans.map((plan) => (
           <Card 
             key={plan.id} 
             className={`glass-card relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
               plan.popular ? 'ring-2 ring-primary shadow-lg' : ''
             }`}
           >
             {plan.popular && (
               <div className="absolute top-0 right-0">
                 <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground px-3 py-1">
                   Mais Popular
                 </Badge>
               </div>
             )}
             <CardHeader className="text-center pb-2">
               <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                 plan.popular 
                   ? 'bg-gradient-to-br from-primary to-primary/80' 
                   : 'bg-gradient-to-br from-muted to-muted/80'
               }`}>
                 <plan.icon className={`w-8 h-8 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`} />
               </div>
               <CardTitle className="text-2xl">{plan.name}</CardTitle>
               <CardDescription>{plan.description}</CardDescription>
               <div className="pt-4">
                 <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                 <span className="text-muted-foreground">{plan.period}</span>
               </div>
             </CardHeader>
             <CardContent className="space-y-6">
               <ul className="space-y-3">
                 {plan.features.map((feature, index) => (
                   <li key={index} className="flex items-center gap-3 text-sm">
                     <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                       <Check className="w-3 h-3 text-green-500" />
                     </div>
                     <span className="text-foreground">{feature}</span>
                   </li>
                 ))}
               </ul>
 
               <Button 
                 className={`w-full gap-2 text-base py-6 ${
                   plan.popular 
                     ? 'gradient-primary text-white' 
                     : plan.isWhatsApp 
                       ? 'bg-green-600 hover:bg-green-700 text-white'
                       : ''
                 }`}
                 variant={plan.popular || plan.isWhatsApp ? 'default' : 'outline'}
                 onClick={() => handleSelectPlan(plan.url)}
               >
                 {plan.isWhatsApp && <MessageCircle className="w-5 h-5" />}
                 {plan.buttonText}
               </Button>
             </CardContent>
           </Card>
         ))}
       </div>
 
       <div className="text-center text-sm text-muted-foreground mt-8">
         <p>Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.</p>
       </div>
     </div>
   );
 }