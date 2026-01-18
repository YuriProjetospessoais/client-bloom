import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Users, Scissors, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserModal } from '@/components/modals/UserModal';
import { ProcedureModal } from '@/components/modals/ProcedureModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { 
  usersStore, 
  proceduresStore, 
  companySettingsStore,
  User,
  Procedure,
  CompanySettings,
} from '@/lib/store';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  // Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  
  // Delete confirmation state
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteProcedureOpen, setDeleteProcedureOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  
  // Loading state
  const [savingCompany, setSavingCompany] = useState(false);

  // Load data on mount
  useEffect(() => {
    setUsers(usersStore.getAll());
    setProcedures(proceduresStore.getAll());
    setCompanySettings(companySettingsStore.get());
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // User handlers
  const handleNewUser = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (usr: User) => {
    setSelectedUser(usr);
    setUserModalOpen(true);
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'createdAt'> & { id?: string }) => {
    if (userData.id) {
      usersStore.update(userData.id, userData);
      toast.success('Usuário atualizado com sucesso!');
    } else {
      usersStore.create(userData);
      toast.success('Usuário criado com sucesso!');
    }
    setUsers(usersStore.getAll());
  };

  const handleDeleteUserClick = (usr: User) => {
    setUserToDelete(usr);
    setDeleteUserOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      usersStore.delete(userToDelete.id);
      setUsers(usersStore.getAll());
      toast.success('Usuário excluído com sucesso!');
    }
    setDeleteUserOpen(false);
    setUserToDelete(null);
  };

  // Procedure handlers
  const handleNewProcedure = () => {
    setSelectedProcedure(null);
    setProcedureModalOpen(true);
  };

  const handleEditProcedure = (proc: Procedure) => {
    setSelectedProcedure(proc);
    setProcedureModalOpen(true);
  };

  const handleSaveProcedure = (procData: Omit<Procedure, 'id'> & { id?: string }) => {
    if (procData.id) {
      proceduresStore.update(procData.id, procData);
      toast.success('Procedimento atualizado com sucesso!');
    } else {
      proceduresStore.create(procData);
      toast.success('Procedimento criado com sucesso!');
    }
    setProcedures(proceduresStore.getAll());
  };

  const handleDeleteProcedureClick = (proc: Procedure) => {
    setProcedureToDelete(proc);
    setDeleteProcedureOpen(true);
  };

  const handleConfirmDeleteProcedure = () => {
    if (procedureToDelete) {
      proceduresStore.delete(procedureToDelete.id);
      setProcedures(proceduresStore.getAll());
      toast.success('Procedimento excluído com sucesso!');
    }
    setDeleteProcedureOpen(false);
    setProcedureToDelete(null);
  };

  // Company settings handlers
  const handleSaveCompanySettings = () => {
    if (!companySettings) return;
    
    setSavingCompany(true);
    setTimeout(() => {
      companySettingsStore.update(companySettings);
      toast.success('Alterações salvas com sucesso!');
      setSavingCompany(false);
    }, 500);
  };

  const userLimit = companySettings?.userLimit || 15;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.settings}</h1>
        <p className="text-muted-foreground mt-1">Configurações da empresa e sistema</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="procedures" className="gap-2">
            <Scissors className="w-4 h-4" />
            Procedimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Dados cadastrais do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input 
                    id="company-name" 
                    value={companySettings?.name || ''} 
                    onChange={(e) => setCompanySettings(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    value={companySettings?.cnpj || ''} 
                    onChange={(e) => setCompanySettings(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={companySettings?.phone || ''} 
                    onChange={(e) => setCompanySettings(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={companySettings?.email || ''} 
                    onChange={(e) => setCompanySettings(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  value={companySettings?.address || ''} 
                  onChange={(e) => setCompanySettings(prev => prev ? { ...prev, address: e.target.value } : null)}
                />
              </div>
              <Button 
                className="gradient-primary text-white" 
                onClick={handleSaveCompanySettings}
                disabled={savingCompany}
              >
                {savingCompany ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Informações sobre sua assinatura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-lg">Plano {companySettings?.plan || 'Professional'}</h3>
                    <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Até {userLimit} usuários • Renovação em 15/02/2026</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">R$ 197</p>
                  <p className="text-sm text-muted-foreground">/mês</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{users.length} de {userLimit} usuários utilizados</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários da Empresa</CardTitle>
                <CardDescription>
                  Gerencie os funcionários e seus acessos ({users.length}/{userLimit} usuários)
                </CardDescription>
              </div>
              <Button className="gradient-primary text-white gap-2" onClick={handleNewUser}>
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((usr) => (
                  <div key={usr.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(usr.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{usr.name}</p>
                        <p className="text-sm text-muted-foreground">{usr.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={usr.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}>
                        {usr.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                      <Badge className={usr.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                        {usr.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(usr)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUserClick(usr)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário cadastrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Procedimentos</CardTitle>
                <CardDescription>Configure os serviços oferecidos e regras de retorno</CardDescription>
              </div>
              <Button className="gradient-primary text-white gap-2" onClick={handleNewProcedure}>
                <Plus className="w-4 h-4" />
                Novo Procedimento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {procedures.map((proc) => (
                  <div key={proc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{proc.name}</p>
                        {!proc.active && (
                          <Badge variant="outline" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{proc.duration} min</span>
                        <span>•</span>
                        <span>Retorno: {proc.returnDays} dias</span>
                        {proc.category && (
                          <>
                            <span>•</span>
                            <span>{proc.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleEditProcedure(proc)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProcedureClick(proc)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {procedures.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum procedimento cadastrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        userLimit={userLimit}
        currentUserCount={users.length}
      />

      <ProcedureModal
        open={procedureModalOpen}
        onOpenChange={setProcedureModalOpen}
        procedure={selectedProcedure}
        onSave={handleSaveProcedure}
      />

      <ConfirmDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${userToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDeleteUser}
      />

      <ConfirmDialog
        open={deleteProcedureOpen}
        onOpenChange={setDeleteProcedureOpen}
        title="Excluir Procedimento"
        description={`Tem certeza que deseja excluir o procedimento "${procedureToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDeleteProcedure}
      />
    </div>
  );
}
