import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/queries/useClients';
import { useProducts } from '@/hooks/queries/useProducts';
import { useCreateProductSale } from '@/hooks/mutations/useProductSaleMutations';
import { useUpdateProduct } from '@/hooks/mutations/useProductMutations';

interface ProductSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string | null;
}

export function ProductSaleModal({ open, onOpenChange, preselectedClientId }: ProductSaleModalProps) {
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts({ onlyActive: true });
  const createSale = useCreateProductSale();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState({
    productId: '',
    clientId: '',
    quantity: 1,
    totalPrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedTotal, setTouchedTotal] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        productId: '',
        clientId: preselectedClientId ?? '',
        quantity: 1,
        totalPrice: 0,
        saleDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      setTouchedTotal(false);
    }
  }, [open, preselectedClientId]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId],
  );

  // Auto-calc total quando muda produto ou qtd, se usuário ainda não editou manualmente
  useEffect(() => {
    if (selectedProduct && !touchedTotal) {
      setForm((f) => ({ ...f, totalPrice: Number(selectedProduct.price) * f.quantity }));
    }
  }, [selectedProduct, form.quantity, touchedTotal]);

  const calculateEndDate = () => {
    if (!selectedProduct || !form.saleDate) return '';
    const d = new Date(form.saleDate);
    d.setDate(d.getDate() + selectedProduct.duration_days);
    return d.toISOString().split('T')[0];
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.clientId) errs.clientId = 'Selecione um cliente';
    if (!form.productId) errs.productId = 'Selecione um produto';
    if (form.quantity < 1) errs.quantity = 'Quantidade inválida';
    if (selectedProduct && form.quantity > selectedProduct.stock) {
      errs.quantity = `Estoque insuficiente (${selectedProduct.stock} disponíveis)`;
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!selectedProduct) return;

    try {
      await createSale.mutateAsync({
        client_id: form.clientId,
        product_id: form.productId,
        quantity: form.quantity,
        total_price: form.totalPrice,
        sale_date: form.saleDate,
        estimated_end_date: calculateEndDate(),
        status: 'completed',
        booked_by_client: false,
      });
      // Atualiza estoque após venda bem-sucedida
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        patch: { stock: Math.max(0, selectedProduct.stock - form.quantity) },
      });
      onOpenChange(false);
    } catch {
      /* hooks mostram toast */
    }
  };

  const isLoading = createSale.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Venda de Produto</DialogTitle>
          <DialogDescription>
            Vincule um produto a um cliente. O sistema calcula a previsão de recompra automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={form.clientId}
              onValueChange={(v) => setForm({ ...form, clientId: v })}
              disabled={!!preselectedClientId}
            >
              <SelectTrigger className={errors.clientId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Produto *</Label>
            <Select
              value={form.productId}
              onValueChange={(v) => { setForm({ ...form, productId: v }); setTouchedTotal(false); }}
            >
              <SelectTrigger className={errors.productId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {Number(p.price).toFixed(2)} (estoque: {p.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => {
                  setForm({ ...form, quantity: parseInt(e.target.value) || 1 });
                  setTouchedTotal(false);
                }}
                className={errors.quantity ? 'border-destructive' : ''}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label>Total (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.totalPrice}
                onChange={(e) => {
                  setForm({ ...form, totalPrice: parseFloat(e.target.value) || 0 });
                  setTouchedTotal(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração estimada:</span>
                <span>{selectedProduct.duration_days} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previsão de término:</span>
                <span>{new Date(calculateEndDate()).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">R$ {form.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Registrar Venda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}