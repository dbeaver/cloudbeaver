import { clsx } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function BlobFormatter({ className, onClick }: Props) {
  return (
    <span className={clsx('tw:uppercase', className)} onClick={onClick}>
      [blob]
    </span>
  );
}
