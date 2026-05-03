import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOpportunities, type Opportunity } from '@/hooks/queries/useOpportunities';

const stages: { id: Opportunity['status']; title: string; color: string }[] = [
  { id: 'lead', title: 'Lead', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contatado', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Qualificado', color: 'bg-purple-500' },
  { id: 'won', title: 'Ganho', color: 'bg-green-500' },
  { id: 'lost', title: 'Perdido', color: 'bg-gray-500' },
];

export default function UserCRMPage() {
  const { t } = useLanguage();
  const { data: items = [] } = useOpportunities();
  const grouped = stages.reduce<Record<string, Opportunity[]>>((acc, s) => {
    acc[s.id] = items.filter(i => i.status === s.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.crm}</h1>
        <p className="text-muted-foreground mt-1">Visualização do pipeline (somente leitura)</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-[280px]">
            <Card className="glass-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <CardTitle className="text-base">{stage.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">{grouped[stage.id]?.length || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {grouped[stage.id]?.map((opp) => (
                  <Card key={opp.id} className="bg-background/50 border-border/50">
                    <CardContent className="p-3">
                      <h4 className="font-medium text-foreground text-sm">{opp.title}</h4>
                      {opp.contact_name && <p className="text-xs text-muted-foreground">{opp.contact_name}</p>}
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="font-semibold text-primary">R$ {Number(opp.estimated_value ?? 0).toFixed(2)}</span>
                        {opp.contact_phone && <span className="text-muted-foreground text-xs">{opp.contact_phone}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!grouped[stage.id] || grouped[stage.id].length === 0) && (
                  <div className="text-center py-6 text-muted-foreground text-sm">Sem itens</div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
