import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scissors, Calendar, BarChart3, Users, Bell, Star, Shield,
  UserPlus, Settings, Rocket, Check, X, Menu, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Cycle = 'monthly' | 'annual';

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#planos', label: 'Planos' },
  { href: '#depoimentos', label: 'Depoimentos' },
];

const FEATURES = [
  { icon: Calendar, color: 'text-blue-400 bg-blue-500/10', title: 'Agendamento Online 24h', desc: 'Seus clientes agendam pelo celular a qualquer hora, sem precisar ligar ou mandar mensagem.' },
  { icon: BarChart3, color: 'text-emerald-400 bg-emerald-500/10', title: 'Relatórios Financeiros', desc: 'Acompanhe faturamento por barbeiro, serviço e período. Tome decisões baseadas em dados reais.' },
  { icon: Users, color: 'text-purple-400 bg-purple-500/10', title: 'Painel de Cada Barbeiro', desc: 'Cada profissional acessa sua própria agenda, histórico e métricas de desempenho.' },
  { icon: Bell, color: 'text-amber-400 bg-amber-500/10', title: 'Lembretes Automáticos', desc: 'Notificações automáticas para clientes antes do horário. Reduza faltas e no-shows.' },
  { icon: Star, color: 'text-orange-400 bg-orange-500/10', title: 'CRM e Histórico de Clientes', desc: 'Preferências, histórico de cortes e alertas de retorno para cada cliente cadastrado.' },
  { icon: Shield, color: 'text-cyan-400 bg-cyan-500/10', title: 'Segurança de Nível Bancário', desc: 'Dados protegidos com criptografia, autenticação em dois fatores e auditoria completa.' },
];

const STEPS = [
  { icon: UserPlus, title: 'Cadastre sua barbearia', desc: 'Crie sua conta em menos de 2 minutos. Sem burocracia, sem cartão de crédito.' },
  { icon: Settings, title: 'Configure em minutos', desc: 'Adicione seus barbeiros, serviços e horários de funcionamento.' },
  { icon: Rocket, title: 'Comece a receber agendamentos', desc: 'Compartilhe seu link personalizado e pronto. Seus clientes já podem agendar online.' },
];

const PLANS = [
  {
    key: 'start',
    badge: 'Para começar',
    name: 'Start',
    monthly: 69,
    annual: 51.75,
    barbers: 'Até 2 barbeiros incluídos',
    features: [
      { ok: true, label: 'Agendamento online' },
      { ok: true, label: 'Página pública da barbearia' },
      { ok: true, label: 'Cadastro de clientes' },
      { ok: true, label: 'Painel do barbeiro' },
      { ok: true, label: 'Lembretes automáticos' },
      { ok: true, label: 'Botão WhatsApp' },
      { ok: false, label: 'Relatórios financeiros' },
      { ok: false, label: 'CRM avançado' },
      { ok: false, label: 'IA e automações' },
    ],
    cta: 'Começar grátis',
    href: '/onboarding',
    highlight: false,
  },
  {
    key: 'pro',
    badge: 'Mais Popular',
    name: 'Pro',
    monthly: 149,
    annual: 111.75,
    barbers: 'Até 5 barbeiros (+R$ 29 por extra)',
    features: [
      { ok: true, label: 'Tudo do Start' },
      { ok: true, label: 'Relatórios financeiros completos' },
      { ok: true, label: 'CRM e histórico de clientes' },
      { ok: true, label: 'Alertas de retorno automáticos' },
      { ok: true, label: 'Campanhas de aniversário' },
      { ok: true, label: 'Gestão de produtos' },
      { ok: true, label: 'Dashboard analytics' },
      { ok: true, label: 'Fila de espera' },
      { ok: false, label: 'IA para WhatsApp' },
    ],
    cta: 'Começar grátis',
    href: '/onboarding',
    highlight: true,
  },
  {
    key: 'enterprise',
    badge: 'Para redes',
    name: 'Enterprise',
    monthly: 349,
    annual: 261.75,
    barbers: 'Até 15 barbeiros (+R$ 25 por extra)',
    features: [
      { ok: true, label: 'Tudo do Pro' },
      { ok: true, label: 'Múltiplas unidades (até 3)' },
      { ok: true, label: 'IA para WhatsApp' },
      { ok: true, label: 'Domínio próprio' },
      { ok: true, label: 'White label' },
      { ok: true, label: 'API access' },
      { ok: true, label: 'Suporte prioritário' },
      { ok: true, label: 'Gerente de conta dedicado' },
    ],
    cta: 'Falar com consultor',
    href: 'https://wa.me/?text=Ol%C3%A1!%20Quero%20saber%20sobre%20o%20plano%20Enterprise%20do%20Navalhapp',
    highlight: false,
    external: true,
  },
];

const TESTIMONIALS = [
  { initials: 'MR', color: 'bg-amber-500', name: 'Marcos Ribeiro', city: 'São Paulo, SP', text: 'Antes eu perdia agendamento por falta de organização. Hoje minha barbearia funciona no automático. Os clientes adoram marcar pelo celular.' },
  { initials: 'FS', color: 'bg-blue-500', name: 'Felipe Santos', city: 'Belo Horizonte, MG', text: 'Os relatórios me mostraram que estava ganhando menos do que achava. Ajustei os preços e aumentei o faturamento em 30%.' },
  { initials: 'CB', color: 'bg-purple-500', name: 'Carlos Barbosa', city: 'Curitiba, PR', text: 'Minha equipe adorou ter painel individual. Cada barbeiro vê sua própria agenda e produtividade. Zero confusão.' },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.55, delay, ease: 'easeOut' as const },
  };
}

export default function LandingPage() {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100" style={{ scrollBehavior: 'smooth' }}>
      {/* HEADER */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5 text-black -rotate-45" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Navalhapp</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-neutral-300 hover:text-amber-400 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-neutral-200 hover:text-white hover:bg-white/5">
                Entrar
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                Começar grátis
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-neutral-200"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/5">
            <div className="px-4 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-neutral-300 hover:text-amber-400 py-2"
                >
                  {l.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-neutral-200">Entrar</Button>
              </Link>
              <Link to="/onboarding" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                  Começar grátis
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.6))]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23fff' d='M20 4l2 14 14 2-14 2-2 14-2-14L4 20l14-2z'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs sm:text-sm font-medium mb-8">
            <Scissors className="w-3.5 h-3.5" />
            14 dias grátis · Sem cartão de crédito
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Sua barbearia merece<br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              uma gestão profissional
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            Agendamento online, controle financeiro, gestão de equipe e muito mais — tudo em um só lugar.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/onboarding">
              <Button size="lg" className="h-14 px-8 text-base bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-xl shadow-amber-500/20 w-full sm:w-auto">
                Cadastrar minha barbearia
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/20 bg-transparent hover:bg-white/5 text-white w-full sm:w-auto">
                Ver demonstração
              </Button>
            </a>
          </motion.div>

          <motion.div {...fadeUp(0.4)} className="flex items-center justify-center gap-3 text-sm text-neutral-500">
            <div className="flex -space-x-2">
              {['#f59e0b', '#3b82f6', '#a855f7', '#10b981', '#ef4444'].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-black"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span>Junte-se a mais de 200 barbearias que já usam o Navalhapp</span>
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 bg-neutral-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-500 uppercase tracking-widest mb-6">
            Confiado por barbearias em todo o Brasil
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-neutral-500 font-display text-lg sm:text-xl">
            <span>Barbearia Dom Pedro</span>
            <span>·</span>
            <span>Studio Vintage</span>
            <span>·</span>
            <span>Corte &amp; Arte</span>
            <span>·</span>
            <span>BarberKing</span>
            <span>·</span>
            <span>O Navalha</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Tudo que sua barbearia precisa</h2>
            <p className="text-lg text-neutral-400">Uma plataforma completa para organizar, crescer e fidelizar.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.05)}
                className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-amber-500/20 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-neutral-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Comece em 3 minutos</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.title} {...fadeUp(i * 0.1)} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black mb-4 shadow-lg shadow-amber-500/20">
                    <s.icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black border-2 border-amber-500 text-amber-400 text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-neutral-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/onboarding">
              <Button size="lg" className="h-12 px-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                Criar minha conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Planos para todos os tamanhos</h2>
            <p className="text-lg text-neutral-400">Comece grátis por 14 dias. Cancele quando quiser.</p>
          </motion.div>

          {/* Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 rounded-full bg-neutral-900 border border-white/5">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  cycle === 'monthly' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setCycle('annual')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  cycle === 'annual' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Anual <span className="text-xs opacity-70">-25%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((p) => {
              const price = cycle === 'annual' ? p.annual : p.monthly;
              return (
                <motion.div
                  key={p.key}
                  {...fadeUp()}
                  className={`relative p-8 rounded-2xl border transition-all ${
                    p.highlight
                      ? 'bg-gradient-to-b from-amber-500/10 to-neutral-900 border-amber-500/40 shadow-xl shadow-amber-500/10 md:scale-105'
                      : 'bg-neutral-900/50 border-white/5'
                  }`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
                      Mais Popular
                    </span>
                  )}
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">{p.badge}</p>
                  <h3 className="text-2xl font-bold mb-4">{p.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">R$ {fmt(price)}</span>
                    <span className="text-neutral-400">/mês</span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-6">{p.barbers}</p>

                  <ul className="space-y-3 mb-8 min-h-[280px]">
                    {p.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2 text-sm">
                        {f.ok ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-neutral-700 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={f.ok ? 'text-neutral-200' : 'text-neutral-600'}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  {p.external ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white">
                        {p.cta}
                      </Button>
                    </a>
                  ) : (
                    <Link to={p.href}>
                      <Button
                        className={`w-full ${
                          p.highlight
                            ? 'bg-amber-500 hover:bg-amber-400 text-black font-semibold'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                        }`}
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-neutral-500 mt-8">
            ✓ 14 dias grátis · ✓ Sem cartão de crédito · ✓ Cancele quando quiser · ✓ Migração gratuita
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="depoimentos" className="py-24 bg-neutral-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">O que nossos clientes dizem</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp(i * 0.08)}
                className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-neutral-300 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-black">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="text-4xl sm:text-5xl font-bold mb-4">
            Comece hoje mesmo, grátis
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="text-lg sm:text-xl text-black/80 mb-8">
            14 dias para testar tudo sem compromisso. Sem cartão de crédito. Configure em minutos.
          </motion.p>
          <motion.div {...fadeUp(0.2)}>
            <Link to="/onboarding">
              <Button size="lg" className="h-14 px-10 text-base bg-black text-amber-400 hover:bg-neutral-900 font-semibold shadow-2xl">
                Cadastrar minha barbearia agora
              </Button>
            </Link>
            <p className="mt-4 text-sm text-black/70">
              Já tem uma conta?{' '}
              <Link to="/login" className="underline font-semibold">Fazer login</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-black -rotate-45" strokeWidth={2.5} />
                </div>
                <span className="font-bold">Navalhapp</span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                A plataforma completa de gestão para barbearias modernas.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wide">Produto</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><a href="#funcionalidades" className="hover:text-amber-400">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-amber-400">Planos</a></li>
                <li><a href="#" className="hover:text-amber-400">Segurança</a></li>
                <li><a href="#" className="hover:text-amber-400">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wide">Suporte</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><a href="#" className="hover:text-amber-400">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-amber-400">Contato</a></li>
                <li><a href="#" className="hover:text-amber-400">Status do sistema</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><a href="#" className="hover:text-amber-400">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-amber-400">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-amber-400">LGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
            <p>© 2025 Navalhapp. Todos os direitos reservados.</p>
            <p>Feito com ♥ para barbearias brasileiras</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20Navalhapp%20para%20minha%20barbearia."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow-2xl shadow-green-500/30 transition-transform hover:scale-110"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}