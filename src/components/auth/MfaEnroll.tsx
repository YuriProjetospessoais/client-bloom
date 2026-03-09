import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface MfaEnrollProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function MfaEnroll({ onComplete, onSkip }: MfaEnrollProps) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    enrollMfa();
  }, []);

  const enrollMfa = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'BarberFlow Authenticator',
    });

    if (error) {
      toast({ title: 'Erro ao configurar MFA', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setIsVerifying(true);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast({ title: 'Erro', description: challengeError.message, variant: 'destructive' });
      setIsVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });

    if (verifyError) {
      toast({ title: 'Código inválido', description: 'Verifique o código e tente novamente.', variant: 'destructive' });
      setVerifyCode('');
      setIsVerifying(false);
      return;
    }

    toast({ title: 'MFA ativado!', description: 'Autenticação de dois fatores configurada com sucesso.' });
    onComplete();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Configurando autenticação...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 p-6"
    >
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">Ativar Autenticação 2FA</h2>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
      </p>

      {qrCode && (
        <div className="rounded-2xl bg-white p-4 shadow-md">
          <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <code className="text-xs bg-secondary px-3 py-1.5 rounded-lg font-mono tracking-wider text-foreground select-all">
          {secret}
        </code>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copySecret}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-foreground">Digite o código de 6 dígitos:</p>
        <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        {onSkip && (
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Depois
          </Button>
        )}
        <Button
          className="flex-1 gradient-gold text-primary-foreground"
          onClick={handleVerify}
          disabled={verifyCode.length !== 6 || isVerifying}
        >
          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar e ativar'}
        </Button>
      </div>
    </motion.div>
  );
}
