import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Product, Client, ProductSale, productsStore, clientsStore } from '@/lib/store';

interface ProductSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClient?: Client | null;
  onSave: (sale: Omit<ProductSale, 'id'>) => void;
}

export function ProductSaleModal({ open, onOpenChange, preselectedClient, onSave }: ProductSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    clientId: '',
    quantity: 1,
    saleDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setProducts(productsStore.getAll().filter(p => p.active));
    setClients(clientsStore.getAll());
  }, [open]);

  useEffect(() => {
    if (preselectedClient) {
      setFormData(prev => ({ ...prev, clientId: preselectedClient.id }));
    }
  }, [preselectedClient, open]);

  useEffect(() => {
    if (!open) {
      setFormData({
        productId: '',
        clientId: preselectedClient?.id || '',
        quantity: 1,
        saleDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [open, preselectedClient]);

  const selectedProduct = products.find(p => p.id === formData.productId);
  const totalPrice = selectedProduct ? selectedProduct.price * formData.quantity : 0;
  
  const calculateEndDate = () => {
    if (!selectedProduct || !formData.saleDate) return '';
    const saleDate = new Date(formData.saleDate);
    saleDate.setDate(saleDate.getDate() + selectedProduct.durationDays);
    return saleDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.productId) newErrors.productId = 'Selecione um produto';
    if (!formData.clientId) newErrors.clientId = 'Selecione um cliente';
    if (formData.quantity < 1) newErrors.quantity = 'Quantidade deve ser pelo menos 1';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const product = products.find(p => p.id === formData.productId)!;
    const client = clients.find(c => c.id === formData.clientId)!;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    onSave({
      productId: formData.productId,
      productName: product.name,
      clientId: formData.clientId,
      clientName: client.name,
      saleDate: formData.saleDate,
      estimatedEndDate: calculateEndDate(),
      quantity: formData.quantity,
      totalPrice,
      notified: false,
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success('Venda registrada com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Venda de Produto</DialogTitle>
          <DialogDescription>
            Registre a venda de um produto para um cliente. O sistema calculará automaticamente a previsão de recompra.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              disabled={!!preselectedClient}
            >
              <SelectTrigger className={errors.clientId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Produto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
            >
              <SelectTrigger className={errors.productId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - R$ {product.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className={errors.quantity ? 'border-destructive' : ''}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Data da Venda</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço unitário:</span>
                <span>R$ {selectedProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duração estimada:</span>
                <span>{selectedProduct.durationDays} dias</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Previsão de término:</span>
                <span>{new Date(calculateEndDate()).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
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
