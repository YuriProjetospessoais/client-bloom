import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Users, Settings2, Scissors, Plus, Edit, Trash2 } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Dr. João Silva', email: 'joao@clinica.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Maria Santos', email: 'maria@clinica.com', role: 'Usuário', status: 'active' },
  { id: 3, name: 'Ana Costa', email: 'ana@clinica.com', role: 'Usuário', status: 'active' },
];

const mockProcedures = [
  { id: 1, name: 'Limpeza de pele', duration: 60, returnDays: 30, price: 'R$ 150' },
  { id: 2, name: 'Botox', duration: 45, returnDays: 180, price: 'R$ 800' },
  { id: 3, name: 'Peeling', duration: 90, returnDays: 30, price: 'R$ 350' },
  { id: 4, name: 'Tratamento Capilar', duration: 120, returnDays: 45, price: 'R$ 500' },
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
                  <Input id="company-name" defaultValue={user?.companyName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 3456-7890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="contato@clinicasaude.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Av. Paulista, 1234 - São Paulo, SP" />
              </div>
              <Button className="gradient-primary text-white">Salvar Alterações</Button>
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
                    <h3 className="font-semibold text-foreground text-lg">Plano Professional</h3>
                    <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Até 15 usuários • Renovação em 15/02/2026</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">R$ 197</p>
                  <p className="text-sm text-muted-foreground">/mês</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">3 de 15 usuários utilizados</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários da Empresa</CardTitle>
                <CardDescription>Gerencie os funcionários e seus acessos</CardDescription>
              </div>
              <Button className="gradient-primary text-white gap-2">
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUsers.map((usr) => (
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
                      <Badge className={usr.role === 'Admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}>
                        {usr.role}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              <Button className="gradient-primary text-white gap-2">
                <Plus className="w-4 h-4" />
                Novo Procedimento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProcedures.map((proc) => (
                  <div key={proc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{proc.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{proc.duration} min</span>
                        <span>•</span>
                        <span>Retorno: {proc.returnDays} dias</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">{proc.price}</span>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
