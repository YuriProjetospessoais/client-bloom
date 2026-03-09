import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/lib/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Scissors, MapPin, Phone, Clock, Instagram, Facebook, ArrowRight } from 'lucide-react';
import TenantNotFound from './TenantNotFound';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface Professional {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[] | null;
}

interface CompanyDetails {
  address: string | null;
  phone: string | null;
  email: string | null;
}

export default function TenantLandingPage() {
  const { slug } = useParams();
  const { tenant, isLoading: isTenantLoading, error } = useTenant();
  
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!tenant?.id) return;

    async function fetchData() {
      setIsLoadingData(true);
      
      const [servicesRes, profsRes, companyRes] = await Promise.all([
        supabase.from('services').select('*').eq('company_id', tenant.id).eq('active', true).order('name'),
        supabase.from('professionals').select('*').eq('company_id', tenant.id).eq('active', true).order('name'),
        supabase.from('companies').select('address, phone, email').eq('id', tenant.id).single()
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (profsRes.data) setProfessionals(profsRes.data);
      if (companyRes.data) setCompanyDetails(companyRes.data);
      
      setIsLoadingData(false);
    }

    fetchData();
  }, [tenant?.id]);

  if (isTenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tenant) return <TenantNotFound />;

  const primaryStyle = { backgroundColor: tenant.primaryColor, color: '#fff' };
  const primaryText = { color: tenant.primaryColor };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* Navbar Minimalista */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="h-8 w-8 rounded flex items-center justify-center" style={primaryStyle}>
                <Scissors className="h-4 w-4" />
              </div>
            )}
            <span className="font-bold text-lg truncate max-w-[200px] sm:max-w-none">{tenant.name}</span>
          </div>
          <Button asChild size="sm" style={primaryStyle} className="hover:opacity-90">
            <Link to={`/${slug}/agendar`}>
              Agendar
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0 bg-muted/30" />
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, var(--tenant-primary-hex, var(--primary)) 0%, transparent 70%)',
          }}
        />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-32 w-32 rounded-3xl object-cover mx-auto shadow-2xl" />
          ) : (
            <div
              className="h-32 w-32 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
              style={primaryStyle}
            >
              <Scissors className="h-16 w-16" />
            </div>
          )}
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight font-display">
              {tenant.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experiência premium em barbearia. Agende seu horário de forma rápida e garanta um atendimento de excelência.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={primaryStyle}>
              <Link to={`/${slug}/agendar`}>
                <CalendarPlus className="mr-2 h-5 w-5" />
                Agendar Horário
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 bg-background/50 backdrop-blur-sm">
              <a href="#servicos">Ver Serviços</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 bg-muted/30 px-4 scroll-mt-16">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold font-display">Nossos Serviços</h2>
            <p className="text-muted-foreground">Tudo o que você precisa para um visual impecável</p>
          </div>

          {isLoadingData ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {services.map(service => (
                <Card key={service.id} className="border-border/50 hover:border-primary/50 transition-colors bg-card shadow-sm hover:shadow-md">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-3">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl" style={primaryText}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nenhum serviço cadastrado.</p>
          )}
        </div>
      </section>

      {/* Professionals Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold font-display">Nossa Equipe</h2>
            <p className="text-muted-foreground">Profissionais altamente qualificados</p>
          </div>

          {isLoadingData ? (
             <div className="flex justify-center gap-6 flex-wrap">
               {[1,2,3].map(i => (
                 <div key={i} className="w-48 h-56 bg-card rounded-2xl animate-pulse" />
               ))}
             </div>
          ) : professionals.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {professionals.map(prof => (
                <div key={prof.id} className="flex flex-col items-center text-center space-y-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{ backgroundColor: tenant.primaryColor }} />
                    <Avatar className="w-32 h-32 border-4 border-background shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={prof.avatar_url || ''} alt={prof.name} className="object-cover" />
                      <AvatarFallback className="text-3xl font-display font-bold text-white" style={{ backgroundColor: tenant.primaryColor }}>
                        {prof.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{prof.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {prof.specialties && prof.specialties.length > 0 ? prof.specialties.join(', ') : 'Especialista'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground">Nenhum profissional cadastrado.</p>
          )}
        </div>
      </section>

      {/* Booking CTA Section */}
      <section className="py-24 px-4 text-center text-white relative overflow-hidden" style={primaryStyle}>
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="container mx-auto max-w-3xl space-y-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight">Pronto para dar aquele trato no visual?</h2>
          <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto">
            Não perca tempo na fila. Agende seu horário agora mesmo e garanta sua vaga com seu profissional favorito.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg h-14 px-8 mt-4 hover:scale-105 transition-transform">
            <Link to={`/${slug}/agendar`} className="text-foreground">
              Agendar Meu Horário <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold font-display mb-2">Visite-nos</h2>
                <p className="text-muted-foreground">Venha conhecer nosso espaço e tomar uma com a gente.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-background shadow-sm" style={primaryText}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Endereço</h4>
                    <p className="text-muted-foreground mt-1">
                      {companyDetails?.address || 'Endereço não informado'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-background shadow-sm" style={primaryText}>
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Contato</h4>
                    <p className="text-muted-foreground mt-1">
                      {companyDetails?.phone || 'Telefone não informado'}
                      {companyDetails?.email && <><br/>{companyDetails.email}</>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-background shadow-sm" style={primaryText}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Horários</h4>
                    <p className="text-muted-foreground mt-1">
                      Consulte a disponibilidade no momento do agendamento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="aspect-square md:aspect-auto md:h-full bg-card rounded-3xl overflow-hidden relative border shadow-sm min-h-[300px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                <MapPin className="w-12 h-12 mb-4 opacity-50" />
                <span className="text-sm font-medium">Localização no mapa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-4 mt-auto">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-8 rounded object-cover grayscale opacity-80" />
            ) : (
              <Scissors className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="font-bold text-muted-foreground">{tenant.name}</span>
          </div>
          
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:text-foreground">
              <Instagram className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:text-foreground">
              <Facebook className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="container mx-auto max-w-5xl mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="font-display font-bold text-foreground">
              Navalh<span className="text-primary">app</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
