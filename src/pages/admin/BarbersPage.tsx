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
import { Plus, Edit, UserX, UserCheck, Search, Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Barber {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  active: boolean;
  hasAccount: boolean;
  specialties: string[];
  avatarUrl: string | null;
  createdAt: string;
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', specialties: '' });
  const [saving, setSaving] = useState(false);

  // Toggle confirm
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Barber | null>(null);

  const fetchBarbers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('manage-barbers', {
        body: { action: 'list' },
      });
      if (res.error) throw res.error;
      setBarbers(res.data?.barbers || []);
    } catch (err: any) {
      toast.error('Erro ao carregar barbeiros: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const handleNew = () => {
    setEditing(null);
    setFormData({ name: '', email: '', password: '', specialties: '' });
    setModalOpen(true);
  };

  const handleEdit = (barber: Barber) => {
    setEditing(barber);
    setFormData({
      name: barber.name,
      email: barber.email,
      password: '',
      specialties: barber.specialties.join(', '),
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
        const body: Record<string, unknown> = {
          action: 'update',
          professionalId: editing.id,
          specialties,
        };
        if (formData.name !== editing.name) body.name = formData.name;
        if (formData.email !== editing.email) body.email = formData.email;
        if (formData.password) body.password = formData.password;

        const res = await supabase.functions.invoke('manage-barbers', { body });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success('Barbeiro atualizado com sucesso!');
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
          setSaving(false);
          return;
        }

        const res = await supabase.functions.invoke('manage-barbers', {
          body: { action: 'create', name: formData.name, email: formData.email, password: formData.password, specialties },
        });
        if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
        toast.success('Barbeiro criado com sucesso!');
      }

      setModalOpen(false);
      fetchBarbers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (barber: Barber) => {
    setToggleTarget(barber);
    setToggleConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      const action = toggleTarget.active ? 'deactivate' : 'activate';
      const res = await supabase.functions.invoke('manage-barbers', {
        body: { action, professionalId: toggleTarget.id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success(toggleTarget.active ? 'Barbeiro desativado!' : 'Barbeiro reativado!');
      fetchBarbers();
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    } finally {
      setToggleConfirmOpen(false);
      setToggleTarget(null);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const filtered = barbers.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Barbeiros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os barbeiros e suas contas de acesso
          </p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNew}>
          <Plus className="w-4 h-4" />
          Novo Barbeiro
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Barbeiros ({barbers.length})
              </CardTitle>
              <CardDescription>
                Barbeiros visualizam apenas seus próprios agendamentos
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
              {barbers.length === 0
                ? 'Nenhum barbeiro cadastrado. Clique em "Novo Barbeiro" para começar.'
                : 'Nenhum resultado encontrado.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((barber) => (
                <div
                  key={barber.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(barber.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{barber.name}</p>
                        {barber.hasAccount && (
                          <Badge variant="outline" className="text-[10px]">Login</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {barber.email || 'Sem conta vinculada'}
                        {barber.specialties.length > 0 && ` • ${barber.specialties.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/20 text-primary">Barbeiro</Badge>
                    <Badge
                      className={
                        barber.active
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-destructive/20 text-destructive'
                      }
                    >
                      {barber.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(barber)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={barber.active ? 'text-destructive' : 'text-emerald-500'}
                      onClick={() => handleToggleClick(barber)}
                    >
                      {barber.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
            <DialogTitle>{editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações. Deixe a senha em branco para manter a atual.'
                : 'Crie uma conta de barbeiro com acesso ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="barber-name">Nome completo *</Label>
                <Input
                  id="barber-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Oliveira"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barber-email">E-mail *</Label>
                <Input
                  id="barber-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: carlos@barbearia.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barber-password">
                  {editing ? 'Nova Senha (opcional)' : 'Senha *'}
                </Label>
                <Input
                  id="barber-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                  required={!editing}
                  minLength={editing ? undefined : 6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barber-specialties">Especialidades</Label>
                <Input
                  id="barber-specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Ex: Corte, Barba, Pigmentação (separado por vírgula)"
                />
              </div>
              <div className="grid gap-2">
                <Label>Função</Label>
                <Input value="Barbeiro" disabled className="bg-muted" />
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
        title={toggleTarget?.active ? 'Desativar Barbeiro' : 'Reativar Barbeiro'}
        description={
          toggleTarget?.active
            ? `Deseja desativar "${toggleTarget?.name}"? Ele não poderá fazer login e não aparecerá para agendamento.`
            : `Deseja reativar "${toggleTarget?.name}"? Ele poderá fazer login novamente.`
        }
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
