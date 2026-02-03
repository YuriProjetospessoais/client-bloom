import { Scissors } from 'lucide-react';

interface BarberFlowLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BarberFlowLogo({ showText = true, size = 'md', className = '' }: BarberFlowLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl gradient-gold flex items-center justify-center shadow-md`}>
        <Scissors className="text-white w-1/2 h-1/2 rotate-[-45deg]" />
      </div>
      {showText && (
        <div>
          <h2 className={`font-display font-bold text-foreground ${textSizeClasses[size]}`}>
            BarberFlow
          </h2>
        </div>
      )}
    </div>
  );
}
