import { Scissors, Circle } from 'lucide-react';

interface BarberFlowLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BarberFlowLogo({ showText = true, size = 'md', className = '' }: BarberFlowLogoProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl leading-tight',
    lg: 'text-2xl leading-tight',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-2xl gradient-gold flex items-center justify-center shadow-lg relative overflow-hidden`}>
        {/* Subtle inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Scissors icon with refined positioning */}
        <Scissors 
          size={iconSizes[size]} 
          className="text-white relative z-10 rotate-[-45deg] drop-shadow-sm" 
          strokeWidth={2.5}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h2 className={`font-display font-bold text-foreground tracking-tight ${textSizeClasses[size]}`}>
            Barber<span className="text-primary">Flow</span>
          </h2>
          {size === 'lg' && (
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-medium -mt-0.5">
              Professional Suite
            </span>
          )}
        </div>
      )}
    </div>
  );
}
