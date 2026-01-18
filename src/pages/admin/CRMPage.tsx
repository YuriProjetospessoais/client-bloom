import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Phone, Mail, Calendar, GripVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LeadModal } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { handleCall, handleEmail } from '@/lib/actions';
import { leadsStore, Lead } from '@/lib/store';
import { toast } from 'sonner';

const stages = [
  { id: 'new', title: 'Novos', color: 'bg-blue-500' },
  { id: 'contact', title: 'Contato', color: 'bg-yellow-500' },
  { id: 'proposal', title: 'Proposta', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'closed', title: 'Fechado', color: 'bg-green-500' },
];

export default function CRMPage() {
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Load leads from localStorage on mount
  useEffect(() => {
    const grouped = leadsStore.getByStage();
    setLeads(grouped);
  }, []);

  const handleNewLead = () => {
    setSelectedLead(null);
    setLeadModalOpen(true);
  };

  const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastContact'> & { id?: string }) => {
    if (leadData.id) {
      leadsStore.update(leadData.id, leadData);
      toast.success('Lead atualizado com sucesso!');
    } else {
      leadsStore.create(leadData);
      toast.success('Lead criado com sucesso!');
    }
    setLeads(leadsStore.getByStage());
  };

  const handleScheduleForLead = (lead: Lead) => {
    setSelectedLead(lead);
    setAppointmentModalOpen(true);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    // Get the lead being moved
    const lead = leads[sourceStage]?.find(l => l.id === draggableId);
    if (!lead) return;

    // Create new leads state
    const newLeads = { ...leads };
    
    // Remove from source
    newLeads[sourceStage] = newLeads[sourceStage].filter(l => l.id !== draggableId);
    
    // Add to destination
    const updatedLead = { ...lead, stage: destStage as Lead['stage'] };
    newLeads[destStage] = [...(newLeads[destStage] || [])];
    newLeads[destStage].splice(destination.index, 0, updatedLead);

    // Update state
    setLeads(newLeads);

    // Persist to localStorage
    const allLeads = Object.values(newLeads).flat();
    leadsStore.saveAll(allLeads);

    toast.success(`Lead movido para ${stages.find(s => s.id === destStage)?.title}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.crm}</h1>
          <p className="text-muted-foreground mt-1">Pipeline de vendas - arraste os cards para mover entre estágios</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewLead}>
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
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
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {leads[stage.id]?.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-background/50 border-border/50 hover:border-primary/30 transition-all ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-medium text-foreground">{lead.name}</h4>
                                  </div>
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(!leads[stage.id] || leads[stage.id].length === 0) && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Arraste leads para cá
                        </div>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

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
    </div>
  );
}
