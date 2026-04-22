/**
 * Centralized React Query keys.
 * All keys are scoped by company_id to guarantee multi-tenant isolation in the cache.
 */
export const queryKeys = {
  clients: {
    all: (companyId: string) => ['clients', companyId] as const,
    detail: (companyId: string, id: string) => ['clients', companyId, id] as const,
  },
  appointments: {
    all: (companyId: string) => ['appointments', companyId] as const,
    byDate: (companyId: string, date: string) => ['appointments', companyId, 'date', date] as const,
    byRange: (companyId: string, from: string, to: string) =>
      ['appointments', companyId, 'range', from, to] as const,
    detail: (companyId: string, id: string) => ['appointments', companyId, id] as const,
  },
  services: {
    all: (companyId: string) => ['services', companyId] as const,
  },
  professionals: {
    all: (companyId: string) => ['professionals', companyId] as const,
  },
  opportunities: {
    all: (companyId: string) => ['opportunities', companyId] as const,
    byStatus: (companyId: string, status: string) =>
      ['opportunities', companyId, 'status', status] as const,
  },
} as const;