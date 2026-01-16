import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';

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
  clientName: string;
  history: HistoryItem[];
}

// Mock history data
const mockHistory: HistoryItem[] = [
  { id: 1, date: '2026-01-10', procedure: 'Limpeza de pele', professional: 'Dra. Ana', value: 'R$ 150', status: 'completed' },
  { id: 2, date: '2025-12-15', procedure: 'Botox', professional: 'Dr. João', value: 'R$ 800', status: 'completed' },
  { id: 3, date: '2025-11-20', procedure: 'Peeling', professional: 'Dra. Ana', value: 'R$ 350', status: 'completed' },
  { id: 4, date: '2025-10-05', procedure: 'Consulta', professional: 'Dr. João', value: 'R$ 200', status: 'cancelled' },
  { id: 5, date: '2025-09-10', procedure: 'Tratamento Facial', professional: 'Dra. Ana', value: 'R$ 500', status: 'completed' },
];

export function ClientHistoryModal({ open, onOpenChange, clientName }: ClientHistoryModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de {clientName}</DialogTitle>
          <DialogDescription>
            Visualize todos os atendimentos realizados
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {mockHistory.map((item) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
