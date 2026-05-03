import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MoreHorizontal, Phone, Mail, MessageCircle, UserPlus, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadModal } from '@/components/modals/LeadModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { handleCall, handleEmail, handleWhatsApp } from '@/lib/actions';
import { useOpportunities, type Opportunity } from '@/hooks/queries/useOpportunities';
import { useDeleteOpportunity } from '@/hooks/mutations/useOpportunityMutations';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  lead: { label: 'Lead', cls: 'bg-blue-500/20 text-blue-500' },
  contacted: { label: 'Contatado', cls: 'bg-yellow-500/20 text-yellow-600' },
  qualified: { label: 'Qualificado', cls: 'bg-purple-500/20 text-purple-500' },
  won: { label: 'Ganho', cls: 'bg-green-500/20 text-green-500' },
  lost: { label: 'Perdido', cls: 'bg-gray-500/20 text-gray-500' },
};

export default function LeadsPage() {
  const { t } = useLanguage();
  const { data: items = [] } = useOpportunities();
  const del = useDeleteOpportunity();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | Opportunity['status']>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Opportunity | null>(null);

  const filtered = useMemo(() => {
    return items.filter(o => {
      const q = search.toLowerCase();
      const matches = !q ||
        o.title.toLowerCase().includes(q) ||
        (o.contact_name ?? '').toLowerCase().includes(q) ||
        (o.contact_phone ?? '').includes(q);
      const matchStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'open'
          ? (o.status === 'lead' || o.status === 'contacted')
          : o.status === statusFilter;
      return matches && matchStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.leads}</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas oportunidades</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nova Oportunidade
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abertas (Lead/Contatado)</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
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
                  <TableHead>Oportunidade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.lead;
                  return (
                    <TableRow key={o.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{o.title}</p>
                            <p className="text-sm text-muted-foreground">{o.contact_name ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{o.source ?? '—'}</TableCell>
                      <TableCell className="font-medium text-primary">R$ {Number(o.estimated_value ?? 0).toFixed(2)}</TableCell>
                      <TableCell><Badge className={s.cls}>{s.label}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => { setSelected(o); setModalOpen(true); }}>
                              <Edit className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            {o.contact_phone && (
                              <>
                                <DropdownMenuItem className="gap-2" onClick={() => handleCall(o.contact_phone!, o.contact_name ?? undefined)}>
                                  <Phone className="w-4 h-4" /> Ligar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2" onClick={() => handleWhatsApp(o.contact_phone!, undefined, o.contact_name ?? undefined)}>
                                  <MessageCircle className="w-4 h-4" /> WhatsApp
                                </DropdownMenuItem>
                              </>
                            )}
                            {o.contact_email && (
                              <DropdownMenuItem className="gap-2" onClick={() => handleEmail(o.contact_email!, 'Contato', o.contact_name ?? undefined)}>
                                <Mail className="w-4 h-4" /> Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => { setToDelete(o); setDelOpen(true); }}>
                              <Trash2 className="w-4 h-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma oportunidade encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LeadModal open={modalOpen} onOpenChange={setModalOpen} opportunity={selected} />
      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen}
        title="Excluir oportunidade" description={`Excluir "${toDelete?.title}"?`}
        onConfirm={async () => { if (toDelete) { await del.mutateAsync(toDelete.id); setDelOpen(false); setToDelete(null); } }}
        confirmLabel="Excluir" variant="destructive" />
    </div>
  );
}
