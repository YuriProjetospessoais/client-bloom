import { useState, useEffect } from 'react';
import { X, Phone, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ReturnAlert {
  id: string;
  clientName: string;
  clientPhone: string;
  lastProcedure: string;
  lastVisitDate: string;
  daysSinceVisit: number;
}

// Mock data for demonstration
const mockAlerts: ReturnAlert[] = [
  {
    id: '1',
    clientName: 'Ana Silva',
    clientPhone: '(11) 99999-1234',
    lastProcedure: 'Limpeza de Pele',
    lastVisitDate: '2024-01-15',
    daysSinceVisit: 30,
  },
  {
    id: '2',
    clientName: 'Carlos Santos',
    clientPhone: '(11) 98888-5678',
    lastProcedure: 'Corte Masculino',
    lastVisitDate: '2024-01-10',
    daysSinceVisit: 35,
  },
  {
    id: '3',
    clientName: 'Maria Oliveira',
    clientPhone: '(11) 97777-9012',
    lastProcedure: 'Coloração',
    lastVisitDate: '2024-01-05',
    daysSinceVisit: 40,
  },
];

const POPUP_SHOWN_KEY = 'lovable-alerts-popup-shown';

export function ReturnAlertsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<ReturnAlert[]>(mockAlerts);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if popup was already shown today
    const lastShown = localStorage.getItem(POPUP_SHOWN_KEY);
    const today = new Date().toDateString();
    
    if (lastShown !== today && alerts.length > 0) {
      // Show popup after a small delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem(POPUP_SHOWN_KEY, today);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [alerts.length]);

  const handleMarkContacted = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleIgnore = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (alerts.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            {t.alerts.popupTitle}
          </DialogTitle>
          <DialogDescription>
            {t.alerts.popupSubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {alert.clientName}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {alert.daysSinceVisit} dias
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.lastProcedure}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {alert.clientPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(alert.lastVisitDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIgnore(alert.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t.alerts.ignore}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkContacted(alert.id)}
                      className="gradient-primary text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t.alerts.markAsContacted}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {alerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
            <p className="text-lg font-medium">Todos os alertas foram tratados!</p>
          </motion.div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
