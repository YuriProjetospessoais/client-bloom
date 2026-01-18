import { useState, useEffect } from 'react';
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
import { Search, Plus, MoreHorizontal, Phone, Calendar, Eye, Edit, Mail, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientModal } from '@/components/modals/ClientModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ClientHistoryModal } from '@/components/modals/ClientHistoryModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { handleCall, handleEmail } from '@/lib/actions';
import { clientsStore, Client } from '@/lib/store';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    setClients(clientsStore.getAll());
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (lastVisit?: string) => {
    if (!lastVisit) return <Badge variant="outline">Novo</Badge>;
    
    const daysSinceVisit = Math.floor(
      (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceVisit <= 30) {
      return <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>;
    } else if (daysSinceVisit <= 90) {
      return <Badge className="bg-yellow-500/20 text-yellow-600">Em risco</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-500">Inativo</Badge>;
    }
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };

  const handleSaveClient = (clientData: any) => {
    if (clientData.id) {
      clientsStore.update(clientData.id, clientData);
      toast.success('Cliente atualizado com sucesso!');
    } else {
      clientsStore.create(clientData);
      toast.success('Cliente criado com sucesso!');
    }
    setClients(clientsStore.getAll());
  };

  const handleSchedule = (client: Client) => {
    setSelectedClient(client);
    setAppointmentModalOpen(true);
  };

  const handleViewHistory = (client: Client) => {
    setSelectedClient(client);
    setHistoryModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      clientsStore.delete(clientToDelete.id);
      setClients(clientsStore.getAll());
      toast.success('Cliente excluído com sucesso!');
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.clients}</h1>
          <p className="text-muted-foreground mt-1">Histórico e gestão de clientes</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewClient}>
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
                    <TableCell className="text-foreground">{client.visitCount}</TableCell>
                    <TableCell className="text-muted-foreground">{client.lastVisit || 'Nunca'}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      R$ {client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(client.lastVisit)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditClient(client)}>
                            <Edit className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewHistory(client)}>
                            <Eye className="w-4 h-4" /> Ver histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleCall(client.phone, client.name)}>
                            <Phone className="w-4 h-4" /> Ligar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEmail(client.email, `Olá ${client.name}`, client.name)}>
                            <Mail className="w-4 h-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleSchedule(client)}>
                            <Calendar className="w-4 h-4" /> Agendar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteClick(client)}>
                            <Trash2 className="w-4 h-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        onSave={() => {
          setAppointmentModalOpen(false);
          toast.success('Agendamento criado!');
        }}
      />

      <ClientHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        client={selectedClient}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${clientToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
