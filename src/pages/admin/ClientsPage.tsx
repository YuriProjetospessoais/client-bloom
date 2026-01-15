import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Plus, MoreHorizontal, Phone, Calendar, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockClients = [
  { id: 1, name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-1111', totalVisits: 12, lastVisit: '2026-01-10', totalSpent: 'R$ 3.600', status: 'active' },
  { id: 2, name: 'Carlos Santos', email: 'carlos@email.com', phone: '(11) 99999-2222', totalVisits: 8, lastVisit: '2025-12-20', totalSpent: 'R$ 2.400', status: 'inactive' },
  { id: 3, name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-3333', totalVisits: 24, lastVisit: '2026-01-14', totalSpent: 'R$ 7.200', status: 'active' },
  { id: 4, name: 'Roberto Alves', email: 'roberto@email.com', phone: '(11) 99999-4444', totalVisits: 5, lastVisit: '2025-11-15', totalSpent: 'R$ 1.500', status: 'inactive' },
  { id: 5, name: 'Patricia Lima', email: 'patricia@email.com', phone: '(11) 99999-5555', totalVisits: 18, lastVisit: '2026-01-12', totalSpent: 'R$ 5.400', status: 'active' },
];

export default function ClientsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-500">Inativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.clients}</h1>
          <p className="text-muted-foreground mt-1">Histórico e gestão de clientes</p>
        </div>
        <Button className="gradient-primary text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{client.totalVisits}</TableCell>
                    <TableCell className="text-muted-foreground">{client.lastVisit}</TableCell>
                    <TableCell className="font-medium text-foreground">{client.totalSpent}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" /> Ver histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Phone className="w-4 h-4" /> Ligar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Calendar className="w-4 h-4" /> Agendar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
