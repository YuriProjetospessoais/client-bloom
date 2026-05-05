import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MoreHorizontal, Phone, Mail, UserPlus, MessageCircle, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOpportunities } from '@/hooks/queries/useOpportunities';
import { handleCall, handleEmail, handleWhatsApp } from '@/lib/actions';

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  lead:       { label: 'Lead',        class: 'bg-blue-500/20 text-blue-500' },
  contacted:  { label: 'Contatado',   class: 'bg-yellow-500/20 text-yellow-500' },
  qualified:  { label: 'Qualificado', class: 'bg-purple-500/20 text-purple-500' },
  won:        { label: 'Ganho',       class: 'bg-green-500/20 text-green-500' },
  lost:       { label: 'Perdido',     class: 'bg-red-500/20 text-red-500' },
};

export default function UserLeadsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: opportunities = [], isLoading } = useOpportunities();

  const leads = useMemo(
    () => opportunities.filter(o => o.status === 'lead' || o.status === 'contacted'),
    [opportunities]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads.filter(l =>
      (l.contact_name ?? l.title).toLowerCase().includes(q) ||
      (l.contact_email ?? '').toLowerCase().includes(q)
    );
  }, [leads, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.leads}</h1>
          <p className="text-muted-foreground mt-1">Leads em aberto (somente leitura)</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lead em aberto.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Lead</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const name = lead.contact_name ?? lead.title;
                    const stage = STATUS_LABEL[lead.status] ?? STATUS_LABEL.lead;
                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserPlus className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{name}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact_email ?? '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{lead.source ?? '—'}</TableCell>
                        <TableCell><Badge className={stage.class}>{stage.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {lead.contact_phone && (
                                <>
                                  <DropdownMenuItem className="gap-2" onClick={() => handleCall(lead.contact_phone!, name)}>
                                    <Phone className="w-4 h-4" /> Ligar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2" onClick={() => handleWhatsApp(lead.contact_phone!, `Olá ${name}!`, name)}>
                                    <MessageCircle className="w-4 h-4" /> WhatsApp
                                  </DropdownMenuItem>
                                </>
                              )}
                              {lead.contact_email && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleEmail(lead.contact_email!, `Contato - ${name}`, name)}>
                                  <Mail className="w-4 h-4" /> Email
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
