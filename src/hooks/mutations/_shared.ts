import { toast } from '@/hooks/use-toast';

/**
 * Standardized mutation error toast.
 * Use as `onError: showMutationError('mensagem amigável')`.
 */
export function showMutationError(fallback: string) {
  return (error: unknown) => {
    const message =
      (error as { message?: string })?.message ??
      (typeof error === 'string' ? error : fallback);
    toast({
      title: 'Erro',
      description: message || fallback,
      variant: 'destructive',
    });
  };
}

export function showMutationSuccess(message: string) {
  return () => {
    toast({ title: 'Sucesso', description: message });
  };
}