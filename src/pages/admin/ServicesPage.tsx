import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useServices, type Service } from '@/hooks/queries/useServices';
import {
  useCreateService, useUpdateService, useDeleteService,
} from '@/hooks/mutations/useServiceMutations';

type FormState = {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

const EMPTY: FormState = { name: '', description: '', duration_minutes: 30, price: 0, active: true };

export default function ServicesPage() {
  const { data: services = [], isLoading } = useServices({ onlyActive: false });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: Number(s.price),
      active: s.active,
    });
    setErrors({});
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (form.duration_minutes < 1) errs.duration_minutes = 'Duração inválida';
    if (form.price < 0) errs.price = 'Preço inválido';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: form.duration_minutes,
      price: form.price,
      active: form.active,
    };
    try {
      if (editing) {
        await updateService.mutateAsync({ id: editing.id, patch: payload });
      } else {
        await createService.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch {
      /* hook mostra toast */
    }
  };

  const toggleActive = (s: Service) => {
    updateService.mutate({ id: s.id, patch: { active: !s.active } });
  };

  const confirmDelete = () => {
    if (toDelete) deleteService.mutate(toDelete.id);
    setDeleteOpen(false);
    setToDelete(null);
  };

  const isSaving = createService.isPending || updateService.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Scissors className="w-7 h-7 text-primary" />
            Serviços
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os serviços oferecidos</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" />
          Novo serviço
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader />
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Duração (min)</TableHead>
                  <TableHead>Preço (R$)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum serviço ainda, cadastre o primeiro!
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{s.duration_minutes}</TableCell>
                      <TableCell>R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                          <Badge className={s.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                            {s.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => { setToDelete(s); setDeleteOpen(true); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize os dados do serviço.' : 'Cadastre um novo serviço.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="srv-name">Nome *</Label>
              <Input
                id="srv-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Corte masculino"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="srv-desc">Descrição</Label>
              <Textarea
                id="srv-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do serviço (opcional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="srv-duration">Duração (minutos) *</Label>
                <Input
                  id="srv-duration"
                  type="number"
                  min="1"
                  value={form.duration_minutes || ''}
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                  className={errors.duration_minutes ? 'border-destructive' : ''}
                />
                {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="srv-price">Preço (R$) *</Label>
                <Input
                  id="srv-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className={errors.price ? 'border-destructive' : ''}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="srv-active">Serviço ativo</Label>
                <p className="text-xs text-muted-foreground">Disponível para agendamento</p>
              </div>
              <Switch
                id="srv-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={isSaving}>
                {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Serviço"
        description={`Tem certeza que deseja excluir "${toDelete?.name}"?`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}