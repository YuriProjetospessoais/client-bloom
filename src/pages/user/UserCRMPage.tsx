import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Phone, Mail, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  value: string;
  stage: string;
  lastContact: string;
}

const initialLeads: Record<string, Lead[]> = {
  new: [
    { id: '1', name: 'João Ferreira', email: 'joao@email.com', phone: '(11) 99999-1111', value: 'R$ 500', stage: 'new', lastContact: 'Hoje' },
  ],
  contact: [
    { id: '2', name: 'Camila Souza', email: 'camila@email.com', phone: '(11) 99999-2222', value: 'R$ 1.200', stage: 'contact', lastContact: '2 dias' },
  ],
  proposal: [
    { id: '3', name: 'Bruno Costa', email: 'bruno@email.com', phone: '(11) 99999-3333', value: 'R$ 800', stage: 'proposal', lastContact: 'Hoje' },
  ],
  negotiation: [],
  closed: [
    { id: '4', name: 'Julia Ferreira', email: 'julia@email.com', phone: '(11) 99999-4444', value: 'R$ 600', stage: 'closed', lastContact: 'Ontem' },
  ],
};

const stages = [
  { id: 'new', title: 'Novos', color: 'bg-blue-500' },
  { id: 'contact', title: 'Contato', color: 'bg-yellow-500' },
  { id: 'proposal', title: 'Proposta', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'closed', title: 'Fechado', color: 'bg-green-500' },
];

export default function UserCRMPage() {
  const { t } = useLanguage();
  const [leads] = useState(initialLeads);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.crm}</h1>
          <p className="text-muted-foreground mt-1">Meus leads e oportunidades</p>
        </div>
        <Button className="gradient-primary text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
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
                  <Badge variant="secondary" className="text-xs">
                    {leads[stage.id]?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {leads[stage.id]?.map((lead) => (
                  <Card key={lead.id} className="bg-background/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm">{lead.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Phone className="w-4 h-4" /> Ligar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Calendar className="w-4 h-4" /> Agendar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">{lead.value}</span>
                        <span className="text-muted-foreground text-xs">{lead.lastContact}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!leads[stage.id] || leads[stage.id].length === 0) && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Sem leads
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
