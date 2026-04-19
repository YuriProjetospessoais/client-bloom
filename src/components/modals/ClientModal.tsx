import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Client, ClientPreferences } from '@/lib/store';
import { sanitizeText, sanitizeObjectStrings } from '@/lib/security/sanitize';

const clientSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20),
  cpf: z.string().max(14).optional(),
  birthDate: z.string().optional(),
  address: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (client: Partial<Client> & { name: string; email: string; phone: string }) => void;
}

export function ClientModal({ open, onOpenChange, client, onSave }: ClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: '',
    address: '',
    notes: '',
  });
  const [preferences, setPreferences] = useState<ClientPreferences>({
    drink: '',
    cutStyle: '',
    favoriteMusic: '',
    freeNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf || '',
        birthDate: client.birthDate || '',
        address: client.address || '',
        notes: client.notes || '',
      });
      setPreferences(client.preferences || {
        drink: '',
        cutStyle: '',
        favoriteMusic: '',
        freeNotes: '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', cpf: '', birthDate: '', address: '', notes: '' });
      setPreferences({ drink: '', cutStyle: '', favoriteMusic: '', freeNotes: '' });
    }
    setErrors({});
    setActiveTab('basic');
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // XSS hardening: sanitiza campos de texto livre antes de persistir.
    const safeData = { ...formData, notes: sanitizeText(formData.notes) };
    const safePreferences = sanitizeObjectStrings(preferences);

    onSave({
      ...safeData,
      preferences: safePreferences,
      id: client?.id,
      lastVisit: client?.lastVisit,
      totalSpent: client?.totalSpent ?? 0,
      visitCount: client?.visitCount ?? 0,
      productPurchases: client?.productPurchases,
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success(client ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {client ? 'Atualize as informações do cliente.' : 'Preencha os dados para cadastrar um novo cliente.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="preferences">Preferências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Aniversário</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações gerais sobre o cliente..."
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="drink">Bebida Preferida</Label>
                <Input
                  id="drink"
                  value={preferences.drink || ''}
                  onChange={(e) => setPreferences({ ...preferences, drink: e.target.value })}
                  placeholder="Ex: Café com açúcar, Água com gás, Chá gelado..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cutStyle">Estilo de Corte / Preferência de Serviço</Label>
                <Input
                  id="cutStyle"
                  value={preferences.cutStyle || ''}
                  onChange={(e) => setPreferences({ ...preferences, cutStyle: e.target.value })}
                  placeholder="Ex: Degradê, Corte reto, Luzes..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteMusic">Música Preferida</Label>
                <Input
                  id="favoriteMusic"
                  value={preferences.favoriteMusic || ''}
                  onChange={(e) => setPreferences({ ...preferences, favoriteMusic: e.target.value })}
                  placeholder="Ex: MPB, Rock, Pop, Sertanejo..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeNotes">Observações Livres de Preferências</Label>
                <Textarea
                  id="freeNotes"
                  value={preferences.freeNotes || ''}
                  onChange={(e) => setPreferences({ ...preferences, freeNotes: e.target.value })}
                  placeholder="Outras preferências ou observações importantes..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : client ? 'Salvar' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
