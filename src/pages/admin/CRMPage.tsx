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
import { LeadModal, Lead } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { handleCall, handleEmail } from '@/lib/actions';
import { createId } from '@/lib/mock/utils';

const initialLeads: Record<string, Lead[]> = {
  new: [
    { id: '1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-1111', value: 'R$ 500', stage: 'new', lastContact: 'Hoje', source: 'Instagram', createdAt: '2026-01-15' },
    { id: '2', name: 'João Pereira', email: 'joao@email.com', phone: '(11) 99999-2222', value: 'R$ 800', stage: 'new', lastContact: 'Ontem', source: 'Google', createdAt: '2026-01-14' },
  ],
  contact: [
    { id: '3', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-3333', value: 'R$ 1.200', stage: 'contact', lastContact: '2 dias', source: 'Indicação', createdAt: '2026-01-13' },
  ],
  proposal: [
    { id: '4', name: 'Carlos Santos', email: 'carlos@email.com', phone: '(11) 99999-4444', value: 'R$ 2.500', stage: 'proposal', lastContact: 'Hoje', source: 'Site', createdAt: '2026-01-12' },
    { id: '5', name: 'Patricia Lima', email: 'patricia@email.com', phone: '(11) 99999-5555', value: 'R$ 750', stage: 'proposal', lastContact: '3 dias', source: 'Facebook', createdAt: '2026-01-11' },
  ],
  negotiation: [
    { id: '6', name: 'Roberto Alves', email: 'roberto@email.com', phone: '(11) 99999-6666', value: 'R$ 3.000', stage: 'negotiation', lastContact: 'Hoje', source: 'WhatsApp', createdAt: '2026-01-10' },
  ],
  closed: [
    { id: '7', name: 'Fernanda Reis', email: 'fernanda@email.com', phone: '(11) 99999-7777', value: 'R$ 1.800', stage: 'closed', lastContact: 'Ontem', source: 'Indicação', createdAt: '2026-01-09' },
  ],
};

const stages = [
  { id: 'new', title: 'Novos', color: 'bg-blue-500' },
  { id: 'contact', title: 'Contato', color: 'bg-yellow-500' },
  { id: 'proposal', title: 'Proposta', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'closed', title: 'Fechado', color: 'bg-green-500' },
];

export default function CRMPage() {
  const { t } = useLanguage();
  const [leads, setLeads] = useState(initialLeads);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleNewLead = () => {
    setSelectedLead(null);
    setLeadModalOpen(true);
  };

  const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastContact'> & { id?: string }) => {
    if (leadData.id) {
      // Update existing lead
      const newLeads = { ...leads };
      for (const stage of Object.keys(newLeads)) {
        newLeads[stage] = newLeads[stage].map(l => 
          l.id === leadData.id ? { ...l, ...leadData } : l
        );
      }
      setLeads(newLeads);
    } else {
      // Create new lead
      const newLead: Lead = {
        ...leadData,
        id: createId('lead'),
        createdAt: new Date().toISOString().split('T')[0],
        lastContact: 'Agora',
      };
      setLeads({
        ...leads,
        new: [newLead, ...leads.new],
      });
    }
  };

  const handleScheduleForLead = (lead: Lead) => {
    setSelectedLead(lead);
    setAppointmentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.crm}</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas e oportunidades</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewLead}>
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-[300px]">
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{lead.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleCall(lead.phone, lead.name)}
                            >
                              <Phone className="w-4 h-4" /> Ligar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleEmail(lead.email, `Contato - ${lead.name}`, lead.name)}
                            >
                              <Mail className="w-4 h-4" /> Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleScheduleForLead(lead)}
                            >
                              <Calendar className="w-4 h-4" /> Agendar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{lead.email}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">{lead.value}</span>
                        <span className="text-muted-foreground text-xs">{lead.lastContact}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!leads[stage.id] || leads[stage.id].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum lead nesta etapa
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <LeadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        lead={selectedLead}
        onSave={handleSaveLead}
      />

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        onSave={() => setAppointmentModalOpen(false)}
      />
    </div>
  );
}
