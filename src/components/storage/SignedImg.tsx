import { ImgHTMLAttributes } from 'react';
import { useSignedAssetUrl } from '@/lib/storage/signedAssets';

interface SignedImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallback?: React.ReactNode;
}

/**
 * <img> wrapper that resolves `company_assets` storage URLs to short-lived
 * signed URLs via the public `get-company-asset` edge function.
 *
 * - Pass-through for non-storage URLs (e.g. external CDNs)
 * - Renders nothing (or `fallback`) until the signed URL is ready
 */
export function SignedImg({ src, fallback = null, alt = '', ...rest }: SignedImgProps) {
  const { url, loading } = useSignedAssetUrl(src);
  if (loading || !url) return <>{fallback}</>;
  return <img src={url} alt={alt} {...rest} />;
}
