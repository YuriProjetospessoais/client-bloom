import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  plan: z.string().min(1, 'Selecione um plano'),
  adminEmail: z.string().trim().email('Email inválido'),
  adminName: z.string().trim().min(2, 'Nome do admin obrigatório'),
});

export interface Company {
  id: number;
  name: string;
  plan: string;
  users: number;
  maxUsers: number;
  status: string;
  createdAt: string;
}

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSave: (company: Partial<Company> & { adminEmail?: string; adminName?: string }) => void;
}

const plans = ['Starter', 'Professional', 'Enterprise'];
const maxUsersByPlan: Record<string, number> = {
  Starter: 5,
  Professional: 15,
  Enterprise: 50,
};

export function CompanyModal({ open, onOpenChange, company, onSave }: CompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    plan: '',
    adminEmail: '',
    adminName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        plan: company.plan,
        adminEmail: '',
        adminName: '',
      });
    } else {
      setFormData({ name: '', plan: '', adminEmail: '', adminName: '' });
    }
    setErrors({});
  }, [company, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // For editing, admin fields are optional
    const schemaToUse = company 
      ? companySchema.omit({ adminEmail: true, adminName: true }).extend({
          adminEmail: z.string().optional(),
          adminName: z.string().optional(),
        })
      : companySchema;

    const result = schemaToUse.safeParse(formData);
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

    onSave({
      id: company?.id,
      name: formData.name,
      plan: formData.plan,
      users: company?.users || 1,
      maxUsers: maxUsersByPlan[formData.plan] || 5,
      status: company?.status || 'active',
      createdAt: company?.createdAt || new Date().toISOString().split('T')[0],
      adminEmail: formData.adminEmail || undefined,
      adminName: formData.adminName || undefined,
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success(company ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          <DialogDescription>
            {company ? 'Atualize as informações da empresa.' : 'Cadastre uma nova empresa no sistema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da empresa"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plano *</Label>
            <Select value={formData.plan} onValueChange={(v) => setFormData({ ...formData, plan: v })}>
              <SelectTrigger className={errors.plan ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p} (até {maxUsersByPlan[p]} usuários)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.plan && <p className="text-sm text-destructive">{errors.plan}</p>}
          </div>

          {!company && (
            <>
              <div className="space-y-2">
                <Label htmlFor="adminName">Nome do Administrador *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Nome do admin"
                  className={errors.adminName ? 'border-destructive' : ''}
                />
                {errors.adminName && <p className="text-sm text-destructive">{errors.adminName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email do Administrador *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@empresa.com"
                  className={errors.adminEmail ? 'border-destructive' : ''}
                />
                {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail}</p>}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : company ? 'Salvar' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
