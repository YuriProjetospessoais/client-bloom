import { useState, useEffect } from 'react';
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
import { Search, Plus, MoreHorizontal, Phone, Mail, UserPlus, Calendar, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadModal } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { handleCall, handleEmail } from '@/lib/actions';
import { leadsStore, Lead } from '@/lib/store';
import { toast } from 'sonner';

export default function LeadsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    setLeads(leadsStore.getAll());
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; class: string }> = {
      new: { label: 'Novo', class: 'bg-blue-500/20 text-blue-500' },
      contact: { label: 'Contato', class: 'bg-yellow-500/20 text-yellow-600' },
      proposal: { label: 'Proposta', class: 'bg-purple-500/20 text-purple-500' },
      negotiation: { label: 'Negociação', class: 'bg-orange-500/20 text-orange-500' },
      closed: { label: 'Fechado', class: 'bg-green-500/20 text-green-500' },
      lost: { label: 'Perdido', class: 'bg-gray-500/20 text-gray-500' },
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

  const handleSaveLead = (leadData: any) => {
    if (leadData.id) {
      leadsStore.update(leadData.id, leadData);
      toast.success('Lead atualizado com sucesso!');
    } else {
      leadsStore.create(leadData);
      toast.success('Lead criado com sucesso!');
    }
    setLeads(leadsStore.getAll());
  };

  const handleSchedule = (lead: Lead) => {
    setSelectedLead(lead);
    setAppointmentModalOpen(true);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      leadsStore.delete(leadToDelete.id);
      setLeads(leadsStore.getAll());
      toast.success('Lead excluído com sucesso!');
    }
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
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
                <SelectItem value="lost">Perdido</SelectItem>
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead>Último Contato</TableHead>
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
                    <TableCell className="font-medium text-primary">{lead.value}</TableCell>
                    <TableCell>{getStageBadge(lead.stage)}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.lastContact}</TableCell>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteClick(lead)}>
                            <Trash2 className="w-4 h-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || stageFilter !== 'all' ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
                    </TableCell>
                  </TableRow>
                )}
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
        onSave={() => {
          setAppointmentModalOpen(false);
          toast.success('Agendamento criado!');
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir o lead "${leadToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
