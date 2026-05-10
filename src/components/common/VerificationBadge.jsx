import clsx from 'clsx';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from './Badge';

export const VerificationBadge = ({
  verified = false,
  verifiedLabel = 'Verified',
  pendingLabel = 'Not verified',
  className
}) => (
  <Badge
    tone={verified ? 'emerald' : 'amber'}
    className={clsx('gap-1', className)}
  >
    {verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
    {verified ? verifiedLabel : pendingLabel}
  </Badge>
);
