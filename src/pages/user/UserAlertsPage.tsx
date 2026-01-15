import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, X, Clock, Calendar, Phone } from 'lucide-react';

interface Alert {
  id: number;
  client: string;
  procedure: string;
  lastVisit: string;
  daysAgo: number;
  phone: string;
  status: 'pending' | 'contacted' | 'ignored';
}

const mockAlerts: Alert[] = [
  { id: 1, client: 'Maria Silva', procedure: 'Limpeza de pele', lastVisit: '2025-11-15', daysAgo: 61, phone: '(11) 99999-1111', status: 'pending' },
  { id: 2, client: 'Carlos Santos', procedure: 'Botox', lastVisit: '2025-10-20', daysAgo: 87, phone: '(11) 99999-2222', status: 'pending' },
  { id: 3, client: 'Ana Costa', procedure: 'Peeling', lastVisit: '2025-12-01', daysAgo: 45, phone: '(11) 99999-3333', status: 'contacted' },
];

export default function UserAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(mockAlerts);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleContact = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'contacted' as const } : alert
    ));
  };

  const handleIgnore = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'ignored' as const } : alert
    ));
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const contactedAlerts = alerts.filter(a => a.status === 'contacted');

  const AlertCard = ({ alert, showActions = true }: { alert: Alert; showActions?: boolean }) => (
    <Card className="bg-background/50 border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(alert.client)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-foreground truncate">{alert.client}</h4>
              <Badge className={`flex-shrink-0 ${
                alert.daysAgo > 90 ? 'bg-red-500/20 text-red-500' :
                alert.daysAgo > 60 ? 'bg-orange-500/20 text-orange-500' :
                'bg-yellow-500/20 text-yellow-500'
              }`}>
                {alert.daysAgo} dias
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{alert.procedure}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {alert.lastVisit}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {alert.phone}
              </span>
            </div>
          </div>
        </div>
        
        {showActions && alert.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              className="flex-1 gradient-primary text-white gap-1"
              onClick={() => handleContact(alert.id)}
            >
              <Check className="w-4 h-4" />
              Contatado
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => handleIgnore(alert.id)}
            >
              <X className="w-4 h-4" />
              Ignorar
            </Button>
          </div>
        )}

        {alert.status === 'contacted' && (
          <div className="mt-3 pt-3 border-t border-border">
            <Badge className="bg-green-500/20 text-green-500">
              <Check className="w-3 h-3 mr-1" />
              Contatado
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.alerts}</h1>
          <p className="text-muted-foreground mt-1">Clientes para contatar</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Bell className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-orange-500">{pendingAlerts.length} pendentes</span>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendentes ({pendingAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="contacted" className="gap-2">
            <Check className="w-4 h-4" />
            Contatados ({contactedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
            {pendingAlerts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum alerta pendente</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacted" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactedAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} showActions={false} />
            ))}
            {contactedAlerts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum cliente contatado ainda</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
