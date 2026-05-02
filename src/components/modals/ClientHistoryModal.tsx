import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, DollarSign, Package, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/queries/useTenantId';

interface ClientHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName: string | null;
}

type AppointmentRow = {
  id: string;
  date: string;
  start_time: string;
  status: string;
  service: { name: string; price: number } | null;
  professional: { name: string } | null;
};

type SaleRow = {
  id: string;
  sale_date: string;
  estimated_end_date: string | null;
  quantity: number;
  total_price: number;
  product: { name: string; duration_days: number } | null;
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/20 text-green-500">Realizado</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500/20 text-red-500">Cancelado</Badge>;
    case 'no_show':
      return <Badge className="bg-yellow-500/20 text-yellow-500">Não compareceu</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-500/20 text-blue-500">Confirmado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export function ClientHistoryModal({ open, onOpenChange, clientId, clientName }: ClientHistoryModalProps) {
  const companyId = useTenantId();

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['client-history-appts', companyId, clientId],
    enabled: !!companyId && !!clientId && open,
    queryFn: async (): Promise<AppointmentRow[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, start_time, status, service:services(name, price), professional:professionals(name)')
        .eq('company_id', companyId!)
        .eq('client_id', clientId!)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AppointmentRow[];
    },
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['client-history-sales', companyId, clientId],
    enabled: !!companyId && !!clientId && open,
    queryFn: async (): Promise<SaleRow[]> => {
      const { data, error } = await supabase
        .from('product_sales')
        .select('id, sale_date, estimated_end_date, quantity, total_price, product:products(name, duration_days)')
        .eq('company_id', companyId!)
        .eq('client_id', clientId!)
        .order('sale_date', { ascending: false });
      if (error) {
        // plano sem feature 'products': vendas vazias, sem quebrar
        return [];
      }
      return (data ?? []) as unknown as SaleRow[];
    },
  });

  const enrichedSales = useMemo(() => {
    const today = new Date();
    return sales.map((s) => {
      const endDate = s.estimated_end_date ? new Date(s.estimated_end_date) : null;
      const daysRemaining = endDate
        ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      let status: 'expired' | 'urgent' | 'ok' = 'ok';
      if (daysRemaining != null) {
        if (daysRemaining <= 0) status = 'expired';
        else if (daysRemaining <= 7) status = 'urgent';
      }
      return { ...s, daysRemaining, repurchaseStatus: status };
    });
  }, [sales]);

  const repurchaseBadge = (status: 'expired' | 'urgent' | 'ok', daysRemaining: number | null) => {
    if (daysRemaining == null) return null;
    if (status === 'expired') {
      return (
        <Badge className="bg-red-500/20 text-red-500 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Acabou há {Math.abs(daysRemaining)}d
        </Badge>
      );
    }
    if (status === 'urgent') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-600 gap-1">
          <Clock className="w-3 h-3" />
          {daysRemaining}d restantes
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/20 text-green-500 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {daysRemaining}d restantes
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de {clientName ?? 'Cliente'}</DialogTitle>
          <DialogDescription>Atendimentos e compras de produtos</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="services" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="gap-2">
              <Calendar className="w-4 h-4" />
              Atendimentos ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Produtos ({enrichedSales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="flex-1 overflow-y-auto space-y-3 pr-2 mt-4">
            {loadingAppts ? (
              <Skeleton className="h-24 w-full" />
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">Nenhum atendimento registrado</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {apt.service?.name ?? 'Serviço removido'}
                      </span>
                      {statusBadge(apt.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(apt.date)} {apt.start_time?.slice(0, 5)}
                      </span>
                      <span>{apt.professional?.name ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <DollarSign className="w-4 h-4" />
                    {(apt.service?.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="products" className="flex-1 overflow-y-auto space-y-3 pr-2 mt-4">
            {loadingSales ? (
              <Skeleton className="h-24 w-full" />
            ) : enrichedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">Nenhum produto comprado por este cliente</p>
              </div>
            ) : (
              enrichedSales.map((sale) => (
                <div
                  key={sale.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    sale.repurchaseStatus === 'expired'
                      ? 'bg-red-500/5 border-red-500/20'
                      : sale.repurchaseStatus === 'urgent'
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-muted/50 border-transparent hover:bg-muted/70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {sale.product?.name ?? 'Produto removido'}
                        </span>
                        {sale.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">x{sale.quantity}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-foreground">
                      R$ {Number(sale.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Compra: {formatDate(sale.sale_date)}
                      </span>
                      {sale.estimated_end_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Término: {formatDate(sale.estimated_end_date)}
                        </span>
                      )}
                    </div>
                    {repurchaseBadge(sale.repurchaseStatus, sale.daysRemaining)}
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