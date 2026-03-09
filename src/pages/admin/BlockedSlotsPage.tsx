import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ban, Plus, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { BlockTimeModal } from '@/components/modals/BlockTimeModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

interface BlockedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  professional_id: string;
  professionalName: string;
}

interface Professional {
  id: string;
  name: string;
}

export default function BlockedSlotsPage() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlockedSlot | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Get company_id
      const { data: role } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role?.company_id) return;
      setCompanyId(role.company_id);

      // Fetch professionals and blocked slots in parallel
      const [prosRes, blockedRes] = await Promise.all([
        supabase
          .from('professionals')
          .select('id, name')
          .eq('company_id', role.company_id)
          .eq('active', true)
          .order('name'),
        supabase
          .from('blocked_slots')
          .select('id, date, start_time, end_time, reason, professional_id')
          .eq('company_id', role.company_id)
          .gte('date', format(new Date(), 'yyyy-MM-dd'))
          .order('date', { ascending: true })
          .order('start_time', { ascending: true }),
      ]);

      const pros = prosRes.data || [];
      setProfessionals(pros);

      const prosMap = new Map(pros.map((p) => [p.id, p.name]));
      setBlocked(
        (blockedRes.data || []).map((b) => ({
          ...b,
          professionalName: prosMap.get(b.professional_id) || 'Desconhecido',
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('blocked_slots').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Bloqueio removido!');
      setBlocked((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bloqueio de Horários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os períodos bloqueados na agenda dos barbeiros
          </p>
        </div>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Bloquear Horário
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Horários Bloqueados ({blocked.length})
          </CardTitle>
          <CardDescription>
            Horários bloqueados não ficam disponíveis para agendamento pelo portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : blocked.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ban className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum horário bloqueado no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocked.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-destructive/10 text-destructive">
                      <span className="text-sm font-bold">{block.start_time.slice(0, 5)}</span>
                      <span className="text-[10px]">{block.end_time.slice(0, 5)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-foreground">{block.professionalName}</p>
                        <Badge variant="outline" className="text-[10px]">Barbeiro</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(block.date + 'T00:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </span>
                        {block.reason && (
                          <span className="flex items-center gap-1">
                            • {block.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(block)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Time Modal */}
      {companyId && (
        <BlockTimeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          companyId={companyId}
          professionals={professionals}
          onSaved={fetchData}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remover Bloqueio"
        description={`Deseja remover o bloqueio de ${deleteTarget?.start_time.slice(0, 5)} - ${deleteTarget?.end_time.slice(0, 5)} em ${deleteTarget ? format(new Date(deleteTarget.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : ''} para ${deleteTarget?.professionalName}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
