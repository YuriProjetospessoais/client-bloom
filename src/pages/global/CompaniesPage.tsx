import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Building2, Search, Plus, MoreHorizontal, Users, Edit, ExternalLink, Power, CreditCard } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompanyModal } from '@/components/modals/CompanyModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { SignedImg } from '@/components/storage/SignedImg';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { PLAN_LABELS, PLAN_COLORS, CompanyPlan } from '@/lib/plans/features';

interface CompanyRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  primary_color: string | null;
  logo_url: string | null;
  cover_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  plan: CompanyPlan;
  plan_active: boolean;
}

export default function CompaniesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<CompanyRow | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCompanies(data);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug && c.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      active: { cls: 'bg-green-500/20 text-green-500 hover:bg-green-500/30', label: 'Ativo' },
      suspended: { cls: 'bg-red-500/20 text-red-500 hover:bg-red-500/30', label: 'Suspenso' },
      trial: { cls: 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30', label: 'Trial' },
    };
    const s = map[status] || map.active;
    return <Badge className={s.cls}>{s.label}</Badge>;
  };

  const handleNewCompany = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(true);
  };

  const handleEditCompany = (company: CompanyRow) => {
    setSelectedCompany(company);
    setCompanyModalOpen(true);
  };

  const handleAccessAdmin = (company: CompanyRow) => {
    if (!company.slug) {
      toast.error('Esta empresa não possui um slug configurado.');
      return;
    }
    navigate(`/${company.slug}/admin`);
  };

  const handleToggleStatus = async () => {
    if (!toggleConfirm) return;
    const newStatus = toggleConfirm.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('companies')
      .update({ status: newStatus })
      .eq('id', toggleConfirm.id);

    if (error) {
      toast.error('Erro ao alterar status');
    } else {
      toast.success(`Empresa ${newStatus === 'active' ? 'ativada' : 'suspensa'} com sucesso`);
      fetchCompanies();
    }
    setToggleConfirm(null);
  };

  const handleViewUsers = async (company: CompanyRow) => {
    setSelectedCompany(company);
    setUsersModalOpen(true);
    setUsersLoading(true);

    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('company_id', company.id);

    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const merged = data.map(r => {
        const profile = profiles?.find(p => p.user_id === r.user_id);
        return {
          userId: r.user_id,
          role: r.role,
          name: profile?.full_name || 'Sem nome',
          email: profile?.email || '—',
        };
      });
      setCompanyUsers(merged);
    } else {
      setCompanyUsers([]);
    }
    setUsersLoading(false);
  };

  const handleSaveCompany = async (data: { name: string; slug: string; email?: string; phone?: string; address?: string; primary_color?: string; logo_url?: string; cover_url?: string }) => {
    if (selectedCompany) {
      const { error } = await supabase
        .from('companies')
        .update({ name: data.name, slug: data.slug, email: data.email, phone: data.phone, address: data.address, primary_color: data.primary_color, logo_url: data.logo_url, cover_url: data.cover_url })
        .eq('id', selectedCompany.id);

      if (error) {
        toast.error(error.message.includes('companies_slug_key') ? 'Slug já está em uso' : 'Erro ao atualizar empresa');
        return;
      }
      toast.success('Empresa atualizada!');
    } else {
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({ name: data.name, slug: data.slug, email: data.email, phone: data.phone, address: data.address, primary_color: data.primary_color || '#8B5CF6', logo_url: data.logo_url, cover_url: data.cover_url })
        .select()
        .single();

      if (error) {
        toast.error(error.message.includes('companies_slug_key') ? 'Slug já está em uso' : 'Erro ao criar empresa');
        return;
      }

      // Create default admin membership for the creator
      if (newCompany && user) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          company_id: newCompany.id,
          role: 'company_admin' as any,
        });
      }
      toast.success('Empresa criada com sucesso!');
    }
    fetchCompanies();
    setCompanyModalOpen(false);
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      company_admin: 'bg-purple-500/20 text-purple-500',
      employee: 'bg-blue-500/20 text-blue-500',
      client: 'bg-green-500/20 text-green-500',
    };
    return <Badge className={map[role] || 'bg-muted text-muted-foreground'}>{role}</Badge>;
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Empresa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma empresa encontrada
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: company.primary_color || '#8B5CF6' }}
                          >
                            {company.logo_url ? (
                              <SignedImg src={company.logo_url} alt="" className="w-full h-full object-cover rounded-lg" fallback={<>{company.name.charAt(0)}</>} />
                            ) : (
                              company.name.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-foreground">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.slug ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">/{company.slug}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">sem slug</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={company.plan}
                          onValueChange={async (val: CompanyPlan) => {
                            const { error } = await supabase
                              .from('companies')
                              .update({ plan: val } as any)
                              .eq('id', company.id);
                            if (error) {
                              toast.error('Erro ao alterar plano');
                            } else {
                              toast.success(`Plano alterado para ${PLAN_LABELS[val]}`);
                              fetchCompanies();
                            }
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="start">Start</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleViewUsers(company)}>
                              <Users className="w-4 h-4" /> Ver usuários
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleAccessAdmin(company)}
                              disabled={!company.slug}
                            >
                              <ExternalLink className="w-4 h-4" /> Acessar admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setToggleConfirm(company)}
                            >
                              <Power className="w-4 h-4" />
                              {company.status === 'active' ? 'Suspender' : 'Ativar'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyModal
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        company={selectedCompany}
        onSave={handleSaveCompany}
      />

      <ConfirmDialog
        open={!!toggleConfirm}
        onOpenChange={() => setToggleConfirm(null)}
        title={toggleConfirm?.status === 'active' ? 'Suspender empresa?' : 'Ativar empresa?'}
        description={
          toggleConfirm?.status === 'active'
            ? `A empresa "${toggleConfirm?.name}" será suspensa e seus usuários perderão acesso.`
            : `A empresa "${toggleConfirm?.name}" será reativada.`
        }
        onConfirm={handleToggleStatus}
        confirmLabel={toggleConfirm?.status === 'active' ? 'Suspender' : 'Ativar'}
        variant={toggleConfirm?.status === 'active' ? 'destructive' : 'default'}
      />

      {/* Users Modal */}
      <Dialog open={usersModalOpen} onOpenChange={setUsersModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuários de {selectedCompany?.name}</DialogTitle>
            <DialogDescription>Membros e seus papéis nesta empresa</DialogDescription>
          </DialogHeader>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : companyUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum usuário encontrado</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {companyUsers.map((u) => (
                <div key={u.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {getRoleBadge(u.role)}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
