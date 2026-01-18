import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Procedure } from '@/lib/store';

interface ProcedureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Procedure | null;
  onSave: (procedure: Omit<Procedure, 'id'> & { id?: string }) => void;
}

export function ProcedureModal({ 
  open, 
  onOpenChange, 
  procedure, 
  onSave,
}: ProcedureModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    returnDays: 30,
    price: 0,
    category: '',
    active: true,
  });

  const isEditing = !!procedure;

  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name,
        duration: procedure.duration,
        returnDays: procedure.returnDays,
        price: procedure.price,
        category: procedure.category || '',
        active: procedure.active,
      });
    } else {
      setFormData({
        name: '',
        duration: 60,
        returnDays: 30,
        price: 0,
        category: '',
        active: true,
      });
    }
  }, [procedure, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: procedure?.id,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do procedimento.'
              : 'Preencha os dados do novo procedimento.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do procedimento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Limpeza de pele"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Facial, Corporal, Capilar"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (min) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="returnDays">Dias para retorno *</Label>
              <Input
                id="returnDays"
                type="number"
                min={1}
                value={formData.returnDays}
                onChange={(e) => setFormData({ ...formData, returnDays: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                O sistema irá alertar quando o cliente deve retornar após este período.
              </p>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Procedimento ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Procedimentos inativos não aparecem na agenda
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white">
              {isEditing ? 'Salvar' : 'Criar Procedimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
