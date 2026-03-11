import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  primaryColor: string;
  status: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Slug não informado');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTenant() {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url, cover_url, primary_color, status')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError('Erro ao carregar barbearia');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError('Barbearia não encontrada');
        setIsLoading(false);
        return;
      }

      setTenant({
        id: data.id,
        name: data.name,
        slug: data.slug!,
        logoUrl: data.logo_url,
        coverUrl: data.cover_url,
        primaryColor: data.primary_color || '#C6973F',
        status: data.status,
      });
      setIsLoading(false);
    }

    fetchTenant();
    return () => { cancelled = true; };
  }, [slug]);

  // Apply tenant primary color as CSS custom property
  useEffect(() => {
    if (!tenant?.primaryColor) return;

    const hex = tenant.primaryColor;
    const hsl = hexToHSL(hex);
    if (hsl) {
      document.documentElement.style.setProperty('--tenant-primary', hsl);
      document.documentElement.style.setProperty('--tenant-primary-hex', hex);
    }

    return () => {
      document.documentElement.style.removeProperty('--tenant-primary');
      document.documentElement.style.removeProperty('--tenant-primary-hex');
    };
  }, [tenant?.primaryColor]);

  const value = useMemo(() => ({ tenant, isLoading, error }), [tenant, isLoading, error]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

// Utility: convert hex color to HSL string (e.g. "38 55% 50%")
function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
