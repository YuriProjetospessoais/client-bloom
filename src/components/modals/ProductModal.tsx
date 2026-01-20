import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { z } from 'zod';
import { Product, productsStore } from '@/lib/store';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  category: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  durationDays: z.number().min(1, 'Duração deve ser pelo menos 1 dia'),
});

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Partial<Product> & { name: string; category: string; price: number; durationDays: number }) => void;
}

const categories = [
  'Capilar',
  'Facial',
  'Corporal',
  'Proteção',
  'Maquiagem',
  'Tratamento',
  'Outros',
];

export function ProductModal({ open, onOpenChange, product, onSave }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    durationDays: 30,
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        durationDays: product.durationDays,
        active: product.active,
      });
    } else {
      setFormData({ name: '', category: '', price: 0, durationDays: 30, active: true });
    }
    setErrors({});
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    onSave({
      ...formData,
      id: product?.id,
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success(product ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            {product ? 'Atualize as informações do produto.' : 'Preencha os dados para cadastrar um novo produto.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Shampoo Profissional"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationDays">Duração Estimada (dias) *</Label>
            <Input
              id="durationDays"
              type="number"
              min="1"
              value={formData.durationDays || ''}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
              placeholder="30"
              className={errors.durationDays ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Tempo médio que o produto dura após a compra
            </p>
            {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays}</p>}
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="active">Produto Ativo</Label>
              <p className="text-xs text-muted-foreground">Disponível para venda</p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : product ? 'Salvar' : 'Cadastrar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
