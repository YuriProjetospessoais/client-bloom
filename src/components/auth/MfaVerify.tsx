import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MfaVerifyProps {
  onVerified: () => void;
}

export function MfaVerify({ onVerified }: MfaVerifyProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);

    // Get existing verified TOTP factors
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError || !factorsData?.totp?.length) {
      toast({ title: 'Erro', description: 'Nenhum fator MFA encontrado.', variant: 'destructive' });
      setIsVerifying(false);
      return;
    }

    const factor = factorsData.totp.find(f => f.status === 'verified');
    if (!factor) {
      toast({ title: 'Erro', description: 'Nenhum fator MFA verificado.', variant: 'destructive' });
      setIsVerifying(false);
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });

    if (challengeError) {
      toast({ title: 'Erro', description: challengeError.message, variant: 'destructive' });
      setIsVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      toast({ title: 'Código inválido', description: 'Verifique o código e tente novamente.', variant: 'destructive' });
      setCode('');
      setIsVerifying(false);
      return;
    }

    onVerified();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 p-6"
    >
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">Verificação 2FA</h2>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Digite o código de 6 dígitos do seu aplicativo autenticador para continuar.
      </p>

      <InputOTP maxLength={6} value={code} onChange={setCode}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      <Button
        className="w-full max-w-xs gradient-gold text-primary-foreground"
        onClick={handleVerify}
        disabled={code.length !== 6 || isVerifying}
      >
        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
      </Button>
    </motion.div>
  );
}
