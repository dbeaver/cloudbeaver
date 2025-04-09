import { NullFormatter } from './NullFormatter.js';
import { clsx } from '@dbeaver/ui-kit';

interface Props {
  value: unknown;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function BlobFormatter({ value, className, onClick }: Props) {
  if (value === null) {
    return <NullFormatter className={className} onClick={onClick} />;
  }
  return (
    <span className={clsx('tw:uppercase', className)} onClick={onClick}>
      [blob]
    </span>
  );
}
