import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Phone, Mail, MessageCircle, Edit, Trash2, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LeadModal } from '@/components/modals/LeadModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { handleCall, handleEmail, handleWhatsApp } from '@/lib/actions';
import { useOpportunities, type Opportunity } from '@/hooks/queries/useOpportunities';
import { useUpdateOpportunity, useDeleteOpportunity } from '@/hooks/mutations/useOpportunityMutations';

const stages: { id: Opportunity['status']; title: string; color: string }[] = [
  { id: 'lead', title: 'Lead', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contatado', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Qualificado', color: 'bg-purple-500' },
  { id: 'won', title: 'Ganho', color: 'bg-green-500' },
  { id: 'lost', title: 'Perdido', color: 'bg-gray-500' },
];

export default function CRMPage() {
  const { t } = useLanguage();
  const { data: items = [] } = useOpportunities();
  const update = useUpdateOpportunity();
  const del = useDeleteOpportunity();

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Opportunity | null>(null);

  const grouped = stages.reduce<Record<string, Opportunity[]>>((acc, s) => {
    acc[s.id] = items.filter(i => i.status === s.id);
    return acc;
  }, {});

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId as Opportunity['status'];
    await update.mutateAsync({ id: draggableId, patch: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.crm}</h1>
          <p className="text-muted-foreground mt-1">Pipeline de oportunidades</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nova Oportunidade
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
                    <Badge variant="secondary" className="text-xs">{grouped[stage.id]?.length || 0}</Badge>
                  </div>
                </CardHeader>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <CardContent ref={provided.innerRef} {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}>
                      {grouped[stage.id]?.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(p, s) => (
                            <Card ref={p.innerRef} {...p.draggableProps}
                              className={`bg-background/50 border-border/50 hover:border-primary/30 transition-all ${
                                s.isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''
                              }`}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div {...p.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-medium text-foreground text-sm truncate">{opp.title}</h4>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => { setSelected(opp); setModalOpen(true); }}>
                                        <Edit className="w-4 h-4" /> Editar
                                      </DropdownMenuItem>
                                      {opp.contact_phone && (
                                        <>
                                          <DropdownMenuItem className="gap-2" onClick={() => handleCall(opp.contact_phone!, opp.contact_name ?? undefined)}>
                                            <Phone className="w-4 h-4" /> Ligar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="gap-2" onClick={() => handleWhatsApp(opp.contact_phone!, undefined, opp.contact_name ?? undefined)}>
                                            <MessageCircle className="w-4 h-4" /> WhatsApp
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {opp.contact_email && (
                                        <DropdownMenuItem className="gap-2" onClick={() => handleEmail(opp.contact_email!, `Contato`, opp.contact_name ?? undefined)}>
                                          <Mail className="w-4 h-4" /> Email
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => { setToDelete(opp); setDelOpen(true); }}>
                                        <Trash2 className="w-4 h-4" /> Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                {opp.contact_name && <p className="text-xs text-muted-foreground">{opp.contact_name}</p>}
                                <div className="flex items-center justify-between text-sm mt-2">
                                  <span className="font-semibold text-primary">R$ {Number(opp.estimated_value ?? 0).toFixed(2)}</span>
                                  {opp.contact_phone && <span className="text-muted-foreground text-xs">{opp.contact_phone}</span>}
                                </div>
                                {opp.next_action_at && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Próx: {new Date(opp.next_action_at).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(!grouped[stage.id] || grouped[stage.id].length === 0) && (
                        <div className="text-center py-8 text-muted-foreground text-sm">Arraste cards para cá</div>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

      <LeadModal open={modalOpen} onOpenChange={setModalOpen} opportunity={selected} />

      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen}
        title="Excluir oportunidade"
        description={`Excluir "${toDelete?.title}"?`}
        onConfirm={async () => { if (toDelete) { await del.mutateAsync(toDelete.id); setDelOpen(false); setToDelete(null); } }}
        confirmLabel="Excluir" variant="destructive" />
    </div>
  );
}
