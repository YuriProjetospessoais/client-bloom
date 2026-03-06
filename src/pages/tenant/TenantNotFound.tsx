import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Scissors className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Barbearia não encontrada</h1>
          <p className="text-muted-foreground">
            O endereço que você acessou não corresponde a nenhuma barbearia cadastrada.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
