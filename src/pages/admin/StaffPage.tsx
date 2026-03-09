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
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Plus, Edit, UserX, UserCheck, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  banned: boolean;
}

export default function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  // Deactivate/activate confirm
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<StaffMember | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke('manage-staff', {
        body: { action: 'list' },
      });

      if (res.error) throw res.error;
      setStaff(res.data?.staff || []);
    } catch (err: any) {
      toast.error('Erro ao carregar equipe: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleNewStaff = () => {
    setEditing(null);
    setFormData({ name: '', email: '', password: '' });
    setModalOpen(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditing(member);
    setFormData({ name: member.name, email: member.email, password: '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const body: Record<string, string> = { action: 'update', userId: editing.id };
        if (formData.name !== editing.name) body.name = formData.name;
        if (formData.email !== editing.email) body.email = formData.email;
        if (formData.password) body.password = formData.password;

        const res = await supabase.functions.invoke('manage-staff', { body });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success('Secretária atualizada com sucesso!');
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
          setSaving(false);
          return;
        }

        const res = await supabase.functions.invoke('manage-staff', {
          body: { action: 'create', ...formData },
        });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success('Secretária criada com sucesso!');
      }

      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (member: StaffMember) => {
    setToggleTarget(member);
    setToggleConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      const action = toggleTarget.banned ? 'activate' : 'deactivate';
      const res = await supabase.functions.invoke('manage-staff', {
        body: { action, userId: toggleTarget.id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success(toggleTarget.banned ? 'Conta reativada!' : 'Conta desativada!');
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    } finally {
      setToggleConfirmOpen(false);
      setToggleTarget(null);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as secretárias e recepcionistas do seu estabelecimento
          </p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewStaff}>
          <Plus className="w-4 h-4" />
          Nova Secretária
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Secretárias ({staff.length})
              </CardTitle>
              <CardDescription>
                Secretárias podem visualizar e gerenciar agendamentos e clientes
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
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
              {staff.length === 0
                ? 'Nenhuma secretária cadastrada. Clique em "Nova Secretária" para começar.'
                : 'Nenhum resultado encontrado.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-500/20 text-blue-500">Secretária</Badge>
                    <Badge
                      className={
                        member.banned
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }
                    >
                      {member.banned ? 'Inativa' : 'Ativa'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEditStaff(member)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={member.banned ? 'text-emerald-500' : 'text-destructive'}
                      onClick={() => handleToggleClick(member)}
                    >
                      {member.banned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Secretária' : 'Nova Secretária'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações da conta. Deixe a senha em branco para manter a atual.'
                : 'Crie uma conta de secretária para o seu estabelecimento.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-name">Nome completo *</Label>
                <Input
                  id="staff-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-email">E-mail *</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: maria@empresa.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-password">
                  {editing ? 'Nova Senha (opcional)' : 'Senha *'}
                </Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                  required={!editing}
                  minLength={editing ? undefined : 6}
                />
              </div>
              <div className="grid gap-2">
                <Label>Função</Label>
                <Input value="Secretária" disabled className="bg-muted" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Conta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Confirm */}
      <ConfirmDialog
        open={toggleConfirmOpen}
        onOpenChange={setToggleConfirmOpen}
        title={toggleTarget?.banned ? 'Reativar Conta' : 'Desativar Conta'}
        description={
          toggleTarget?.banned
            ? `Tem certeza que deseja reativar a conta de "${toggleTarget?.name}"? Ela poderá fazer login novamente.`
            : `Tem certeza que deseja desativar a conta de "${toggleTarget?.name}"? Ela não conseguirá fazer login.`
        }
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
