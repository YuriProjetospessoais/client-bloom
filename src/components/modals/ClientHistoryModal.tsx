import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Client, productSalesStore, productsStore, ProductSale, Product } from '@/lib/store';

interface HistoryItem {
  id: number;
  date: string;
  procedure: string;
  professional: string;
  value: string;
  status: 'completed' | 'cancelled' | 'no-show';
}

interface ClientHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

// Mock service history data
const mockServiceHistory: HistoryItem[] = [
  { id: 1, date: '2026-01-10', procedure: 'Limpeza de pele', professional: 'Dra. Ana', value: 'R$ 150', status: 'completed' },
  { id: 2, date: '2025-12-15', procedure: 'Botox', professional: 'Dr. João', value: 'R$ 800', status: 'completed' },
  { id: 3, date: '2025-11-20', procedure: 'Peeling', professional: 'Dra. Ana', value: 'R$ 350', status: 'completed' },
  { id: 4, date: '2025-10-05', procedure: 'Consulta', professional: 'Dr. João', value: 'R$ 200', status: 'cancelled' },
  { id: 5, date: '2025-09-10', procedure: 'Tratamento Facial', professional: 'Dra. Ana', value: 'R$ 500', status: 'completed' },
];

interface ProductPurchaseWithDetails extends ProductSale {
  product?: Product;
  daysRemaining: number;
  status: 'expired' | 'urgent' | 'ok';
}

export function ClientHistoryModal({ open, onOpenChange, client }: ClientHistoryModalProps) {
  const [productPurchases, setProductPurchases] = useState<ProductPurchaseWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    if (open && client) {
      // Get all product sales for this client
      const allSales = productSalesStore.getAll();
      const products = productsStore.getAll();
      const today = new Date();
      
      const clientSales = allSales
        .filter(sale => sale.clientId === client.id)
        .map(sale => {
          const product = products.find(p => p.id === sale.productId);
          const endDate = new Date(sale.estimatedEndDate);
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: 'expired' | 'urgent' | 'ok' = 'ok';
          if (daysRemaining <= 0) status = 'expired';
          else if (daysRemaining <= 7) status = 'urgent';
          
          return {
            ...sale,
            product,
            daysRemaining,
            status,
          };
        })
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
      
      setProductPurchases(clientSales);
    }
  }, [open, client]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500">Realizado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500">Cancelado</Badge>;
      case 'no-show':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Não compareceu</Badge>;
      default:
        return null;
    }
  };

  const getRepurchaseBadge = (status: 'expired' | 'urgent' | 'ok', daysRemaining: number) => {
    switch (status) {
      case 'expired':
        return (
          <Badge className="bg-red-500/20 text-red-500 gap-1">
            <AlertTriangle className="w-3 h-3" />
            Acabou há {Math.abs(daysRemaining)}d
          </Badge>
        );
      case 'urgent':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 gap-1">
            <Clock className="w-3 h-3" />
            {daysRemaining}d restantes
          </Badge>
        );
      case 'ok':
        return (
          <Badge className="bg-green-500/20 text-green-500 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {daysRemaining}d restantes
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de {client?.name || 'Cliente'}</DialogTitle>
          <DialogDescription>
            Visualize atendimentos e compras de produtos
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="gap-2">
              <Calendar className="w-4 h-4" />
              Atendimentos
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Produtos ({productPurchases.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="services" className="flex-1 overflow-y-auto space-y-3 pr-2 mt-4">
            {mockServiceHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{item.procedure}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span>{item.professional}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <DollarSign className="w-4 h-4" />
                  {item.value.replace('R$ ', '')}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="products" className="flex-1 overflow-y-auto space-y-3 pr-2 mt-4">
            {productPurchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">Nenhum produto comprado por este cliente</p>
              </div>
            ) : (
              productPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    purchase.status === 'expired' 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : purchase.status === 'urgent'
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-muted/50 border-transparent hover:bg-muted/70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {purchase.product?.name || purchase.productName}
                        </span>
                        {purchase.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">
                            x{purchase.quantity}
                          </Badge>
                        )}
                      </div>
                      {purchase.product?.category && (
                        <span className="text-xs text-muted-foreground">
                          {purchase.product.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        R$ {purchase.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Compra: {formatDate(purchase.saleDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Término: {formatDate(purchase.estimatedEndDate)}
                      </span>
                    </div>
                    {getRepurchaseBadge(purchase.status, purchase.daysRemaining)}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
