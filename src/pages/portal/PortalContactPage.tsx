import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface CompanyContact {
  name: string;
  phone: string | null;
  address: string | null;
  google_maps_url: string | null;
}

export default function PortalContactPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadCompany();
  }, [user]);

  async function loadCompany() {
    setLoading(true);
    const { data: role } = await supabase
      .from('user_roles')
      .select('company_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!role?.company_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('companies')
      .select('name, phone, address, google_maps_url')
      .eq('id', role.company_id)
      .single();

    if (data) {
      setCompany(data as any);
    }
    setLoading(false);
  }

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  const whatsappUrl = company?.phone
    ? `https://wa.me/55${cleanPhone(company.phone)}?text=${encodeURIComponent('Olá! Gostaria de falar com a barbearia.')}`
    : null;

  const mapsEmbedUrl = company?.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(company.address)}&output=embed`
    : null;

  const mapsOpenUrl = company?.google_maps_url
    || (company?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}` : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Informações de contato não disponíveis.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contato e Localização</h1>
        <p className="text-muted-foreground">Entre em contato ou visite {company.name}</p>
      </div>

      {/* WhatsApp */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {whatsappUrl ? (
            <Button asChild size="lg" className="w-full gap-2 text-base h-14">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Falar com a Barbearia no WhatsApp
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Número de WhatsApp não configurado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {company.address ? (
            <>
              <p className="text-foreground font-medium">{company.address}</p>

              {/* Embedded Map */}
              <div className="w-full aspect-video rounded-lg overflow-hidden border">
                <iframe
                  src={mapsEmbedUrl!}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização da barbearia"
                />
              </div>

              {/* Open in Maps */}
              {mapsOpenUrl && (
                <Button asChild variant="outline" size="lg" className="w-full gap-2 h-14 text-base">
                  <a href={mapsOpenUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5" />
                    Abrir no Google Maps
                  </a>
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Endereço não configurado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
