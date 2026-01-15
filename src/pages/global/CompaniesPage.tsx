import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Building2, Search, Plus, MoreHorizontal, Users, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockCompanies = [
  { id: 1, name: 'Clínica Saúde Total', plan: 'Professional', users: 8, maxUsers: 10, status: 'active', createdAt: '2025-10-15' },
  { id: 2, name: 'Barbearia Vintage', plan: 'Starter', users: 3, maxUsers: 5, status: 'active', createdAt: '2025-11-20' },
  { id: 3, name: 'Studio Beauty', plan: 'Enterprise', users: 25, maxUsers: 50, status: 'active', createdAt: '2025-08-05' },
  { id: 4, name: 'Clínica Bem Estar', plan: 'Professional', users: 10, maxUsers: 10, status: 'suspended', createdAt: '2025-06-12' },
  { id: 5, name: 'Salão Glamour', plan: 'Starter', users: 2, maxUsers: 5, status: 'active', createdAt: '2026-01-02' },
];

export default function CompaniesPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = mockCompanies.filter(company =>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.companies}</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as empresas do sistema</p>
        </div>
        <Button className="gradient-primary text-white gap-2">
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
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
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
    </div>
  );
}
