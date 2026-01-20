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

// Extended Client interface with preferences and purchase history
export interface ClientPreferences {
  drink?: string; // ex: "café com açúcar"
  cutStyle?: string; // ex: "degradê"
  favoriteMusic?: string; // ex: "Rock"
  freeNotes?: string;
}

export interface ClientProductPurchase {
  id: string;
  productId: string;
  productName: string;
  purchaseDate: string;
  estimatedEndDate: string;
  quantity: number;
  price: number;
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
  // New fields
  address?: string;
  preferences?: ClientPreferences;
  productPurchases?: ClientProductPurchase[];
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

// ============= PRODUCT TYPES =============

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  durationDays: number; // Estimated duration in days
  active: boolean;
  createdAt: string;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  clientId: string;
  clientName: string;
  saleDate: string;
  estimatedEndDate: string;
  quantity: number;
  totalPrice: number;
  notified: boolean;
}

// ============= BIRTHDAY COMBO TYPES =============

export interface BirthdayCombo {
  id: string;
  clientId: string;
  clientName: string;
  birthDate: string;
  comboDiscount: number;
  comboDescription: string;
  status: 'pending' | 'sent' | 'used' | 'expired';
  createdAt: string;
  validUntil: string;
}

// ============= OPPORTUNITY TYPES =============

export interface Opportunity {
  id: string;
  type: 'birthday' | 'repurchase' | 'return';
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  productId?: string;
  productName?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'contacted' | 'converted' | 'dismissed';
  createdAt: string;
}

// Analytics interfaces
export interface Analytics {
  totalLeads: number;
  totalClients: number;
  totalAppointments: number;
  appointmentsByDay: Record<string, number>;
  appointmentsByWeek: number;
  appointmentsByMonth: number;
  leadsByStage: Record<string, number>;
  conversionRate: number;
  revenue: number;
  // New analytics
  upcomingBirthdays: number;
  activeCombos: number;
  productsNearEnd: number;
  topProducts: { name: string; count: number }[];
  repurchaseOpportunities: number;
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
  PRODUCTS: 'crm_products',
  PRODUCT_SALES: 'crm_product_sales',
  BIRTHDAY_COMBOS: 'crm_birthday_combos',
  OPPORTUNITIES: 'crm_opportunities',
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

// Get tomorrow's date for birthday demo
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

const getNextWeekDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const defaultClients: Client[] = [
  { 
    id: 'client_1', 
    name: 'Fernanda Oliveira', 
    email: 'fernanda@email.com', 
    phone: '(11) 98765-4321', 
    lastVisit: '2026-01-10', 
    totalSpent: 2500, 
    visitCount: 8, 
    createdAt: '2025-03-15',
    birthDate: getTomorrowDate(), // Tomorrow's birthday!
    address: 'Rua das Flores, 123 - São Paulo, SP',
    preferences: {
      drink: 'Café com leite',
      cutStyle: 'Corte reto nas pontas',
      favoriteMusic: 'MPB',
      freeNotes: 'Prefere horários pela manhã'
    }
  },
  { 
    id: 'client_2', 
    name: 'Carlos Mendes', 
    email: 'carlos@email.com', 
    phone: '(11) 98765-4322', 
    lastVisit: '2026-01-08', 
    totalSpent: 1800, 
    visitCount: 5, 
    createdAt: '2025-04-20',
    birthDate: getNextWeekDate(3),
    address: 'Av. Paulista, 500 - São Paulo, SP',
    preferences: {
      drink: 'Água com gás',
      cutStyle: 'Degradê',
      favoriteMusic: 'Rock',
    }
  },
  { 
    id: 'client_3', 
    name: 'Juliana Costa', 
    email: 'juliana@email.com', 
    phone: '(11) 98765-4323', 
    lastVisit: '2025-12-15', 
    totalSpent: 4200, 
    visitCount: 15, 
    createdAt: '2024-06-10',
    birthDate: getNextWeekDate(7),
    address: 'Rua Augusta, 789 - São Paulo, SP',
    preferences: {
      drink: 'Chá gelado',
      favoriteMusic: 'Pop',
    }
  },
  { 
    id: 'client_4', 
    name: 'Roberto Santos', 
    email: 'roberto@email.com', 
    phone: '(11) 98765-4324', 
    lastVisit: '2026-01-12', 
    totalSpent: 950, 
    visitCount: 3, 
    createdAt: '2025-09-01',
    birthDate: '1990-05-15',
    address: 'Rua Oscar Freire, 200 - São Paulo, SP',
  },
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

// Generate appointments for multiple dates
const today = new Date();
const formatDateStr = (date: Date) => date.toISOString().split('T')[0];

const getDateOffset = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return formatDateStr(date);
};

const defaultAppointments: Appointment[] = [
  // Today's appointments
  { id: 'apt_1', clientName: 'Fernanda Oliveira', procedureName: 'Limpeza de pele', professionalName: 'Dra. Maria Santos', date: formatDateStr(today), time: '09:00', duration: 60, status: 'confirmed' },
  { id: 'apt_2', clientName: 'Carlos Mendes', procedureName: 'Botox', professionalName: 'Dr. João Silva', date: formatDateStr(today), time: '10:00', duration: 45, status: 'confirmed' },
  { id: 'apt_3', clientName: 'Juliana Costa', procedureName: 'Peeling', professionalName: 'Dra. Ana Costa', date: formatDateStr(today), time: '11:00', duration: 90, status: 'pending' },
  { id: 'apt_4', clientName: 'Roberto Santos', procedureName: 'Tratamento Capilar', professionalName: 'Dr. João Silva', date: formatDateStr(today), time: '14:00', duration: 120, status: 'confirmed' },
  
  // Tomorrow's appointments
  { id: 'apt_5', clientName: 'Ana Paula', procedureName: 'Limpeza de pele', professionalName: 'Dr. João Silva', date: getDateOffset(1), time: '09:00', duration: 60, status: 'confirmed' },
  { id: 'apt_6', clientName: 'Ricardo Lima', procedureName: 'Botox', professionalName: 'Dra. Maria Santos', date: getDateOffset(1), time: '11:00', duration: 45, status: 'pending' },
  { id: 'apt_7', clientName: 'Mariana Costa', procedureName: 'Peeling', professionalName: 'Dra. Ana Costa', date: getDateOffset(1), time: '15:00', duration: 90, status: 'confirmed' },
  
  // Day after tomorrow
  { id: 'apt_8', clientName: 'Paulo Ferreira', procedureName: 'Tratamento Capilar', professionalName: 'Dr. João Silva', date: getDateOffset(2), time: '10:00', duration: 120, status: 'pending' },
  { id: 'apt_9', clientName: 'Camila Santos', procedureName: 'Limpeza de pele', professionalName: 'Dra. Ana Costa', date: getDateOffset(2), time: '14:00', duration: 60, status: 'confirmed' },
  
  // Yesterday
  { id: 'apt_10', clientName: 'Bruno Almeida', procedureName: 'Botox', professionalName: 'Dr. João Silva', date: getDateOffset(-1), time: '09:00', duration: 45, status: 'completed' },
  { id: 'apt_11', clientName: 'Laura Oliveira', procedureName: 'Peeling', professionalName: 'Dra. Maria Santos', date: getDateOffset(-1), time: '11:00', duration: 90, status: 'completed' },
  
  // 2 days ago
  { id: 'apt_12', clientName: 'Gabriel Souza', procedureName: 'Tratamento Capilar', professionalName: 'Dra. Ana Costa', date: getDateOffset(-2), time: '10:00', duration: 120, status: 'completed' },
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

// ============= DEFAULT PRODUCTS =============

const defaultProducts: Product[] = [
  { id: 'prod_1', name: 'Shampoo Profissional', category: 'Capilar', price: 89.90, durationDays: 30, active: true, createdAt: '2025-01-01' },
  { id: 'prod_2', name: 'Condicionador Hidratante', category: 'Capilar', price: 79.90, durationDays: 30, active: true, createdAt: '2025-01-01' },
  { id: 'prod_3', name: 'Sérum Facial Anti-idade', category: 'Facial', price: 189.90, durationDays: 45, active: true, createdAt: '2025-01-01' },
  { id: 'prod_4', name: 'Protetor Solar FPS 50', category: 'Proteção', price: 69.90, durationDays: 60, active: true, createdAt: '2025-01-01' },
  { id: 'prod_5', name: 'Creme Hidratante Corporal', category: 'Corporal', price: 59.90, durationDays: 45, active: true, createdAt: '2025-01-01' },
  { id: 'prod_6', name: 'Óleo Capilar Nutritivo', category: 'Capilar', price: 129.90, durationDays: 60, active: true, createdAt: '2025-01-01' },
];

// Default product sales with some near end date
const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateStr(date);
};

const defaultProductSales: ProductSale[] = [
  { 
    id: 'sale_1', 
    productId: 'prod_1', 
    productName: 'Shampoo Profissional', 
    clientId: 'client_1', 
    clientName: 'Fernanda Oliveira', 
    saleDate: getDateDaysAgo(28), 
    estimatedEndDate: getDateOffset(2), // Ends in 2 days!
    quantity: 1, 
    totalPrice: 89.90,
    notified: false
  },
  { 
    id: 'sale_2', 
    productId: 'prod_3', 
    productName: 'Sérum Facial Anti-idade', 
    clientId: 'client_2', 
    clientName: 'Carlos Mendes', 
    saleDate: getDateDaysAgo(40), 
    estimatedEndDate: getDateOffset(5), // Ends in 5 days
    quantity: 1, 
    totalPrice: 189.90,
    notified: false
  },
  { 
    id: 'sale_3', 
    productId: 'prod_4', 
    productName: 'Protetor Solar FPS 50', 
    clientId: 'client_3', 
    clientName: 'Juliana Costa', 
    saleDate: getDateDaysAgo(55), 
    estimatedEndDate: getDateOffset(5),
    quantity: 2, 
    totalPrice: 139.80,
    notified: false
  },
  { 
    id: 'sale_4', 
    productId: 'prod_2', 
    productName: 'Condicionador Hidratante', 
    clientId: 'client_1', 
    clientName: 'Fernanda Oliveira', 
    saleDate: getDateDaysAgo(25), 
    estimatedEndDate: getDateOffset(5),
    quantity: 1, 
    totalPrice: 79.90,
    notified: false
  },
];

const defaultBirthdayCombos: BirthdayCombo[] = [];

const defaultOpportunities: Opportunity[] = [];

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

  // Get clients with upcoming birthdays (next N days)
  getUpcomingBirthdays: (days: number = 7): Client[] => {
    const clients = clientsStore.getAll();
    const today = new Date();
    
    return clients.filter(client => {
      if (!client.birthDate) return false;
      
      const birthDate = new Date(client.birthDate);
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const diffTime = thisYearBirthday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= days;
    }).sort((a, b) => {
      const getNextBirthday = (date: string) => {
        const birth = new Date(date);
        const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        return next.getTime();
      };
      return getNextBirthday(a.birthDate!) - getNextBirthday(b.birthDate!);
    });
  },

  // Get clients with birthday tomorrow
  getTomorrowBirthdays: (): Client[] => {
    const clients = clientsStore.getAll();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return clients.filter(client => {
      if (!client.birthDate) return false;
      const birthDate = new Date(client.birthDate);
      return birthDate.getMonth() === tomorrow.getMonth() && 
             birthDate.getDate() === tomorrow.getDate();
    });
  },

  // Add product purchase to client
  addProductPurchase: (clientId: string, purchase: Omit<ClientProductPurchase, 'id'>): Client | undefined => {
    const client = clientsStore.getById(clientId);
    if (!client) return undefined;
    
    const newPurchase: ClientProductPurchase = {
      ...purchase,
      id: createId('purchase'),
    };
    
    const purchases = client.productPurchases || [];
    return clientsStore.update(clientId, {
      productPurchases: [...purchases, newPurchase],
      totalSpent: client.totalSpent + purchase.price,
    });
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
  
  // Check for time conflict on a specific date
  hasTimeConflict: (date: string, time: string, excludeId?: string): boolean => {
    const appointments = appointmentsStore.getByDate(date);
    return appointments.some(a => a.time === time && a.id !== excludeId);
  },
  
  create: (appointment: Omit<Appointment, 'id'>): Appointment | null => {
    // Check for time conflict
    if (appointmentsStore.hasTimeConflict(appointment.date, appointment.time)) {
      return null;
    }
    
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
    
    // Check for time conflict if time or date is being updated
    if (data.time || data.date) {
      const newDate = data.date || appointments[index].date;
      const newTime = data.time || appointments[index].time;
      if (appointmentsStore.hasTimeConflict(newDate, newTime, id)) {
        return undefined;
      }
    }
    
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
  
  // Get appointments count by date range
  getCountByDateRange: (startDate: string, endDate: string): number => {
    const appointments = appointmentsStore.getAll();
    return appointments.filter(a => a.date >= startDate && a.date <= endDate).length;
  },
  
  // Get appointments grouped by date
  getGroupedByDate: (): Record<string, Appointment[]> => {
    const appointments = appointmentsStore.getAll();
    const grouped: Record<string, Appointment[]> = {};
    
    appointments.forEach(apt => {
      if (!grouped[apt.date]) {
        grouped[apt.date] = [];
      }
      grouped[apt.date].push(apt);
    });
    
    return grouped;
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
    const settings = companySettingsStore.get();
    const updatedSettings = { ...settings, ...data };
    setToStorage(STORAGE_KEYS.COMPANY_SETTINGS, updatedSettings);
    return updatedSettings;
  },
};

// ============= PRODUCTS STORE =============

export const productsStore = {
  getAll: (): Product[] => getFromStorage(STORAGE_KEYS.PRODUCTS, defaultProducts),
  
  getById: (id: string): Product | undefined => {
    const products = productsStore.getAll();
    return products.find(p => p.id === id);
  },
  
  create: (product: Omit<Product, 'id' | 'createdAt'>): Product => {
    const products = productsStore.getAll();
    const newProduct: Product = {
      ...product,
      id: createId('prod'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setToStorage(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
    return newProduct;
  },
  
  update: (id: string, data: Partial<Product>): Product | undefined => {
    const products = productsStore.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    products[index] = { ...products[index], ...data };
    setToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },
  
  delete: (id: string): boolean => {
    const products = productsStore.getAll();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    
    setToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  getByCategory: (category: string): Product[] => {
    const products = productsStore.getAll();
    return products.filter(p => p.category === category && p.active);
  },

  getCategories: (): string[] => {
    const products = productsStore.getAll();
    return [...new Set(products.map(p => p.category))];
  },
};

// ============= PRODUCT SALES STORE =============

export const productSalesStore = {
  getAll: (): ProductSale[] => getFromStorage(STORAGE_KEYS.PRODUCT_SALES, defaultProductSales),
  
  getById: (id: string): ProductSale | undefined => {
    const sales = productSalesStore.getAll();
    return sales.find(s => s.id === id);
  },
  
  create: (sale: Omit<ProductSale, 'id'>): ProductSale => {
    const sales = productSalesStore.getAll();
    const newSale: ProductSale = {
      ...sale,
      id: createId('sale'),
    };
    setToStorage(STORAGE_KEYS.PRODUCT_SALES, [...sales, newSale]);
    
    // Also update client's product purchases
    const client = clientsStore.getById(sale.clientId);
    if (client) {
      clientsStore.addProductPurchase(sale.clientId, {
        productId: sale.productId,
        productName: sale.productName,
        purchaseDate: sale.saleDate,
        estimatedEndDate: sale.estimatedEndDate,
        quantity: sale.quantity,
        price: sale.totalPrice,
      });
    }
    
    return newSale;
  },
  
  update: (id: string, data: Partial<ProductSale>): ProductSale | undefined => {
    const sales = productSalesStore.getAll();
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    sales[index] = { ...sales[index], ...data };
    setToStorage(STORAGE_KEYS.PRODUCT_SALES, sales);
    return sales[index];
  },
  
  delete: (id: string): boolean => {
    const sales = productSalesStore.getAll();
    const filtered = sales.filter(s => s.id !== id);
    if (filtered.length === sales.length) return false;
    
    setToStorage(STORAGE_KEYS.PRODUCT_SALES, filtered);
    return true;
  },

  // Get sales by client
  getByClient: (clientId: string): ProductSale[] => {
    const sales = productSalesStore.getAll();
    return sales.filter(s => s.clientId === clientId);
  },

  // Get products near end date (within N days)
  getProductsNearEnd: (days: number = 7): ProductSale[] => {
    const sales = productSalesStore.getAll();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return sales.filter(sale => {
      const endDate = new Date(sale.estimatedEndDate);
      return endDate >= today && endDate <= futureDate;
    }).sort((a, b) => new Date(a.estimatedEndDate).getTime() - new Date(b.estimatedEndDate).getTime());
  },

  // Get top selling products
  getTopProducts: (limit: number = 5): { name: string; count: number; revenue: number }[] => {
    const sales = productSalesStore.getAll();
    const productCounts: Record<string, { count: number; revenue: number }> = {};
    
    sales.forEach(sale => {
      if (!productCounts[sale.productName]) {
        productCounts[sale.productName] = { count: 0, revenue: 0 };
      }
      productCounts[sale.productName].count += sale.quantity;
      productCounts[sale.productName].revenue += sale.totalPrice;
    });
    
    return Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};

// ============= BIRTHDAY COMBOS STORE =============

export const birthdayCombosStore = {
  getAll: (): BirthdayCombo[] => getFromStorage(STORAGE_KEYS.BIRTHDAY_COMBOS, defaultBirthdayCombos),
  
  getById: (id: string): BirthdayCombo | undefined => {
    const combos = birthdayCombosStore.getAll();
    return combos.find(c => c.id === id);
  },
  
  create: (combo: Omit<BirthdayCombo, 'id' | 'createdAt'>): BirthdayCombo => {
    const combos = birthdayCombosStore.getAll();
    const newCombo: BirthdayCombo = {
      ...combo,
      id: createId('combo'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setToStorage(STORAGE_KEYS.BIRTHDAY_COMBOS, [...combos, newCombo]);
    return newCombo;
  },
  
  update: (id: string, data: Partial<BirthdayCombo>): BirthdayCombo | undefined => {
    const combos = birthdayCombosStore.getAll();
    const index = combos.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    combos[index] = { ...combos[index], ...data };
    setToStorage(STORAGE_KEYS.BIRTHDAY_COMBOS, combos);
    return combos[index];
  },
  
  delete: (id: string): boolean => {
    const combos = birthdayCombosStore.getAll();
    const filtered = combos.filter(c => c.id !== id);
    if (filtered.length === combos.length) return false;
    
    setToStorage(STORAGE_KEYS.BIRTHDAY_COMBOS, filtered);
    return true;
  },

  getByClient: (clientId: string): BirthdayCombo[] => {
    const combos = birthdayCombosStore.getAll();
    return combos.filter(c => c.clientId === clientId);
  },

  getActive: (): BirthdayCombo[] => {
    const combos = birthdayCombosStore.getAll();
    return combos.filter(c => c.status === 'pending' || c.status === 'sent');
  },

  // Generate combo for clients with birthday tomorrow
  generateTomorrowCombos: (discountAmount: number = 50): BirthdayCombo[] => {
    const tomorrowBirthdays = clientsStore.getTomorrowBirthdays();
    const existingCombos = birthdayCombosStore.getAll();
    const newCombos: BirthdayCombo[] = [];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    
    tomorrowBirthdays.forEach(client => {
      // Check if combo already exists for this client this year
      const hasCombo = existingCombos.some(c => 
        c.clientId === client.id && 
        c.birthDate.slice(5) === client.birthDate!.slice(5) &&
        new Date(c.createdAt).getFullYear() === new Date().getFullYear()
      );
      
      if (!hasCombo) {
        const combo = birthdayCombosStore.create({
          clientId: client.id,
          clientName: client.name,
          birthDate: client.birthDate!,
          comboDiscount: discountAmount,
          comboDescription: `Feliz Aniversário! Ganhe R$ ${discountAmount} de desconto em qualquer procedimento.`,
          status: 'pending',
          validUntil: validUntil.toISOString().split('T')[0],
        });
        newCombos.push(combo);
      }
    });
    
    return newCombos;
  },
};

// ============= OPPORTUNITIES STORE =============

export const opportunitiesStore = {
  getAll: (): Opportunity[] => getFromStorage(STORAGE_KEYS.OPPORTUNITIES, defaultOpportunities),
  
  getById: (id: string): Opportunity | undefined => {
    const opportunities = opportunitiesStore.getAll();
    return opportunities.find(o => o.id === id);
  },
  
  create: (opportunity: Omit<Opportunity, 'id' | 'createdAt'>): Opportunity => {
    const opportunities = opportunitiesStore.getAll();
    const newOpportunity: Opportunity = {
      ...opportunity,
      id: createId('opp'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setToStorage(STORAGE_KEYS.OPPORTUNITIES, [...opportunities, newOpportunity]);
    return newOpportunity;
  },
  
  update: (id: string, data: Partial<Opportunity>): Opportunity | undefined => {
    const opportunities = opportunitiesStore.getAll();
    const index = opportunities.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    opportunities[index] = { ...opportunities[index], ...data };
    setToStorage(STORAGE_KEYS.OPPORTUNITIES, opportunities);
    return opportunities[index];
  },
  
  delete: (id: string): boolean => {
    const opportunities = opportunitiesStore.getAll();
    const filtered = opportunities.filter(o => o.id !== id);
    if (filtered.length === opportunities.length) return false;
    
    setToStorage(STORAGE_KEYS.OPPORTUNITIES, filtered);
    return true;
  },

  getPending: (): Opportunity[] => {
    const opportunities = opportunitiesStore.getAll();
    return opportunities.filter(o => o.status === 'pending');
  },

  getByType: (type: Opportunity['type']): Opportunity[] => {
    const opportunities = opportunitiesStore.getAll();
    return opportunities.filter(o => o.type === type);
  },

  // Generate all opportunities based on current data
  generateOpportunities: (): Opportunity[] => {
    const opportunities = opportunitiesStore.getAll();
    const newOpportunities: Opportunity[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 1. Birthday opportunities (clients with birthday in next 2 days)
    const upcomingBirthdays = clientsStore.getUpcomingBirthdays(2);
    upcomingBirthdays.forEach(client => {
      const exists = opportunities.some(o => 
        o.type === 'birthday' && 
        o.clientId === client.id &&
        new Date(o.createdAt).getFullYear() === today.getFullYear()
      );
      
      if (!exists) {
        const birthDate = new Date(client.birthDate!);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1);
        
        const opp = opportunitiesStore.create({
          type: 'birthday',
          title: `Aniversário de ${client.name}`,
          description: `Cliente faz aniversário em ${thisYearBirthday.toLocaleDateString('pt-BR')}. Envie uma mensagem de parabéns e ofereça um combo promocional!`,
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          priority: 'high',
          dueDate: thisYearBirthday.toISOString().split('T')[0],
          status: 'pending',
        });
        newOpportunities.push(opp);
      }
    });
    
    // 2. Repurchase opportunities (products ending in next 7 days)
    const productsNearEnd = productSalesStore.getProductsNearEnd(7);
    productsNearEnd.forEach(sale => {
      const exists = opportunities.some(o => 
        o.type === 'repurchase' && 
        o.productId === sale.productId &&
        o.clientId === sale.clientId &&
        o.status === 'pending'
      );
      
      if (!exists) {
        const daysUntilEnd = Math.ceil((new Date(sale.estimatedEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const opp = opportunitiesStore.create({
          type: 'repurchase',
          title: `Recompra: ${sale.productName}`,
          description: `O produto "${sale.productName}" de ${sale.clientName} termina em ${daysUntilEnd} dias. Sugira a recompra!`,
          clientId: sale.clientId,
          clientName: sale.clientName,
          clientPhone: clientsStore.getById(sale.clientId)?.phone || '',
          productId: sale.productId,
          productName: sale.productName,
          priority: daysUntilEnd <= 3 ? 'high' : 'medium',
          dueDate: sale.estimatedEndDate,
          status: 'pending',
        });
        newOpportunities.push(opp);
      }
    });
    
    return newOpportunities;
  },
};

// ============= ANALYTICS STORE =============

export const analyticsStore = {
  getAnalytics: (): Analytics => {
    const leads = leadsStore.getAll();
    const clients = clientsStore.getAll();
    const appointments = appointmentsStore.getAll();
    const procedures = proceduresStore.getAll();
    const productSales = productSalesStore.getAll();
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate week range
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Calculate month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Appointments by day (last 7 days)
    const appointmentsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      appointmentsByDay[dateStr] = appointments.filter(a => a.date === dateStr).length;
    }
    
    // Appointments by week
    const appointmentsByWeek = appointments.filter(a => {
      const aptDate = new Date(a.date);
      return aptDate >= weekStart && aptDate <= weekEnd;
    }).length;
    
    // Appointments by month
    const appointmentsByMonth = appointments.filter(a => {
      const aptDate = new Date(a.date);
      return aptDate >= monthStart && aptDate <= monthEnd;
    }).length;
    
    // Leads by stage
    const leadsByStage: Record<string, number> = {};
    const stages = ['new', 'contact', 'proposal', 'negotiation', 'closed', 'lost'];
    stages.forEach(stage => {
      leadsByStage[stage] = leads.filter(l => l.stage === stage).length;
    });
    
    // Conversion rate (closed / total excluding lost)
    const totalLeadsExcludingLost = leads.filter(l => l.stage !== 'lost').length;
    const closedLeads = leads.filter(l => l.stage === 'closed').length;
    const conversionRate = totalLeadsExcludingLost > 0 ? (closedLeads / totalLeadsExcludingLost) * 100 : 0;
    
    // Estimate revenue from completed appointments
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    let revenue = 0;
    completedAppointments.forEach(apt => {
      const procedure = procedures.find(p => p.name === apt.procedureName);
      if (procedure) {
        revenue += procedure.price;
      }
    });
    
    // Add client total spent
    revenue += clients.reduce((sum, c) => sum + c.totalSpent, 0);
    
    // Add product sales revenue
    revenue += productSales.reduce((sum, s) => sum + s.totalPrice, 0);
    
    // New analytics
    const upcomingBirthdays = clientsStore.getUpcomingBirthdays(7).length;
    const activeCombos = birthdayCombosStore.getActive().length;
    const productsNearEnd = productSalesStore.getProductsNearEnd(7).length;
    const topProducts = productSalesStore.getTopProducts(5).map(p => ({ name: p.name, count: p.count }));
    const repurchaseOpportunities = opportunitiesStore.getByType('repurchase').filter(o => o.status === 'pending').length;
    
    return {
      totalLeads: leads.length,
      totalClients: clients.length,
      totalAppointments: appointments.length,
      appointmentsByDay,
      appointmentsByWeek,
      appointmentsByMonth,
      leadsByStage,
      conversionRate,
      revenue,
      upcomingBirthdays,
      activeCombos,
      productsNearEnd,
      topProducts,
      repurchaseOpportunities,
    };
  },
  
  getAppointmentsChartData: (): { day: string; count: number }[] => {
    const appointments = appointmentsStore.getAll();
    const today = new Date();
    const data: { day: string; count: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      data.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
        count: appointments.filter(a => a.date === dateStr).length,
      });
    }
    
    return data;
  },
  
  getLeadsChartData: (): { name: string; value: number; color: string }[] => {
    const leads = leadsStore.getAll();
    return [
      { name: 'Novos', value: leads.filter(l => l.stage === 'new').length, color: 'hsl(243, 75%, 59%)' },
      { name: 'Contato', value: leads.filter(l => l.stage === 'contact').length, color: 'hsl(258, 90%, 66%)' },
      { name: 'Proposta', value: leads.filter(l => l.stage === 'proposal').length, color: 'hsl(199, 89%, 48%)' },
      { name: 'Negociação', value: leads.filter(l => l.stage === 'negotiation').length, color: 'hsl(142, 76%, 36%)' },
      { name: 'Fechados', value: leads.filter(l => l.stage === 'closed').length, color: 'hsl(38, 92%, 50%)' },
    ];
  },
  
  getRevenueChartData: (): { month: string; value: number }[] => {
    const appointments = appointmentsStore.getAll();
    const procedures = proceduresStore.getAll();
    const productSales = productSalesStore.getAll();
    
    const today = new Date();
    const data: { month: string; value: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = date.toISOString().split('T')[0];
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      // Calculate revenue from completed appointments in this month
      let monthRevenue = 0;
      appointments
        .filter(a => a.date >= monthStart && a.date <= monthEnd && a.status === 'completed')
        .forEach(apt => {
          const procedure = procedures.find(p => p.name === apt.procedureName);
          if (procedure) {
            monthRevenue += procedure.price;
          }
        });
      
      // Add product sales revenue
      productSales
        .filter(s => s.saleDate >= monthStart && s.saleDate <= monthEnd)
        .forEach(sale => {
          monthRevenue += sale.totalPrice;
        });
      
      // Add some mock revenue for demonstration
      monthRevenue += (6 - i) * 8000 + Math.random() * 5000;
      
      data.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: Math.round(monthRevenue),
      });
    }
    
    return data;
  },

  getProductsChartData: (): { name: string; value: number; color: string }[] => {
    const topProducts = productSalesStore.getTopProducts(5);
    const colors = [
      'hsl(243, 75%, 59%)',
      'hsl(258, 90%, 66%)',
      'hsl(199, 89%, 48%)',
      'hsl(142, 76%, 36%)',
      'hsl(38, 92%, 50%)',
    ];
    
    return topProducts.map((p, i) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
      value: p.count,
      color: colors[i % colors.length],
    }));
  },
};
