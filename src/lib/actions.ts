import { toast } from 'sonner';

/**
 * Simulates making a phone call
 */
export function handleCall(phone: string, name?: string) {
  // In a real app, this would use a telephony API or open the phone app
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Try to open tel: protocol
  window.open(`tel:${cleanPhone}`, '_self');
  
  toast.success(`Iniciando chamada${name ? ` para ${name}` : ''}`, {
    description: phone,
  });
}

/**
 * Simulates sending an email
 */
export function handleEmail(email: string, subject?: string, name?: string) {
  const encodedSubject = encodeURIComponent(subject || 'Contato');
  window.open(`mailto:${email}?subject=${encodedSubject}`, '_blank');
  
  toast.success(`Abrindo email${name ? ` para ${name}` : ''}`, {
    description: email,
  });
}

/**
 * Simulates sending a WhatsApp message
 */
export function handleWhatsApp(phone: string, message?: string, name?: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message || 'Olá!');
  
  window.open(`https://wa.me/55${cleanPhone}?text=${encodedMessage}`, '_blank');
  
  toast.success(`Abrindo WhatsApp${name ? ` para ${name}` : ''}`, {
    description: phone,
  });
}

/**
 * Copy to clipboard with feedback
 */
export async function copyToClipboard(text: string, label?: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label || 'Texto'} copiado!`);
  } catch {
    toast.error('Erro ao copiar');
  }
}

/**
 * Generic action feedback
 */
export function showActionFeedback(action: string, success: boolean = true) {
  if (success) {
    toast.success(action);
  } else {
    toast.error(action);
  }
}
