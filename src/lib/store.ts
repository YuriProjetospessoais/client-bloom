// LocalStorage persistence layer for all CRM data
// This provides centralized data management with automatic persistence

import { createId } from './mock/utils';

// ============= TYPES =============

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  phone?: string;
  createdAt: string;
}

export interface Procedure {
  id: string;
  name: string;
  duration: number;
  returnDays: number;
  price: number;
  active: boolean;
  category?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  birthDate?: string;
  notes?: string;
  lastVisit?: string;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  value: string;
  stage: 'new' | 'contact' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  source: string;
  lastContact: string;
  createdAt: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  procedureId?: string;
  procedureName: string;
  professionalId?: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: string;
  userLimit: number;
  currentUsers: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  features: string[];
  active: boolean;
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  plan: string;
  userLimit: number;
}

// ============= STORAGE KEYS =============

const STORAGE_KEYS = {
  USERS: 'crm_users',
  PROCEDURES: 'crm_procedures',
  CLIENTS: 'crm_clients',
  LEADS: 'crm_leads',
  APPOINTMENTS: 'crm_appointments',
  COMPANIES: 'crm_companies',
  PLANS: 'crm_plans',
  COMPANY_SETTINGS: 'crm_company_settings',
} as const;

// ============= DEFAULT DATA =============

const defaultUsers: User[] = [
  { id: 'user_1', name: 'Dr. João Silva', email: 'joao@clinica.com', role: 'admin', status: 'active', phone: '(11) 99999-0001', createdAt: '2025-01-01' },
  { id: 'user_2', name: 'Maria Santos', email: 'maria@clinica.com', role: 'user', status: 'active', phone: '(11) 99999-0002', createdAt: '2025-01-10' },
  { id: 'user_3', name: 'Ana Costa', email: 'ana@clinica.com', role: 'user', status: 'active', phone: '(11) 99999-0003', createdAt: '2025-01-15' },
];

const defaultProcedures: Procedure[] = [
  { id: 'proc_1', name: 'Limpeza de pele', duration: 60, returnDays: 30, price: 150, active: true, category: 'Facial' },
  { id: 'proc_2', name: 'Botox', duration: 45, returnDays: 180, price: 800, active: true, category: 'Estética' },
  { id: 'proc_3', name: 'Peeling', duration: 90, returnDays: 30, price: 350, active: true, category: 'Facial' },
  { id: 'proc_4', name: 'Tratamento Capilar', duration: 120, returnDays: 45, price: 500, active: true, category: 'Capilar' },
];

const defaultClients: Client[] = [
  { id: 'client_1', name: 'Fernanda Oliveira', email: 'fernanda@email.com', phone: '(11) 98765-4321', lastVisit: '2026-01-10', totalSpent: 2500, visitCount: 8, createdAt: '2025-03-15' },
  { id: 'client_2', name: 'Carlos Mendes', email: 'carlos@email.com', phone: '(11) 98765-4322', lastVisit: '2026-01-08', totalSpent: 1800, visitCount: 5, createdAt: '2025-04-20' },
  { id: 'client_3', name: 'Juliana Costa', email: 'juliana@email.com', phone: '(11) 98765-4323', lastVisit: '2025-12-15', totalSpent: 4200, visitCount: 15, createdAt: '2024-06-10' },
  { id: 'client_4', name: 'Roberto Santos', email: 'roberto@email.com', phone: '(11) 98765-4324', lastVisit: '2026-01-12', totalSpent: 950, visitCount: 3, createdAt: '2025-09-01' },
];

const defaultLeads: Lead[] = [
  { id: 'lead_1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-1111', value: 'R$ 500', stage: 'new', lastContact: 'Hoje', source: 'Instagram', createdAt: '2026-01-15' },
  { id: 'lead_2', name: 'João Pereira', email: 'joao@email.com', phone: '(11) 99999-2222', value: 'R$ 800', stage: 'new', lastContact: 'Ontem', source: 'Google', createdAt: '2026-01-14' },
  { id: 'lead_3', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-3333', value: 'R$ 1.200', stage: 'contact', lastContact: '2 dias', source: 'Indicação', createdAt: '2026-01-13' },
  { id: 'lead_4', name: 'Carlos Santos', email: 'carlos@email.com', phone: '(11) 99999-4444', value: 'R$ 2.500', stage: 'proposal', lastContact: 'Hoje', source: 'Site', createdAt: '2026-01-12' },
  { id: 'lead_5', name: 'Patricia Lima', email: 'patricia@email.com', phone: '(11) 99999-5555', value: 'R$ 750', stage: 'proposal', lastContact: '3 dias', source: 'Facebook', createdAt: '2026-01-11' },
  { id: 'lead_6', name: 'Roberto Alves', email: 'roberto@email.com', phone: '(11) 99999-6666', value: 'R$ 3.000', stage: 'negotiation', lastContact: 'Hoje', source: 'WhatsApp', createdAt: '2026-01-10' },
  { id: 'lead_7', name: 'Fernanda Reis', email: 'fernanda@email.com', phone: '(11) 99999-7777', value: 'R$ 1.800', stage: 'closed', lastContact: 'Ontem', source: 'Indicação', createdAt: '2026-01-09' },
];

const defaultAppointments: Appointment[] = [
  { id: 'apt_1', clientName: 'Fernanda Oliveira', procedureName: 'Limpeza de pele', professionalName: 'Dra. Maria Santos', date: '2026-01-18', time: '09:00', duration: 60, status: 'confirmed' },
  { id: 'apt_2', clientName: 'Carlos Mendes', procedureName: 'Botox', professionalName: 'Dr. João Silva', date: '2026-01-18', time: '10:00', duration: 45, status: 'confirmed' },
  { id: 'apt_3', clientName: 'Juliana Costa', procedureName: 'Peeling', professionalName: 'Dra. Ana Costa', date: '2026-01-18', time: '11:00', duration: 90, status: 'pending' },
  { id: 'apt_4', clientName: 'Roberto Santos', procedureName: 'Tratamento Capilar', professionalName: 'Dr. João Silva', date: '2026-01-18', time: '14:00', duration: 120, status: 'confirmed' },
];

const defaultCompanies: Company[] = [
  { id: 'comp_1', name: 'Clínica Saúde Total', cnpj: '12.345.678/0001-90', email: 'contato@saudetotal.com', phone: '(11) 3456-7890', plan: 'Professional', userLimit: 15, currentUsers: 8, status: 'active', createdAt: '2025-01-15' },
  { id: 'comp_2', name: 'Barbearia Vintage', cnpj: '98.765.432/0001-10', email: 'contato@vintage.com', phone: '(11) 3456-7891', plan: 'Starter', userLimit: 5, currentUsers: 3, status: 'active', createdAt: '2025-03-20' },
  { id: 'comp_3', name: 'Studio Beauty', cnpj: '11.222.333/0001-44', email: 'contato@studiobeauty.com', phone: '(11) 3456-7892', plan: 'Enterprise', userLimit: 50, currentUsers: 25, status: 'active', createdAt: '2024-08-10' },
  { id: 'comp_4', name: 'Clínica Bem Estar', cnpj: '44.555.666/0001-77', email: 'contato@bemestar.com', phone: '(11) 3456-7893', plan: 'Professional', userLimit: 15, currentUsers: 12, status: 'suspended', createdAt: '2025-06-05' },
];

const defaultPlans: Plan[] = [
  { id: 'plan_1', name: 'Starter', price: 97, userLimit: 5, features: ['Até 5 usuários', 'CRM básico', 'Agenda', 'Suporte por email'], active: true },
  { id: 'plan_2', name: 'Professional', price: 197, userLimit: 15, features: ['Até 15 usuários', 'CRM completo', 'Agenda avançada', 'Relatórios', 'Suporte prioritário'], active: true },
  { id: 'plan_3', name: 'Enterprise', price: 397, userLimit: 50, features: ['Até 50 usuários', 'CRM completo', 'Agenda avançada', 'Relatórios avançados', 'API', 'Suporte 24/7'], active: true },
];

const defaultCompanySettings: CompanySettings = {
  name: 'Clínica Saúde Total',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3456-7890',
  email: 'contato@clinicasaude.com',
  address: 'Av. Paulista, 1234 - São Paulo, SP',
  plan: 'Professional',
  userLimit: 15,
};

// ============= STORAGE HELPERS =============

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default value
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// ============= USERS STORE =============

export const usersStore = {
  getAll: (): User[] => getFromStorage(STORAGE_KEYS.USERS, defaultUsers),
  
  getById: (id: string): User | undefined => {
    const users = usersStore.getAll();
    return users.find(u => u.id === id);
  },
  
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = usersStore.getAll();
    const newUser: User = {
      ...user,
      id: createId('user'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setToStorage(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },
  
  update: (id: string, data: Partial<User>): User | undefined => {
    const users = usersStore.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    users[index] = { ...users[index], ...data };
    setToStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },
  
  delete: (id: string): boolean => {
    const users = usersStore.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    
    setToStorage(STORAGE_KEYS.USERS, filtered);
    return true;
  },
};

// ============= PROCEDURES STORE =============

export const proceduresStore = {
  getAll: (): Procedure[] => getFromStorage(STORAGE_KEYS.PROCEDURES, defaultProcedures),
  
  getById: (id: string): Procedure | undefined => {
    const procedures = proceduresStore.getAll();
    return procedures.find(p => p.id === id);
  },
  
  create: (procedure: Omit<Procedure, 'id'>): Procedure => {
    const procedures = proceduresStore.getAll();
    const newProcedure: Procedure = {
      ...procedure,
      id: createId('proc'),
    };
    setToStorage(STORAGE_KEYS.PROCEDURES, [...procedures, newProcedure]);
    return newProcedure;
  },
  
  update: (id: string, data: Partial<Procedure>): Procedure | undefined => {
    const procedures = proceduresStore.getAll();
    const index = procedures.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    procedures[index] = { ...procedures[index], ...data };
    setToStorage(STORAGE_KEYS.PROCEDURES, procedures);
    return procedures[index];
  },
  
  delete: (id: string): boolean => {
    const procedures = proceduresStore.getAll();
    const filtered = procedures.filter(p => p.id !== id);
    if (filtered.length === procedures.length) return false;
    
    setToStorage(STORAGE_KEYS.PROCEDURES, filtered);
    return true;
  },
};

// ============= CLIENTS STORE =============

export const clientsStore = {
  getAll: (): Client[] => getFromStorage(STORAGE_KEYS.CLIENTS, defaultClients),
  
  getById: (id: string): Client | undefined => {
    const clients = clientsStore.getAll();
    return clients.find(c => c.id === id);
  },
  
  create: (client: Omit<Client, 'id' | 'createdAt' | 'totalSpent' | 'visitCount'>): Client => {
    const clients = clientsStore.getAll();
    const newClient: Client = {
      ...client,
      id: createId('client'),
      createdAt: new Date().toISOString().split('T')[0],
      totalSpent: 0,
      visitCount: 0,
    };
    setToStorage(STORAGE_KEYS.CLIENTS, [...clients, newClient]);
    return newClient;
  },
  
  update: (id: string, data: Partial<Client>): Client | undefined => {
    const clients = clientsStore.getAll();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    clients[index] = { ...clients[index], ...data };
    setToStorage(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },
  
  delete: (id: string): boolean => {
    const clients = clientsStore.getAll();
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    
    setToStorage(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },
};

// ============= LEADS STORE =============

export const leadsStore = {
  getAll: (): Lead[] => getFromStorage(STORAGE_KEYS.LEADS, defaultLeads),
  
  getByStage: (): Record<string, Lead[]> => {
    const leads = leadsStore.getAll();
    const stages = ['new', 'contact', 'proposal', 'negotiation', 'closed', 'lost'];
    const grouped: Record<string, Lead[]> = {};
    
    stages.forEach(stage => {
      grouped[stage] = leads.filter(l => l.stage === stage);
    });
    
    return grouped;
  },
  
  getById: (id: string): Lead | undefined => {
    const leads = leadsStore.getAll();
    return leads.find(l => l.id === id);
  },
  
  create: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastContact'>): Lead => {
    const leads = leadsStore.getAll();
    const newLead: Lead = {
      ...lead,
      id: createId('lead'),
      createdAt: new Date().toISOString().split('T')[0],
      lastContact: 'Agora',
    };
    setToStorage(STORAGE_KEYS.LEADS, [...leads, newLead]);
    return newLead;
  },
  
  update: (id: string, data: Partial<Lead>): Lead | undefined => {
    const leads = leadsStore.getAll();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    
    leads[index] = { ...leads[index], ...data };
    setToStorage(STORAGE_KEYS.LEADS, leads);
    return leads[index];
  },
  
  updateStage: (id: string, stage: Lead['stage']): Lead | undefined => {
    return leadsStore.update(id, { stage, lastContact: 'Agora' });
  },
  
  delete: (id: string): boolean => {
    const leads = leadsStore.getAll();
    const filtered = leads.filter(l => l.id !== id);
    if (filtered.length === leads.length) return false;
    
    setToStorage(STORAGE_KEYS.LEADS, filtered);
    return true;
  },
  
  saveAll: (leads: Lead[]): void => {
    setToStorage(STORAGE_KEYS.LEADS, leads);
  },
};

// ============= APPOINTMENTS STORE =============

export const appointmentsStore = {
  getAll: (): Appointment[] => getFromStorage(STORAGE_KEYS.APPOINTMENTS, defaultAppointments),
  
  getByDate: (date: string): Appointment[] => {
    const appointments = appointmentsStore.getAll();
    return appointments.filter(a => a.date === date);
  },
  
  getById: (id: string): Appointment | undefined => {
    const appointments = appointmentsStore.getAll();
    return appointments.find(a => a.id === id);
  },
  
  create: (appointment: Omit<Appointment, 'id'>): Appointment => {
    const appointments = appointmentsStore.getAll();
    const newAppointment: Appointment = {
      ...appointment,
      id: createId('apt'),
    };
    setToStorage(STORAGE_KEYS.APPOINTMENTS, [...appointments, newAppointment]);
    return newAppointment;
  },
  
  update: (id: string, data: Partial<Appointment>): Appointment | undefined => {
    const appointments = appointmentsStore.getAll();
    const index = appointments.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    appointments[index] = { ...appointments[index], ...data };
    setToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
    return appointments[index];
  },
  
  delete: (id: string): boolean => {
    const appointments = appointmentsStore.getAll();
    const filtered = appointments.filter(a => a.id !== id);
    if (filtered.length === appointments.length) return false;
    
    setToStorage(STORAGE_KEYS.APPOINTMENTS, filtered);
    return true;
  },
};

// ============= COMPANIES STORE =============

export const companiesStore = {
  getAll: (): Company[] => getFromStorage(STORAGE_KEYS.COMPANIES, defaultCompanies),
  
  getById: (id: string): Company | undefined => {
    const companies = companiesStore.getAll();
    return companies.find(c => c.id === id);
  },
  
  create: (company: Omit<Company, 'id' | 'createdAt' | 'currentUsers'>): Company => {
    const companies = companiesStore.getAll();
    const newCompany: Company = {
      ...company,
      id: createId('comp'),
      createdAt: new Date().toISOString().split('T')[0],
      currentUsers: 1,
    };
    setToStorage(STORAGE_KEYS.COMPANIES, [...companies, newCompany]);
    return newCompany;
  },
  
  update: (id: string, data: Partial<Company>): Company | undefined => {
    const companies = companiesStore.getAll();
    const index = companies.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    companies[index] = { ...companies[index], ...data };
    setToStorage(STORAGE_KEYS.COMPANIES, companies);
    return companies[index];
  },
  
  delete: (id: string): boolean => {
    const companies = companiesStore.getAll();
    const filtered = companies.filter(c => c.id !== id);
    if (filtered.length === companies.length) return false;
    
    setToStorage(STORAGE_KEYS.COMPANIES, filtered);
    return true;
  },
};

// ============= PLANS STORE =============

export const plansStore = {
  getAll: (): Plan[] => getFromStorage(STORAGE_KEYS.PLANS, defaultPlans),
  
  getById: (id: string): Plan | undefined => {
    const plans = plansStore.getAll();
    return plans.find(p => p.id === id);
  },
  
  create: (plan: Omit<Plan, 'id'>): Plan => {
    const plans = plansStore.getAll();
    const newPlan: Plan = {
      ...plan,
      id: createId('plan'),
    };
    setToStorage(STORAGE_KEYS.PLANS, [...plans, newPlan]);
    return newPlan;
  },
  
  update: (id: string, data: Partial<Plan>): Plan | undefined => {
    const plans = plansStore.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    plans[index] = { ...plans[index], ...data };
    setToStorage(STORAGE_KEYS.PLANS, plans);
    return plans[index];
  },
  
  delete: (id: string): boolean => {
    const plans = plansStore.getAll();
    const filtered = plans.filter(p => p.id !== id);
    if (filtered.length === plans.length) return false;
    
    setToStorage(STORAGE_KEYS.PLANS, filtered);
    return true;
  },
};

// ============= COMPANY SETTINGS STORE =============

export const companySettingsStore = {
  get: (): CompanySettings => getFromStorage(STORAGE_KEYS.COMPANY_SETTINGS, defaultCompanySettings),
  
  update: (data: Partial<CompanySettings>): CompanySettings => {
    const current = companySettingsStore.get();
    const updated = { ...current, ...data };
    setToStorage(STORAGE_KEYS.COMPANY_SETTINGS, updated);
    return updated;
  },
};
