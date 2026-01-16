import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { z } from 'zod';

const planSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50),
  price: z.string().min(1, 'Preço obrigatório'),
  maxUsers: z.number().min(1, 'Mínimo 1 usuário').max(1000),
  description: z.string().max(200).optional(),
  features: z.string().max(500),
});

export interface Plan {
  id: number;
  name: string;
  price: string;
  period: string;
  description: string;
  maxUsers: number;
  features: string[];
  companies: number;
  popular?: boolean;
  color: string;
}

interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
  onSave: (plan: Partial<Plan>) => void;
}

export function PlanModal({ open, onOpenChange, plan, onSave }: PlanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    maxUsers: 5,
    description: '',
    features: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: plan.price.replace('R$ ', '').replace('/mês', ''),
        maxUsers: plan.maxUsers,
        description: plan.description,
        features: plan.features.join('\n'),
      });
    } else {
      setFormData({ name: '', price: '', maxUsers: 5, description: '', features: '' });
    }
    setErrors({});
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = planSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const featuresArray = formData.features.split('\n').filter(f => f.trim());

    onSave({
      id: plan?.id,
      name: formData.name,
      price: `R$ ${formData.price}`,
      period: '/mês',
      description: formData.description,
      maxUsers: formData.maxUsers,
      features: featuresArray,
      companies: plan?.companies || 0,
      color: plan?.color || 'from-blue-500 to-blue-600',
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success(plan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <DialogDescription>
            {plan ? 'Atualize as informações do plano.' : 'Configure um novo plano de assinatura.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Professional"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="197"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Máx. Usuários *</Label>
              <Input
                id="maxUsers"
                type="number"
                min={1}
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                className={errors.maxUsers ? 'border-destructive' : ''}
              />
              {errors.maxUsers && <p className="text-sm text-destructive">{errors.maxUsers}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ideal para..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Recursos (um por linha) *</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="CRM completo&#10;Agendamento&#10;Relatórios"
              rows={5}
              className={errors.features ? 'border-destructive' : ''}
            />
            {errors.features && <p className="text-sm text-destructive">{errors.features}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : plan ? 'Salvar' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
