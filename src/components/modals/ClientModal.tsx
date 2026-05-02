import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { sanitizeText, sanitizeObjectStrings } from '@/lib/security/sanitize';
import type { Client } from '@/hooks/queries/useClients';
import { useCreateClient, useUpdateClient } from '@/hooks/mutations/useClientMutations';

interface ClientPreferences {
  drink?: string;
  cutStyle?: string;
  favoriteMusic?: string;
  freeNotes?: string;
}

const clientSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255).or(z.literal('')),
  phone: z.string().trim().max(20).optional(),
  birthday: z.string().optional(),
  address: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

function maskPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 0) return `(${digits}`;
  return '';
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isLoading = createClient.isPending || updateClient.isPending;

  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
    notes: '',
  });
  const [preferences, setPreferences] = useState<ClientPreferences>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name ?? '',
        email: client.email ?? '',
        phone: client.phone ?? '',
        birthday: client.birthday ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      });
      const p = (client.preferences ?? {}) as ClientPreferences;
      setPreferences({
        drink: p.drink ?? '',
        cutStyle: p.cutStyle ?? '',
        favoriteMusic: p.favoriteMusic ?? '',
        freeNotes: p.freeNotes ?? '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', birthday: '', address: '', notes: '' });
      setPreferences({});
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
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const safeNotes = formData.notes ? sanitizeText(formData.notes) : null;
    const safePrefs = sanitizeObjectStrings(preferences) as Record<string, unknown>;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      birthday: formData.birthday || null,
      address: formData.address?.trim() || null,
      notes: safeNotes,
      preferences: safePrefs,
    };

    try {
      if (client?.id) {
        await updateClient.mutateAsync({ id: client.id, patch: payload });
      } else {
        await createClient.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      /* o hook já mostra o toast de erro */
    }
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: maskPhoneBR(e.target.value) })}
                    placeholder="(11) 99999-9999"
                    maxLength={16}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Data de Aniversário</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
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
                  placeholder="Ex: Café com açúcar..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cutStyle">Estilo de Corte / Preferência de Serviço</Label>
                <Input
                  id="cutStyle"
                  value={preferences.cutStyle || ''}
                  onChange={(e) => setPreferences({ ...preferences, cutStyle: e.target.value })}
                  placeholder="Ex: Degradê, Corte reto..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favoriteMusic">Música Preferida</Label>
                <Input
                  id="favoriteMusic"
                  value={preferences.favoriteMusic || ''}
                  onChange={(e) => setPreferences({ ...preferences, favoriteMusic: e.target.value })}
                  placeholder="Ex: MPB, Rock..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeNotes">Observações Livres</Label>
                <Textarea
                  id="freeNotes"
                  value={preferences.freeNotes || ''}
                  onChange={(e) => setPreferences({ ...preferences, freeNotes: e.target.value })}
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