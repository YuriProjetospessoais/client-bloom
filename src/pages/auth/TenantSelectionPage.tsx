import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Scissors, ChevronRight, LogOut, Crown, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import barbershopBg from '@/assets/barbershop-bg.jpg';

interface TenantMembership {
  companyId: string;
  companyName: string;
  slug: string | null;
  primaryColor: string;
  logoUrl: string | null;
  role: string;
  status: string;
}

const ROLE_META: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  company_admin: { label: 'Administrador', icon: Crown, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  employee: { label: 'Colaborador', icon: Briefcase, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  client: { label: 'Cliente', icon: User, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

function getRoleDestination(role: string, slug: string): string {
  if (role === 'company_admin') return `/${slug}/admin`;
  if (role === 'employee') return `/${slug}/agenda`;
  return `/${slug}/dashboard`;
}

export default function TenantSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchMemberships() {
      setLoading(true);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', user!.id)
        .not('company_id', 'is', null);

      if (!roles || roles.length === 0) {
        setLoading(false);
        return;
      }

      const companyIds = roles.map(r => r.company_id!);

      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, slug, primary_color, logo_url, status')
        .in('id', companyIds);

      if (!companies) {
        setLoading(false);
        return;
      }

      const merged: TenantMembership[] = roles
        .map(r => {
          const company = companies.find(c => c.id === r.company_id);
          if (!company) return null;
          return {
            companyId: company.id,
            companyName: company.name,
            slug: company.slug,
            primaryColor: company.primary_color || '#8B5CF6',
            logoUrl: company.logo_url,
            role: r.role,
            status: company.status,
          } as TenantMembership;
        })
        .filter(Boolean) as TenantMembership[];

      setMemberships(merged);
      setLoading(false);
    }

    fetchMemberships();
  }, [user]);

  const handleSelect = (membership: TenantMembership) => {
    if (!membership.slug) return;
    setNavigating(membership.companyId);
    navigate(getRoleDestination(membership.role, membership.slug));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barbershopBg})` }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold mb-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
            <Scissors size={28} className="text-white relative z-10 rotate-[-45deg] drop-shadow-md" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">
            Barber<span className="text-gold">Flow</span>
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Olá, <span className="text-white font-medium">{user?.name}</span>. Selecione uma empresa para continuar.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          <div className="p-6 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Minhas Empresas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {memberships.length} empresa{memberships.length !== 1 ? 's' : ''} disponível{memberships.length !== 1 ? 'is' : ''}
            </p>
          </div>

          <div className="p-4 max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando empresas...</p>
              </div>
            ) : memberships.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhuma empresa encontrada</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Você ainda não tem acesso a nenhuma empresa. Solicite um convite ao administrador.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {memberships.map((m) => {
                  const roleMeta = ROLE_META[m.role] || ROLE_META.client;
                  const RoleIcon = roleMeta.icon;
                  const isActive = m.status === 'active';
                  const isNavigating = navigating === m.companyId;

                  return (
                    <motion.div key={m.companyId} variants={cardVariants}>
                      <button
                        onClick={() => isActive && handleSelect(m)}
                        disabled={!isActive || !m.slug || !!navigating}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left group
                          ${isActive && m.slug
                            ? 'border-border/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                            : 'border-border/30 opacity-50 cursor-not-allowed bg-muted/20'
                          }
                          ${isNavigating ? 'border-primary/60 bg-primary/10' : ''}
                        `}
                      >
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                          style={{ backgroundColor: m.primaryColor }}
                        >
                          {m.logoUrl ? (
                            <img src={m.logoUrl} alt={m.companyName} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            m.companyName.charAt(0)
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground truncate">{m.companyName}</p>
                            {!isActive && (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">Suspenso</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`text-xs border ${roleMeta.color} gap-1`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleMeta.label}
                            </Badge>
                            {m.slug && (
                              <span className="text-xs text-muted-foreground">/{m.slug}</span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        {isActive && m.slug && (
                          <div className="flex-shrink-0">
                            {isNavigating ? (
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            )}
                          </div>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
