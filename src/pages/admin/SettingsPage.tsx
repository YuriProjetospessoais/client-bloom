import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, ShieldCheck, Clock, Loader2, Save } from 'lucide-react';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { toast } from 'sonner';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface PolicyForm {
  cancel_limit_hours: number;
  max_advance_days: number;
  max_active_appointments: number;
  commission_percent: number;
}

interface WorkingHourRow {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_HOURS: WorkingHourRow[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '19:00',
  is_available: i >= 1 && i <= 6,
}));

function PolicyTab() {
  const companyId = useTenantId();
  const [form, setForm] = useState<PolicyForm>({
    cancel_limit_hours: 12,
    max_advance_days: 30,
    max_active_appointments: 3,
    commission_percent: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('cancel_limit_hours, max_advance_days, max_active_appointments, commission_percent')
        .eq('id', companyId)
        .maybeSingle();
      if (!error && data) {
        setForm({
          cancel_limit_hours: data.cancel_limit_hours,
          max_advance_days: data.max_advance_days,
          max_active_appointments: data.max_active_appointments,
          commission_percent: Number(data.commission_percent),
        });
      }
      setLoading(false);
    })();
  }, [companyId]);

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from('companies').update(form).eq('id', companyId);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar política');
    } else {
      toast.success('Política salva.');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" />Política de Agendamento</CardTitle>
        <CardDescription>Regras gerais para clientes e equipe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cancelamento — limite (horas)</Label>
            <Input type="number" min={0} value={form.cancel_limit_hours}
              onChange={(e) => setForm({ ...form, cancel_limit_hours: parseInt(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground">Cliente pode cancelar até X horas antes.</p>
          </div>
          <div className="space-y-2">
            <Label>Antecedência máxima (dias)</Label>
            <Input type="number" min={1} value={form.max_advance_days}
              onChange={(e) => setForm({ ...form, max_advance_days: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="space-y-2">
            <Label>Agendamentos ativos por cliente</Label>
            <Input type="number" min={1} value={form.max_active_appointments}
              onChange={(e) => setForm({ ...form, max_active_appointments: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="space-y-2">
            <Label>Comissão padrão (%)</Label>
            <Input type="number" min={0} max={100} step="0.01" value={form.commission_percent}
              onChange={(e) => setForm({ ...form, commission_percent: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="gradient-primary text-white gap-2" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HoursTab() {
  const companyId = useTenantId();
  const [hours, setHours] = useState<WorkingHourRow[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from('working_hours')
        .select('id, day_of_week, start_time, end_time, is_available')
        .eq('company_id', companyId)
        .is('professional_id', null)
        .order('day_of_week');
      if (data && data.length > 0) {
        setHours(DEFAULT_HOURS.map((d) => {
          const f = data.find((h) => h.day_of_week === d.day_of_week);
          return f ? { ...d, ...f, start_time: f.start_time.slice(0, 5), end_time: f.end_time.slice(0, 5) } : d;
        }));
      }
      setLoading(false);
    })();
  }, [companyId]);

  const update = (day: number, field: keyof WorkingHourRow, value: any) => {
    setHours((prev) => prev.map((h) => h.day_of_week === day ? { ...h, [field]: value } : h));
  };

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      for (const h of hours) {
        if (h.id) {
          await supabase.from('working_hours')
            .update({ start_time: h.start_time, end_time: h.end_time, is_available: h.is_available })
            .eq('id', h.id);
        } else {
          const { data } = await supabase.from('working_hours').insert({
            company_id: companyId,
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
            is_available: h.is_available,
          }).select('id').single();
          if (data) h.id = data.id;
        }
      }
      toast.success('Horários salvos.');
    } catch {
      toast.error('Erro ao salvar horários.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Horários de Funcionamento</CardTitle>
        <CardDescription>Define dias e horários disponíveis para agendamento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hours.map((h) => (
          <div key={h.day_of_week} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="w-24 shrink-0 font-medium text-sm">{DAY_NAMES[h.day_of_week]}</div>
            <Switch checked={h.is_available} onCheckedChange={(v) => update(h.day_of_week, 'is_available', v)} />
            {h.is_available ? (
              <div className="flex items-center gap-2">
                <Input type="time" value={h.start_time} onChange={(e) => update(h.day_of_week, 'start_time', e.target.value)} className="w-28" />
                <span className="text-muted-foreground text-sm">até</span>
                <Input type="time" value={h.end_time} onChange={(e) => update(h.day_of_week, 'end_time', e.target.value)} className="w-28" />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button className="gradient-primary text-white gap-2" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.settings}</h1>
        <p className="text-muted-foreground mt-1">Configurações da empresa e do agendamento</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" />Empresa</TabsTrigger>
          <TabsTrigger value="policy" className="gap-2"><ShieldCheck className="w-4 h-4" />Política</TabsTrigger>
          <TabsTrigger value="hours" className="gap-2"><Clock className="w-4 h-4" />Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6"><CompanySettingsTab /></TabsContent>
        <TabsContent value="policy" className="mt-6"><PolicyTab /></TabsContent>
        <TabsContent value="hours" className="mt-6"><HoursTab /></TabsContent>
      </Tabs>
    </div>
  );
}
