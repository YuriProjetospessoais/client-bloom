import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTenant } from '@/lib/tenant/TenantContext';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  RotateCcw,
  Phone,
  MessageSquare,
  Copy,
  ExternalLink,
  Clock,
  Scissors,
  Search,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnCandidate {
  clientId: string;
  clientName: string;
  phone: string | null;
  lastVisitDate: string;
  daysSinceVisit: number;
  lastServiceName: string;
}

export default function CustomerReturnReminders() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [candidates, setCandidates] = useState<ReturnCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  // Message modal
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [msgTarget, setMsgTarget] = useState<ReturnCandidate | null>(null);

  const companyId = tenant?.id;
  const tenantColor = tenant?.primaryColor || 'hsl(var(--primary))';

  const fetchCandidates = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    try {
      // Get all active clients for this company
      const { data: clients, error: clientsErr } = await supabase
        .from('clients')
        .select('id, name, phone')
        .eq('company_id', companyId)
        .eq('active', true);

      if (clientsErr || !clients || clients.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      // For each client, get their most recent completed appointment
      const clientIds = clients.map((c) => c.id);

      const { data: appointments, error: aptsErr } = await supabase
        .from('appointments')
        .select(`
          client_id,
          date,
          services!appointments_service_id_fkey(name)
        `)
        .eq('company_id', companyId)
        .in('client_id', clientIds)
        .in('status', ['completed', 'confirmed', 'scheduled'])
        .order('date', { ascending: false });

      if (aptsErr) throw aptsErr;

      // Group by client, get most recent
      const latestByClient = new Map<string, { date: string; serviceName: string }>();
      for (const apt of appointments || []) {
        if (!latestByClient.has(apt.client_id)) {
          latestByClient.set(apt.client_id, {
            date: apt.date,
            serviceName: (apt.services as any)?.name || 'Serviço',
          });
        }
      }

      const now = new Date();
      const results: ReturnCandidate[] = [];

      for (const client of clients) {
        const latest = latestByClient.get(client.id);
        if (!latest) continue; // No history, skip

        const lastDate = new Date(latest.date + 'T00:00:00');
        const days = differenceInDays(now, lastDate);

        if (days >= daysThreshold) {
          results.push({
            clientId: client.id,
            clientName: client.name,
            phone: client.phone,
            lastVisitDate: latest.date,
            daysSinceVisit: days,
            lastServiceName: latest.serviceName,
          });
        }
      }

      // Sort by most days since visit
      results.sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);
      setCandidates(results);
    } catch (err) {
      console.error('Error fetching return candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, daysThreshold]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const getBookingLink = () => {
    const slug = tenant?.slug;
    if (!slug) return '';
    return `${window.location.origin}/${slug}/agendar`;
  };

  const buildMessage = (candidate: ReturnCandidate) => {
    const barbershopName = tenant?.name || 'nossa barbearia';
    const bookingLink = getBookingLink();
    return `Olá ${candidate.clientName}! Já faz um tempo desde seu último corte na ${barbershopName}. Se quiser garantir seu horário, pode agendar aqui: ${bookingLink}`;
  };

  const handleCopyMessage = (candidate: ReturnCandidate) => {
    const msg = buildMessage(candidate);
    navigator.clipboard.writeText(msg);
    toast.success('Mensagem copiada!');
  };

  const handleOpenWhatsApp = (candidate: ReturnCandidate) => {
    if (!candidate.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }
    const msg = buildMessage(candidate);
    // Clean phone: keep only digits
    const cleanPhone = candidate.phone.replace(/\D/g, '');
    // Add Brazil country code if not present
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const openMsgModal = (candidate: ReturnCandidate) => {
    setMsgTarget(candidate);
    setMsgModalOpen(true);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const filtered = candidates.filter(
    (c) => c.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const getDaysBadgeColor = (days: number) => {
    if (days >= 90) return 'bg-destructive/20 text-destructive';
    if (days >= 60) return 'bg-amber-500/20 text-amber-600';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Clientes que podem voltar
          </h1>
          <p className="text-muted-foreground mt-1">
            Clientes sem agendamento há {daysThreshold}+ dias
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-4 w-4" />
          Configurar
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="days-threshold">Dias sem visita (mínimo)</Label>
                <Input
                  id="days-threshold"
                  type="number"
                  value={daysThreshold}
                  onChange={(e) => setDaysThreshold(Math.max(1, parseInt(e.target.value) || 30))}
                  className="w-32"
                  min={1}
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchCandidates}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" style={{ color: tenantColor }} />
                {loading ? 'Carregando...' : `${candidates.length} cliente${candidates.length !== 1 ? 's' : ''}`}
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para trazer esses clientes de volta
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>
                {candidates.length === 0
                  ? `Nenhum cliente sem visita há mais de ${daysThreshold} dias. Ótimo!`
                  : 'Nenhum resultado encontrado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((candidate) => (
                <div
                  key={candidate.clientId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(candidate.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{candidate.clientName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {candidate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {candidate.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {candidate.lastServiceName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(candidate.lastVisitDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                    <Badge className={cn('text-xs', getDaysBadgeColor(candidate.daysSinceVisit))}>
                      {candidate.daysSinceVisit} dias
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openMsgModal(candidate)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Mensagem</span>
                    </Button>
                    {candidate.phone && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-white"
                        style={{ backgroundColor: '#25D366' }}
                        onClick={() => handleOpenWhatsApp(candidate)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Preview Modal */}
      <Dialog open={msgModalOpen} onOpenChange={setMsgModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: tenantColor }} />
              Mensagem para {msgTarget?.clientName}
            </DialogTitle>
            <DialogDescription>
              Copie a mensagem ou envie diretamente pelo WhatsApp
            </DialogDescription>
          </DialogHeader>
          {msgTarget && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {buildMessage(msgTarget)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    handleCopyMessage(msgTarget);
                    setMsgModalOpen(false);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar mensagem
                </Button>
                {msgTarget.phone && (
                  <Button
                    className="flex-1 gap-2 text-white"
                    style={{ backgroundColor: '#25D366' }}
                    onClick={() => {
                      handleOpenWhatsApp(msgTarget);
                      setMsgModalOpen(false);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
