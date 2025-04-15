import { clsx } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function NullFormatter({ className, onClick }: Props) {
  return (
    <span className={clsx('tw:uppercase', 'tw:opacity-65', className)} onClick={onClick}>
      [NULL]
    </span>
  );
}
