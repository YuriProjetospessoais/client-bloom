import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Phone, Clock, ImageIcon, Loader2, Save, MapPin, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  logo_url: string;
  google_maps_url: string;
  latitude: number | null;
  longitude: number | null;
  whatsapp_number: string;
}

interface WorkingHourRow {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const DEFAULT_HOURS: WorkingHourRow[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '19:00',
  is_available: i >= 1 && i <= 6,
}));

export default function CompanySettingsTab() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [hours, setHours] = useState<WorkingHourRow[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: role } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role?.company_id) return;
      setCompanyId(role.company_id);

      const [companyRes, hoursRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, description, address, phone, logo_url, google_maps_url, city, state, zip_code, latitude, longitude, whatsapp_number')
          .eq('id', role.company_id)
          .single(),
        supabase
          .from('working_hours')
          .select('id, day_of_week, start_time, end_time, is_available')
          .eq('company_id', role.company_id)
          .is('professional_id', null)
          .order('day_of_week'),
      ]);

      if (companyRes.data) {
        const d = companyRes.data as any;
        setCompany({
          id: d.id,
          name: d.name || '',
          description: d.description || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || '',
          zip_code: d.zip_code || '',
          phone: d.phone || '',
          logo_url: d.logo_url || '',
          google_maps_url: d.google_maps_url || '',
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
          whatsapp_number: d.whatsapp_number || '',
        });
      }

      if (hoursRes.data && hoursRes.data.length > 0) {
        const merged = DEFAULT_HOURS.map(dh => {
          const found = hoursRes.data!.find(h => h.day_of_week === dh.day_of_week);
          return found ? { ...found } : dh;
        });
        setHours(merged);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${companyId}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('company_assets')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('company_assets').getPublicUrl(path);
      const logoUrl = `${data.publicUrl}?t=${Date.now()}`;

      setCompany(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      toast.success('Logo enviada!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!company || !companyId) return;
    setSaving(true);

    try {
      const updatePayload: any = {
        name: company.name,
        description: company.description || null,
        address: company.address || null,
        city: company.city || null,
        state: company.state || null,
        zip_code: company.zip_code || null,
        phone: company.phone || null,
        logo_url: company.logo_url || null,
        google_maps_url: company.google_maps_url || null,
        latitude: company.latitude,
        longitude: company.longitude,
        whatsapp_number: company.whatsapp_number || null,
      };

      const { error: companyErr } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('id', companyId);

      if (companyErr) throw companyErr;

      for (const h of hours) {
        if (h.id) {
          await supabase
            .from('working_hours')
            .update({ start_time: h.start_time, end_time: h.end_time, is_available: h.is_available })
            .eq('id', h.id);
        } else {
          const { data } = await supabase
            .from('working_hours')
            .insert({ company_id: companyId, day_of_week: h.day_of_week, start_time: h.start_time, end_time: h.end_time, is_available: h.is_available })
            .select('id')
            .single();
          if (data) h.id = data.id;
        }
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (dayIndex: number, field: keyof WorkingHourRow, value: any) => {
    setHours(prev => prev.map(h =>
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const updateField = (field: keyof CompanyData, value: any) => {
    setCompany(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Barbearia
          </CardTitle>
          <CardDescription>Informações exibidas na landing page e portal do cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="relative">
                <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleLogoUpload} disabled={uploading} />
                <Button type="button" variant="outline" size="sm" disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {uploading ? 'Enviando...' : 'Alterar Logo'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbershop-name">Nome da Barbearia *</Label>
            <Input id="barbershop-name" value={company?.name || ''} onChange={e => updateField('name', e.target.value)} placeholder="Ex: Barbearia do João" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbershop-desc">Descrição</Label>
            <Textarea id="barbershop-desc" value={company?.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Uma breve descrição da sua barbearia..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localização
          </CardTitle>
          <CardDescription>Endereço e coordenadas para exibição no mapa da landing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barbershop-address">Endereço (Rua, número, bairro)</Label>
            <Input id="barbershop-address" value={company?.address || ''} onChange={e => updateField('address', e.target.value)} placeholder="Rua Exemplo, 123 - Bairro" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barbershop-city">Cidade</Label>
              <Input id="barbershop-city" value={company?.city || ''} onChange={e => updateField('city', e.target.value)} placeholder="São Paulo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-state">Estado</Label>
              <Input id="barbershop-state" value={company?.state || ''} onChange={e => updateField('state', e.target.value)} placeholder="SP" maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-zip">CEP</Label>
              <Input id="barbershop-zip" value={company?.zip_code || ''} onChange={e => updateField('zip_code', e.target.value)} placeholder="01001-000" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barbershop-lat">Latitude</Label>
              <Input id="barbershop-lat" type="number" step="any" value={company?.latitude ?? ''} onChange={e => updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)} placeholder="-23.550520" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-lng">Longitude</Label>
              <Input id="barbershop-lng" type="number" step="any" value={company?.longitude ?? ''} onChange={e => updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)} placeholder="-46.633308" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbershop-maps">Link do Google Maps (opcional)</Label>
            <Input id="barbershop-maps" value={company?.google_maps_url || ''} onChange={e => updateField('google_maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
            <p className="text-xs text-muted-foreground">Se preenchido, será usado como link direto. Caso contrário, usamos latitude/longitude ou endereço.</p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </CardTitle>
          <CardDescription>Número exibido no botão flutuante de WhatsApp da landing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barbershop-whatsapp">Número do WhatsApp</Label>
            <Input
              id="barbershop-whatsapp"
              value={company?.whatsapp_number || ''}
              onChange={e => updateField('whatsapp_number', e.target.value)}
              placeholder="5511999999999"
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional sem espaços ou traços. Ex: 5511999999999 (55 = Brasil, 11 = DDD)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbershop-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone (exibido na landing page)
            </Label>
            <Input
              id="barbershop-phone"
              value={company?.phone || ''}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                let masked = raw;
                if (raw.length > 6) {
                  masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                } else if (raw.length > 2) {
                  masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                } else if (raw.length > 0) {
                  masked = `(${raw}`;
                }
                updateField('phone', masked);
              }}
              placeholder="(11) 99999-9999"
              maxLength={16}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Define os dias e horários disponíveis para agendamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hours.map(h => (
              <div key={h.day_of_week} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="w-24 shrink-0">
                  <span className="font-medium text-sm text-foreground">{DAY_NAMES[h.day_of_week]}</span>
                </div>
                <Switch checked={h.is_available} onCheckedChange={val => updateHour(h.day_of_week, 'is_available', val)} />
                {h.is_available ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={h.start_time} onChange={e => updateHour(h.day_of_week, 'start_time', e.target.value)} className="w-28" />
                    <span className="text-muted-foreground text-sm">até</span>
                    <Input type="time" value={h.end_time} onChange={e => updateHour(h.day_of_week, 'end_time', e.target.value)} className="w-28" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button className="gradient-primary text-white gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
