/**
 * Plan-based feature access control system.
 *
 * Each company has a plan: 'start' | 'pro' | 'enterprise'.
 * This module maps features to plans and provides helpers
 * for checking access both in UI and via the backend function
 * `get_company_plan()`.
 */

export type CompanyPlan = 'start' | 'pro' | 'enterprise';

export type Feature =
  | 'scheduling'
  | 'public_page'
  | 'customers'
  | 'barber_panel'
  | 'reminders'
  | 'whatsapp_button'
  | 'location'
  | 'reports'
  | 'return_alerts'
  | 'customer_preferences'
  | 'products'
  | 'birthday_campaigns'
  | 'advanced_schedule'
  | 'ai_whatsapp'
  | 'automations'
  | 'priority_support'
  | 'custom_features';

const START_FEATURES: Feature[] = [
  'scheduling',
  'public_page',
  'customers',
  'barber_panel',
  'reminders',
  'whatsapp_button',
  'location',
];

const PRO_FEATURES: Feature[] = [
  ...START_FEATURES,
  'reports',
  'return_alerts',
  'customer_preferences',
  'products',
  'birthday_campaigns',
  'advanced_schedule',
];

const ENTERPRISE_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  'ai_whatsapp',
  'automations',
  'priority_support',
  'custom_features',
];

export const PLAN_FEATURES: Record<CompanyPlan, Feature[]> = {
  start: START_FEATURES,
  pro: PRO_FEATURES,
  enterprise: ENTERPRISE_FEATURES,
};

/** Human-readable plan labels */
export const PLAN_LABELS: Record<CompanyPlan, string> = {
  start: 'Start',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/** Plan colors for badges */
export const PLAN_COLORS: Record<CompanyPlan, string> = {
  start: 'bg-green-500/20 text-green-600',
  pro: 'bg-blue-500/20 text-blue-600',
  enterprise: 'bg-purple-500/20 text-purple-600',
};

/** Plan pricing */
export const PLAN_PRICING: Record<CompanyPlan, { base: number; perBarber: number }> = {
  start: { base: 29, perBarber: 19 },
  pro: { base: 49, perBarber: 19 },
  enterprise: { base: 99, perBarber: 19 },
};

/** Feature labels for display */
export const FEATURE_LABELS: Record<Feature, string> = {
  scheduling: 'Agendamento Online',
  public_page: 'Página Pública',
  customers: 'Cadastro de Clientes',
  barber_panel: 'Painel do Barbeiro',
  reminders: 'Lembretes Automáticos',
  whatsapp_button: 'Botão de WhatsApp',
  location: 'Localização',
  reports: 'Relatórios Completos',
  return_alerts: 'Alertas de Retorno',
  customer_preferences: 'Preferências de Clientes',
  products: 'Gestão de Produtos',
  birthday_campaigns: 'Campanhas de Aniversário',
  advanced_schedule: 'Controle Avançado da Agenda',
  ai_whatsapp: 'IA para WhatsApp',
  automations: 'Automações Avançadas',
  priority_support: 'Suporte Prioritário',
  custom_features: 'Personalizações',
};

/** Returns the minimum plan required for a feature */
export function getMinimumPlan(feature: Feature): CompanyPlan {
  if (START_FEATURES.includes(feature)) return 'start';
  if (PRO_FEATURES.includes(feature)) return 'pro';
  return 'enterprise';
}

/** Check if a plan has access to a feature */
export function hasFeatureAccess(plan: CompanyPlan | null | undefined, feature: Feature): boolean {
  if (!plan) return false;
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/** Get upgrade message for a blocked feature */
export function getUpgradeMessage(feature: Feature): string {
  const minPlan = getMinimumPlan(feature);
  return `Essa funcionalidade está disponível a partir do plano ${PLAN_LABELS[minPlan]}.`;
}
