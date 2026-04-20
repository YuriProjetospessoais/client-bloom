import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Loader2 } from 'lucide-react';

const companySchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  slug: z.string().trim().min(2, 'Slug deve ter pelo menos 2 caracteres').max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (use letras minúsculas, números e hífens)'),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  primary_color: z.string().optional(),
  logo_url: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
});

interface CompanyData {
  id?: string;
  name: string;
  slug: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  primary_color?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
}

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyData | null;
  onSave: (data: { name: string; slug: string; email?: string; phone?: string; address?: string; primary_color?: string; logo_url?: string; cover_url?: string }) => Promise<void>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CompanyModal({ open, onOpenChange, company, onSave }: CompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    primary_color: '#8B5CF6',
    logo_url: '',
    cover_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        slug: company.slug || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        primary_color: company.primary_color || '#8B5CF6',
        logo_url: company.logo_url || '',
        cover_url: company.cover_url || '',
      });
      setSlugManual(true);
    } else {
      setFormData({ name: '', slug: '', email: '', phone: '', address: '', primary_color: '#8B5CF6', logo_url: '', cover_url: '' });
      setSlugManual(false);
    }
    setErrors({});
    setSlugAvailable(null);
  }, [company, open]);

  // Auto-generate slug from name (only for new companies and when not manually edited)
  useEffect(() => {
    if (!slugManual && !company) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name, slugManual, company]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', formData.slug)
        .maybeSingle();

      if (data && data.id !== company?.id) {
        setSlugAvailable(false);
      } else {
        setSlugAvailable(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.slug, company?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'cover_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    if (field === 'logo_url') setIsUploadingLogo(true);
    if (field === 'cover_url') setIsUploadingCover(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('company_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company_assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [field]: data.publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagem');
    } finally {
      if (field === 'logo_url') setIsUploadingLogo(false);
      if (field === 'cover_url') setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = companySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (slugAvailable === false) {
      setErrors({ slug: 'Este slug já está em uso' });
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: formData.name,
        slug: formData.slug,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        primary_color: formData.primary_color,
        logo_url: formData.logo_url || undefined,
        cover_url: formData.cover_url || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          <DialogDescription>
            {company ? 'Atualize as informações da empresa.' : 'Cadastre uma nova empresa no sistema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da empresa"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                }}
                placeholder="minha-empresa"
                className={errors.slug || slugAvailable === false ? 'border-destructive' : slugAvailable === true ? 'border-green-500' : ''}
              />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
            {!errors.slug && slugAvailable === false && (
              <p className="text-sm text-destructive">Slug já em uso</p>
            )}
            {!errors.slug && slugAvailable === true && formData.slug.length >= 2 && (
              <p className="text-sm text-green-500">Slug disponível ✓</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, cidade"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded border bg-muted overflow-hidden flex items-center justify-center">
                  {formData.logo_url ? (
                    <SignedImg src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" fallback={<ImageIcon className="h-4 w-4 text-muted-foreground" />} />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 relative">
                  <Input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => handleFileUpload(e, 'logo_url')}
                    disabled={isUploadingLogo}
                  />
                  <Button type="button" variant="outline" size="sm" className="w-full" disabled={isUploadingLogo}>
                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capa da Landing Page</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded border bg-muted overflow-hidden flex items-center justify-center">
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 relative">
                  <Input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => handleFileUpload(e, 'cover_url')}
                    disabled={isUploadingCover}
                  />
                  <Button type="button" variant="outline" size="sm" className="w-full" disabled={isUploadingCover}>
                    {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Cor primária</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primary_color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <span className="text-sm text-muted-foreground">{formData.primary_color}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : company ? 'Salvar' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}