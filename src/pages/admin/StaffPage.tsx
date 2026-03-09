import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Plus, Edit, UserX, UserCheck, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'secretary' | 'employee';
  createdAt: string;
  banned: boolean;
  specialties: string[];
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'secretary' | 'employee'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'secretary' as 'secretary' | 'employee',
    specialties: '',
  });
  const [saving, setSaving] = useState(false);

  // Toggle confirm
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

  const handleNew = () => {
    setEditing(null);
    setFormData({ name: '', email: '', password: '', role: 'secretary', specialties: '' });
    setModalOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setEditing(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      specialties: member.specialties.join(', '),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const specialties = formData.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editing) {
        const body: Record<string, unknown> = { action: 'update', userId: editing.id };
        if (formData.name !== editing.name) body.name = formData.name;
        if (formData.email !== editing.email) body.email = formData.email;
        if (formData.password) body.password = formData.password;
        if (editing.role === 'employee') body.specialties = specialties;

        const res = await supabase.functions.invoke('manage-staff', { body });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success('Colaborador atualizado com sucesso!');
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
          setSaving(false);
          return;
        }

        const res = await supabase.functions.invoke('manage-staff', {
          body: {
            action: 'create',
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            specialties: formData.role === 'employee' ? specialties : undefined,
          },
        });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success(
          formData.role === 'employee'
            ? 'Barbeiro criado com sucesso! Perfil profissional vinculado automaticamente.'
            : 'Secretária criada com sucesso!'
        );
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

  const getRoleLabel = (role: string) => (role === 'employee' ? 'Barbeiro' : 'Secretária');
  const getRoleBadgeClass = (role: string) =>
    role === 'employee' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500';

  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie secretárias e barbeiros do seu estabelecimento
          </p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNew}>
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Equipe ({staff.length})
              </CardTitle>
              <CardDescription>
                Secretárias gerenciam agendamentos. Barbeiros visualizam apenas seus próprios.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filterRole}
                onValueChange={(v) => setFilterRole(v as typeof filterRole)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="secretary">Secretárias</SelectItem>
                  <SelectItem value="employee">Barbeiros</SelectItem>
                </SelectContent>
              </Select>
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
                ? 'Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para começar.'
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
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                        {member.specialties.length > 0 && ` • ${member.specialties.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleBadgeClass(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    <Badge
                      className={
                        member.banned
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }
                    >
                      {member.banned ? 'Inativo' : 'Ativo'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
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
            <DialogTitle>{editing ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações. Deixe a senha em branco para manter a atual.'
                : 'Crie uma conta de acesso para um membro da equipe.'}
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
                <Label>Função *</Label>
                {editing ? (
                  <Input
                    value={getRoleLabel(formData.role)}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      setFormData({ ...formData, role: v as 'secretary' | 'employee' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secretary">Secretária</SelectItem>
                      <SelectItem value="employee">Barbeiro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {formData.role === 'employee' && (
                <div className="grid gap-2">
                  <Label htmlFor="staff-specialties">Especialidades</Label>
                  <Input
                    id="staff-specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Ex: Corte, Barba, Pigmentação (separado por vírgula)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Um perfil de barbeiro será criado automaticamente ao salvar.
                  </p>
                </div>
              )}
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
            ? `Deseja reativar "${toggleTarget?.name}"? Ele(a) poderá fazer login novamente.`
            : `Deseja desativar "${toggleTarget?.name}"? Ele(a) não conseguirá fazer login.`
        }
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
