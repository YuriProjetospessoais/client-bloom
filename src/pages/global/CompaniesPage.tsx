import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Building2, Search, Plus, MoreHorizontal, Users, Eye, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompanyModal, Company } from '@/components/modals/CompanyModal';

const initialCompanies: Company[] = [
  { id: 1, name: 'Clínica Saúde Total', plan: 'Professional', users: 8, maxUsers: 15, status: 'active', createdAt: '2025-10-15' },
  { id: 2, name: 'Barbearia Vintage', plan: 'Starter', users: 3, maxUsers: 5, status: 'active', createdAt: '2025-11-20' },
  { id: 3, name: 'Studio Beauty', plan: 'Enterprise', users: 25, maxUsers: 50, status: 'active', createdAt: '2025-08-05' },
  { id: 4, name: 'Clínica Bem Estar', plan: 'Professional', users: 10, maxUsers: 15, status: 'suspended', createdAt: '2025-06-12' },
  { id: 5, name: 'Salão Glamour', plan: 'Starter', users: 2, maxUsers: 5, status: 'active', createdAt: '2026-01-02' },
];

const mockUsers = [
  { id: 1, name: 'Dr. João Silva', email: 'joao@empresa.com', role: 'Admin' },
  { id: 2, name: 'Maria Santos', email: 'maria@empresa.com', role: 'Usuário' },
  { id: 3, name: 'Ana Costa', email: 'ana@empresa.com', role: 'Usuário' },
];

export default function CompaniesPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Ativo</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Suspenso</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      Starter: 'bg-blue-500/20 text-blue-500',
      Professional: 'bg-purple-500/20 text-purple-500',
      Enterprise: 'bg-orange-500/20 text-orange-500',
    };
    return <Badge className={`${colors[plan]} hover:opacity-80`}>{plan}</Badge>;
  };

  const handleNewCompany = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setCompanyModalOpen(true);
  };

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setDetailsModalOpen(true);
  };

  const handleViewUsers = (company: Company) => {
    setSelectedCompany(company);
    setUsersModalOpen(true);
  };

  const handleSaveCompany = (companyData: Partial<Company>) => {
    if (companyData.id) {
      setCompanies(companies.map(c => c.id === companyData.id ? { ...c, ...companyData } : c));
    } else {
      const newCompany: Company = {
        ...companyData as Company,
        id: Date.now(),
        users: 1,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCompanies([newCompany, ...companies]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.companies}</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as empresas do sistema</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={handleNewCompany}>
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(company.plan)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{company.users}/{company.maxUsers}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{company.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditCompany(company)}>
                            <Edit className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewDetails(company)}>
                            <Eye className="w-4 h-4" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewUsers(company)}>
                            <Users className="w-4 h-4" /> Ver usuários
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

      <CompanyModal
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        company={selectedCompany}
        onSave={handleSaveCompany}
      />

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
            <DialogDescription>Informações completas sobre {selectedCompany?.name}</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedCompany.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{selectedCompany.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                  <p className="font-medium">{selectedCompany.users} / {selectedCompany.maxUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedCompany.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{selectedCompany.createdAt}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Users Modal */}
      <Dialog open={usersModalOpen} onOpenChange={setUsersModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuários de {selectedCompany?.name}</DialogTitle>
            <DialogDescription>Lista de usuários cadastrados nesta empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge className={user.role === 'Admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
