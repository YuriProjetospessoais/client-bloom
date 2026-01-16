import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Plus, MoreHorizontal, Phone, Mail, UserPlus, Calendar, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadModal, Lead } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { handleCall, handleEmail } from '@/lib/actions';
import { createId } from '@/lib/mock/utils';

const initialLeads = [
  { id: '1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-1111', source: 'Instagram', stage: 'new', assignedTo: 'João', createdAt: '2026-01-15', value: 'R$ 500', lastContact: 'Hoje' },
  { id: '2', name: 'Carlos Santos', email: 'carlos@email.com', phone: '(11) 99999-2222', source: 'Indicação', stage: 'contact', assignedTo: 'Ana', createdAt: '2026-01-14', value: 'R$ 800', lastContact: 'Ontem' },
  { id: '3', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-3333', source: 'Google', stage: 'proposal', assignedTo: 'João', createdAt: '2026-01-13', value: 'R$ 1200', lastContact: '2 dias' },
  { id: '4', name: 'Roberto Alves', email: 'roberto@email.com', phone: '(11) 99999-4444', source: 'Facebook', stage: 'negotiation', assignedTo: 'Maria', createdAt: '2026-01-12', value: 'R$ 2000', lastContact: '3 dias' },
  { id: '5', name: 'Patricia Lima', email: 'patricia@email.com', phone: '(11) 99999-5555', source: 'Site', stage: 'closed', assignedTo: 'Ana', createdAt: '2026-01-10', value: 'R$ 1500', lastContact: '5 dias' },
];

export default function LeadsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; class: string }> = {
      new: { label: 'Novo', class: 'bg-blue-500/20 text-blue-500' },
      contact: { label: 'Contato', class: 'bg-yellow-500/20 text-yellow-500' },
      proposal: { label: 'Proposta', class: 'bg-purple-500/20 text-purple-500' },
      negotiation: { label: 'Negociação', class: 'bg-orange-500/20 text-orange-500' },
      closed: { label: 'Fechado', class: 'bg-green-500/20 text-green-500' },
    };
    const s = stages[stage] || stages.new;
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadModalOpen(true);
  };

  const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastContact'> & { id?: string }) => {
    if (leadData.id) {
      setLeads(leads.map(l => l.id === leadData.id ? { ...l, ...leadData } : l));
    } else {
      const newLead: Lead = {
        ...leadData,
        id: createId('lead'),
        createdAt: new Date().toISOString().split('T')[0],
        lastContact: 'Agora',
      };
      setLeads([newLead, ...leads]);
    }
  };

  const handleSchedule = (lead: Lead) => {
    setSelectedLead(lead);
    setAppointmentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.leads}</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os leads da sua empresa</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewLead}>
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estágios</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contact">Contato</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Lead</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{lead.source}</TableCell>
                    <TableCell>{getStageBadge(lead.stage)}</TableCell>
                    <TableCell className="text-foreground">{lead.assignedTo}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditLead(lead)}>
                            <Edit className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleCall(lead.phone, lead.name)}>
                            <Phone className="w-4 h-4" /> Ligar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEmail(lead.email, `Contato - ${lead.name}`, lead.name)}>
                            <Mail className="w-4 h-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleSchedule(lead)}>
                            <Calendar className="w-4 h-4" /> Agendar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
