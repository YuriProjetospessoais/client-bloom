import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Product } from '@/hooks/queries/useProducts';
import { useCreateProduct, useUpdateProduct } from '@/hooks/mutations/useProductMutations';

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isLoading = createProduct.isPending || updateProduct.isPending;

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    duration_days: 30,
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        price: Number(product.price),
        stock: product.stock,
        duration_days: product.duration_days,
        active: product.active,
      });
    } else {
      setForm({ name: '', description: '', price: 0, stock: 0, duration_days: 30, active: true });
    }
    setErrors({});
  }, [product, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (form.price < 0) errs.price = 'Preço inválido';
    if (form.duration_days < 1) errs.duration_days = 'Duração inválida';
    if (form.stock < 0) errs.stock = 'Estoque inválido';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price,
      stock: form.stock,
      duration_days: form.duration_days,
      active: form.active,
    };
    try {
      if (product?.id) {
        await updateProduct.mutateAsync({ id: product.id, patch: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      /* hook mostra toast */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            {product ? 'Atualize os dados do produto.' : 'Cadastre um novo produto.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prd-name">Nome *</Label>
            <Input
              id="prd-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Shampoo Profissional"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prd-desc">Descrição</Label>
            <Textarea
              id="prd-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prd-price">Preço (R$) *</Label>
              <Input
                id="prd-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prd-stock">Estoque *</Label>
              <Input
                id="prd-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className={errors.stock ? 'border-destructive' : ''}
              />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prd-duration">Duração (dias) *</Label>
              <Input
                id="prd-duration"
                type="number"
                min="1"
                value={form.duration_days || ''}
                onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 1 })}
                className={errors.duration_days ? 'border-destructive' : ''}
              />
              {errors.duration_days && <p className="text-sm text-destructive">{errors.duration_days}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="prd-active">Produto Ativo</Label>
              <p className="text-xs text-muted-foreground">Disponível para venda</p>
            </div>
            <Switch
              id="prd-active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : product ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}