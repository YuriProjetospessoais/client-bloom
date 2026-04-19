import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { User, Save } from 'lucide-react';
import { sanitizeText } from '@/lib/security/sanitize';

export default function PortalProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }

    // Load client preferences
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, preferences')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (clientData) {
      setClientId(clientData.id);
      const prefs = clientData.preferences as any;
      if (prefs && typeof prefs === 'object') {
        setPreferences(prefs.notes || '');
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    // XSS hardening: sanitiza nome, telefone e preferências antes de persistir.
    const safeName = sanitizeText(fullName);
    const safePhone = sanitizeText(phone);
    const safePreferences = sanitizeText(preferences);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: safeName, phone: safePhone })
      .eq('user_id', user!.id);

    if (profileError) {
      toast.error('Erro ao salvar perfil.');
      setSaving(false);
      return;
    }

    // Update client preferences
    if (clientId) {
      await supabase
        .from('clients')
        .update({
          name: safeName,
          phone: safePhone,
          preferences: { notes: safePreferences },
        })
        .eq('id', clientId);
    }

    toast.success('Perfil atualizado!');
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        Meu Perfil
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email || ''} disabled className="opacity-60" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Preferências (bebida, estilo, etc.)</Label>
            <Textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Ex: Cerveja artesanal, corte degradê, rock"
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
